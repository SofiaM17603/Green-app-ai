"""
Carbon Forecast Engine

Generates monthly and quarterly emission forecasts by category
using historical data and trend analysis.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from typing import Dict, List, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')


class CarbonForecastEngine:
    """Generate intelligent carbon emission forecasts"""

    def __init__(self, csv_path: str):
        """
        Initialize forecast engine

        Args:
            csv_path: Path to enriched invoices CSV file
        """
        self.csv_path = csv_path
        self.df = pd.read_csv(csv_path)
        self.df['Date'] = pd.to_datetime(self.df['Date'])
        self.historical_data = self._prepare_historical_data()

    def _prepare_historical_data(self) -> Dict:
        """Prepare and aggregate historical data by category and month"""
        # Group by month and category
        self.df['YearMonth'] = self.df['Date'].dt.to_period('M')

        historical = {}

        # Overall emissions
        overall = self.df.groupby('YearMonth')['CO2e_kg'].sum().reset_index()
        overall.columns = ['month', 'emissions']
        overall['month'] = overall['month'].dt.to_timestamp()
        historical['overall'] = overall

        # By category
        by_category = self.df.groupby(['YearMonth', 'Categorie'])['CO2e_kg'].sum().reset_index()
        by_category.columns = ['month', 'category', 'emissions']
        by_category['month'] = by_category['month'].dt.to_timestamp()

        for category in by_category['category'].unique():
            cat_data = by_category[by_category['category'] == category][['month', 'emissions']]
            historical[category] = cat_data.reset_index(drop=True)

        return historical

    def generate_forecast(
        self,
        periods: int = 6,
        frequency: str = 'monthly',
        categories: Optional[List[str]] = None
    ) -> Dict:
        """
        Generate emissions forecast

        Args:
            periods: Number of periods to forecast
            frequency: 'monthly' or 'quarterly'
            categories: List of categories to forecast (None = all)

        Returns:
            Dictionary with forecast data
        """
        if frequency == 'quarterly':
            periods = periods * 3  # Convert quarters to months

        forecasts = {}

        # Forecast overall emissions
        overall_forecast = self._forecast_timeseries(
            self.historical_data['overall'],
            periods
        )
        forecasts['overall'] = overall_forecast

        # Forecast by category
        if categories is None:
            categories = [k for k in self.historical_data.keys() if k != 'overall']

        for category in categories:
            if category in self.historical_data and category != 'overall':
                cat_forecast = self._forecast_timeseries(
                    self.historical_data[category],
                    periods
                )
                forecasts[category] = cat_forecast

        # Aggregate by quarter if requested
        if frequency == 'quarterly':
            forecasts = self._aggregate_to_quarterly(forecasts)

        # Calculate metrics
        metrics = self._calculate_forecast_metrics(forecasts)

        return {
            'forecasts': forecasts,
            'metrics': metrics,
            'frequency': frequency,
            'periods': periods if frequency == 'monthly' else periods // 3,
            'generated_at': datetime.now().isoformat()
        }

    def _forecast_timeseries(self, data: pd.DataFrame, periods: int) -> Dict:
        """
        Forecast a single time series using trend analysis and seasonality

        Args:
            data: DataFrame with 'month' and 'emissions' columns
            periods: Number of months to forecast

        Returns:
            Dictionary with historical and forecast data
        """
        if len(data) < 2:
            # Not enough data for forecasting, use simple average
            avg = data['emissions'].mean() if len(data) > 0 else 0
            last_date = data['month'].max() if len(data) > 0 else datetime.now()

            forecast_dates = pd.date_range(
                start=last_date + relativedelta(months=1),
                periods=periods,
                freq='MS'
            )

            return {
                'historical': {
                    'dates': data['month'].dt.strftime('%Y-%m-%d').tolist(),
                    'values': data['emissions'].tolist()
                },
                'forecast': {
                    'dates': forecast_dates.strftime('%Y-%m-%d').tolist(),
                    'values': [float(avg)] * periods,
                    'lower_bound': [float(avg * 0.8)] * periods,
                    'upper_bound': [float(avg * 1.2)] * periods
                },
                'method': 'average'
            }

        # Prepare data
        data = data.sort_values('month').reset_index(drop=True)
        y = data['emissions'].values
        x = np.arange(len(y))

        # Calculate trend using linear regression
        trend_coef = np.polyfit(x, y, 1)
        trend_line = np.poly1d(trend_coef)

        # Calculate seasonality (if enough data points)
        if len(y) >= 12:
            monthly_avg = {}
            for i in range(len(data)):
                month = data.loc[i, 'month'].month
                if month not in monthly_avg:
                    monthly_avg[month] = []
                monthly_avg[month].append(y[i])

            seasonality = {m: np.mean(vals) / np.mean(y) for m, vals in monthly_avg.items()}
        else:
            seasonality = {}

        # Generate forecast
        last_date = data['month'].max()
        forecast_dates = pd.date_range(
            start=last_date + relativedelta(months=1),
            periods=periods,
            freq='MS'
        )

        forecast_values = []
        lower_bounds = []
        upper_bounds = []

        for i in range(periods):
            # Trend component
            trend_value = trend_line(len(y) + i)

            # Seasonality component
            month = forecast_dates[i].month
            if month in seasonality:
                seasonal_factor = seasonality[month]
            else:
                seasonal_factor = 1.0

            # Forecast value
            forecast = max(0, trend_value * seasonal_factor)
            forecast_values.append(float(forecast))

            # Confidence interval (±20% as simple estimate)
            std_error = np.std(y) * 0.2
            lower_bounds.append(float(max(0, forecast - std_error)))
            upper_bounds.append(float(forecast + std_error))

        return {
            'historical': {
                'dates': data['month'].dt.strftime('%Y-%m-%d').tolist(),
                'values': [float(v) for v in y]
            },
            'forecast': {
                'dates': forecast_dates.strftime('%Y-%m-%d').tolist(),
                'values': forecast_values,
                'lower_bound': lower_bounds,
                'upper_bound': upper_bounds
            },
            'trend': {
                'slope': float(trend_coef[0]),
                'direction': 'increasing' if trend_coef[0] > 0 else 'decreasing' if trend_coef[0] < 0 else 'stable'
            },
            'method': 'trend_seasonality'
        }

    def _aggregate_to_quarterly(self, forecasts: Dict) -> Dict:
        """Aggregate monthly forecasts to quarterly"""
        quarterly_forecasts = {}

        for key, data in forecasts.items():
            if 'forecast' not in data:
                continue

            # Aggregate historical
            hist_dates = pd.to_datetime(data['historical']['dates'])
            hist_values = data['historical']['values']
            hist_df = pd.DataFrame({'date': hist_dates, 'value': hist_values})
            hist_df['quarter'] = hist_df['date'].dt.to_period('Q')
            hist_quarterly = hist_df.groupby('quarter')['value'].sum().reset_index()

            # Aggregate forecast
            fore_dates = pd.to_datetime(data['forecast']['dates'])
            fore_values = data['forecast']['values']
            fore_df = pd.DataFrame({'date': fore_dates, 'value': fore_values})
            fore_df['quarter'] = fore_df['date'].dt.to_period('Q')
            fore_quarterly = fore_df.groupby('quarter')['value'].sum().reset_index()

            quarterly_forecasts[key] = {
                'historical': {
                    'periods': hist_quarterly['quarter'].astype(str).tolist(),
                    'values': hist_quarterly['value'].tolist()
                },
                'forecast': {
                    'periods': fore_quarterly['quarter'].astype(str).tolist(),
                    'values': fore_quarterly['value'].tolist()
                },
                'method': data.get('method', 'unknown'),
                'trend': data.get('trend', {})
            }

        return quarterly_forecasts

    def _calculate_forecast_metrics(self, forecasts: Dict) -> Dict:
        """Calculate summary metrics for forecasts"""
        overall = forecasts.get('overall', {})

        if 'forecast' not in overall:
            return {}

        forecast_values = overall['forecast']['values']
        historical_values = overall['historical']['values']

        total_forecast = sum(forecast_values)
        avg_historical = np.mean(historical_values) if historical_values else 0
        avg_forecast = np.mean(forecast_values) if forecast_values else 0

        change_pct = ((avg_forecast - avg_historical) / avg_historical * 100) if avg_historical > 0 else 0

        return {
            'total_forecast': round(total_forecast, 2),
            'avg_historical': round(avg_historical, 2),
            'avg_forecast': round(avg_forecast, 2),
            'change_percentage': round(change_pct, 1),
            'trend_direction': overall.get('trend', {}).get('direction', 'unknown')
        }


def generate_forecast(
    csv_path: str,
    periods: int = 6,
    frequency: str = 'monthly',
    categories: Optional[List[str]] = None
) -> Dict:
    """
    Generate carbon emissions forecast

    Args:
        csv_path: Path to enriched CSV file
        periods: Number of periods to forecast
        frequency: 'monthly' or 'quarterly'
        categories: List of categories to forecast

    Returns:
        Forecast data dictionary
    """
    engine = CarbonForecastEngine(csv_path)
    return engine.generate_forecast(periods, frequency, categories)
