# Green App - Interface Web

Interface web moderne pour analyser vos émissions carbone à partir de factures.

## Structure du projet

```
green-app-ui/
├── index.html              # Page principale avec navigation
├── style.css               # Styles modernes et responsive
├── script.js               # Logique JavaScript et intégration API
├── exemple_factures.csv    # Fichier CSV d'exemple pour tester
└── README.md               # Ce fichier
```

## Fonctionnalités

- **Page d'accueil** : Présentation de l'application avec 3 fonctionnalités clés
- **Analyse de factures** : Upload de fichier CSV (drag & drop ou sélection) avec calcul automatique des émissions
- **Prévisions carbone** : Graphique interactif des prévisions sur 6 mois avec Chart.js
- **Recommandations** : Conseils personnalisés pour réduire votre empreinte carbone

## Prérequis

### Backend FastAPI

Votre backend FastAPI doit être opérationnel avec les endpoints suivants :

1. **POST /analyze_invoices**
   - Accepte un fichier CSV via multipart/form-data
   - Retourne le fichier enrichi `factures_enrichies.csv`

2. **POST /forecast**
   - Génère les prévisions sur 6 mois
   - Retourne un JSON avec format Prophet : `[{ds: "date", yhat: value, yhat_lower: value, yhat_upper: value}, ...]`

### Dépendances Python requises

Assurez-vous que votre backend a ces dépendances installées :

```bash
pip install fastapi uvicorn pandas numpy python-dateutil python-multipart
```

**Note** : Prophet a été remplacé par une régression linéaire simple compatible avec Python 3.13.

## Installation et lancement

### Étape 1 : Installer les dépendances

Dans votre terminal, depuis le dossier racine de Green App :

```bash
# Créer un environnement virtuel (si pas déjà fait)
python3 -m venv venv

# Activer l'environnement virtuel
source venv/bin/activate  # Sur macOS/Linux
# ou
venv\Scripts\activate  # Sur Windows

# Installer les dépendances
pip install -r requirements.txt
```

### Étape 2 : Lancer le backend FastAPI

```bash
# Lancer le serveur FastAPI
python app.py
```

Le serveur démarrera automatiquement sur `http://localhost:8000`

Vous pouvez vérifier que le backend fonctionne en ouvrant `http://localhost:8000/docs` dans votre navigateur.

### Étape 3 : Ouvrir l'interface web

Deux options :

#### Option A : Ouvrir directement dans le navigateur

1. Naviguez vers le dossier `green-app-ui`
2. Double-cliquez sur `index.html`
3. L'interface s'ouvrira dans votre navigateur par défaut

#### Option B : Utiliser un serveur HTTP local (recommandé)

Pour éviter les problèmes de CORS :

```bash
# Depuis le dossier green-app-ui
cd green-app-ui

# Option 1 : Avec Python
python3 -m http.server 8080

# Option 2 : Avec Node.js (si installé)
npx http-server -p 8080

# Option 3 : Avec l'extension Live Server de VS Code
# Clic droit sur index.html > "Open with Live Server"
```

Puis ouvrez votre navigateur sur `http://localhost:8080`

## Configuration de l'URL du backend

Par défaut, l'interface attend que le backend soit sur `http://localhost:8000`.

Si votre backend est sur un autre port ou URL, modifiez la ligne 2 de `script.js` :

```javascript
const API_BASE_URL = 'http://localhost:8000'; // Changez cette URL si nécessaire
```

## Test rapide avec le fichier d'exemple

Un fichier `exemple_factures.csv` est fourni dans le dossier `green-app-ui/` pour tester rapidement l'application.

**Pour l'utiliser** :
1. Lancez le backend (voir section Installation)
2. Ouvrez l'interface web
3. Allez sur "Analyser mes factures"
4. Sélectionnez le fichier `exemple_factures.csv`
5. Cliquez sur "Analyser"

Le fichier contient 10 factures d'exemple de différentes catégories (électricité, transport, etc.) réparties sur 10 mois.

## Utilisation de l'interface

### 1. Analyser vos factures

1. Cliquez sur "Analyser mes factures" depuis l'accueil ou utilisez la navigation
2. Glissez-déposez votre fichier CSV ou cliquez sur "Parcourir les fichiers"
3. Cliquez sur "Analyser"
4. Attendez l'analyse (le fichier est envoyé à votre backend)
5. Consultez les statistiques affichées
6. Téléchargez le fichier enrichi si besoin

**Format attendu du CSV** :
```csv
InvoiceId,Date,ClientId,Libellé,Montant total
INV001,2025-01-15,C001,EDF électricité bureau,450.00
```

