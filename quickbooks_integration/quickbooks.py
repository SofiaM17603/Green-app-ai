"""
QuickBooks Online API Client
Handles OAuth2 authentication and data fetching from QuickBooks
"""

import os
import json
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from urllib.parse import urlencode
import base64


class QuickBooksClient:
    """
    QuickBooks Online API Client with OAuth2 authentication
    """

    # QuickBooks API URLs
    AUTH_URL = "https://appcenter.intuit.com/connect/oauth2"
    TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
    REVOKE_URL = "https://developer.api.intuit.com/v2/oauth2/tokens/revoke"
    BASE_URL = "https://quickbooks.api.intuit.com/v3/company"

    # OAuth2 Scopes
    SCOPES = [
        "com.intuit.quickbooks.accounting",
        "com.intuit.quickbooks.payment"
    ]

    def __init__(
        self,
        client_id: str,
        client_secret: str,
        redirect_uri: str,
        environment: str = "sandbox"  # "sandbox" or "production"
    ):
        """
        Initialize QuickBooks client

        Args:
            client_id: QuickBooks App Client ID
            client_secret: QuickBooks App Client Secret
            redirect_uri: OAuth callback URL
            environment: "sandbox" for testing, "production" for live
        """
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.environment = environment

        # Token storage
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.realm_id: Optional[str] = None  # Company ID
        self.token_expiry: Optional[datetime] = None

        # For production, use production URLs
        if environment == "production":
            self.BASE_URL = "https://quickbooks.api.intuit.com/v3/company"
        else:
            self.BASE_URL = "https://sandbox-quickbooks.api.intuit.com/v3/company"

    def get_authorization_url(self, state: str = "random_state_string") -> str:
        """
        Generate OAuth2 authorization URL for user to grant access

        Args:
            state: Random string for CSRF protection

        Returns:
            Authorization URL to redirect user to
        """
        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "scope": " ".join(self.SCOPES),
            "redirect_uri": self.redirect_uri,
            "state": state
        }

        return f"{self.AUTH_URL}?{urlencode(params)}"

    def exchange_code_for_tokens(self, authorization_code: str, realm_id: str) -> Dict:
        """
        Exchange authorization code for access and refresh tokens

        Args:
            authorization_code: Code received from OAuth callback
            realm_id: Company ID from callback

        Returns:
            Token response dict
        """
        # Create Basic Auth header
        credentials = f"{self.client_id}:{self.client_secret}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()

        headers = {
            "Authorization": f"Basic {encoded_credentials}",
            "Content-Type": "application/x-www-form-urlencoded"
        }

        data = {
            "grant_type": "authorization_code",
            "code": authorization_code,
            "redirect_uri": self.redirect_uri
        }

        response = requests.post(self.TOKEN_URL, headers=headers, data=data)
        response.raise_for_status()

        token_data = response.json()

        # Store tokens
        self.access_token = token_data["access_token"]
        self.refresh_token = token_data["refresh_token"]
        self.realm_id = realm_id
        self.token_expiry = datetime.now() + timedelta(seconds=token_data["expires_in"])

        return token_data

    def refresh_access_token(self) -> Dict:
        """
        Refresh the access token using refresh token

        Returns:
            New token response dict
        """
        if not self.refresh_token:
            raise ValueError("No refresh token available. Please authenticate first.")

        credentials = f"{self.client_id}:{self.client_secret}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()

        headers = {
            "Authorization": f"Basic {encoded_credentials}",
            "Content-Type": "application/x-www-form-urlencoded"
        }

        data = {
            "grant_type": "refresh_token",
            "refresh_token": self.refresh_token
        }

        response = requests.post(self.TOKEN_URL, headers=headers, data=data)
        response.raise_for_status()

        token_data = response.json()

        # Update tokens
        self.access_token = token_data["access_token"]
        self.refresh_token = token_data["refresh_token"]
        self.token_expiry = datetime.now() + timedelta(seconds=token_data["expires_in"])

        return token_data

    def ensure_valid_token(self):
        """
        Ensure access token is valid, refresh if needed
        """
        if not self.access_token:
            raise ValueError("Not authenticated. Please authenticate first.")

        # Refresh if token expires in less than 5 minutes
        if self.token_expiry and datetime.now() >= self.token_expiry - timedelta(minutes=5):
            self.refresh_access_token()

    def _make_request(self, method: str, endpoint: str, params: Optional[Dict] = None) -> Dict:
        """
        Make authenticated request to QuickBooks API

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path
            params: Query parameters

        Returns:
            API response dict
        """
        self.ensure_valid_token()

        url = f"{self.BASE_URL}/{self.realm_id}/{endpoint}"

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json"
        }

        response = requests.request(method, url, headers=headers, params=params)
        response.raise_for_status()

        return response.json()

    def get_invoices(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        max_results: int = 1000
    ) -> List[Dict]:
        """
        Fetch invoices from QuickBooks

        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            max_results: Maximum number of invoices to fetch

        Returns:
            List of invoice dicts
        """
        # Build SQL query
        query = "SELECT * FROM Invoice"

        conditions = []
        if start_date:
            conditions.append(f"TxnDate >= '{start_date}'")
        if end_date:
            conditions.append(f"TxnDate <= '{end_date}'")

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        query += f" MAXRESULTS {max_results}"

        params = {"query": query}

        response = self._make_request("GET", "query", params=params)

        # Extract invoices from response
        query_response = response.get("QueryResponse", {})
        invoices = query_response.get("Invoice", [])

        return invoices

    def get_company_info(self) -> Dict:
        """
        Get company information

        Returns:
            Company info dict
        """
        response = self._make_request("GET", "companyinfo/" + self.realm_id)
        return response.get("CompanyInfo", {})

    def transform_invoices_for_green_app(self, invoices: List[Dict]) -> List[Dict]:
        """
        Transform QuickBooks invoices to Green App format

        QuickBooks Invoice format:
        {
            "Id": "123",
            "DocNumber": "INV-001",
            "TxnDate": "2025-01-15",
            "CustomerRef": {"value": "1", "name": "Customer Name"},
            "Line": [
                {
                    "Description": "Product/Service",
                    "Amount": 100.00,
                    ...
                }
            ],
            "TotalAmt": 100.00
        }

        Green App format:
        {
            "InvoiceId": "INV-001",
            "Date": "2025-01-15",
            "ClientId": "1",
            "Libellé": "Product/Service description",
            "Montant total": 100.00
        }

        Args:
            invoices: List of QuickBooks invoices

        Returns:
            List of Green App formatted invoices
        """
        green_app_invoices = []

        for invoice in invoices:
            # Extract basic info
            invoice_id = invoice.get("DocNumber", invoice.get("Id", "UNKNOWN"))
            date = invoice.get("TxnDate", "")
            customer_ref = invoice.get("CustomerRef", {})
            client_id = customer_ref.get("value", "UNKNOWN")
            customer_name = customer_ref.get("name", "Unknown Customer")

            # Get line items to build description
            lines = invoice.get("Line", [])
            descriptions = []
            for line in lines:
                # Only process line items with amounts (not subtotal lines)
                if line.get("DetailType") == "SalesItemLineDetail":
                    desc = line.get("Description", "")
                    if desc:
                        descriptions.append(desc)
                    else:
                        # Try to get item name
                        detail = line.get("SalesItemLineDetail", {})
                        item_ref = detail.get("ItemRef", {})
                        item_name = item_ref.get("name", "")
                        if item_name:
                            descriptions.append(item_name)

            # Combine descriptions
            libelle = " | ".join(descriptions) if descriptions else f"Invoice for {customer_name}"

            # Total amount
            total_amount = invoice.get("TotalAmt", 0.0)

            # Create Green App format invoice
            green_app_invoice = {
                "InvoiceId": invoice_id,
                "Date": date,
                "ClientId": client_id,
                "Libellé": libelle,
                "Montant total": float(total_amount)
            }

            green_app_invoices.append(green_app_invoice)

        return green_app_invoices

    def save_tokens_to_file(self, filepath: str = "quickbooks_tokens.json"):
        """
        Save tokens to file for persistence

        Args:
            filepath: Path to save tokens
        """
        token_data = {
            "access_token": self.access_token,
            "refresh_token": self.refresh_token,
            "realm_id": self.realm_id,
            "token_expiry": self.token_expiry.isoformat() if self.token_expiry else None
        }

        with open(filepath, "w") as f:
            json.dump(token_data, f, indent=2)

    def load_tokens_from_file(self, filepath: str = "quickbooks_tokens.json"):
        """
        Load tokens from file

        Args:
            filepath: Path to load tokens from
        """
        try:
            with open(filepath, "r") as f:
                token_data = json.load(f)

            self.access_token = token_data.get("access_token")
            self.refresh_token = token_data.get("refresh_token")
            self.realm_id = token_data.get("realm_id")

            expiry_str = token_data.get("token_expiry")
            if expiry_str:
                self.token_expiry = datetime.fromisoformat(expiry_str)
        except FileNotFoundError:
            pass  # No saved tokens


