import os
import requests
import csv
from requests.auth import HTTPBasicAuth
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
REALM_ID = os.getenv("REALM_ID")

print("Client ID:", CLIENT_ID)
print("Realm ID:", REALM_ID)

def get_tokens(auth_code: str):
    url = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {
        "grant_type": "authorization_code",
        "code": auth_code,
        "redirect_uri": REDIRECT_URI
    }
    resp = requests.post(url, headers=headers, data=data,
                         auth=HTTPBasicAuth(CLIENT_ID, CLIENT_SECRET))
    print("Token response:", resp.json())
    return resp.json()

def refresh_tokens(refresh_token: str):
    url = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token
    }
    resp = requests.post(url, headers=headers, data=data,
                         auth=HTTPBasicAuth(CLIENT_ID, CLIENT_SECRET))
    print("Refresh response:", resp.json())
    return resp.json()

def get_invoice_pdf(access_token: str, invoice_id: str):
    folder = "factures"
    os.makedirs(folder, exist_ok=True)

    url = f"https://sandbox-quickbooks.api.intuit.com/v3/company/{REALM_ID}/invoice/{invoice_id}/pdf"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/pdf"
    }
    resp = requests.get(url, headers=headers)

    if resp.status_code == 200:
        filename = os.path.join(folder, f"invoice_{invoice_id}.pdf")
        with open(filename, "wb") as f:
            f.write(resp.content)
        print(f"✅ PDF enregistré : {filename}")
    else:
        print("❌ Erreur lors du téléchargement du PDF :", resp.text)

def get_invoices(access_token: str):
    url = f"https://sandbox-quickbooks.api.intuit.com/v3/company/{REALM_ID}/query"
    query = "select * from Invoice startposition 1 maxresults 100"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "Content-Type": "application/text"
    }
    resp = requests.post(url, headers=headers, data=query)
    print("Invoices:", resp.json())
    return resp.json()

def export_invoices_to_csv(invoices: list, filename: str = "factures.csv"):
    if not invoices:
        print("❌ Aucune facture trouvée.")
        return

    with open(filename, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["InvoiceId", "Date", "Montant total", "Solde", "ClientId", "Libellé"])

        for inv in invoices:
            invoice_id = inv.get("Id")
            date = inv.get("TxnDate")
            total = inv.get("TotalAmt")
            balance = inv.get("Balance")
            client = inv.get("CustomerRef", {}).get("value")

            for line in inv.get("Line", []):
                description = line.get("Description") or line.get("SalesItemLineDetail", {}).get("ItemRef", {}).get("name", "")
                writer.writerow([invoice_id, date, total, balance, client, description])

    print(f"✅ Données exportées dans {filename}")

def download_and_export_all_invoices(access_token: str, batch_size: int = 50, csv_filename: str = "factures.csv"):
    start = 1
    all_invoices = []

    while True:
        query = f"select * from Invoice startposition {start} maxresults {batch_size}"
        url = f"https://sandbox-quickbooks.api.intuit.com/v3/company/{REALM_ID}/query"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
            "Content-Type": "application/text"
        }

        resp = requests.post(url, headers=headers, data=query)
        data = resp.json()

        invoices = data.get("QueryResponse", {}).get("Invoice", [])
        if not invoices:
            print("✅ Plus de factures à traiter.")
            break

        for inv in invoices:
            invoice_id = inv.get("Id")
            print(f"Téléchargement du PDF pour la facture {invoice_id}...")
            get_invoice_pdf(access_token, invoice_id)
            all_invoices.append(inv)

        start += batch_size

        if all_invoices:
            export_invoices_to_csv(all_invoices, csv_filename)

if __name__ == "__main__":
    REFRESH_TOKEN = "RT1-184-H0-1769662008h7ijpf7ch8hfb0xfh6i5"

    tokens = refresh_tokens(REFRESH_TOKEN)
    access_token = tokens.get("access_token")

    if access_token:
      if access_token:
        download_and_export_all_invoices(access_token, batch_size=50, csv_filename="factures.csv")

        
from collections import defaultdict

# --- Règles de catégorisation ---
CATEGORY_RULES = {
    "materiaux": ["sod", "concrete", "lumber", "rock", "sprinkler", "bag"],
    "services": ["weekly gardening", "pest control", "installation", "maintenance", "custom design"],
    "equipements": ["pump", "lighting", "heads", "pipes"],
}

# Facteurs d’émission (kgCO2e/€ dépensé) – proxies simplifiés
EMISSION_FACTORS = {
    "materiaux": 0.25,
    "services": 0.15,
    "equipements": 0.20,
    "autres": 0.20,
}

def categorize(libelle: str) -> str:
    text = (libelle or "").lower()
    for cat, keywords in CATEGORY_RULES.items():
        if any(k in text for k in keywords):
            return cat
    return "autres"

def compute_co2e(montant: float, libelle: str):
    cat = categorize(libelle)
    factor = EMISSION_FACTORS.get(cat, 0.20)
    co2e = montant * factor
    return cat, factor, co2e

def enrich_csv(input_file="factures.csv", output_file="factures_enrichies.csv"):
    factures = defaultdict(list)

    # Lecture et regroupement par facture
    with open(input_file, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["Libellé"].strip():  # ignorer lignes vides
                factures[row["InvoiceId"]].append(row)

    # Écriture du fichier enrichi
    with open(output_file, "w", newline="", encoding="utf-8") as f_out:
        fieldnames = ["InvoiceId", "Date", "ClientId", "Libellé", "Montant_ligne",
                      "Categorie", "FacteurEmission", "CO2e_kg"]
        writer = csv.DictWriter(f_out, fieldnames=fieldnames)
        writer.writeheader()

        for invoice_id, lignes in factures.items():
            total = float(lignes[0]["Montant total"])
            part = total / len(lignes)  # répartition équitable
            for row in lignes:
                cat, factor, co2e = compute_co2e(part, row["Libellé"])
                writer.writerow({
                    "InvoiceId": invoice_id,
                    "Date": row["Date"],
                    "ClientId": row["ClientId"],
                    "Libellé": row["Libellé"],
                    "Montant_ligne": round(part, 2),
                    "Categorie": cat,
                    "FacteurEmission": factor,
                    "CO2e_kg": round(co2e, 2),
                })

    print(f"✅ Fichier enrichi exporté : {output_file}")

if access_token:
    download_and_export_all_invoices(access_token, batch_size=50, csv_filename="factures.csv")
    enrich_csv("factures.csv", "factures_enrichies.csv")