"""
Climate Action Plan Generator

Analyzes emissions data and generates prioritized, actionable climate plans
for reducing carbon footprint.
"""

import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json


class ActionPlanGenerator:
    """Generate climate action plans based on emissions data"""

    # Action templates by category (bilingual)
    ACTION_TEMPLATES = {
        'voyages_aeriens': {
            'fr': [
                {
                    'title': 'Privilégier le train pour les trajets < 4h',
                    'description': 'Remplacer les vols courts par le train lorsque possible. Le train émet jusqu\'à 30 fois moins de CO2 que l\'avion.',
                    'impact': 'high',
                    'feasibility': 'medium',
                    'reduction_percent': 60,
                    'category': 'voyages_aeriens'
                },
                {
                    'title': 'Mettre en place une politique de visioconférence',
                    'description': 'Encourager les réunions virtuelles pour réduire les déplacements professionnels non essentiels.',
                    'impact': 'high',
                    'feasibility': 'easy',
                    'reduction_percent': 40,
                    'category': 'voyages_aeriens'
                },
                {
                    'title': 'Compenser les vols incompressibles',
                    'description': 'Investir dans des projets de compensation carbone certifiés pour les vols nécessaires.',
                    'impact': 'medium',
                    'feasibility': 'easy',
                    'reduction_percent': 0,  # Compensation, not reduction
                    'category': 'voyages_aeriens'
                }
            ],
            'en': [
                {
                    'title': 'Prioritize train for trips < 4h',
                    'description': 'Replace short flights with train when possible. Trains emit up to 30 times less CO2 than planes.',
                    'impact': 'high',
                    'feasibility': 'medium',
                    'reduction_percent': 60,
                    'category': 'voyages_aeriens'
                },
                {
                    'title': 'Implement a video conferencing policy',
                    'description': 'Encourage virtual meetings to reduce non-essential business travel.',
                    'impact': 'high',
                    'feasibility': 'easy',
                    'reduction_percent': 40,
                    'category': 'voyages_aeriens'
                },
                {
                    'title': 'Offset unavoidable flights',
                    'description': 'Invest in certified carbon offset projects for necessary flights.',
                    'impact': 'medium',
                    'feasibility': 'easy',
                    'reduction_percent': 0,
                    'category': 'voyages_aeriens'
                }
            ]
        },
        'transport_routier': {
            'fr': [
                {
                    'title': 'Optimiser les tournées de livraison',
                    'description': 'Utiliser des logiciels de route optimization pour réduire les kilomètres parcourus et la consommation de carburant.',
                    'impact': 'high',
                    'feasibility': 'medium',
                    'reduction_percent': 25,
                    'category': 'transport_routier'
                },
                {
                    'title': 'Transition vers véhicules électriques',
                    'description': 'Remplacer progressivement la flotte par des véhicules électriques ou hybrides.',
                    'impact': 'high',
                    'feasibility': 'hard',
                    'reduction_percent': 70,
                    'category': 'transport_routier'
                },
                {
                    'title': 'Former les conducteurs à l\'éco-conduite',
                    'description': 'Programme de formation pour adopter des pratiques de conduite économes en carburant.',
                    'impact': 'medium',
                    'feasibility': 'easy',
                    'reduction_percent': 15,
                    'category': 'transport_routier'
                }
            ],
            'en': [
                {
                    'title': 'Optimize delivery routes',
                    'description': 'Use route optimization software to reduce kilometers driven and fuel consumption.',
                    'impact': 'high',
                    'feasibility': 'medium',
                    'reduction_percent': 25,
                    'category': 'transport_routier'
                },
                {
                    'title': 'Transition to electric vehicles',
                    'description': 'Gradually replace fleet with electric or hybrid vehicles.',
                    'impact': 'high',
                    'feasibility': 'hard',
                    'reduction_percent': 70,
                    'category': 'transport_routier'
                },
                {
                    'title': 'Train drivers in eco-driving',
                    'description': 'Training program to adopt fuel-efficient driving practices.',
                    'impact': 'medium',
                    'feasibility': 'easy',
                    'reduction_percent': 15,
                    'category': 'transport_routier'
                }
            ]
        },
        'energie': {
            'fr': [
                {
                    'title': 'Passer à l\'électricité verte',
                    'description': 'Souscrire à un contrat d\'électricité 100% renouvelable auprès d\'un fournisseur certifié.',
                    'impact': 'high',
                    'feasibility': 'easy',
                    'reduction_percent': 80,
                    'category': 'energie'
                },
                {
                    'title': 'Installer des panneaux solaires',
                    'description': 'Produire votre propre électricité verte pour réduire la dépendance au réseau.',
                    'impact': 'high',
                    'feasibility': 'hard',
                    'reduction_percent': 50,
                    'category': 'energie'
                },
                {
                    'title': 'Améliorer l\'isolation des bâtiments',
                    'description': 'Réduire les besoins en chauffage et climatisation par une meilleure isolation.',
                    'impact': 'high',
                    'feasibility': 'medium',
                    'reduction_percent': 30,
                    'category': 'energie'
                },
                {
                    'title': 'Remplacer les ampoules par des LED',
                    'description': 'Les LED consomment 75% moins d\'énergie que les ampoules classiques.',
                    'impact': 'medium',
                    'feasibility': 'easy',
                    'reduction_percent': 10,
                    'category': 'energie'
                }
            ],
            'en': [
                {
                    'title': 'Switch to green electricity',
                    'description': 'Subscribe to a 100% renewable electricity contract from a certified supplier.',
                    'impact': 'high',
                    'feasibility': 'easy',
                    'reduction_percent': 80,
                    'category': 'energie'
                },
                {
                    'title': 'Install solar panels',
                    'description': 'Generate your own green electricity to reduce grid dependence.',
                    'impact': 'high',
                    'feasibility': 'hard',
                    'reduction_percent': 50,
                    'category': 'energie'
                },
                {
                    'title': 'Improve building insulation',
                    'description': 'Reduce heating and cooling needs through better insulation.',
                    'impact': 'high',
                    'feasibility': 'medium',
                    'reduction_percent': 30,
                    'category': 'energie'
                },
                {
                    'title': 'Replace bulbs with LEDs',
                    'description': 'LEDs use 75% less energy than traditional bulbs.',
                    'impact': 'medium',
                    'feasibility': 'easy',
                    'reduction_percent': 10,
                    'category': 'energie'
                }
            ]
        },
        'materiaux': {
            'fr': [
                {
                    'title': 'Privilégier les matériaux recyclés',
                    'description': 'Acheter des matériaux de construction recyclés ou biosourcés pour réduire l\'empreinte carbone.',
                    'impact': 'high',
                    'feasibility': 'medium',
                    'reduction_percent': 40,
                    'category': 'materiaux'
                },
                {
                    'title': 'Mettre en place un système de réemploi',
                    'description': 'Créer une filière de récupération et réutilisation des matériaux sur les chantiers.',
                    'impact': 'medium',
                    'feasibility': 'medium',
                    'reduction_percent': 25,
                    'category': 'materiaux'
                },
                {
                    'title': 'Choisir des fournisseurs locaux',
                    'description': 'Réduire le transport en privilégiant les fournisseurs dans un rayon de 100 km.',
                    'impact': 'medium',
                    'feasibility': 'easy',
                    'reduction_percent': 15,
                    'category': 'materiaux'
                }
            ],
            'en': [
                {
                    'title': 'Prioritize recycled materials',
                    'description': 'Purchase recycled or bio-based construction materials to reduce carbon footprint.',
                    'impact': 'high',
                    'feasibility': 'medium',
                    'reduction_percent': 40,
                    'category': 'materiaux'
                },
                {
                    'title': 'Implement a reuse system',
                    'description': 'Create a recovery and reuse channel for materials on construction sites.',
                    'impact': 'medium',
                    'feasibility': 'medium',
                    'reduction_percent': 25,
                    'category': 'materiaux'
                },
                {
                    'title': 'Choose local suppliers',
                    'description': 'Reduce transport by prioritizing suppliers within 60 miles.',
                    'impact': 'medium',
                    'feasibility': 'easy',
                    'reduction_percent': 15,
                    'category': 'materiaux'
                }
            ]
        },
        'services': {
            'fr': [
                {
                    'title': 'Passer à un hébergeur web vert',
                    'description': 'Migrer vers un hébergeur qui utilise 100% d\'énergies renouvelables pour ses data centers.',
                    'impact': 'medium',
                    'feasibility': 'easy',
                    'reduction_percent': 50,
                    'category': 'services'
                },
                {
                    'title': 'Optimiser les services numériques',
                    'description': 'Réduire la consommation d\'énergie des serveurs et applications en optimisant le code.',
                    'impact': 'medium',
                    'feasibility': 'medium',
                    'reduction_percent': 30,
                    'category': 'services'
                },
                {
                    'title': 'Sensibiliser les équipes',
                    'description': 'Former les collaborateurs aux gestes numériques responsables (désabonnements, nettoyage emails...).',
                    'impact': 'low',
                    'feasibility': 'easy',
                    'reduction_percent': 10,
                    'category': 'services'
                }
            ],
            'en': [
                {
                    'title': 'Switch to green web hosting',
                    'description': 'Migrate to a host that uses 100% renewable energy for its data centers.',
                    'impact': 'medium',
                    'feasibility': 'easy',
                    'reduction_percent': 50,
                    'category': 'services'
                },
                {
                    'title': 'Optimize digital services',
                    'description': 'Reduce server and application energy consumption by optimizing code.',
                    'impact': 'medium',
                    'feasibility': 'medium',
                    'reduction_percent': 30,
                    'category': 'services'
                },
                {
                    'title': 'Raise team awareness',
                    'description': 'Train employees in responsible digital practices (unsubscribing, email cleanup...).',
                    'impact': 'low',
                    'feasibility': 'easy',
                    'reduction_percent': 10,
                    'category': 'services'
                }
            ]
        },
        'equipements': {
            'fr': [
                {
                    'title': 'Prolonger la durée de vie des équipements',
                    'description': 'Réparer et maintenir plutôt que remplacer. Un ordinateur gardé 5 ans au lieu de 3 réduit son impact de 40%.',
                    'impact': 'high',
                    'feasibility': 'easy',
                    'reduction_percent': 40,
                    'category': 'equipements'
                },
                {
                    'title': 'Acheter du matériel reconditionné',
                    'description': 'Privilégier l\'équipement reconditionné certifié pour le matériel informatique et électronique.',
                    'impact': 'high',
                    'feasibility': 'easy',
                    'reduction_percent': 70,
                    'category': 'equipements'
                },
                {
                    'title': 'Mettre en place un programme de recyclage',
                    'description': 'Assurer le recyclage correct des équipements en fin de vie via des filières certifiées.',
                    'impact': 'medium',
                    'feasibility': 'easy',
                    'reduction_percent': 20,
                    'category': 'equipements'
                }
            ],
            'en': [
                {
                    'title': 'Extend equipment lifespan',
                    'description': 'Repair and maintain rather than replace. A computer kept 5 years instead of 3 reduces its impact by 40%.',
                    'impact': 'high',
                    'feasibility': 'easy',
                    'reduction_percent': 40,
                    'category': 'equipements'
                },
                {
                    'title': 'Buy refurbished equipment',
                    'description': 'Prioritize certified refurbished equipment for IT and electronics.',
                    'impact': 'high',
                    'feasibility': 'easy',
                    'reduction_percent': 70,
                    'category': 'equipements'
                },
                {
                    'title': 'Implement a recycling program',
                    'description': 'Ensure proper recycling of end-of-life equipment through certified channels.',
                    'impact': 'medium',
                    'feasibility': 'easy',
                    'reduction_percent': 20,
                    'category': 'equipements'
                }
            ]
        },
        'achat': {
            'fr': [
                {
                    'title': 'Privilégier les fournisseurs éco-responsables',
                    'description': 'Sélectionner des fournisseurs avec des certifications environnementales et des pratiques durables.',
                    'impact': 'high',
                    'feasibility': 'medium',
                    'reduction_percent': 30,
                    'category': 'achat'
                },
                {
                    'title': 'Optimiser les volumes d\'achat',
                    'description': 'Grouper les commandes pour réduire la fréquence de livraison et les émissions liées au transport.',
                    'impact': 'medium',
                    'feasibility': 'easy',
                    'reduction_percent': 20,
                    'category': 'achat'
                },
                {
                    'title': 'Acheter local et de saison',
                    'description': 'Privilégier les produits locaux et de saison pour réduire l\'empreinte carbone du transport.',
                    'impact': 'high',
                    'feasibility': 'medium',
                    'reduction_percent': 35,
                    'category': 'achat'
                }
            ],
            'en': [
                {
                    'title': 'Prioritize eco-responsible suppliers',
                    'description': 'Select suppliers with environmental certifications and sustainable practices.',
                    'impact': 'high',
                    'feasibility': 'medium',
                    'reduction_percent': 30,
                    'category': 'achat'
                },
                {
                    'title': 'Optimize purchase volumes',
                    'description': 'Group orders to reduce delivery frequency and transport-related emissions.',
                    'impact': 'medium',
                    'feasibility': 'easy',
                    'reduction_percent': 20,
                    'category': 'achat'
                },
                {
                    'title': 'Buy local and seasonal',
                    'description': 'Prioritize local and seasonal products to reduce transportation carbon footprint.',
                    'impact': 'high',
                    'feasibility': 'medium',
                    'reduction_percent': 35,
                    'category': 'achat'
                }
            ]
        },
        'approvisionnement': {
            'fr': [
                {
                    'title': 'Optimiser la logistique et le transport',
                    'description': 'Mutualiser les livraisons et privilégier les modes de transport bas-carbone.',
                    'impact': 'high',
                    'feasibility': 'medium',
                    'reduction_percent': 40,
                    'category': 'approvisionnement'
                },
                {
                    'title': 'Réduire les stocks dormants',
                    'description': 'Améliorer la gestion des stocks pour éviter le sur-stockage et les pertes.',
                    'impact': 'medium',
                    'feasibility': 'medium',
                    'reduction_percent': 25,
                    'category': 'approvisionnement'
                },
                {
                    'title': 'Digitaliser la chaîne d\'approvisionnement',
                    'description': 'Utiliser des outils numériques pour optimiser les flux et réduire les déchets.',
                    'impact': 'medium',
                    'feasibility': 'hard',
                    'reduction_percent': 20,
                    'category': 'approvisionnement'
                }
            ],
            'en': [
                {
                    'title': 'Optimize logistics and transportation',
                    'description': 'Pool deliveries and prioritize low-carbon transportation modes.',
                    'impact': 'high',
                    'feasibility': 'medium',
                    'reduction_percent': 40,
                    'category': 'approvisionnement'
                },
                {
                    'title': 'Reduce idle inventory',
                    'description': 'Improve inventory management to avoid overstocking and losses.',
                    'impact': 'medium',
                    'feasibility': 'medium',
                    'reduction_percent': 25,
                    'category': 'approvisionnement'
                },
                {
                    'title': 'Digitalize supply chain',
                    'description': 'Use digital tools to optimize flows and reduce waste.',
                    'impact': 'medium',
                    'feasibility': 'hard',
                    'reduction_percent': 20,
                    'category': 'approvisionnement'
                }
            ]
        },
        'article': {
            'fr': [
                {
                    'title': 'Éco-concevoir les produits',
                    'description': 'Intégrer l\'analyse du cycle de vie dès la conception pour réduire l\'empreinte carbone des articles.',
                    'impact': 'high',
                    'feasibility': 'hard',
                    'reduction_percent': 45,
                    'category': 'article'
                },
                {
                    'title': 'Utiliser des matériaux recyclés',
                    'description': 'Privilégier les matériaux recyclés et recyclables dans la fabrication des produits.',
                    'impact': 'high',
                    'feasibility': 'medium',
                    'reduction_percent': 35,
                    'category': 'article'
                },
                {
                    'title': 'Allonger la durée de vie des produits',
                    'description': 'Concevoir des articles durables, réparables et proposer un service après-vente de qualité.',
                    'impact': 'medium',
                    'feasibility': 'medium',
                    'reduction_percent': 30,
                    'category': 'article'
                }
            ],
            'en': [
                {
                    'title': 'Eco-design products',
                    'description': 'Integrate life cycle analysis from design stage to reduce articles carbon footprint.',
                    'impact': 'high',
                    'feasibility': 'hard',
                    'reduction_percent': 45,
                    'category': 'article'
                },
                {
                    'title': 'Use recycled materials',
                    'description': 'Prioritize recycled and recyclable materials in product manufacturing.',
                    'impact': 'high',
                    'feasibility': 'medium',
                    'reduction_percent': 35,
                    'category': 'article'
                },
                {
                    'title': 'Extend product lifespan',
                    'description': 'Design durable, repairable articles and offer quality after-sales service.',
                    'impact': 'medium',
                    'feasibility': 'medium',
                    'reduction_percent': 30,
                    'category': 'article'
                }
            ]
        },
        'autres': {
            'fr': [
                {
                    'title': 'Effectuer un bilan carbone complet',
                    'description': 'Réaliser un diagnostic approfondi pour identifier tous les postes d\'émissions.',
                    'impact': 'medium',
                    'feasibility': 'medium',
                    'reduction_percent': 0,
                    'category': 'autres'
                },
                {
                    'title': 'Définir une stratégie bas-carbone',
                    'description': 'Établir une feuille de route avec des objectifs chiffrés et un calendrier précis.',
                    'impact': 'high',
                    'feasibility': 'medium',
                    'reduction_percent': 0,
                    'category': 'autres'
                }
            ],
            'en': [
                {
                    'title': 'Conduct a complete carbon assessment',
                    'description': 'Perform an in-depth diagnosis to identify all emission sources.',
                    'impact': 'medium',
                    'feasibility': 'medium',
                    'reduction_percent': 0,
                    'category': 'autres'
                },
                {
                    'title': 'Define a low-carbon strategy',
                    'description': 'Establish a roadmap with quantified objectives and a precise timeline.',
                    'impact': 'high',
                    'feasibility': 'medium',
                    'reduction_percent': 0,
                    'category': 'autres'
                }
            ]
        }
    }

    def __init__(self, csv_path: str, lang: str = 'fr'):
        """
        Initialize the action plan generator

        Args:
            csv_path: Path to enriched invoices CSV file
            lang: Language for actions ('fr' or 'en')
        """
        self.csv_path = csv_path
        self.lang = lang
        self.df = pd.read_csv(csv_path)
        self.emissions_by_category = self._analyze_emissions()

    def _analyze_emissions(self) -> Dict:
        """Analyze emissions by category"""
        analysis = {}

        # Group by category
        by_category = self.df.groupby('Categorie').agg({
            'CO2e_kg': 'sum',
            'Montant_ligne': 'sum'
        }).to_dict()

        for category in by_category['CO2e_kg']:
            analysis[category] = {
                'emissions': by_category['CO2e_kg'][category],
                'amount': by_category['Montant_ligne'][category],
                'count': len(self.df[self.df['Categorie'] == category]),
                'percentage': (by_category['CO2e_kg'][category] / self.df['CO2e_kg'].sum()) * 100
            }

        # Sort by emissions (descending)
        analysis = dict(sorted(analysis.items(), key=lambda x: x[1]['emissions'], reverse=True))

        return analysis

    def generate_actions(self, max_actions: int = 15) -> List[Dict]:
        """
        Generate prioritized action plan

        Args:
            max_actions: Maximum number of actions to generate

        Returns:
            List of action dictionaries with priority, impact, feasibility
        """
        actions = []

        # Generate actions for each major emission category
        for category, data in self.emissions_by_category.items():
            # Skip categories with < 5% of total emissions
            if data['percentage'] < 5:
                continue

            # Get action templates for this category
            templates = self.ACTION_TEMPLATES.get(category, {}).get(self.lang, [])

            for template in templates:
                action = template.copy()

                # Calculate estimated reduction in kg CO2e
                if action['reduction_percent'] > 0:
                    action['estimated_reduction'] = round(
                        data['emissions'] * (action['reduction_percent'] / 100),
                        2
                    )
                else:
                    action['estimated_reduction'] = 0

                # Calculate priority score
                action['priority_score'] = self._calculate_priority(
                    data['emissions'],
                    data['percentage'],
                    action['impact'],
                    action['feasibility'],
                    action['reduction_percent']
                )

                # Assign priority level
                if action['priority_score'] >= 80:
                    action['priority'] = 'high'
                elif action['priority_score'] >= 50:
                    action['priority'] = 'medium'
                else:
                    action['priority'] = 'low'

                # Add metadata
                action['category_emissions'] = round(data['emissions'], 2)
                action['category_percentage'] = round(data['percentage'], 1)
                action['status'] = 'pending'
                action['created_at'] = datetime.now().isoformat()
                action['target_date'] = (datetime.now() + timedelta(days=90)).isoformat()
                action['id'] = f"{category}_{len(actions)}"

                actions.append(action)

        # Sort by priority score (descending)
        actions = sorted(actions, key=lambda x: x['priority_score'], reverse=True)

        # Limit to max_actions
        return actions[:max_actions]

    def _calculate_priority(
        self,
        category_emissions: float,
        category_percentage: float,
        impact: str,
        feasibility: str,
        reduction_percent: float
    ) -> float:
        """
        Calculate priority score for an action (0-100)

        Factors:
        - Category emissions (40%): Higher emissions = higher priority
        - Impact potential (30%): high/medium/low
        - Feasibility (20%): easy/medium/hard
        - Reduction percent (10%): Estimated reduction
        """
        score = 0

        # Category emissions weight (40 points)
        score += min(category_percentage, 40)

        # Impact weight (30 points)
        impact_scores = {'high': 30, 'medium': 20, 'low': 10}
        score += impact_scores.get(impact, 10)

        # Feasibility weight (20 points)
        feasibility_scores = {'easy': 20, 'medium': 12, 'hard': 5}
        score += feasibility_scores.get(feasibility, 10)

        # Reduction percent weight (10 points)
        score += min(reduction_percent / 10, 10)

        return round(score, 2)

    def generate_summary(self, actions: List[Dict]) -> Dict:
        """Generate summary statistics for the action plan"""
        total_reduction = sum(a['estimated_reduction'] for a in actions)
        current_total = self.df['CO2e_kg'].sum()

        return {
            'current_emissions': round(current_total, 2),
            'potential_reduction': round(total_reduction, 2),
            'reduction_percentage': round((total_reduction / current_total) * 100, 1) if current_total > 0 else 0,
            'total_actions': len(actions),
            'high_priority': len([a for a in actions if a['priority'] == 'high']),
            'medium_priority': len([a for a in actions if a['priority'] == 'medium']),
            'low_priority': len([a for a in actions if a['priority'] == 'low']),
            'by_category': self._summary_by_category(actions),
            'quick_wins': [a for a in actions if a['feasibility'] == 'easy' and a['impact'] in ['high', 'medium']][:5]
        }

    def _summary_by_category(self, actions: List[Dict]) -> Dict:
        """Group actions by category for summary"""
        by_cat = {}
        for action in actions:
            cat = action['category']
            if cat not in by_cat:
                by_cat[cat] = {
                    'count': 0,
                    'potential_reduction': 0
                }
            by_cat[cat]['count'] += 1
            by_cat[cat]['potential_reduction'] += action['estimated_reduction']

        return by_cat


def generate_action_plan(csv_path: str, lang: str = 'fr', max_actions: int = 15) -> Dict:
    """
    Generate a complete action plan from emissions data

    Args:
        csv_path: Path to enriched CSV file
        lang: Language ('fr' or 'en')
        max_actions: Maximum number of actions

    Returns:
        Dictionary with actions and summary
    """
    generator = ActionPlanGenerator(csv_path, lang)
    actions = generator.generate_actions(max_actions)
    summary = generator.generate_summary(actions)

    return {
        'actions': actions,
        'summary': summary,
        'metadata': {
            'language': lang,
            'generated_at': datetime.now().isoformat(),
            'data_source': csv_path
        }
    }