# Utility function to create client from environment variables
def create_quickbooks_client_from_env() -> QuickBooksClient:
    """
    Create QuickBooks client from environment variables

    Required environment variables:
        - QUICKBOOKS_CLIENT_ID
        - QUICKBOOKS_CLIENT_SECRET
        - QUICKBOOKS_REDIRECT_URI
        - QUICKBOOKS_ENVIRONMENT (optional, default: sandbox)

    Returns:
        QuickBooksClient instance
    """
    client_id = os.getenv("QUICKBOOKS_CLIENT_ID")
    client_secret = os.getenv("QUICKBOOKS_CLIENT_SECRET")
    redirect_uri = os.getenv("QUICKBOOKS_REDIRECT_URI")
    environment = os.getenv("QUICKBOOKS_ENVIRONMENT", "sandbox")

    if not all([client_id, client_secret, redirect_uri]):
        raise ValueError(
            "Missing required environment variables. "
            "Please set QUICKBOOKS_CLIENT_ID, QUICKBOOKS_CLIENT_SECRET, and QUICKBOOKS_REDIRECT_URI"
        )

    client = QuickBooksClient(
        client_id=client_id,
        client_secret=client_secret,
        redirect_uri=redirect_uri,
        environment=environment
    )

    # Try to load saved tokens
    client.load_tokens_from_file()

    return client
