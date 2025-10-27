# 📁 Fichiers CSV d'exemple

J'ai créé **3 fichiers CSV réalistes** pour tester votre Green App avec différents scénarios :

---

## 📊 1. `factures_entreprise_2025.csv`

**50 factures | Janvier à Octobre 2025**

### Contenu
- Dépenses d'une entreprise classique sur 10 mois
- Mix équilibré de toutes les catégories

### Catégories incluses
| Catégorie | Exemples | Nb factures |
|-----------|----------|-------------|
| ✈️ **Voyages aériens** | Air France, Delta, Lufthansa, Emirates, British Airways | ~12 |
| 🚗 **Transport routier** | Uber, Taxi, Location voiture | ~10 |
| ⚡ **Énergie** | EDF, Engie, PG&E (électricité et gaz) | ~10 |
| 🛒 **Équipements** | Ordinateurs, mobilier, climatiseurs, imprimantes | ~10 |
| 🏗️ **Matériaux** | Fournitures bureau, équipements divers | ~3 |
| 🔧 **Services** | Maintenance, comptabilité, formation, nettoyage | ~5 |

### Montant total
~**48 000 €** sur l'année

### Émissions estimées
~**10 000 - 12 000 kg CO₂e**

### 💡 Idéal pour
- Tester le dashboard complet
- Voir l'évolution mensuelle sur 10 mois
- Analyser les tendances saisonnières

---

## 🚀 2. `factures_startup_q3_2025.csv`

**34 factures | Juillet à Septembre 2025**

### Contenu
- Dépenses d'une startup tech sur Q3 2025
- Focus sur tech, voyages business, coworking

### Highlights
- 💻 **Tech-heavy** : MacBook Pro, serveurs Dell, écrans 4K, licences Adobe
- ✈️ **Business trips** : San Francisco (YC Demo Day), Berlin, Londres, Dublin
- ⚡ **Cloud & Hosting** : AWS, PG&E pour coworking
- 🪑 **Remote work** : Standing desks, chaises ergo, équipements visio

### Montant total
~**42 000 €** sur 3 mois

### Émissions estimées
~**8 500 - 10 000 kg CO₂e**

### 💡 Idéal pour
- Simuler une startup en croissance
- Voir l'impact des voyages internationaux
- Tester avec beaucoup d'équipements tech

---

## 📅 3. `historique_2024_q4.csv`

**15 factures | Octobre à Décembre 2024**

### Contenu
- Historique du dernier trimestre 2024
- Données plus anciennes pour l'historique

### Particularités
- 🎄 **Fin d'année** : Achats équipements avant clôture
- ❄️ **Hiver** : Chauffage, climatisation, consommation énergie élevée
- 🌍 **Voyages** : Salon tech Dubai, déplacements Europe

### Montant total
~**15 500 €** sur 3 mois

### Émissions estimées
~**3 500 - 4 000 kg CO₂e**

### 💡 Idéal pour
- Avoir de l'historique pour les prévisions
- Comparer 2024 vs 2025
- Tester la consolidation multi-fichiers

---

## 🎯 Comment les utiliser

### Scénario 1 : Test complet
1. Uploadez `factures_entreprise_2025.csv`
2. Allez sur Dashboard → Voyez 10 mois de données
3. Allez sur Prévisions → Projection sur 6 mois
4. Allez sur Recommandations → Conseils basés sur vos vraies catégories

### Scénario 2 : Multi-fichiers
1. Uploadez `historique_2024_q4.csv`
2. Uploadez `factures_entreprise_2025.csv`
3. Dashboard → Voit les données consolidées des 2 fichiers
4. Mes Fichiers → Gérez les 2 fichiers séparément

### Scénario 3 : Startup mode
1. Uploadez `factures_startup_q3_2025.csv`
2. Voyez l'impact des voyages internationaux
3. Analysez les dépenses tech vs transport

### Scénario 4 : Test suppression
1. Uploadez les 3 fichiers
2. Dashboard affiche ~66 000€ et ~22 000 kg CO₂e
3. Supprimez un fichier depuis "Mes Fichiers"
4. Dashboard se met à jour automatiquement

---

## 📈 Répartition par catégorie (tous fichiers combinés)

Si vous uploadez les 3 fichiers :

| Catégorie | Émissions estimées | % du total |
|-----------|-------------------|------------|
| ✈️ Voyages aériens | ~8 000 kg CO₂e | 36% |
| ⚡ Énergie | ~7 500 kg CO₂e | 34% |
| 🛒 Équipements | ~3 500 kg CO₂e | 16% |
| 🚗 Transport routier | ~2 000 kg CO₂e | 9% |
| 🔧 Services | ~800 kg CO₂e | 4% |
| 🏗️ Matériaux | ~200 kg CO₂e | 1% |

**Total : ~22 000 kg CO₂e**

---

## 🎨 Recommandations attendues

Après upload, vous devriez voir des recommandations comme :

1. **Réduire les voyages aériens** (Impact élevé)
   - 36% de vos émissions
   - Privilégier le train <800km
   - Organiser des visioconférences

2. **Optimiser la consommation énergétique** (Impact élevé)
   - 34% de vos émissions
   - Passer aux énergies renouvelables
   - Améliorer l'isolation

3. **Optimiser le transport routier** (Impact moyen)
   - Covoiturage, véhicules électriques

---

## ⚡ Tips

- Les fichiers sont dans `green-app-ui/` pour un accès rapide
- Tous les montants sont en euros
- Dates réalistes pour voir les tendances
- Libellés variés pour tester la catégorisation automatique
- Vous pouvez éditer les CSV pour créer vos propres scénarios

Bon test ! 🌱
