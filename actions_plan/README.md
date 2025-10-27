# 📋 Climate Action Plan Module

**Automated climate action planning for businesses to reduce carbon emissions**

Generate data-driven, prioritized action plans based on your company's emissions data, with calendar integration for Google Calendar and Microsoft Outlook.

---

## 🌟 Features

- **Automated Action Generation**: Analyzes emission data and proposes concrete, category-specific actions
- **Smart Prioritization**: Actions ranked by impact, feasibility, and emissions reduction potential
- **Multilingual Support**: Full French and English translations with automatic unit conversion
- **Calendar Integration**: Export to Google Calendar, Outlook, or .ics file
- **Progress Tracking**: Mark actions as completed, add notes, and view history
- **Customizable**: Easy to add new action templates or modify existing ones

---

## 📦 Installation

### Prerequisites

```bash
pip install pandas ics
```

### Module Structure

```
actions_plan/
├── __init__.py              # Module entry point
├── plan_generator.py        # Core action generation logic
├── calendar_sync.py         # Calendar integration (Google, Outlook, ICS)
└── README.md                # This file
```

---

## 🚀 Quick Start

### 1. Generate an Action Plan (API)

```bash
# Generate a French action plan with 15 actions
curl -X POST "http://localhost:8000/generate_plan?lang=fr&max_actions=15"

# Generate an English action plan
curl -X POST "http://localhost:8000/generate_plan?lang=en&max_actions=10"

# Export as .ics calendar file
curl -X POST "http://localhost:8000/generate_plan?lang=fr&export_format=ics" -o action_plan.ics
```

### 2. Use in Python

```python
from actions_plan import generate_action_plan

# Generate plan from CSV data
plan = generate_action_plan(
    csv_path='factures_enrichies.csv',
    lang='fr',
    max_actions=15
)

print(f"Generated {plan['summary']['total_actions']} actions")
print(f"Potential reduction: {plan['summary']['potential_reduction']:.2f} kg CO₂e")

# Access actions
for action in plan['actions']:
    print(f"[{action['priority'].upper()}] {action['title']}")
    print(f"  → Reduction: {action['estimated_reduction']:.2f} kg CO₂e")
    print(f"  → Feasibility: {action['feasibility']}")
    print()
```

### 3. Export to Calendar

```python
from actions_plan.calendar_sync import export_to_ics, CalendarSync

# Export to .ics file (works with all calendar apps)
export_to_ics(
    actions=plan['actions'],
    output_path='my_climate_actions.ics',
    app_url='https://my-green-app.com'
)

# Generate Google Calendar links
sync = CalendarSync()
for action in plan['actions']:
    google_link = sync.generate_google_calendar_link(action)
    print(f"Add to Google Calendar: {google_link}")

# Generate Outlook links
for action in plan['actions']:
    outlook_link = sync.generate_outlook_link(action)
    print(f"Add to Outlook: {outlook_link}")
```

---

## 📊 API Response Format

### Plan Structure

```json
{
  "actions": [
    {
      "id": "energie_0",
      "title": "Passer à l'électricité verte",
      "description": "Souscrire à un contrat d'électricité 100% renouvelable...",
      "category": "energie",
      "priority": "high",
      "priority_score": 85.2,
      "impact": "high",
      "feasibility": "easy",
      "reduction_percent": 80,
      "estimated_reduction": 1829.62,
      "category_emissions": 2287.03,
      "category_percentage": 100.0,
      "status": "pending",
      "created_at": "2025-10-26T19:30:00",
      "target_date": "2026-01-24T19:30:00"
    }
  ],
  "summary": {
    "current_emissions": 2287.03,
    "potential_reduction": 5123.45,
    "reduction_percentage": 224.0,
    "total_actions": 15,
    "high_priority": 8,
    "medium_priority": 5,
    "low_priority": 2,
    "by_category": {
      "energie": {
        "count": 3,
        "potential_reduction": 2000.5
      }
    },
    "quick_wins": [...]
  },
  "metadata": {
    "language": "fr",
    "generated_at": "2025-10-26T19:30:00",
    "data_source": "factures_enrichies.csv"
  }
}
```

---

## 🎯 Action Categories

The module generates tailored actions for these emission categories:

| Category | Examples | Typical Actions |
|----------|----------|-----------------|
| **voyages_aeriens** | Business flights | Switch to train, implement video conferencing |
| **transport_routier** | Delivery trucks, fleet | Electric vehicles, route optimization |
| **energie** | Electricity, heating | Green energy, solar panels, LED bulbs |
| **materiaux** | Construction materials | Recycled materials, local suppliers |
| **services** | IT, consulting | Green hosting, code optimization |
| **equipements** | Computers, hardware | Extended lifespan, refurbished equipment |
| **autres** | Other | Carbon assessment, low-carbon strategy |

---

## ⚙️ Customization

### Add New Action Templates

Edit `plan_generator.py` and add to `ACTION_TEMPLATES`:

