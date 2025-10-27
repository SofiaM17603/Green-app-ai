# 📊 Module de Reporting ESG/RSE - Green App

Module complet de génération de rapports carbone professionnels conformes aux normes **ADEME** et **GHG Protocol**.

## 🎯 Fonctionnalités

- ✅ **Conformité réglementaire** : ADEME Bilan Carbone®, GHG Protocol, ISO 14064-1
- ✅ **Export multi-formats** : PDF et DOCX prêts pour intégration dans rapports annuels
- ✅ **Multilingue** : Français et Anglais avec adaptation des unités
- ✅ **Graphiques professionnels** : Évolution temporelle, répartition par scope/catégorie
- ✅ **Recommandations personnalisées** : Actions prioritaires basées sur les données
- ✅ **Benchmarking** : Comparaison avec seuils réglementaires et objectifs SBT

## 📂 Structure du module

```
reporting/
├── __init__.py                    # Point d'entrée du module
├── report_generator.py            # Générateur de rapports (analyse + calculs)
├── export.py                      # Export PDF et DOCX
├── templates/
│   ├── __init__.py
│   └── text_templates.py         # Templates texte bilingues
├── assets/                        # (Pour logos et images personnalisés)
└── README.md                      # Documentation complète
```

## 🚀 Installation

### Dépendances requises

Ajoutez ces bibliothèques à votre `requirements.txt` :

```txt
# Génération de rapports
reportlab>=4.0.0           # Génération PDF
python-docx>=1.1.0         # Génération DOCX
matplotlib>=3.8.0          # Graphiques
pandas>=2.1.0              # Analyse de données
numpy>=1.26.0              # Calculs numériques
```

### Installation des dépendances

```bash
pip install reportlab python-docx matplotlib pandas numpy
```

## 📖 Utilisation

### 1. Via l'API FastAPI (Recommandé)

#### Endpoint: `POST /generate_report`

**Paramètres:**
- `lang` (string, optionnel) : Langue du rapport ('fr' ou 'en', défaut: 'fr')
- `format` (string, optionnel) : Format d'export ('pdf' ou 'docx', défaut: 'pdf')
- `climate_commitments` (string, optionnel) : Texte personnalisé des engagements climat
- `file_id` (string, optionnel) : ID de fichier spécifique à analyser

**Exemples:**

```bash
# Générer un rapport PDF en français
curl -X POST "http://localhost:8000/generate_report?lang=fr&format=pdf" \
  -o rapport_carbone.pdf

# Générer un rapport DOCX en anglais
curl -X POST "http://localhost:8000/generate_report?lang=en&format=docx" \
  -o carbon_report.docx

# Avec engagements climat personnalisés
curl -X POST "http://localhost:8000/generate_report?lang=fr&format=pdf" \
  --data-urlencode "climate_commitments=Notre entreprise vise la neutralité carbone d'ici 2040..." \
  -o rapport.pdf
```

**Depuis votre frontend JavaScript:**

```javascript
// Générer un rapport PDF
async function generateReport(lang = 'fr', format = 'pdf') {
    try {
        const response = await fetch(
            `${API_BASE_URL}/generate_report?lang=${lang}&format=${format}`,
            { method: 'POST' }
        );

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // Télécharger automatiquement
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport_carbone_${Date.now()}.${format}`;
        a.click();

        console.log('Rapport généré avec succès!');
    } catch (error) {
        console.error('Erreur génération rapport:', error);
    }
}
```

### 2. Utilisation directe en Python

```python
from reporting import generate_report, export_pdf, export_docx

# 1. Générer les données du rapport
report_data = generate_report(
    csv_path='factures_enrichies.csv',
    lang='fr',
    climate_commitments='Nos engagements personnalisés...'
)

# 2. Exporter en PDF
export_pdf(report_data, 'rapport_carbone.pdf')

# 3. Ou exporter en DOCX
export_docx(report_data, 'rapport_carbone.docx')
```

### 3. Utilisation avancée avec la classe

```python
from reporting.report_generator import CarbonReportGenerator

# Initialiser le générateur
generator = CarbonReportGenerator(lang='en')

