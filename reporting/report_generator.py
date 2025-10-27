"""
Green App - ESG/CSR Carbon Report Generator
Compliant with ADEME and GHG Protocol standards

This module generates professional carbon reports for companies,
suitable for integration into annual ESG/CSR reports.
"""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from collections import defaultdict
import json


class CarbonReportGenerator:
    """
    Generate carbon reports compliant with ADEME and GHG Protocol standards
    """

    # GHG Protocol Scope definitions
    SCOPE_MAPPING = {
        'voyages_aeriens': 'Scope 3',
        'transport_routier': 'Scope 3',
        'energie': 'Scope 2',
        'materiaux': 'Scope 3',
        'services': 'Scope 3',
        'equipements': 'Scope 3',
        'autres': 'Scope 3'
    }

    # ADEME emission categories (Bilan Carbone)
    ADEME_CATEGORIES = {
        'voyages_aeriens': 'Déplacements professionnels',
        'transport_routier': 'Transport de marchandises',
        'energie': 'Énergie',
        'materiaux': 'Achats de biens',
        'services': 'Services achetés',
        'equipements': 'Immobilisations',
        'autres': 'Autres émissions'
    }

    def __init__(self, lang: str = 'fr'):
        """
        Initialize report generator

        Args:
            lang: Language for report ('fr' or 'en')
        """
        self.lang = lang
        self.data = None
        self.analysis = {}

    def load_data(self, csv_path: str) -> pd.DataFrame:
        """
        Load enriched invoice data

        Args:
            csv_path: Path to enriched CSV file

        Returns:
            DataFrame with loaded data
        """
        self.data = pd.read_csv(csv_path)

        # Ensure Date column is datetime
        if 'Date' in self.data.columns:
            self.data['Date'] = pd.to_datetime(self.data['Date'])

        return self.data

    def analyze_emissions(self) -> Dict:
        """
        Analyze emissions data and generate key metrics

        Returns:
            Dictionary with analysis results
        """
        if self.data is None or self.data.empty:
            raise ValueError("No data loaded. Call load_data() first.")

        # Total emissions
        total_emissions = self.data['CO2e_kg'].sum()

        # Emissions by category
        by_category = self.data.groupby('Categorie')['CO2e_kg'].agg([
            ('total', 'sum'),
            ('count', 'count'),
            ('average', 'mean')
        ]).round(2).to_dict('index')

        # Emissions by GHG Protocol Scope
        self.data['Scope'] = self.data['Categorie'].map(self.SCOPE_MAPPING)
        by_scope = self.data.groupby('Scope')['CO2e_kg'].sum().round(2).to_dict()

        # Emissions by ADEME category
        self.data['ADEME_Category'] = self.data['Categorie'].map(self.ADEME_CATEGORIES)
        by_ademe = self.data.groupby('ADEME_Category')['CO2e_kg'].sum().round(2).to_dict()

        # Monthly evolution
        if 'Date' in self.data.columns:
            self.data['YearMonth'] = self.data['Date'].dt.to_period('M')
            monthly = self.data.groupby('YearMonth')['CO2e_kg'].sum().round(2)
            monthly_evolution = {
                str(period): value for period, value in monthly.items()
            }
        else:
            monthly_evolution = {}

        # Top emitters
        top_suppliers = self.data.groupby('ClientId')['CO2e_kg'].sum().nlargest(10).round(2).to_dict()

        # Statistics
        invoice_count = len(self.data)
        avg_per_invoice = total_emissions / invoice_count if invoice_count > 0 else 0

        # Date range
        if 'Date' in self.data.columns and not self.data['Date'].isna().all():
            start_date = self.data['Date'].min()
            end_date = self.data['Date'].max()
            period_days = (end_date - start_date).days
        else:
            start_date = None
            end_date = None
            period_days = 0

        self.analysis = {
            'total_emissions_kg': round(total_emissions, 2),
            'total_emissions_tons': round(total_emissions / 1000, 2),
            'invoice_count': invoice_count,
            'average_per_invoice': round(avg_per_invoice, 2),
            'period': {
                'start_date': start_date.strftime('%Y-%m-%d') if start_date else None,
                'end_date': end_date.strftime('%Y-%m-%d') if end_date else None,
                'days': period_days
            },
            'by_category': by_category,
            'by_scope': by_scope,
            'by_ademe_category': by_ademe,
            'monthly_evolution': monthly_evolution,
            'top_emitters': top_suppliers
        }

        return self.analysis

    def calculate_benchmarks(self) -> Dict:
        """
        Calculate benchmarks and regulatory thresholds

        Returns:
            Dictionary with benchmark comparisons
        """
        if not self.analysis:
            self.analyze_emissions()

        total_tons = self.analysis['total_emissions_tons']

        # French BEGES (Bilan GES) thresholds
        # Companies > 500 employees or revenue > 100M€ must report
        beges_threshold = 500  # tons CO2e/year (example threshold)

        # Science-Based Targets initiative (SBTi)
        # 1.5°C pathway: ~50% reduction by 2030 from 2020 baseline
        sbt_target_2030 = total_tons * 0.5  # 50% reduction target

        # EU Taxonomy alignment (example)
        eu_taxonomy_threshold = 100  # gCO2e/kWh (example)

        benchmarks = {
            'beges_reporting_required': total_tons > beges_threshold,
            'beges_threshold': beges_threshold,
            'current_vs_threshold': round((total_tons / beges_threshold) * 100, 1) if beges_threshold > 0 else 0,
            'sbt_2030_target': round(sbt_target_2030, 2),
            'reduction_needed': round(total_tons - sbt_target_2030, 2),
            'eu_taxonomy_aligned': False,  # Simplified - would need detailed analysis
            'carbon_intensity': round(total_tons / self.analysis['invoice_count'], 4) if self.analysis['invoice_count'] > 0 else 0
        }

        return benchmarks

    def generate_recommendations(self) -> List[Dict]:
        """
        Generate actionable recommendations based on emissions data

        Returns:
            List of recommendations with priorities
        """
        if not self.analysis:
            self.analyze_emissions()

        recommendations = []

        # Analyze by category
        by_category = self.analysis['by_category']

        # Top emission category
        if by_category:
            top_category = max(by_category.items(), key=lambda x: x[1]['total'])
            category_name = top_category[0]
            category_emissions = top_category[1]['total']

            rec_map = {
                'voyages_aeriens': {
                    'fr': {
                        'title': 'Optimiser les déplacements aériens',
                        'description': 'Privilégier la visioconférence, choisir des vols directs, et compenser les émissions inévitables.',
                        'potential_reduction': round(category_emissions * 0.3, 2)
                    },
                    'en': {
                        'title': 'Optimize air travel',
                        'description': 'Prefer video conferencing, choose direct flights, and offset unavoidable emissions.',
                        'potential_reduction': round(category_emissions * 0.3, 2)
                    }
                },
                'transport_routier': {
                    'fr': {
                        'title': 'Optimiser la logistique transport',
                        'description': 'Consolider les livraisons, passer à des véhicules électriques, optimiser les tournées.',
                        'potential_reduction': round(category_emissions * 0.25, 2)
                    },
                    'en': {
                        'title': 'Optimize transport logistics',
                        'description': 'Consolidate deliveries, switch to electric vehicles, optimize routes.',
                        'potential_reduction': round(category_emissions * 0.25, 2)
                    }
                },
                'energie': {
                    'fr': {
                        'title': 'Passer aux énergies renouvelables',
                        'description': 'Souscrire à des contrats d\'électricité verte, installer des panneaux solaires, améliorer l\'efficacité énergétique.',
                        'potential_reduction': round(category_emissions * 0.6, 2)
                    },
                    'en': {
                        'title': 'Switch to renewable energy',
                        'description': 'Subscribe to green electricity contracts, install solar panels, improve energy efficiency.',
                        'potential_reduction': round(category_emissions * 0.6, 2)
                    }
                }
            }

            if category_name in rec_map:
                rec = rec_map[category_name][self.lang]
                rec['priority'] = 'high'
                rec['category'] = category_name
                recommendations.append(rec)

        # General recommendations
        general_recs = {
            'fr': [
                {
                    'title': 'Engager les fournisseurs',
                    'description': 'Travailler avec les fournisseurs pour réduire leur empreinte carbone et privilégier les fournisseurs engagés.',
                    'priority': 'medium',
                    'category': 'supply_chain'
                },
                {
                    'title': 'Former les équipes',
                    'description': 'Sensibiliser et former les collaborateurs aux enjeux climatiques et aux bonnes pratiques.',
                    'priority': 'medium',
                    'category': 'awareness'
                }
            ],
            'en': [
                {
                    'title': 'Engage suppliers',
                    'description': 'Work with suppliers to reduce their carbon footprint and favor committed suppliers.',
                    'priority': 'medium',
                    'category': 'supply_chain'
                },
                {
                    'title': 'Train teams',
                    'description': 'Raise awareness and train employees on climate issues and best practices.',
                    'priority': 'medium',
                    'category': 'awareness'
                }
            ]
        }

        recommendations.extend(general_recs[self.lang])

        return recommendations

    def prepare_report_data(self, climate_commitments: Optional[str] = None) -> Dict:
        """
        Prepare all data needed for report generation

        Args:
            climate_commitments: Custom climate commitments text

        Returns:
            Complete report data dictionary
        """
        if not self.analysis:
            self.analyze_emissions()

        benchmarks = self.calculate_benchmarks()
        recommendations = self.generate_recommendations()

        # Metadata
        metadata = {
            'generated_at': datetime.now().isoformat(),
            'generated_date': datetime.now().strftime('%Y-%m-%d'),
            'language': self.lang,
            'standards': ['ADEME Bilan Carbone', 'GHG Protocol'],
            'report_version': '1.0'
        }

        # Unit conversion based on language
        if self.lang == 'en':
            # Convert to lbs for US audience
            emissions_lbs = self.analysis['total_emissions_kg'] * 2.20462
            unit_weight = 'lbs'
            unit_currency = '$'
            unit_distance = 'mi'
        else:
            emissions_lbs = self.analysis['total_emissions_kg']
            unit_weight = 'kg'
            unit_currency = '€'
            unit_distance = 'km'

        report_data = {
            'metadata': metadata,
            'summary': {
                'total_emissions': self.analysis['total_emissions_kg'],
                'total_emissions_display': emissions_lbs,
                'unit': unit_weight,
                'total_emissions_tons': self.analysis['total_emissions_tons'],
                'invoice_count': self.analysis['invoice_count'],
                'average_per_invoice': self.analysis['average_per_invoice'],
                'period': self.analysis['period']
            },
            'breakdown': {
                'by_category': self.analysis['by_category'],
                'by_scope': self.analysis['by_scope'],
                'by_ademe_category': self.analysis['by_ademe_category']
            },
            'evolution': {
                'monthly': self.analysis['monthly_evolution']
            },
            'benchmarks': benchmarks,
            'recommendations': recommendations,
            'climate_commitments': climate_commitments or self._get_default_commitments(),
            'methodology': self._get_methodology_text(),
            'units': {
                'weight': unit_weight,
                'currency': unit_currency,
                'distance': unit_distance
            }
        }

        return report_data

    def _get_default_commitments(self) -> str:
        """Get default climate commitments text"""
        if self.lang == 'fr':
            return """
Notre entreprise s'engage à :
- Réduire nos émissions de gaz à effet de serre de 50% d'ici 2030
- Atteindre la neutralité carbone d'ici 2050
- Mesurer et publier annuellement notre bilan carbone
- Sensibiliser nos collaborateurs et partenaires aux enjeux climatiques
            """
        else:
            return """
Our company commits to:
- Reduce our greenhouse gas emissions by 50% by 2030
- Achieve carbon neutrality by 2050
- Measure and publish our carbon footprint annually
- Raise awareness among our employees and partners on climate issues
            """

    def _get_methodology_text(self) -> Dict:
        """Get methodology description text"""
        if self.lang == 'fr':
            return {
                'title': 'Méthodologie',
                'text': """
Ce rapport a été généré en conformité avec :
- La méthodologie Bilan Carbone® de l'ADEME
- Le GHG Protocol (Greenhouse Gas Protocol)

Les facteurs d'émission utilisés proviennent de la Base Carbone® de l'ADEME.
Les calculs incluent les scopes 2 et 3 du GHG Protocol.

Périmètre : Émissions liées aux achats et dépenses de l'entreprise
Période de référence : Indiquée dans la section Synthèse
                """,
                'sources': [
                    'ADEME Base Carbone®',
                    'GHG Protocol Corporate Standard',
                    'ISO 14064-1:2018'
                ]
            }
        else:
            return {
                'title': 'Methodology',
                'text': """
This report was generated in compliance with:
- ADEME's Bilan Carbone® methodology
- The GHG Protocol (Greenhouse Gas Protocol)

Emission factors used are from ADEME's Base Carbone®.
Calculations include GHG Protocol Scopes 2 and 3.

Scope: Emissions related to company purchases and expenses
Reference period: Indicated in the Summary section
                """,
                'sources': [
                    'ADEME Base Carbone®',
                    'GHG Protocol Corporate Standard',
                    'ISO 14064-1:2018'
                ]
            }


def generate_report(
    csv_path: str,
    lang: str = 'fr',
    climate_commitments: Optional[str] = None
) -> Dict:
    """
    Main function to generate a complete carbon report

    Args:
        csv_path: Path to enriched invoices CSV
        lang: Report language ('fr' or 'en')
        climate_commitments: Custom climate commitments text

    Returns:
        Complete report data ready for export
    """
    generator = CarbonReportGenerator(lang=lang)
    generator.load_data(csv_path)
    return generator.prepare_report_data(climate_commitments)
