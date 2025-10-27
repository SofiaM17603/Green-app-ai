import streamlit as st
import requests
import pandas as pd
import matplotlib.pyplot as plt

st.title("📊 Prévisions Carbone")

# Appel à ton API FastAPI
url = "http://localhost:8030/forecast"
response = requests.get(url)

if response.status_code == 200:
    data = response.json()["forecast_next_month"]

    # Affichage des résultats
    st.subheader("Prévision du mois prochain")
    st.write(f"Date prévue : {data['ds']}")
    st.write(f"Estimation centrale : {round(data['yhat'], 2)} kgCO₂e")
    st.write(f"Intervalle : {round(data['yhat_lower'], 2)} – {round(data['yhat_upper'], 2)} kgCO₂e")

    # Graphique simple
    df = pd.DataFrame([data])
    fig, ax = plt.subplots()
    ax.bar(df["ds"], df["yhat"], yerr=[[df["yhat"]-df["yhat_lower"]], [df["yhat_upper"]-df["yhat"]]], capsize=5)
    ax.set_ylabel("Émissions prévues (kgCO₂e)")
    ax.set_title("Prévision carbone du mois prochain")
    st.pyplot(fig)

else:
    st.error("Impossible de récupérer les prévisions depuis l'API.")