# Charger les données
generator.load_data('factures_enrichies.csv')

# Analyser les émissions
analysis = generator.analyze_emissions()
print(f"Total: {analysis['total_emissions_tons']} tonnes CO2e")

# Obtenir les benchmarks
benchmarks = generator.calculate_benchmarks()
print(f"BEGES required: {benchmarks['beges_reporting_required']}")

# Générer les recommandations
recommendations = generator.generate_recommendations()
for rec in recommendations:
    print(f"- {rec['title']}: {rec['description']}")

# Préparer le rapport complet
report_data = generator.prepare_report_data(
    climate_commitments="Our custom commitments..."
)

# Exporter
from reporting import export_pdf
export_pdf(report_data, 'custom_report.pdf')
```

## 📊 Contenu du rapport

### 1. Page de titre
- Titre du rapport
- Période d'analyse
- Émissions totales (chiffre clé)
- Mentions de conformité (ADEME, GHG Protocol)

### 2. Résumé exécutif
- Émissions totales (kg et tonnes CO₂e)
- Nombre de factures analysées
- Moyenne par facture
- Période de référence
- Graphique : Répartition par scope GHG Protocol

### 3. Répartition des émissions

#### Par catégorie d'activité
- Tableau détaillé avec pourcentages
- Nombre de factures par catégorie
- Moyenne par catégorie

#### Par scope GHG Protocol
- Scope 2 : Émissions indirectes liées à l'énergie
- Scope 3 : Autres émissions indirectes

#### Par poste Bilan Carbone® ADEME
- Déplacements professionnels
- Transport de marchandises
- Énergie
- Achats de biens
- Services achetés
- etc.

### 4. Évolution temporelle
- Graphique : Évolution mensuelle des émissions
- Tendances et variations
- Comparaison période-à-période

### 5. Benchmarks et objectifs
- **Seuils réglementaires** : Conformité BEGES (France)
- **Science-Based Targets** : Objectifs 1.5°C (50% réduction 2030)
- **Intensité carbone** : CO₂e par facture/transaction
- Position vs objectifs

### 6. Recommandations
Pour chaque recommandation :
- **Titre** et priorité (haute/moyenne/faible)
- **Description** des actions concrètes
- **Réduction potentielle** estimée en kg CO₂e

Exemples :
- Optimiser les déplacements aériens
- Passer aux énergies renouvelables
- Engager les fournisseurs
- Former les équipes

### 7. Engagements climat
Section personnalisable pour afficher les engagements de l'entreprise :
- Objectifs de réduction
- Échéances (2030, 2050)
- Actions en cours
- Certifications visées

### 8. Méthodologie et sources
- Description de la méthodologie
- Standards utilisés (ADEME, GHG Protocol, ISO 14064-1)
- Sources des facteurs d'émission
- Périmètre et limites
- Références bibliographiques

## 🌍 Support multilingue

### Langues supportées
- **Français (fr)** : Unités métriques (kg, tonnes, km, €)
- **Anglais (en)** : Unités impériales/US (lbs, tons, miles, $)

### Adaptation automatique
Le module adapte automatiquement :
- ✅ Tous les textes du rapport
- ✅ Les unités de mesure
- ✅ Les formats de nombres (séparateurs)
- ✅ Les formats de dates
- ✅ Les termes techniques

### Ajouter une nouvelle langue

1. **Éditer `templates/text_templates.py`** :

```python
TEMPLATES = {
    'fr': { ... },
    'en': { ... },
    'es': {  # Nouvelle langue : Espagnol
        'report_title': 'Informe de Carbono ESG/RSE',
        'executive_summary': 'Resumen Ejecutivo',
        # ... ajouter toutes les clés
    }
}
```

2. **Adapter les unités si nécessaire** dans `report_generator.py` :

```python
if self.lang == 'es':
    unit_weight = 'kg'
    unit_currency = '€'
    unit_distance = 'km'
