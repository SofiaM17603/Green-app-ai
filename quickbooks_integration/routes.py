"""
FastAPI routes for QuickBooks Online integration
"""

import os
import pandas as pd
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from fastapi.responses import RedirectResponse, JSONResponse
from datetime import datetime, timedelta
from typing import Optional
import tempfile
import uuid

from .quickbooks import create_quickbooks_client_from_env


# Create router
router = APIRouter(prefix="/quickbooks", tags=["QuickBooks Integration"])

# Global client instance (in production, use proper state management)
qb_client = None


def get_qb_client():
    """Get or create QuickBooks client"""
    global qb_client
    if qb_client is None:
        qb_client = create_quickbooks_client_from_env()
    return qb_client


@router.get("/connect")
async def connect_to_quickbooks():
    """
    Initiate QuickBooks OAuth2 connection
    Redirects user to QuickBooks authorization page

    Returns:
        Redirect to QuickBooks OAuth page
    """
    try:
        client = get_qb_client()

        # Generate random state for CSRF protection
        state = str(uuid.uuid4())

        # Get authorization URL
        auth_url = client.get_authorization_url(state=state)

        return JSONResponse({
            "auth_url": auth_url,
            "message": "Please visit the auth_url to connect your QuickBooks account",
            "instructions": [
                "1. Click on the auth_url",
                "2. Sign in to your QuickBooks account",
                "3. Grant access to Green App",
                "4. You will be redirected back to the callback URL"
            ]
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initiate connection: {str(e)}")


@router.get("/callback")
async def quickbooks_callback(
    code: str = Query(..., description="Authorization code from QuickBooks"),
    realmId: str = Query(..., description="Company ID from QuickBooks"),
    state: Optional[str] = Query(None, description="State for CSRF protection")
):
    """
    OAuth2 callback endpoint
    Exchanges authorization code for access tokens

    Args:
        code: Authorization code from QuickBooks
        realmId: Company ID (realm ID)
        state: State parameter for CSRF validation

    Returns:
        Success message with company info
    """
    try:
        client = get_qb_client()

        # Exchange code for tokens
        token_data = client.exchange_code_for_tokens(code, realmId)

        # Save tokens to file for persistence
        client.save_tokens_to_file()

        # Get company info to confirm connection
        company_info = client.get_company_info()

        return JSONResponse({
            "success": True,
            "message": "Successfully connected to QuickBooks!",
            "company": {
                "name": company_info.get("CompanyName", "Unknown"),
                "realm_id": realmId
            },
            "token_expires_in": token_data.get("expires_in", 3600),
            "next_steps": [
                "You can now sync your invoices using POST /quickbooks/sync",
                "Check connection status with GET /quickbooks/status"
            ]
        })

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to complete OAuth flow: {str(e)}"
        )


@router.get("/status")
async def quickbooks_status():
    """
    Check QuickBooks connection status

    Returns:
        Connection status and company info
    """
    try:
        client = get_qb_client()

        if not client.access_token or not client.realm_id:
            return JSONResponse({
                "connected": False,
                "message": "Not connected to QuickBooks. Use /quickbooks/connect to connect."
            })

        # Try to get company info to verify connection
        try:
            client.ensure_valid_token()
            company_info = client.get_company_info()

            return JSONResponse({
                "connected": True,
                "company": {
                    "name": company_info.get("CompanyName", "Unknown"),
                    "realm_id": client.realm_id,
                    "country": company_info.get("Country", "Unknown")
                },
                "token_valid": True,
                "token_expiry": client.token_expiry.isoformat() if client.token_expiry else None
            })

        except Exception as e:
            return JSONResponse({
                "connected": False,
                "error": "Token expired or invalid. Please reconnect.",
                "details": str(e)
            })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync")
async def sync_quickbooks_invoices(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    max_results: int = Query(1000, description="Maximum invoices to fetch"),
    auto_analyze: bool = Query(True, description="Automatically analyze invoices after sync")
):
    """
    Sync invoices from QuickBooks and optionally analyze them

    Args:
        start_date: Filter invoices from this date (YYYY-MM-DD)
        end_date: Filter invoices until this date (YYYY-MM-DD)
        max_results: Maximum number of invoices to fetch
        auto_analyze: If True, automatically send to Green App analyzer

    Returns:
        Synced invoices and analysis results
    """
    try:
        client = get_qb_client()

        # Check if connected
        if not client.access_token or not client.realm_id:
            raise HTTPException(
                status_code=401,
                detail="Not connected to QuickBooks. Use /quickbooks/connect first."
            )

        # Set default date range if not provided (last 3 months)
        if not start_date:
            start_date = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
        if not end_date:
            end_date = datetime.now().strftime("%Y-%m-%d")

        # Fetch invoices from QuickBooks
        print(f"Fetching QuickBooks invoices from {start_date} to {end_date}...")
        qb_invoices = client.get_invoices(start_date, end_date, max_results)

        if not qb_invoices:
            return JSONResponse({
                "success": True,
                "message": "No invoices found in the specified date range",
                "count": 0,
                "date_range": {"start": start_date, "end": end_date}
            })

        # Transform to Green App format
        green_app_invoices = client.transform_invoices_for_green_app(qb_invoices)

        print(f"Transformed {len(green_app_invoices)} invoices to Green App format")

        # If auto_analyze is True, send to analyzer
        analysis_results = None
        if auto_analyze:
            # Import here to avoid circular import
            from app import enrich_data, save_enriched_file, load_metadata, update_metadata

            # Convert to DataFrame
            df = pd.DataFrame(green_app_invoices)

            # Enrich with emissions data
            df_enriched = enrich_data(df)

            # Generate unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            original_filename = f"quickbooks_sync_{timestamp}.csv"
            enriched_filename = f"quickbooks_sync_{timestamp}_enriched.csv"

            # Save enriched file
            file_id = save_enriched_file(df, df_enriched, original_filename, enriched_filename)

            # Calculate statistics
            total_emissions = df_enriched["CO2e_kg"].sum()
            total_amount = df["Montant total"].sum()
            invoice_count = len(df)

            analysis_results = {
                "file_id": file_id,
                "total_emissions_kg": round(total_emissions, 2),
                "total_amount": round(total_amount, 2),
                "invoice_count": invoice_count,
                "average_emissions_per_invoice": round(total_emissions / invoice_count, 2),
                "original_filename": original_filename,
                "enriched_filename": enriched_filename
            }

            print(f"Analysis complete: {total_emissions:.2f} kg CO2e from {invoice_count} invoices")

        return JSONResponse({
            "success": True,
            "message": f"Successfully synced {len(green_app_invoices)} invoices from QuickBooks",
            "sync_info": {
                "invoice_count": len(green_app_invoices),
                "date_range": {
                    "start": start_date,
                    "end": end_date
                },
                "synced_at": datetime.now().isoformat()
            },
            "analysis": analysis_results,
            "invoices": green_app_invoices[:10],  # Return first 10 for preview
            "note": "Full data has been saved and analyzed" if auto_analyze else "Use auto_analyze=true to analyze invoices"
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to sync invoices: {str(e)}"
        )


@router.get("/disconnect")
async def disconnect_quickbooks():
    """
    Disconnect from QuickBooks and clear stored tokens

    Returns:
        Success message
    """
    try:
        client = get_qb_client()

        # Clear tokens
        client.access_token = None
        client.refresh_token = None
        client.realm_id = None
        client.token_expiry = None

        # Delete saved tokens file
        try:
            os.remove("quickbooks_tokens.json")
        except FileNotFoundError:
            pass

        return JSONResponse({
            "success": True,
            "message": "Successfully disconnected from QuickBooks",
            "note": "You can reconnect anytime using /quickbooks/connect"
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/test-transform")
async def test_transform():
    """
    Test endpoint to verify data transformation with mock data

    Returns:
        Transformed sample invoice
    """
    # Sample QuickBooks invoice format
    sample_qb_invoice = {
        "Id": "123",
        "DocNumber": "INV-2025-001",
        "TxnDate": "2025-01-15",
        "CustomerRef": {
            "value": "CUST-001",
            "name": "Acme Corporation"
        },
        "Line": [
            {
                "DetailType": "SalesItemLineDetail",
                "Description": "Business travel - Paris to New York",
                "Amount": 1500.00,
                "SalesItemLineDetail": {
                    "ItemRef": {
                        "value": "1",
                        "name": "Air Travel"
                    }
                }
            },
            {
                "DetailType": "SalesItemLineDetail",
                "Description": "Consulting services",
                "Amount": 2500.00
            }
        ],
        "TotalAmt": 4000.00
    }

    client = get_qb_client()
    transformed = client.transform_invoices_for_green_app([sample_qb_invoice])

    return JSONResponse({
        "original": sample_qb_invoice,
        "transformed": transformed[0],
        "message": "This is how QuickBooks invoices are transformed for Green App"
    })
