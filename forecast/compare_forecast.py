"""
Forecast vs Budget Comparator

Compares emission forecasts with carbon budgets and generates alerts
for overages and trends.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')


class ForecastComparator:
    """Compare forecasts with budgets and generate alerts"""

    # Alert severity thresholds
    ALERT_THRESHOLDS = {
        'critical': 20,  # >20% over budget
        'high': 10,      # 10-20% over budget
        'medium': 5,     # 5-10% over budget
        'warning': 0,    # 0-5% over budget
        'on_track': -5   # Within or under budget
    }

    def __init__(self, forecast_data: Dict, budget_data: Dict):
        """
        Initialize comparator

        Args:
            forecast_data: Output from CarbonForecastEngine.generate_forecast()
            budget_data: Budget values by category (from BudgetImporter)
        """
        self.forecast_data = forecast_data
        self.budget_data = budget_data
        self.frequency = forecast_data.get('frequency', 'monthly')
        self.comparison_results = None

    def compare(self) -> Dict:
        """
        Compare forecasts with budgets

        Returns:
            Dictionary with comparison results and alerts
        """
        results = {
            'overall': self._compare_category('overall'),
            'by_category': {},
            'alerts': [],
            'summary': {}
        }

        # Compare each category
        forecasts = self.forecast_data['forecasts']
        for category in forecasts.keys():
            if category == 'overall':
                continue

            comparison = self._compare_category(category)
            if comparison:
                results['by_category'][category] = comparison

        # Generate alerts
        results['alerts'] = self._generate_alerts(results)

        # Calculate summary metrics
        results['summary'] = self._calculate_summary(results)

        self.comparison_results = results
        return results

    def _compare_category(self, category: str) -> Optional[Dict]:
        """
        Compare forecast vs budget for a single category

        Args:
            category: Category name

        Returns:
            Comparison data or None if not available
        """
        # Get forecast data
        forecasts = self.forecast_data['forecasts']
        if category not in forecasts:
            return None

        forecast = forecasts[category].get('forecast', {})
        forecast_values = forecast.get('values', [])

        if not forecast_values:
            return None

        # Get budget
        if category not in self.budget_data:
            return None

        budget_value = self.budget_data[category]

        # Calculate metrics
        total_forecast = sum(forecast_values)
        avg_forecast = np.mean(forecast_values)

        # Calculate difference
        if self.frequency == 'monthly':
            # Compare average monthly forecast to monthly budget
            difference = avg_forecast - budget_value
            difference_pct = (difference / budget_value * 100) if budget_value > 0 else 0
        elif self.frequency == 'quarterly':
            # Compare average quarterly forecast to quarterly budget
            difference = avg_forecast - budget_value
            difference_pct = (difference / budget_value * 100) if budget_value > 0 else 0
        else:
            difference = avg_forecast - budget_value
            difference_pct = (difference / budget_value * 100) if budget_value > 0 else 0

        # Determine status
        status = self._get_status(difference_pct)

        # Period-by-period comparison
        period_comparison = []
        for i, forecast_val in enumerate(forecast_values):
            period_diff = forecast_val - budget_value
            period_diff_pct = (period_diff / budget_value * 100) if budget_value > 0 else 0

            period_comparison.append({
                'period': i + 1,
                'forecast': round(forecast_val, 2),
                'budget': round(budget_value, 2),
                'difference': round(period_diff, 2),
                'difference_pct': round(period_diff_pct, 1),
                'status': self._get_status(period_diff_pct)
            })

        return {
            'category': category,
            'forecast_total': round(total_forecast, 2),
            'forecast_avg': round(avg_forecast, 2),
            'budget': round(budget_value, 2),
            'difference': round(difference, 2),
            'difference_pct': round(difference_pct, 1),
            'status': status,
            'periods': period_comparison,
            'trend': forecasts[category].get('trend', {})
        }

    def _get_status(self, difference_pct: float) -> str:
        """
        Determine status based on difference percentage

        Args:
            difference_pct: Percentage difference from budget

        Returns:
            Status string
        """
        if difference_pct > self.ALERT_THRESHOLDS['critical']:
            return 'critical'
        elif difference_pct > self.ALERT_THRESHOLDS['high']:
            return 'high'
        elif difference_pct > self.ALERT_THRESHOLDS['medium']:
            return 'medium'
        elif difference_pct > self.ALERT_THRESHOLDS['warning']:
            return 'warning'
        else:
            return 'on_track'

    def _generate_alerts(self, results: Dict) -> List[Dict]:
        """
        Generate alerts for budget overages

        Args:
            results: Comparison results

        Returns:
            List of alert dictionaries
        """
        alerts = []

        # Overall alert
        overall = results.get('overall', {})
        if overall and overall['status'] in ['critical', 'high', 'medium', 'warning']:
            alerts.append({
                'severity': overall['status'],
                'category': 'overall',
                'message': self._format_alert_message(overall),
                'difference_pct': overall['difference_pct'],
                'forecast_avg': overall['forecast_avg'],
                'budget': overall['budget']
            })

        # Category alerts
        for category, comparison in results.get('by_category', {}).items():
            if comparison['status'] in ['critical', 'high', 'medium', 'warning']:
                alerts.append({
                    'severity': comparison['status'],
                    'category': category,
                    'message': self._format_alert_message(comparison),
                    'difference_pct': comparison['difference_pct'],
                    'forecast_avg': comparison['forecast_avg'],
                    'budget': comparison['budget']
                })

        # Sort by severity
        severity_order = {'critical': 0, 'high': 1, 'medium': 2, 'warning': 3, 'on_track': 4}
        alerts.sort(key=lambda x: severity_order.get(x['severity'], 999))

        return alerts

    def _format_alert_message(self, comparison: Dict) -> Dict:
        """
        Format alert message in multiple languages

        Args:
            comparison: Comparison data

        Returns:
            Dictionary with messages in FR and EN
        """
        category = comparison['category']
        diff_pct = abs(comparison['difference_pct'])
        status = comparison['status']

        # French messages
        if status == 'critical':
            fr_msg = f"⚠️ ALERTE CRITIQUE: {category} dépasse le budget de {diff_pct:.1f}%"
        elif status == 'high':
            fr_msg = f"⚠️ ALERTE: {category} dépasse le budget de {diff_pct:.1f}%"
        elif status == 'medium':
            fr_msg = f"⚠️ Attention: {category} dépasse le budget de {diff_pct:.1f}%"
        elif status == 'warning':
            fr_msg = f"ℹ️ Surveillance: {category} approche du budget (+{diff_pct:.1f}%)"
        else:
            fr_msg = f"✓ {category} dans les limites du budget"

        # English messages
        if status == 'critical':
            en_msg = f"⚠️ CRITICAL ALERT: {category} exceeds budget by {diff_pct:.1f}%"
        elif status == 'high':
            en_msg = f"⚠️ ALERT: {category} exceeds budget by {diff_pct:.1f}%"
        elif status == 'medium':
            en_msg = f"⚠️ Warning: {category} exceeds budget by {diff_pct:.1f}%"
        elif status == 'warning':
            en_msg = f"ℹ️ Watch: {category} approaching budget (+{diff_pct:.1f}%)"
        else:
            en_msg = f"✓ {category} within budget"

        return {
            'fr': fr_msg,
            'en': en_msg
        }

    def _calculate_summary(self, results: Dict) -> Dict:
        """
        Calculate summary statistics

        Args:
            results: Comparison results

        Returns:
            Summary dictionary
        """
        alerts = results['alerts']

        # Count by severity
        severity_counts = {
            'critical': 0,
            'high': 0,
            'medium': 0,
            'warning': 0,
            'on_track': 0
        }

        for alert in alerts:
            severity = alert['severity']
            severity_counts[severity] = severity_counts.get(severity, 0) + 1

        # Overall status
        overall = results.get('overall', {})

        # Count categories over/under budget
        by_category = results.get('by_category', {})
        over_budget = sum(1 for cat in by_category.values() if cat['difference'] > 0)
        under_budget = sum(1 for cat in by_category.values() if cat['difference'] <= 0)

        return {
            'total_alerts': len(alerts),
            'severity_counts': severity_counts,
            'categories_over_budget': over_budget,
            'categories_under_budget': under_budget,
            'overall_status': overall.get('status', 'unknown'),
            'overall_difference_pct': overall.get('difference_pct', 0),
            'requires_action': len([a for a in alerts if a['severity'] in ['critical', 'high']]) > 0
        }

    def get_recommendations(self, lang: str = 'fr') -> List[Dict]:
        """
        Generate recommendations based on comparison

        Args:
            lang: Language ('fr' or 'en')

        Returns:
            List of recommendation dictionaries
        """
        if self.comparison_results is None:
            raise ValueError("Run compare() first before getting recommendations")

        recommendations = []

        # Get critical and high severity alerts
        critical_alerts = [a for a in self.comparison_results['alerts'] if a['severity'] in ['critical', 'high']]

        for alert in critical_alerts:
            category = alert['category']
            diff_pct = abs(alert['difference_pct'])

            if lang == 'fr':
                rec = {
                    'category': category,
                    'priority': 'haute' if alert['severity'] == 'critical' else 'moyenne',
                    'title': f"Réduire les émissions: {category}",
                    'description': f"Les prévisions dépassent le budget de {diff_pct:.1f}%. Actions recommandées pour réduire les émissions dans cette catégorie.",
                    'actions': self._get_category_actions(category, 'fr')
                }
            else:
                rec = {
                    'category': category,
                    'priority': 'high' if alert['severity'] == 'critical' else 'medium',
                    'title': f"Reduce emissions: {category}",
                    'description': f"Forecast exceeds budget by {diff_pct:.1f}%. Recommended actions to reduce emissions in this category.",
                    'actions': self._get_category_actions(category, 'en')
                }

            recommendations.append(rec)

        return recommendations

    def _get_category_actions(self, category: str, lang: str) -> List[str]:
        """
        Get recommended actions for a category

        Args:
            category: Category name
            lang: Language

        Returns:
            List of action strings
        """
        actions_fr = {
            'overall': [
                "Réviser la stratégie globale de réduction carbone",
                "Prioriser les catégories avec le plus grand impact",
                "Mettre en place un suivi mensuel des émissions"
            ],
            'voyages_aeriens': [
                "Privilégier les visioconférences quand possible",
                "Choisir des vols directs",
                "Compenser les émissions carbone"
            ],
            'transport_routier': [
                "Optimiser les trajets et le covoiturage",
                "Passer à des véhicules électriques",
                "Encourager les transports en commun"
            ],
            'energie': [
                "Améliorer l'efficacité énergétique",
                "Passer aux énergies renouvelables",
                "Optimiser le chauffage/climatisation"
            ],
            'materiaux': [
                "Privilégier les matériaux recyclés",
                "Réduire le gaspillage",
                "Choisir des fournisseurs locaux"
            ]
        }

        actions_en = {
            'overall': [
                "Review overall carbon reduction strategy",
                "Prioritize categories with greatest impact",
                "Implement monthly emissions tracking"
            ],
            'voyages_aeriens': [
                "Prefer video conferences when possible",
                "Choose direct flights",
                "Offset carbon emissions"
            ],
            'transport_routier': [
                "Optimize routes and carpooling",
                "Switch to electric vehicles",
                "Encourage public transportation"
            ],
            'energie': [
                "Improve energy efficiency",
                "Switch to renewable energy",
                "Optimize heating/cooling"
            ],
            'materiaux': [
                "Prefer recycled materials",
                "Reduce waste",
                "Choose local suppliers"
            ]
        }

        actions = actions_fr if lang == 'fr' else actions_en

        # Return specific actions or default
        return actions.get(category, actions.get('overall', []))


def compare_with_budget(
    forecast_data: Dict,
    budget_data: Dict
) -> Dict:
    """
    Compare forecast with budget and generate alerts

    Args:
        forecast_data: Output from generate_forecast()
        budget_data: Budget values by category

    Returns:
        Comparison results with alerts
    """
    comparator = ForecastComparator(forecast_data, budget_data)
    return comparator.compare()