```

## 🎨 Personnalisation

### 1. Changer les couleurs du PDF

Dans `export.py`, classe `PDFExporter` :

```python
def __init__(self, report_data: Dict, output_path: str):
    # Personnaliser les couleurs
    self.color_primary = colors.HexColor('#047857')     # Vert principal
    self.color_secondary = colors.HexColor('#10b981')   # Vert secondaire
    self.color_accent = colors.HexColor('#fbbf24')      # Or/Jaune
    self.color_text = colors.HexColor('#0a1f1a')       # Texte
```

### 2. Ajouter un logo

Dans `export.py`, méthode `create_header_footer` :

```python
def create_header_footer(self, canvas_obj, doc):
    # Ajouter votre logo
    logo_path = "reporting/assets/company_logo.png"
    if os.path.exists(logo_path):
        canvas_obj.drawImage(
            logo_path,
            2*cm,
            A4[1] - 1.3*cm,
            width=2*cm,
            height=1*cm,
            preserveAspectRatio=True
        )
```

### 3. Personnaliser les engagements climat par défaut

Dans `report_generator.py`, méthode `_get_default_commitments` :

```python
def _get_default_commitments(self) -> str:
    if self.lang == 'fr':
        return """
Notre entreprise s'engage à :
- Votre engagement 1
- Votre engagement 2
- Votre engagement 3
        """
```

### 4. Ajouter des graphiques personnalisés

Dans `export.py`, créer une nouvelle méthode :

```python
def _create_custom_chart(self, data: dict, title: str):
    """Créer un graphique personnalisé"""
    fig, ax = plt.subplots(figsize=(10, 6))

    # Votre logique de graphique
    # ...

    # Sauvegarder et retourner l'image
    img_buffer = io.BytesIO()
    plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
    img_buffer.seek(0)
    plt.close()

    return Image(img_buffer, width=15*cm, height=9*cm)
```

## 🔧 Ajouter d'autres normes

### Exemple : Ajouter la taxonomie européenne

1. **Dans `report_generator.py`**, ajouter une méthode :

```python
def calculate_eu_taxonomy_alignment(self) -> Dict:
    """
    Calculer l'alignement avec la taxonomie EU
    """
    # Critères taxonomie EU
    # - Contribution substantielle aux objectifs climat
    # - Ne pas nuire significativement (DNSH)
    # - Respect des garanties sociales minimales

    green_activities = 0
    total_revenue = 0

    # Votre logique de calcul
    # ...

    return {
        'aligned': green_activities > 0,
        'alignment_percentage': (green_activities / total_revenue * 100) if total_revenue > 0 else 0,
        'criteria_met': ['climate_mitigation', 'dnsh_verified']
    }
```

2. **Intégrer dans le rapport** :

```python
def prepare_report_data(self, climate_commitments: Optional[str] = None) -> Dict:
    # ... code existant ...

    # Ajouter EU Taxonomy
    eu_taxonomy = self.calculate_eu_taxonomy_alignment()

    report_data['compliance'] = {
        'ademe': True,
        'ghg_protocol': True,
        'eu_taxonomy': eu_taxonomy
    }

    return report_data
```

3. **Afficher dans le PDF** (`export.py`) :

```python
def _create_compliance_section(self, styles):
    elements = []
    compliance = self.report_data.get('compliance', {})

    elements.append(Paragraph("Conformité réglementaire", styles['SectionHeading']))

    # EU Taxonomy
    if 'eu_taxonomy' in compliance:
        tax = compliance['eu_taxonomy']
        elements.append(Paragraph(
            f"Taxonomie européenne : {tax['alignment_percentage']:.1f}% aligné",
            styles['BodyText']
        ))

    return elements
```

## 📈 Cas d'usage avancés

### 1. Comparer plusieurs périodes

```python
from reporting import CarbonReportGenerator
import pandas as pd

# Charger les données de 2 années
gen_2023 = CarbonReportGenerator(lang='fr')
gen_2023.load_data('factures_2023.csv')
analysis_2023 = gen_2023.analyze_emissions()

gen_2024 = CarbonReportGenerator(lang='fr')
gen_2024.load_data('factures_2024.csv')
analysis_2024 = gen_2024.analyze_emissions()