```python
ACTION_TEMPLATES = {
    'your_category': {
        'fr': [
            {
                'title': 'Titre de l\'action',
                'description': 'Description détaillée...',
                'impact': 'high',  # high, medium, low
                'feasibility': 'easy',  # easy, medium, hard
                'reduction_percent': 50,  # Estimated % reduction
                'category': 'your_category'
            }
        ],
        'en': [
            {
                'title': 'Action Title',
                'description': 'Detailed description...',
                'impact': 'high',
                'feasibility': 'easy',
                'reduction_percent': 50,
                'category': 'your_category'
            }
        ]
    }
}
```

### Adjust Priority Calculation

Modify the `_calculate_priority()` method in `ActionPlanGenerator`:

```python
def _calculate_priority(self, category_emissions, category_percentage,
                       impact, feasibility, reduction_percent) -> float:
    """
    Customize priority scoring:
    - category_emissions: Total kg CO₂e for this category
    - category_percentage: % of total emissions
    - impact: high/medium/low
    - feasibility: easy/medium/hard
    - reduction_percent: Expected % reduction
    """
    score = 0

    # Your custom logic here
    # Example: Prioritize easy wins
    if feasibility == 'easy':
        score += 30

    return score
```

---

## 📅 Calendar Integration

### Google Calendar

#### Option 1: Direct Links (No OAuth required)

```python
from actions_plan.calendar_sync import export_to_google_calendar

links = export_to_google_calendar(actions)
for link in links:
    print(link)  # Share these links with users
```

#### Option 2: Google Calendar API (OAuth required)

```python
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

# 1. Set up OAuth 2.0 (one-time setup)
# - Go to https://console.cloud.google.com/
# - Create project and enable Google Calendar API
# - Create OAuth 2.0 credentials
# - Download client_secret.json

# 2. Authenticate
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ['https://www.googleapis.com/auth/calendar']
flow = InstalledAppFlow.from_client_secrets_file('client_secret.json', SCOPES)
creds = flow.run_local_server(port=0)

# 3. Add events
service = build('calendar', 'v3', credentials=creds)

for action in actions:
    event = {
        'summary': action['title'],
        'description': action['description'],
        'start': {
            'dateTime': action['target_date'],
            'timeZone': 'UTC',
        },
        'end': {
            'dateTime': action['target_date'],  # Same day event
            'timeZone': 'UTC',
        }
    }

    result = service.events().insert(calendarId='primary', body=event).execute()
    print(f"Created event: {result.get('htmlLink')}")
```

### Microsoft Outlook

#### Option 1: Direct Links (No OAuth required)

```python
from actions_plan.calendar_sync import export_to_outlook

links = export_to_outlook(actions)
for link in links:
    print(link)  # Share these links with users
```

#### Option 2: Microsoft Graph API (OAuth required)

```python
import msal
import requests

# 1. Set up Azure AD App (one-time setup)
# - Go to https://portal.azure.com/
# - Register an application
# - Add "Calendars.ReadWrite" permission
# - Get Client ID and Client Secret

# 2. Authenticate
CLIENT_ID = 'your_client_id'
CLIENT_SECRET = 'your_client_secret'
TENANT_ID = 'common'

AUTHORITY = f'https://login.microsoftonline.com/{TENANT_ID}'
SCOPES = ['https://graph.microsoft.com/Calendars.ReadWrite']

app = msal.ConfidentialClientApplication(
    CLIENT_ID,
    authority=AUTHORITY,
    client_credential=CLIENT_SECRET
)

result = app.acquire_token_for_client(scopes=SCOPES)
access_token = result['access_token']

# 3. Add events
endpoint = 'https://graph.microsoft.com/v1.0/me/calendar/events'

for action in actions:
    event = {
        'subject': action['title'],
        'body': {
            'contentType': 'Text',
            'content': action['description']
        },
        'start': {
            'dateTime': action['target_date'],
            'timeZone': 'UTC'
        },
        'end': {
            'dateTime': action['target_date'],
            'timeZone': 'UTC'
        }
    }

    response = requests.post(
        endpoint,
        json=event,
        headers={'Authorization': f'Bearer {access_token}'}
    )
    print(f"Created event: {response.json()}")
```

### Universal .ICS File

The easiest option that works with **all calendar apps** (Google, Outlook, Apple Calendar, etc.):

```python
from actions_plan.calendar_sync import export_to_ics

# Generate .ics file
ics_path = export_to_ics(
    actions=plan['actions'],
    output_path='climate_actions.ics'
)

print(f"Calendar file created: {ics_path}")
# Users can double-click this file to import into any calendar app
```

---

## 🌍 Multilingual Support

### Supported Languages

- 🇫🇷 **French** (`lang='fr'`)
  - Units: kg CO₂e, km, €

- 🇬🇧 **English** (`lang='en'`)
  - Units: lbs CO₂e, mi, $

### Adding a New Language

1. **Add action templates** in `plan_generator.py`:

