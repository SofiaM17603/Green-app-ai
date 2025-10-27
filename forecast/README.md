# Green App - Carbon Forecast Module

## Overview

The Forecast Module provides intelligent carbon emission forecasting with budget comparison and alert capabilities. It uses trend analysis and seasonality detection to generate accurate predictions for future emissions, and compares them against user-defined carbon budgets.

## Features

- **Intelligent Forecasting**: Monthly and quarterly emission forecasts using trend analysis and seasonality
- **Budget Import & Validation**: Upload carbon budgets in CSV format with automatic validation
- **Budget Comparison**: Compare forecasts against budgets with visual alerts
- **Multi-Category Analysis**: Forecast emissions for each category independently
- **Confidence Intervals**: Upper and lower bounds for forecast uncertainty
- **Multilingual Support**: Full French and English interface
- **Alert System**: Four-tier alert system (critical, high, medium, warning)
- **Actionable Recommendations**: Specific actions to reduce emissions based on forecast overages

## Installation

### Dependencies

The forecast module requires the following Python packages:

```bash
pip install pandas numpy python-dateutil
```

All dependencies should already be installed if you've set up the main Green App environment.

### Module Structure

```
forecast/
├── __init__.py              # Module initialization and exports
├── forecast_engine.py       # Core forecasting logic
├── budget_import.py         # Budget CSV import and validation
├── compare_forecast.py      # Forecast vs budget comparison
└── README.md                # This file
```

## Quick Start

### 1. Generate a Basic Forecast

```python
from forecast import generate_forecast

# Generate 6-month monthly forecast
forecast_data = generate_forecast(
    csv_path='factures_enrichies.csv',
    periods=6,
    frequency='monthly'
)

print(f"Average forecast: {forecast_data['metrics']['avg_forecast']} kg CO₂e")
print(f"Trend: {forecast_data['metrics']['trend_direction']}")
```

### 2. Forecast with Budget Comparison

```python
from forecast import generate_forecast, load_budget, compare_with_budget

# Generate forecast
forecast_data = generate_forecast(
    csv_path='factures_enrichies.csv',
    periods=6,
    frequency='monthly'
)

# Load budget
budget_data = load_budget(
    csv_path='budget_carbone.csv',
    frequency='monthly'
)

# Compare
comparison = compare_with_budget(forecast_data, budget_data)

# Check alerts
for alert in comparison['alerts']:
    print(f"{alert['severity'].upper()}: {alert['message']['en']}")
```

## Budget CSV Format

Your budget CSV file should have the following structure:

### Option 1: Monthly Budget

```csv
Categorie,Budget_mensuel
voyages_aeriens,500
transport_routier,300
energie,200
materiaux,400
services,250
equipements,150
```

### Option 2: Annual Budget

```csv
Categorie,Budget_annuel
voyages_aeriens,6000
transport_routier,3600
energie,2400
materiaux,4800
services,3000
equipements,1800
```

**Column Requirements:**
- `Categorie` (required): Category name matching your emissions data
- Budget column (required): One of:
  - `Budget_mensuel` or `Budget_monthly` for monthly budgets
  - `Budget_annuel`, `Budget_annual`, or `Budget_yearly` for annual budgets
  - `Budget` for generic budgets (defaults to annual)

**Units:** All budget values should be in kg CO₂e

## API Usage

### FastAPI Endpoint

The forecast module is integrated into the main FastAPI application via the `/forecast` endpoint.

#### Basic Forecast Request

```bash
curl -X POST "http://localhost:8000/forecast?periods=6&frequency=monthly&lang=fr"
```

#### With Budget File

```bash
curl -X POST "http://localhost:8000/forecast?periods=6&frequency=monthly&lang=en" \
  -F "budget_file=@budget_carbone.csv"
```

#### Response Structure