# Comparer
reduction = analysis_2023['total_emissions_tons'] - analysis_2024['total_emissions_tons']
reduction_pct = (reduction / analysis_2023['total_emissions_tons']) * 100

print(f"Réduction : {reduction:.2f} tonnes ({reduction_pct:.1f}%)")
```

### 2. Générer plusieurs rapports automatiquement

```python
from reporting import generate_report, export_pdf
from pathlib import Path

# Générer un rapport par fichier
uploads_dir = Path('uploads')
for csv_file in uploads_dir.glob('*_enriched.csv'):
    # Rapport français PDF
    report_fr = generate_report(str(csv_file), lang='fr')
    export_pdf(report_fr, f'reports/{csv_file.stem}_FR.pdf')

    # Rapport anglais DOCX
    report_en = generate_report(str(csv_file), lang='en')
    export_docx(report_en, f'reports/{csv_file.stem}_EN.docx')

    print(f"✅ Rapports générés pour {csv_file.name}")
```

### 3. Automatiser la génération mensuelle

```python
from reporting import generate_report, export_pdf
from datetime import datetime
import schedule

def generate_monthly_report():
    """Génère le rapport mensuel automatiquement"""
    month = datetime.now().strftime('%Y-%m')

    report_data = generate_report(
        csv_path='factures_enrichies.csv',
        lang='fr',
        climate_commitments=f"Rapport mensuel {month}"
    )

    output_file = f'reports/rapport_mensuel_{month}.pdf'
    export_pdf(report_data, output_file)

    print(f"✅ Rapport mensuel généré : {output_file}")

# Planifier le 1er de chaque mois à 9h
schedule.every().month.at("09:00").do(generate_monthly_report)

# Exécuter
while True:
    schedule.run_pending()
    time.sleep(3600)  # Vérifier toutes les heures
```

## 🧪 Tests et validation

### Tester la génération de rapport

```bash
# Depuis la racine du projet
python -m pytest reporting/tests/  # Si vous ajoutez des tests

# Ou tester manuellement
python -c "
from reporting import generate_report, export_pdf
data = generate_report('factures_enrichies.csv', lang='fr')
export_pdf(data, 'test_report.pdf')
print('✅ Test réussi!')
"
```

### Valider la conformité

Le module garantit la conformité avec :

- ✅ **ADEME Bilan Carbone®** : Catégorisation des postes d'émission
- ✅ **GHG Protocol** : Séparation Scope 1/2/3
- ✅ **ISO 14064-1:2018** : Méthodologie de quantification

## ❓ FAQ

**Q: Puis-je utiliser ce module sans Green App?**
R: Oui ! Le module est standalone. Il suffit d'avoir un CSV avec les colonnes requises : `InvoiceId`, `Date`, `ClientId`, `Libellé`, `Montant total`, `Categorie`, `CO2e_kg`.

**Q: Comment ajouter ma propre méthodologie de calcul?**
R: Modifiez `report_generator.py`, méthode `analyze_emissions()` pour intégrer vos calculs personnalisés.

**Q: Les rapports sont-ils acceptés par l'ADEME?**
R: Les rapports suivent la méthodologie Bilan Carbone® et utilisent la Base Carbone® pour les facteurs d'émission. Pour une validation officielle ADEME, consultez un organisme certifié.

**Q: Puis-je personnaliser complètement le design du PDF?**
R: Oui ! Éditez `export.py`, classe `PDFExporter`. Vous avez un contrôle total sur le layout, les couleurs, les polices, etc.

**Q: Les graphiques sont-ils interactifs?**
R: Dans les PDF, les graphiques sont des images statiques. Pour des rapports interactifs, considérez générer du HTML avec Plotly ou Bokeh.

## 📞 Support

Pour toute question ou problème :
1. Consultez cette documentation
2. Vérifiez les logs d'erreur
3. Examinez les exemples dans ce README
4. Créez une issue sur GitHub (si applicable)

## 📝 Licence

Ce module fait partie de Green App. Tous droits réservés.

---

**Généré avec ❤️ par Green App**
*Mesurez. Réduisez. Agissez.*
