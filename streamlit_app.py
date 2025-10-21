import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
from prophet import Prophet

st.title("📈 Prévisions Carbone (Historique + 6 mois)")

# Charger les factures enrichies
try:
    df = pd.read_csv("factures_enrichies.csv")
except FileNotFoundError:
    st.error("⚠️ Fichier factures_enrichies.csv introuvable. Lance d'abord /analyze_invoices.")
    st.stop()

# Préparer les données
df["Date"] = pd.to_datetime(df["Date"])
monthly = df.groupby(pd.Grouper(key="Date", freq="M"))["CO2e_kg"].sum().reset_index()
monthly = monthly.rename(columns={"Date": "ds", "CO2e_kg": "y"})

# Entraîner Prophet
model = Prophet()
model.fit(monthly)

# Prédire 6 mois dans le futur
future = model.make_future_dataframe(periods=6, freq="M")
forecast = model.predict(future)

# Afficher le graphique
fig, ax = plt.subplots(figsize=(10, 5))
ax.plot(monthly["ds"], monthly["y"], label="Historique", marker="o")
ax.plot(forecast["ds"], forecast["yhat"], label="Prévision", linestyle="--")
ax.fill_between(forecast["ds"], forecast["yhat_lower"], forecast["yhat_upper"], alpha=0.2, label="Intervalle")
ax.set_ylabel("Émissions (kgCO₂e)")
ax.set_title("Historique et prévisions des émissions carbone")
ax.legend()
st.pyplot(fig)

# Afficher les prévisions brutes
st.subheader("📊 Données prédites")
st.dataframe(forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(6))