```json
{
  "success": true,
  "forecast_data": {
    "forecasts": {
      "overall": {
        "historical": {
          "dates": ["2024-01-01", "2024-02-01", ...],
          "values": [450.2, 523.8, ...]
        },
        "forecast": {
          "dates": ["2025-01-01", "2025-02-01", ...],
          "values": [512.5, 487.3, ...],
          "lower_bound": [410.0, 389.8, ...],
          "upper_bound": [615.0, 584.8, ...]
        },
        "trend": {
          "slope": -2.5,
          "direction": "decreasing"
        }
      },
      "voyages_aeriens": {...},
      "transport_routier": {...}
    },
    "metrics": {
      "total_forecast": 3074.5,
      "avg_historical": 487.5,
      "avg_forecast": 512.4,
      "change_percentage": 5.1,
      "trend_direction": "increasing"
    },
    "frequency": "monthly",
    "periods": 6,
    "generated_at": "2025-10-27T10:30:00"
  },
  "budget_comparison": {
    "overall": {
      "forecast_avg": 512.4,
      "budget": 500.0,
      "difference": 12.4,
      "difference_pct": 2.5,
      "status": "warning"
    },
    "by_category": {...},
    "alerts": [
      {
        "severity": "high",
        "category": "voyages_aeriens",
        "message": {
          "fr": "⚠️ ALERTE: voyages_aeriens dépasse le budget de 15.2%",
          "en": "⚠️ ALERT: voyages_aeriens exceeds budget by 15.2%"
        },
        "difference_pct": 15.2,
        "forecast_avg": 576.0,
        "budget": 500.0
      }
    ],
    "summary": {
      "total_alerts": 3,
      "severity_counts": {
        "critical": 0,
        "high": 1,
        "medium": 1,
        "warning": 1,
        "on_track": 2
      },
      "categories_over_budget": 3,
      "categories_under_budget": 3,
      "overall_status": "warning",
      "requires_action": true
    },
    "recommendations": [
      {
        "category": "voyages_aeriens",
        "priority": "high",
        "title": "Reduce emissions: voyages_aeriens",
        "description": "Forecast exceeds budget by 15.2%. Recommended actions...",
        "actions": [
          "Prefer video conferences when possible",
          "Choose direct flights",
          "Offset carbon emissions"
        ]
      }
    ]
  }
}
```

## Forecasting Algorithm

### 1. Trend Analysis

The forecast engine uses linear regression to detect emission trends:

```
y = mx + b
```

Where:
- `y` = emissions
- `x` = time period
- `m` = trend slope (increasing/decreasing)
- `b` = intercept

### 2. Seasonality Detection

If ≥12 months of historical data are available, the engine calculates monthly seasonality factors:

```
seasonality[month] = avg_emissions[month] / overall_avg
```

### 3. Forecast Calculation

Each forecast value combines trend and seasonality:

```
forecast[t] = trend[t] × seasonality[month(t)]
```

### 4. Confidence Intervals

Upper and lower bounds are calculated using historical standard deviation:

```
lower_bound[t] = forecast[t] - (std_error × 1.0)
upper_bound[t] = forecast[t] + (std_error × 1.0)
```

## Alert System

### Alert Severity Levels

| Severity | Condition | Action Required |
|----------|-----------|-----------------|
| **Critical** | >20% over budget | Immediate action required |
| **High** | 10-20% over budget | Priority action recommended |
| **Medium** | 5-10% over budget | Attention needed |
| **Warning** | 0-5% over budget | Monitor closely |
| **On Track** | Within budget | No action needed |

### Alert Examples

```python
from forecast.compare_forecast import ForecastComparator

comparator = ForecastComparator(forecast_data, budget_data)
comparison = comparator.compare()

# Get critical/high severity alerts
urgent_alerts = [
    a for a in comparison['alerts']
    if a['severity'] in ['critical', 'high']
]

# Get recommendations
recommendations = comparator.get_recommendations(lang='en')
for rec in recommendations:
    print(f"[{rec['priority'].upper()}] {rec['title']}")
    for action in rec['actions']:
        print(f"  - {action}")
```

## Frontend Integration

### HTML Structure

The forecast page includes:
- Control options (periods, frequency, budget upload)
- Summary cards (avg forecast, trend, budget status, alerts)
- Interactive chart with historical + forecast data
- Alert cards for budget overages
- Category breakdown grid
- Recommendations section

### JavaScript Usage

```javascript
// Generate forecast with budget
async function generateForecast() {
    const periods = document.getElementById('forecastPeriods').value;
    const frequency = document.getElementById('forecastFrequency').value;
    const budgetFile = document.getElementById('budgetFile').files[0];
    const lang = window.i18n.getCurrentLang();

    const formData = new FormData();
    if (budgetFile) {
        formData.append('budget_file', budgetFile);
    }

    const params = new URLSearchParams({
        periods: periods,
        frequency: frequency,
        lang: lang
    });

    const response = await fetch(`${API_BASE_URL}/forecast?${params}`, {
        method: 'POST',
        body: budgetFile ? formData : undefined
    });

    const data = await response.json();
    displayForecast(data);
}
```

## Advanced Usage

### Custom Category Forecasts

```python
from forecast import generate_forecast

# Forecast only specific categories
forecast_data = generate_forecast(
    csv_path='factures_enrichies.csv',
    periods=12,
    frequency='quarterly',
    categories=['voyages_aeriens', 'transport_routier']
)

# Access category-specific forecasts
air_travel = forecast_data['forecasts']['voyages_aeriens']
print(f"Air travel trend: {air_travel['trend']['direction']}")
```

### Quarterly Aggregation

