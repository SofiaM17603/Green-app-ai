# 1. Imports
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
import csv, io
from collections import defaultdict
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from typing import Optional
import os
import json
import shutil
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# 2. Initialisation de l'app
app = FastAPI(title="Carbon Impact API",
              description="Prototype YC : calcul automatique de l'empreinte carbone à partir de factures",
              version="1.0")

# Configuration CORS pour permettre les requêtes depuis l'interface web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifiez les domaines autorisés
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include QuickBooks Integration routes
try:
    from quickbooks_integration.routes import router as quickbooks_router
    app.include_router(quickbooks_router)
    print("✅ QuickBooks integration loaded successfully")
except ImportError as e:
    print(f"⚠️  QuickBooks integration not available: {e}")
except Exception as e:
    print(f"⚠️  Error loading QuickBooks integration: {e}")

# 3. Configuration du système de fichiers
UPLOADS_DIR = Path("uploads")
UPLOADS_DIR.mkdir(exist_ok=True)
METADATA_FILE = UPLOADS_DIR / "metadata.json"

def load_metadata():
    """Charge les métadonnées des fichiers uploadés"""
    if METADATA_FILE.exists():
        with open(METADATA_FILE, 'r') as f:
            return json.load(f)
    return {"files": []}

def save_metadata(metadata):
    """Sauvegarde les métadonnées"""
    with open(METADATA_FILE, 'w') as f:
        json.dump(metadata, f, indent=2)

def get_all_enriched_data():
    """Consolide tous les fichiers enrichis en un seul DataFrame"""
    metadata = load_metadata()
    all_data = []

    for file_info in metadata["files"]:
        enriched_path = UPLOADS_DIR / file_info["enriched_filename"]
        if enriched_path.exists():
            df = pd.read_csv(enriched_path)
            all_data.append(df)

    if all_data:
        return pd.concat(all_data, ignore_index=True)
    return None

# 4. Règles globales
CATEGORY_RULES = {
    "materiaux": ["sod", "concrete", "lumber", "rock", "sprinkler", "bag"],
    "services": ["weekly gardening", "pest control", "installation", "maintenance", "custom design"],
    "equipements": ["pump", "lighting", "heads", "pipes"],
    "voyages_aeriens": ["air france", "delta", "avion", "flight"],
    "transport_routier": ["uber", "taxi", "car", "location"],
    "energie": ["edf", "electricite", "engie", "pg&e", "kwh"],
    "achat": ["achat", "purchase", "buy", "buying", "procurement"],
    "approvisionnement": ["approvisionnement", "supply", "stock", "inventaire", "inventory", "warehouse"],
    "article": ["article", "produit", "product", "item", "merchandise", "goods"]
}

EMISSION_FACTORS = {
    "materiaux": 0.25,          # kgCO2e / €
    "services": 0.15,
    "equipements": 0.20,
    "voyages_aeriens": 0.25,
    "transport_routier": 0.15,
    "energie": 0.10,
    "achat": 0.18,              # kgCO2e / € - émissions liées aux achats généraux
    "approvisionnement": 0.22,  # kgCO2e / € - émissions liées à la chaîne d'approvisionnement
    "article": 0.20,            # kgCO2e / € - émissions liées aux produits/articles
    "autres": 0.20
}

# Secteurs d'activité basés sur les catégories et labels
SECTOR_RULES = {
    "transport": ["voyages_aeriens", "transport_routier", "uber", "taxi", "flight", "avion"],
    "construction": ["materiaux", "concrete", "lumber", "rock"],
    "technology": ["equipements", "pump", "lighting", "software", "tech"],
    "energy": ["energie", "edf", "electricite", "engie", "pg&e", "kwh"],
    "services": ["services", "gardening", "pest control", "maintenance", "installation"],
    "retail": ["retail", "commerce", "shop"],
    "manufacturing": ["manufacturing", "production", "factory"]
}