Les colonnes nécessaires sont :
- `InvoiceId` : Identifiant unique de la facture
- `Date` : Date au format YYYY-MM-DD
- `ClientId` : Identifiant du client
- `Libellé` : Description de la facture (utilisée pour la catégorisation)
- `Montant total` : Montant en euros

Le backend enrichira le fichier avec les colonnes supplémentaires : `Montant_ligne`, `Categorie`, `FacteurEmission`, et `CO2e_kg`

### 2. Visualiser les prévisions

1. Allez sur la page "Prévisions"
2. Cliquez sur "Générer les prévisions"
3. Un graphique interactif s'affichera avec :
   - La courbe de prévision (en vert)
   - Les limites inférieure et supérieure (en pointillés)
4. Passez la souris sur le graphique pour voir les détails

### 3. Recevoir des recommandations

1. Allez sur la page "Recommandations"
2. Cliquez sur "Recevoir des recommandations"
3. Consultez les conseils personnalisés classés par impact :
   - Impact élevé (vert) : Actions prioritaires
   - Impact moyen (jaune) : Actions complémentaires
   - Impact faible (bleu) : Actions à long terme

## Résolution de problèmes

### L'analyse ne fonctionne pas

**Erreur** : "Erreur lors de l'analyse: Failed to fetch" ou "Erreur HTTP: 404"

**Solutions** :
1. Vérifiez que le backend FastAPI est bien lancé
2. Testez l'endpoint dans votre navigateur : `http://localhost:8000/docs`
3. Vérifiez que l'URL dans `script.js` correspond à votre backend
4. Vérifiez les logs du serveur FastAPI pour voir les erreurs

### Problèmes CORS

Si vous voyez des erreurs CORS dans la console :

**Solution** : Ajoutez le middleware CORS dans votre backend FastAPI :

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifiez les domaines autorisés
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Les prévisions ne s'affichent pas

**Solutions** :
1. Assurez-vous d'avoir analysé des factures avant de générer les prévisions
2. Vérifiez que votre endpoint `/forecast` retourne le bon format JSON
3. Vérifiez que Prophet est installé : `pip install prophet`

### Le graphique ne s'affiche pas

**Vérifiez** :
1. Que vous avez une connexion Internet (Chart.js est chargé depuis un CDN)
2. Ouvrez la console du navigateur (F12) pour voir les erreurs JavaScript

## Format de données attendu

### Réponse de /forecast

```json
[
  {
    "ds": "2025-11-01",
    "yhat": 145.2,
    "yhat_lower": 120.5,
    "yhat_upper": 170.8
  },
  ...
]
```

- `ds` : Date au format ISO (YYYY-MM-DD)
- `yhat` : Prévision
- `yhat_lower` : Limite inférieure de confiance
- `yhat_upper` : Limite supérieure de confiance

## Personnalisation

### Modifier les couleurs

Éditez les variables CSS dans `style.css` (lignes 8-18) :

```css
:root {
    --primary-color: #10b981;  /* Couleur principale */
    --secondary-color: #3b82f6; /* Couleur secondaire */
    ...
}
```

### Ajouter des recommandations personnalisées

Modifiez la fonction `generateRecommendations()` dans `script.js` (ligne 367).

Vous pouvez également créer un endpoint `/recommendations` dans votre backend pour générer des recommandations dynamiques basées sur les données analysées.

## Technologies utilisées

- **HTML5** : Structure de la page
- **CSS3** : Design moderne et responsive avec variables CSS
- **JavaScript (ES6+)** : Logique et interaction
- **Chart.js 4.4** : Graphiques interactifs
- **Fetch API** : Appels HTTP vers le backend
- **FastAPI** : Backend (séparé)

## Support et développement futur

### Améliorations possibles

- Intégration d'une vraie API de recommandations basée sur l'IA
- Authentification utilisateur
- Sauvegarde de l'historique des analyses
- Export des graphiques en PDF
- Dashboard avec plusieurs types de visualisations
- Mode sombre
- Multi-langue

## Licence

Ce projet fait partie de Green App - Analyse d'émissions carbone.

---

**Besoin d'aide ?**

Si vous rencontrez des problèmes :
1. Vérifiez que toutes les étapes du README sont suivies
2. Consultez la console du navigateur (F12) pour les erreurs JavaScript
3. Consultez les logs du serveur FastAPI pour les erreurs backend
4. Vérifiez que tous les fichiers (index.html, style.css, script.js) sont bien dans le dossier green-app-ui
