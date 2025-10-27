"""
Bilingual text templates for carbon reports
French (FR) and English (EN)
"""

TEMPLATES = {
    'fr': {
        'report_title': 'Rapport Carbone ESG/RSE',
        'company_section': 'Informations Entreprise',
        'executive_summary': 'Résumé Exécutif',
        'emissions_breakdown': 'Répartition des Émissions',
        'evolution': 'Évolution Temporelle',
        'benchmarks': 'Comparaison et Objectifs',
        'recommendations': 'Recommandations',
        'commitments': 'Engagements Climat',
        'methodology': 'Méthodologie et Sources',

        # Summary section
        'total_emissions': 'Émissions totales',
        'reporting_period': 'Période de référence',
        'invoice_analyzed': 'Factures analysées',
        'average_per_invoice': 'Moyenne par facture',

        # Breakdown
        'by_category': 'Par catégorie d\'activité',
        'by_scope': 'Par scope GHG Protocol',
        'by_ademe': 'Par poste Bilan Carbone® ADEME',

        # Evolution
        'monthly_trend': 'Évolution mensuelle',
        'yearly_comparison': 'Comparaison annuelle',

        # Benchmarks
        'regulatory_threshold': 'Seuils réglementaires',
        'beges_compliance': 'Conformité BEGES',
        'sbt_targets': 'Objectifs Science-Based Targets',
        'reduction_target': 'Objectif de réduction',

        # Recommendations
        'priority_high': 'Priorité haute',
        'priority_medium': 'Priorité moyenne',
        'priority_low': 'Priorité faible',
        'potential_reduction': 'Réduction potentielle',

        # Footer
        'generated_on': 'Rapport généré le',
        'standards_compliance': 'Conforme aux standards',
        'page': 'Page',

        # Units
        'unit_co2e': 'kg CO₂e',
        'unit_tons': 'tonnes CO₂e',
        'unit_percent': '%',
    },

    'en': {
        'report_title': 'ESG/CSR Carbon Report',
        'company_section': 'Company Information',
        'executive_summary': 'Executive Summary',
        'emissions_breakdown': 'Emissions Breakdown',
        'evolution': 'Time Evolution',
        'benchmarks': 'Benchmarks and Targets',
        'recommendations': 'Recommendations',
        'commitments': 'Climate Commitments',
        'methodology': 'Methodology and Sources',

        # Summary section
        'total_emissions': 'Total emissions',
        'reporting_period': 'Reporting period',
        'invoice_analyzed': 'Invoices analyzed',
        'average_per_invoice': 'Average per invoice',

        # Breakdown
        'by_category': 'By activity category',
        'by_scope': 'By GHG Protocol scope',
        'by_ademe': 'By ADEME Carbon Balance category',

        # Evolution
        'monthly_trend': 'Monthly trend',
        'yearly_comparison': 'Yearly comparison',

        # Benchmarks
        'regulatory_threshold': 'Regulatory thresholds',
        'beges_compliance': 'BEGES compliance',
        'sbt_targets': 'Science-Based Targets',
        'reduction_target': 'Reduction target',

        # Recommendations
        'priority_high': 'High priority',
        'priority_medium': 'Medium priority',
        'priority_low': 'Low priority',
        'potential_reduction': 'Potential reduction',

        # Footer
        'generated_on': 'Report generated on',
        'standards_compliance': 'Compliant with standards',
        'page': 'Page',

        # Units
        'unit_co2e': 'lbs CO₂e',
        'unit_tons': 'tons CO₂e',
        'unit_percent': '%',
    }
}


def get_template(lang: str = 'fr') -> dict:
    """Get templates for specified language"""
    return TEMPLATES.get(lang, TEMPLATES['fr'])


def format_number(value: float, lang: str = 'fr', decimals: int = 2) -> str:
    """Format number according to locale"""
    if lang == 'fr':
        # French: space as thousand separator, comma as decimal
        formatted = f"{value:,.{decimals}f}".replace(',', ' ').replace('.', ',')
        return formatted.replace(' ', ' ')  # Use non-breaking space
    else:
        # English: comma as thousand separator, period as decimal
        return f"{value:,.{decimals}f}"