```python
ACTION_TEMPLATES = {
    'energie': {
        'es': [  # Spanish
            {
                'title': 'Cambiar a electricidad verde',
                'description': 'Suscribirse a un contrato...',
                'impact': 'high',
                'feasibility': 'easy',
                'reduction_percent': 80,
                'category': 'energie'
            }
        ]
    }
}
```

2. **Use the new language**:

```python
plan = generate_action_plan(csv_path='data.csv', lang='es')
```

---

## 🔧 Integration with Your Green App

### Add to Existing Dashboard

```javascript
// Frontend JavaScript
async function loadActionPlan() {
    const response = await fetch('http://localhost:8000/generate_plan?lang=fr');
    const plan = await response.json();

    // Display actions
    const actionsHTML = plan.actions.map(action => `
        <div class="action-card priority-${action.priority}">
            <h3>${action.title}</h3>
            <p>${action.description}</p>
            <div class="action-meta">
                <span class="badge">${action.priority}</span>
                <span class="reduction">-${action.estimated_reduction} kg CO₂e</span>
            </div>
            <button onclick="addToCalendar('${action.id}')">
                📅 Add to Calendar
            </button>
        </div>
    `).join('');

    document.getElementById('actions-container').innerHTML = actionsHTML;
}

function addToCalendar(actionId) {
    // Open Google Calendar or download .ics
    window.open(`http://localhost:8000/generate_plan?export_format=ics&action_id=${actionId}`);
}
```

### Store Action Progress

```python
# Example: Store action completion in database
import json
from datetime import datetime

def mark_action_complete(action_id, notes=""):
    """Mark an action as completed"""
    progress_file = 'action_progress.json'

    # Load existing progress
    try:
        with open(progress_file, 'r') as f:
            progress = json.load(f)
    except FileNotFoundError:
        progress = {}

    # Update progress
    progress[action_id] = {
        'status': 'completed',
        'completed_at': datetime.now().isoformat(),
        'notes': notes
    }

    # Save
    with open(progress_file, 'w') as f:
        json.dump(progress, f, indent=2)

    return progress[action_id]

# Usage
mark_action_complete('energie_0', notes='Switched to Engie green contract')
```

---

## 📈 Advanced Use Cases

### 1. Compare Plans Over Time

```python
# Generate plan for Q1
plan_q1 = generate_action_plan('q1_data.csv', lang='fr')

# Generate plan for Q2
plan_q2 = generate_action_plan('q2_data.csv', lang='fr')

# Compare reduction potential
improvement = plan_q2['summary']['potential_reduction'] - plan_q1['summary']['potential_reduction']
print(f"Improvement: {improvement:.2f} kg CO₂e")
```

### 2. Filter Actions by Priority

```python
plan = generate_action_plan('data.csv', lang='en')

# Get only high-priority actions
high_priority = [a for a in plan['actions'] if a['priority'] == 'high']
print(f"Focus on these {len(high_priority)} critical actions:")
for action in high_priority:
    print(f"- {action['title']}")
```

### 3. Calculate ROI

```python
def calculate_roi(action, carbon_price=50):
    """
    Calculate ROI for an action

    Args:
        action: Action dictionary
        carbon_price: Price per ton of CO₂ (€ or $)

    Returns:
        Estimated annual savings
    """
    reduction_kg = action['estimated_reduction']
    reduction_tons = reduction_kg / 1000
    annual_savings = reduction_tons * carbon_price

    return {
        'action': action['title'],
        'reduction_tons': round(reduction_tons, 2),
        'annual_savings': round(annual_savings, 2),
        'feasibility': action['feasibility']
    }

# Calculate ROI for all actions
for action in plan['actions']:
    roi = calculate_roi(action, carbon_price=50)  # 50€ per ton
    print(f"{roi['action']}: €{roi['annual_savings']}/year")
```

---

## 🐛 Troubleshooting

### Error: "No data available"

**Solution**: Make sure you have uploaded invoices and generated `factures_enrichies.csv`:

```bash
curl -F "file=@your_invoices.csv" http://localhost:8000/analyze_invoices
```

### Error: "Module not found"

**Solution**: Install dependencies:

```bash
pip install pandas ics
```

### Calendar file not opening

**Solution**: Make sure the .ics file has proper permissions and your calendar app is set as the default handler for .ics files.

---

## 📚 API Documentation

Visit `http://localhost:8000/docs` for interactive API documentation (Swagger UI).

---

## 🤝 Contributing

Want to add more action templates or improve the prioritization algorithm?

1. Edit `plan_generator.py` to add new actions
2. Update `ACTION_TEMPLATES` with bilingual content
3. Test with your data
4. Submit a pull request!

---

## 📄 License

Part of Green App - Carbon Analytics Platform

---

## 💬 Support

For questions or issues, please check:
- API docs: `http://localhost:8000/docs`
- Main README: `/README.md`

---

**Generated with 🌱 Green App - Measure, analyze, reduce your carbon footprint**