```python
# Generate quarterly forecast (automatically aggregates monthly data)
quarterly_forecast = generate_forecast(
    csv_path='factures_enrichies.csv',
    periods=4,  # 4 quarters = 1 year
    frequency='quarterly'
)

# Access quarterly data
q1_forecast = quarterly_forecast['forecasts']['overall']['forecast']['values'][0]
print(f"Q1 forecast: {q1_forecast} kg CO₂e")
```

### Budget Validation

```python
from forecast import validate_budget

# Validate budget file before loading
is_valid, errors = validate_budget('budget_carbone.csv')

if is_valid:
    print("Budget file is valid!")
else:
    print("Budget errors:")
    for error in errors:
        print(f"  - {error}")
```

## Troubleshooting

### Common Issues

#### 1. "Not enough data for forecasting"

**Problem:** Less than 2 months of historical data

**Solution:** The forecast engine requires at least 2 data points. If you have less data, it will fall back to using the average:

```python
# Check data availability
df = pd.read_csv('factures_enrichies.csv')
df['Date'] = pd.to_datetime(df['Date'])
monthly = df.groupby(pd.Grouper(key='Date', freq='M'))['CO2e_kg'].sum()
print(f"Available months: {len(monthly)}")
```

#### 2. "Budget category not found"

**Problem:** Category names in budget CSV don't match emissions data

**Solution:** Ensure category names match exactly:

```python
# Check available categories
df = pd.read_csv('factures_enrichies.csv')
print("Categories in data:", df['Categorie'].unique())

# Budget CSV should use the same category names
```

#### 3. "Invalid budget CSV"

**Problem:** Missing required columns or malformed data

**Solution:** Verify CSV structure:

```python
import pandas as pd
budget = pd.read_csv('budget_carbone.csv')
print("Columns:", budget.columns.tolist())
print("First rows:")
print(budget.head())

# Should have 'Categorie' and a budget column
```

## Best Practices

### 1. Data Quality

- **Minimum data:** At least 3 months for basic trends, 12+ months for seasonality
- **Regular updates:** Update historical data monthly for best accuracy
- **Consistent categorization:** Ensure emissions are categorized consistently

### 2. Budget Planning

- **Realistic targets:** Set budgets based on historical performance
- **Category-specific:** Use different budgets for different categories
- **Regular review:** Update budgets quarterly based on forecast performance

### 3. Forecast Interpretation

- **Confidence intervals:** Pay attention to upper/lower bounds for uncertainty
- **Trend direction:** Focus on long-term trends, not short-term fluctuations
- **Category analysis:** Investigate categories with critical/high alerts first

### 4. Taking Action

- **Priority order:** Address critical and high severity alerts first
- **Track progress:** Monitor actual emissions vs forecast monthly
- **Adjust budgets:** Refine budgets based on achievable reduction targets

## Example Workflow

### Complete Forecast and Budget Analysis

```python
from forecast import generate_forecast, load_budget
from forecast.compare_forecast import ForecastComparator

# Step 1: Generate forecast
print("Generating forecast...")
forecast_data = generate_forecast(
    csv_path='factures_enrichies.csv',
    periods=6,
    frequency='monthly'
)

print(f"✓ Forecast complete")
print(f"  Average: {forecast_data['metrics']['avg_forecast']:.2f} kg CO₂e")
print(f"  Trend: {forecast_data['metrics']['trend_direction']}")

# Step 2: Load budget
print("\nLoading budget...")
budget_data = load_budget('budget_carbone.csv', frequency='monthly')
print(f"✓ Budget loaded: {len(budget_data)} categories")

# Step 3: Compare and analyze
print("\nComparing forecast vs budget...")
comparator = ForecastComparator(forecast_data, budget_data)
comparison = comparator.compare()

print(f"✓ Comparison complete")
print(f"  Total alerts: {comparison['summary']['total_alerts']}")
print(f"  Categories over budget: {comparison['summary']['categories_over_budget']}")

# Step 4: Display alerts
print("\n=== ALERTS ===")
for alert in comparison['alerts']:
    severity = alert['severity'].upper()
    message = alert['message']['en']
    print(f"[{severity}] {message}")

# Step 5: Get recommendations
print("\n=== RECOMMENDATIONS ===")
recommendations = comparator.get_recommendations(lang='en')
for rec in recommendations:
    print(f"\n{rec['title']} (Priority: {rec['priority']})")
    print(f"  {rec['description']}")
    if rec['actions']:
        print("  Actions:")
        for action in rec['actions']:
            print(f"    • {action}")
```

## Support & Contributing

For issues, questions, or contributions related to the forecast module, please contact the Green App development team.

---

**Version:** 1.0.0
**Last Updated:** October 2025
**Authors:** Green App Development Team