# 4. Fonctions utilitaires
def categorize(libelle: str) -> str:
    text = (libelle or "").lower()
    for cat, keywords in CATEGORY_RULES.items():
        if any(k in text for k in keywords):
            return cat
    return "autres"

def determine_sector(category: str, libelle: str) -> str:
    """Détermine le secteur d'activité basé sur la catégorie et le libellé"""
    text = (libelle or "").lower()
    # Check keywords first
    for sector, keywords in SECTOR_RULES.items():
        if any(k in text for k in keywords):
            return sector
    # Then check category
    for sector, keywords in SECTOR_RULES.items():
        if category in keywords:
            return sector
    return "other"

def compute_co2e(montant: float, libelle: str):
    cat = categorize(libelle)
    factor = EMISSION_FACTORS.get(cat, 0.20)
    co2e = montant * factor
    return cat, factor, co2e


# Helper functions for QuickBooks integration
def enrich_data(df):
    """
    Enrich a DataFrame with CO2 emissions calculations
    Expected columns: InvoiceId, Date, ClientId, Libellé, Montant total
    """
    factures = defaultdict(list)

    # Group by InvoiceId
    for _, row in df.iterrows():
        if row["Libellé"].strip():
            factures[row["InvoiceId"]].append(row.to_dict())

    results = []
    for invoice_id, lignes in factures.items():
        total = float(lignes[0]["Montant total"])
        part = total / len(lignes)
        for row in lignes:
            cat, factor, co2e = compute_co2e(part, row["Libellé"])
            results.append({
                "InvoiceId": invoice_id,
                "Date": row["Date"],
                "ClientId": row["ClientId"],
                "Libellé": row["Libellé"],
                "Montant_ligne": round(part, 2),
                "Categorie": cat,
                "FacteurEmission": factor,
                "CO2e_kg": round(co2e, 2),
            })

    return pd.DataFrame(results)


