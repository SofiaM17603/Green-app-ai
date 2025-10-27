# Démarrage rapide Green App

Ce guide vous permet de lancer l'application en 3 étapes simples.

## Prérequis

- Python 3.8 ou supérieur installé
- Un navigateur web moderne

## Étapes de lancement

### 1. Installer les dépendances

Ouvrez un terminal dans le dossier `/Users/sofia/Desktop/Green App` et exécutez :

```bash
# Activer l'environnement virtuel
source venv/bin/activate

# Installer/mettre à jour les dépendances
pip install -r requirements.txt
```

### 2. Lancer le backend

Dans le même terminal :

```bash
python app.py
```

Vous devriez voir :
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**Laissez ce terminal ouvert.**

### 3. Ouvrir l'interface web

Ouvrez un nouveau terminal dans le dossier `green-app-ui` :

```bash
cd green-app-ui
python3 -m http.server 8080
```

Puis ouvrez votre navigateur sur : **http://localhost:8080**

## Test de l'application

1. Cliquez sur "Analyser mes factures"
2. Sélectionnez le fichier `exemple_factures.csv` fourni
3. Cliquez sur "Analyser"
4. Consultez les résultats
5. Allez sur "Prévisions" et cliquez sur "Générer les prévisions"
6. Explorez les "Recommandations"

## Résolution rapide de problèmes

### Le backend ne démarre pas

**Erreur** : `ModuleNotFoundError: No module named 'fastapi'`

**Solution** :
```bash
pip install fastapi uvicorn python-multipart numpy python-dateutil
```

**Note** : Cette application utilise une régression linéaire au lieu de Prophet pour la compatibilité avec Python 3.13.

### L'interface ne se connecte pas au backend

**Vérifiez** :
1. Que le backend tourne bien (terminal doit montrer "Uvicorn running")
2. Ouvrez http://localhost:8000/docs pour tester le backend
3. Vérifiez la console du navigateur (F12) pour voir les erreurs

### Erreur CORS

Si vous voyez "CORS policy" dans la console :

**Solution** : Le middleware CORS a été ajouté dans `app.py`. Relancez le backend avec `python app.py`.

## Arrêter l'application

1. Dans le terminal du backend : `Ctrl + C`
2. Dans le terminal de l'interface : `Ctrl + C`

## Prochaines étapes

- Consultez le fichier `README.md` pour plus de détails
- Personnalisez les catégories d'émissions dans `app.py`
- Créez vos propres fichiers CSV de factures

Bon test ! 🌱