def save_enriched_file(df_original, df_enriched, original_filename, enriched_filename):
    """
    Save original and enriched files and return file_id
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_id = f"{timestamp}_{original_filename.replace('.csv', '')}"

    # Save original file
    original_path = UPLOADS_DIR / f"{file_id}_original.csv"
    df_original.to_csv(original_path, index=False)

    # Save enriched file
    enriched_path = UPLOADS_DIR / f"{file_id}_enriched.csv"
    df_enriched.to_csv(enriched_path, index=False)

    # Calculate stats
    total_emissions = df_enriched["CO2e_kg"].sum()
    invoice_count = len(df_enriched)

    # Update metadata
    metadata = load_metadata()
    metadata["files"].append({
        "id": file_id,
        "original_filename": original_filename,
        "enriched_filename": f"{file_id}_enriched.csv",
        "upload_date": datetime.now().isoformat(),
        "total_emissions": round(total_emissions, 2),
        "invoice_count": invoice_count,
        "size_bytes": original_path.stat().st_size
    })
    save_metadata(metadata)

    # Also save to factures_enrichies.csv for compatibility
    df_enriched.to_csv("factures_enrichies.csv", index=False)

    return file_id


def update_metadata(file_id, updates):
    """
    Update metadata for a specific file
    """
    metadata = load_metadata()
    for file_entry in metadata["files"]:
        if file_entry["id"] == file_id:
            file_entry.update(updates)
            break
    save_metadata(metadata)


# 5. Endpoints

# --- Endpoint 1 : analyse des factures ---
@app.post("/analyze_invoices")
async def analyze_invoices(file: UploadFile = File(...)):
    # Générer un ID unique pour ce fichier
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_id = f"{timestamp}_{file.filename.replace('.csv', '')}"

    # Lire et analyser le fichier
    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))

    factures = defaultdict(list)
    for row in reader:
        if row["Libellé"].strip():
            factures[row["InvoiceId"]].append(row)

    results = []
    for invoice_id, lignes in factures.items():
        total = float(lignes[0]["Montant total"])
        part = total / len(lignes)
        for row in lignes:
            cat, factor, co2e = compute_co2e(part, row["Libellé"])
            results.append({
                "InvoiceId": invoice_id,
                "Date": row["Date"],
                "ClientId": row["ClientId"],
                "Libellé": row["Libellé"],
                "Montant_ligne": round(part, 2),
                "Categorie": cat,
                "FacteurEmission": factor,
                "CO2e_kg": round(co2e, 2),
            })

    # Sauvegarder le fichier original
    original_path = UPLOADS_DIR / f"{file_id}_original.csv"
    with open(original_path, 'wb') as f:
        f.write(content)

    # Sauvegarder le fichier enrichi
    enriched_filename = f"{file_id}_enriched.csv"
    enriched_path = UPLOADS_DIR / enriched_filename
    with open(enriched_path, "w", newline="", encoding="utf-8") as f_out:
        fieldnames = results[0].keys()
        writer = csv.DictWriter(f_out, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)

    # Calculer les stats pour les métadonnées
    total_emissions = sum(r["CO2e_kg"] for r in results)

    # Mettre à jour les métadonnées
    metadata = load_metadata()
    metadata["files"].append({
        "id": file_id,
        "original_filename": file.filename,
        "enriched_filename": enriched_filename,
        "upload_date": datetime.now().isoformat(),
        "total_emissions": round(total_emissions, 2),
        "invoice_count": len(results),
        "size_bytes": len(content)
    })
    save_metadata(metadata)

    # Aussi sauvegarder dans factures_enrichies.csv pour compatibilité
    with open("factures_enrichies.csv", "w", newline="", encoding="utf-8") as f_out:
        writer = csv.DictWriter(f_out, fieldnames=results[0].keys())
        writer.writeheader()
        writer.writerows(results)

    # Retourner le fichier enrichi
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=results[0].keys())
    writer.writeheader()
    writer.writerows(results)
    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={enriched_filename}"}
    )

# --- Endpoint 2 : Dashboard analytics complet ---
@app.get("/dashboard")
async def get_dashboard():
    """Retourne toutes les analytics pour le dashboard (consolidé de tous les fichiers)"""
    try:
        df = get_all_enriched_data()
        if df is None or len(df) == 0:
            return {"error": "Aucune donnée disponible. Analysez d'abord vos factures."}

        df["Date"] = pd.to_datetime(df["Date"])

        # KPIs globaux
        total_emissions = df["CO2e_kg"].sum()
        total_invoices = len(df)
        avg_emissions = df["CO2e_kg"].mean()

        # Répartition par catégorie
        by_category = df.groupby("Categorie")["CO2e_kg"].sum().to_dict()

        # Timeline mensuelle
        monthly = df.groupby(pd.Grouper(key="Date", freq="ME"))["CO2e_kg"].sum().reset_index()
        timeline = [
            {
                "date": row["Date"].strftime("%Y-%m-%d"),
                "emissions": round(row["CO2e_kg"], 2)
            }
            for _, row in monthly.iterrows()
        ]

        # Top catégories
        top_categories = df.groupby("Categorie").agg({
            "CO2e_kg": "sum",
            "InvoiceId": "count"
        }).sort_values("CO2e_kg", ascending=False).head(5)

        top_categories_list = [
            {
                "category": cat,
                "emissions": round(row["CO2e_kg"], 2),
                "count": int(row["InvoiceId"])
            }
            for cat, row in top_categories.iterrows()
        ]

        # Comparaison mois actuel vs précédent
        current_month = monthly.iloc[-1]["CO2e_kg"] if len(monthly) > 0 else 0
        previous_month = monthly.iloc[-2]["CO2e_kg"] if len(monthly) > 1 else 0
        month_change = ((current_month - previous_month) / previous_month * 100) if previous_month > 0 else 0

        # Score carbone (0-100, 100 = meilleur)
        # Basé sur les émissions moyennes par facture
        avg_per_invoice = total_emissions / total_invoices if total_invoices > 0 else 0
        carbon_score = max(0, min(100, 100 - (avg_per_invoice / 10)))  # Ajustable

        # Top fournisseurs par émissions
        by_supplier = df.groupby("ClientId").agg({
            "CO2e_kg": "sum",
            "InvoiceId": "count"
        }).sort_values("CO2e_kg", ascending=False).head(10)

        top_suppliers = [
            {
                "supplier": supplier,
                "emissions": round(row["CO2e_kg"], 2),
                "count": int(row["InvoiceId"])
            }
            for supplier, row in by_supplier.iterrows()
        ]

        # Données brutes pour filtrage côté client
        invoices = []
        for _, row in df.iterrows():
            category = str(row.get("Categorie", "autres"))
            label = str(row.get("Label", ""))
            sector = determine_sector(category, label)

            invoices.append({
                "id": str(row.get("InvoiceId", "")),
                "date": row["Date"].strftime("%Y-%m-%d"),
                "client_id": str(row.get("ClientId", "")),
                "label": label,
                "amount": float(row.get("TotalAmount", 0)),
                "category": category,
                "sector": sector,
                "emissions": round(float(row["CO2e_kg"]), 2)
            })

        return {
            "kpis": {
                "total_emissions": round(total_emissions, 2),
                "total_invoices": total_invoices,
                "avg_emissions": round(avg_emissions, 2),
                "carbon_score": round(carbon_score, 1),
                "month_change": round(month_change, 1)
            },
            "by_category": {cat: round(val, 2) for cat, val in by_category.items()},
            "timeline": timeline,
            "top_categories": top_categories_list,
            "top_suppliers": top_suppliers,
            "invoices": invoices
        }

    except FileNotFoundError:
        return {"error": "Aucune donnée disponible. Analysez d'abord vos factures."}
    except Exception as e:
        return {"error": f"Erreur: {str(e)}"}

# --- Endpoint : Recommandations intelligentes ---
@app.get("/recommendations")
async def get_recommendations():
    """Génère des recommandations basées sur les données réelles"""
    try:
        df = pd.read_csv("factures_enrichies.csv")

        # Analyser les catégories
        by_category = df.groupby("Categorie")["CO2e_kg"].sum().sort_values(ascending=False)

        recommendations = []

        # Recommandations basées sur les catégories les plus émettrices
        for category, emissions in by_category.head(3).items():
            if category == "voyages_aeriens":
                recommendations.append({
                    "title": "Réduire les voyages aériens",
                    "description": f"Vos voyages aériens représentent {emissions:.0f} kg CO₂e ({emissions/df['CO2e_kg'].sum()*100:.1f}% du total). Privilégiez le train pour les trajets <800km ou organisez des visioconférences.",
                    "impact": "high",
                    "icon": "✈️",
                    "category": category,
                    "potential_reduction": round(emissions * 0.3, 2)
                })
            elif category == "transport_routier":
                recommendations.append({
                    "title": "Optimiser le transport routier",
                    "description": f"Transport routier: {emissions:.0f} kg CO₂e. Privilégiez les transports en commun, le covoiturage ou les véhicules électriques.",
                    "impact": "high",
                    "icon": "🚗",
                    "category": category,
                    "potential_reduction": round(emissions * 0.4, 2)
                })
            elif category == "energie":
                recommendations.append({
                    "title": "Optimiser la consommation énergétique",
                    "description": f"Énergie: {emissions:.0f} kg CO₂e. Passez aux énergies renouvelables et améliorez l'isolation de vos locaux.",
                    "impact": "high",
                    "icon": "⚡",
                    "category": category,
                    "potential_reduction": round(emissions * 0.5, 2)
                })
            elif category == "materiaux":
                recommendations.append({
                    "title": "Choisir des matériaux durables",
                    "description": f"Matériaux: {emissions:.0f} kg CO₂e. Privilégiez les matériaux recyclés et les fournisseurs locaux.",
                    "impact": "medium",
                    "icon": "🏗️",
                    "category": category,
                    "potential_reduction": round(emissions * 0.25, 2)
                })

        # Recommandations générales toujours pertinentes
        recommendations.append({
            "title": "Former vos équipes",
            "description": "Organisez des formations sur les éco-gestes. L'engagement collectif multiplie l'impact des actions individuelles.",
            "impact": "medium",
            "icon": "👥",
            "category": "general",
            "potential_reduction": round(df['CO2e_kg'].sum() * 0.1, 2)
        })

        # Calculer le potentiel total de réduction
        total_potential = sum(r["potential_reduction"] for r in recommendations)

        return {
            "recommendations": recommendations,
            "total_potential_reduction": round(total_potential, 2),
            "current_emissions": round(df['CO2e_kg'].sum(), 2)
        }

    except FileNotFoundError:
        return {"error": "Aucune donnée disponible"}
    except Exception as e:
        return {"error": f"Erreur: {str(e)}"}

# --- Endpoint : Gestion des fichiers ---
@app.get("/files")
async def list_files():
    """Liste tous les fichiers uploadés avec leurs métadonnées"""
    metadata = load_metadata()
    return {"files": metadata["files"]}

@app.delete("/files/{file_id}")
async def delete_file(file_id: str):
    """Supprime un fichier et ses métadonnées"""
    metadata = load_metadata()

    # Trouver le fichier
    file_info = None
    for f in metadata["files"]:
        if f["id"] == file_id:
            file_info = f
            break

    if not file_info:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")

    # Supprimer les fichiers physiques
    original_path = UPLOADS_DIR / f"{file_id}_original.csv"
    enriched_path = UPLOADS_DIR / file_info["enriched_filename"]

    if original_path.exists():
        original_path.unlink()
    if enriched_path.exists():
        enriched_path.unlink()

    # Retirer des métadonnées
    metadata["files"] = [f for f in metadata["files"] if f["id"] != file_id]
    save_metadata(metadata)

    return {"message": "Fichier supprimé avec succès", "file_id": file_id}

@app.get("/files/{file_id}/download")
async def download_file(file_id: str):
    """Télécharge un fichier enrichi"""
    metadata = load_metadata()

    file_info = None
    for f in metadata["files"]:
        if f["id"] == file_id:
            file_info = f
            break

    if not file_info:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")

    enriched_path = UPLOADS_DIR / file_info["enriched_filename"]
    if not enriched_path.exists():
        raise HTTPException(status_code=404, detail="Fichier enrichi non trouvé")

    return FileResponse(
        enriched_path,
        media_type="text/csv",
        filename=file_info["enriched_filename"]
    )

# --- Endpoint 3 : données fictives pour démo YC ---
@app.get("/demo_data")
async def demo_data():
    demo_invoices = [
        {
            "InvoiceId": "D1",
            "Date": "2025-09-01",
            "ClientId": "100",
            "Libellé": "Billet Air France Paris-New York",
            "Montant_ligne": 1200.0,
            "Categorie": "voyages_aeriens",
            "FacteurEmission": 0.25,
            "CO2e_kg": 300.0
        },
        {
            "InvoiceId": "D2",
            "Date": "2025-09-05",
            "ClientId": "101",
            "Libellé": "EDF électricité bureau",
            "Montant_ligne": 500.0,
            "Categorie": "energie",
            "FacteurEmission": 0.10,
            "CO2e_kg": 50.0
        },
        {
            "InvoiceId": "D3",
            "Date": "2025-09-10",
            "ClientId": "102",
            "Libellé": "Uber Business",
            "Montant_ligne": 80.0,
            "Categorie": "transport_routier",
            "FacteurEmission": 0.15,
            "CO2e_kg": 12.0
        },
        {
            "InvoiceId": "D4",
            "Date": "2025-09-15",
            "ClientId": "103",
            "Libellé": "Achat fournitures bureau",
            "Montant_ligne": 200.0,
            "Categorie": "materiaux",
            "FacteurEmission": 0.25,
            "CO2e_kg": 50.0
        },
        {
            "InvoiceId": "D5",
            "Date": "2025-09-20",
            "ClientId": "104",
            "Libellé": "Prestation de conseil",
            "Montant_ligne": 1000.0,
            "Categorie": "services",
            "FacteurEmission": 0.10,
            "CO2e_kg": 100.0
        }
    ]
    return {"factures_demo": demo_invoices}


# --- Endpoint: Generate ESG/CSR Carbon Report ---
@app.post("/generate_report")
async def generate_carbon_report(
    lang: str = Query('fr', description="Report language: 'fr' or 'en'"),
    format: str = Query('pdf', description="Export format: 'pdf' or 'docx'"),
    climate_commitments: Optional[str] = Query(None, description="Custom climate commitments text"),
    file_id: Optional[str] = Query(None, description="Specific file ID to analyze")
):
    """
    Generate a professional ESG/CSR carbon report

    Args:
        lang: Report language ('fr' or 'en')
        format: Export format ('pdf' or 'docx')
        climate_commitments: Custom climate commitments text
        file_id: Specific file ID to analyze (uses factures_enrichies.csv if not specified)

    Returns:
        StreamingResponse with generated report file
    """
    try:
        from reporting import generate_report, export_pdf, export_docx
        from pathlib import Path

        # Determine which CSV file to use
        if file_id:
            # Use specific file
            enriched_path = UPLOADS_DIR / f"{file_id}_enriched.csv"
            if not enriched_path.exists():
                raise HTTPException(
                    status_code=404,
                    detail=f"File not found: {file_id}"
                )
            csv_path = str(enriched_path)
        else:
            # Use default factures_enrichies.csv
            csv_path = "factures_enrichies.csv"
            if not Path(csv_path).exists():
                raise HTTPException(
                    status_code=404,
                    detail="No enriched data found. Please upload and analyze invoices first."
                )

        # Generate report data
        report_data = generate_report(
            csv_path=csv_path,
            lang=lang,
            climate_commitments=climate_commitments
        )

        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"carbon_report_{timestamp}.{format}"
        output_path = UPLOADS_DIR / output_filename

        # Export to requested format
        if format.lower() == 'pdf':
            export_pdf(report_data, str(output_path))
            media_type = "application/pdf"
        elif format.lower() == 'docx':
            export_docx(report_data, str(output_path))
            media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid format. Use 'pdf' or 'docx'."
            )

        # Read file for streaming
        with open(output_path, 'rb') as f:
            content = f.read()

        # Return file
        return StreamingResponse(
            io.BytesIO(content),
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename={output_filename}"
            }
        )

    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Report module not properly installed: {str(e)}"
        )
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=404,
            detail=f"Data file not found: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate report: {str(e)}"
        )


@app.post("/generate_plan")
async def generate_action_plan(
    lang: str = Query('fr', description="Plan language: 'fr' or 'en'"),
    max_actions: int = Query(15, description="Maximum number of actions to generate"),
    file_id: Optional[str] = Query(None, description="Specific file ID to analyze"),
    export_format: Optional[str] = Query(None, description="Export format: 'ics' for calendar file")
):
    """
    Generate a prioritized climate action plan

    Returns a structured action plan with:
    - Prioritized actions based on emissions data
    - Estimated CO2 reduction for each action
    - Priority levels (high/medium/low)
    - Feasibility assessment
    - Calendar integration links
    """
    try:
        from actions_plan import generate_action_plan as gen_plan
        from actions_plan.calendar_sync import export_to_ics

        # Determine CSV file to use
        if file_id:
            csv_path = str(UPLOADS_DIR / f"{file_id}_enriched.csv")
            if not os.path.exists(csv_path):
                raise HTTPException(status_code=404, detail=f"File {file_id} not found")
        else:
            csv_path = "factures_enrichies.csv"
            if not os.path.exists(csv_path):
                raise HTTPException(
                    status_code=404,
                    detail="No data available. Please upload invoices first."
                )

        # Generate action plan
        plan_data = gen_plan(csv_path=csv_path, lang=lang, max_actions=max_actions)

        # If ICS export is requested
        if export_format == 'ics':
            output_path = str(UPLOADS_DIR / f"action_plan_{datetime.now().strftime('%Y%m%d_%H%M%S')}.ics")
            export_to_ics(plan_data['actions'], output_path)

            return FileResponse(
                output_path,
                media_type='text/calendar',
                filename=f"green_app_action_plan.ics",
                headers={
                    "Content-Disposition": f"attachment; filename=green_app_action_plan.ics"
                }
            )

        # Return JSON plan
        return plan_data

    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Action plan module not available: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 6. Lancement local
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

@app.post("/forecast")
async def generate_forecast(
    periods: int = Query(6, description="Number of periods to forecast"),
    frequency: str = Query('monthly', description="Forecast frequency: 'monthly' or 'quarterly'"),
    categories: Optional[str] = Query(None, description="Comma-separated list of categories to forecast"),
    file_id: Optional[str] = Query(None, description="Specific file ID to analyze"),
    budget_file: Optional[UploadFile] = File(None, description="Optional budget CSV file for comparison"),
    lang: str = Query('fr', description="Language for alerts and recommendations: 'fr' or 'en'")
):
    """
    Generate intelligent carbon emission forecasts with budget comparison

    Features:
    - Monthly/quarterly forecasts by category
    - Trend and seasonality analysis
    - Confidence intervals
    - Optional budget comparison with alerts
    - Multilingual support

    Args:
        periods: Number of periods to forecast (default: 6)
        frequency: 'monthly' or 'quarterly' (default: monthly)
        categories: Comma-separated categories to forecast (default: all)
        file_id: Specific file to analyze (default: factures_enrichies.csv)
        budget_file: Optional CSV file with carbon budgets
        lang: Language for alerts ('fr' or 'en')

    Returns:
        JSON with forecast data, metrics, and optional budget comparison
    """
    try:
        from forecast import generate_forecast as gen_forecast
        from forecast import load_budget, compare_with_budget
        from pathlib import Path

        # Determine CSV file to use
        if file_id:
            csv_path = str(UPLOADS_DIR / f"{file_id}_enriched.csv")
            if not os.path.exists(csv_path):
                raise HTTPException(status_code=404, detail=f"File {file_id} not found")
        else:
            csv_path = "factures_enrichies.csv"
            if not os.path.exists(csv_path):
                raise HTTPException(
                    status_code=404,
                    detail="No data available. Please upload and analyze invoices first."
                )

        # Parse categories if provided
        category_list = None
        if categories:
            category_list = [cat.strip() for cat in categories.split(',')]

        # Generate forecast
        forecast_data = gen_forecast(
            csv_path=csv_path,
            periods=periods,
            frequency=frequency,
            categories=category_list
        )

        # Handle budget file if provided
        budget_comparison = None
        if budget_file:
            try:
                # Save budget file temporarily
                budget_path = UPLOADS_DIR / "temp_budget.csv"
                content = await budget_file.read()
                with open(budget_path, 'wb') as f:
                    f.write(content)

                # Load and normalize budget data
                budget_data = load_budget(
                    str(budget_path),
                    frequency=frequency,
                    categories=category_list
                )

                # Compare forecast with budget
                from forecast.compare_forecast import ForecastComparator
                comparator = ForecastComparator(forecast_data, budget_data)
                budget_comparison = comparator.compare()

                # Add recommendations
                budget_comparison['recommendations'] = comparator.get_recommendations(lang=lang)

                # Clean up temp file
                budget_path.unlink()

            except Exception as e:
                # Budget processing failed, but continue with forecast
                budget_comparison = {
                    'error': f"Failed to process budget file: {str(e)}"
                }

        # Build response
        response = {
            'forecast_data': forecast_data,
            'success': True
        }

        if budget_comparison:
            response['budget_comparison'] = budget_comparison

        return response

    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Forecast module not available: {str(e)}"
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="No enriched data found. Please analyze invoices first."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate forecast: {str(e)}"
        )