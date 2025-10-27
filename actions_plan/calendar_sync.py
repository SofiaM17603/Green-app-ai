"""
Calendar Integration Module

Provides tools to export climate actions to Google Calendar and Microsoft Outlook.
Generates .ics files and provides OAuth integration examples.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json
from ics import Calendar, Event


class CalendarSync:
    """Sync climate actions with calendar systems"""

    def __init__(self, app_name: str = "Green App", app_url: str = "http://localhost:8080"):
        """
        Initialize calendar sync

        Args:
            app_name: Name of the application
            app_url: URL to the application
        """
        self.app_name = app_name
        self.app_url = app_url

    def generate_ics_file(self, actions: List[Dict], output_path: str) -> str:
        """
        Generate an .ics file from actions list

        Args:
            actions: List of action dictionaries
            output_path: Path to save .ics file

        Returns:
            Path to generated file
        """
        calendar = Calendar()

        for action in actions:
            event = Event()
            event.name = f"[{self.app_name}] {action['title']}"
            event.description = self._format_description(action)

            # Set start date (target_date from action or 90 days from now)
            if 'target_date' in action:
                start_date = datetime.fromisoformat(action['target_date'].replace('Z', '+00:00'))
            else:
                start_date = datetime.now() + timedelta(days=90)

            event.begin = start_date
            event.duration = timedelta(hours=1)

            # Add action URL if available
            if 'id' in action:
                event.url = f"{self.app_url}/actions?id={action['id']}"

            # Set reminder (7 days before)
            event.alarms = [timedelta(days=-7)]

            # Add priority
            if action.get('priority') == 'high':
                event.categories = ['High Priority', 'Climate Action']
            elif action.get('priority') == 'medium':
                event.categories = ['Medium Priority', 'Climate Action']
            else:
                event.categories = ['Low Priority', 'Climate Action']

            calendar.events.add(event)

        # Write to file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.writelines(calendar)

        return output_path

    def _format_description(self, action: Dict) -> str:
        """Format action as calendar event description"""
        lines = [
            f"📋 {action.get('description', 'No description')}",
            "",
            f"🎯 Priority: {action.get('priority', 'unknown').upper()}",
            f"⚡ Impact: {action.get('impact', 'unknown').upper()}",
            f"🔧 Feasibility: {action.get('feasibility', 'unknown').upper()}",
            ""
        ]

        if action.get('estimated_reduction', 0) > 0:
            lines.append(f"🌱 Estimated reduction: {action['estimated_reduction']:.2f} kg CO₂e")
            lines.append("")

        if action.get('category'):
            lines.append(f"📂 Category: {action['category']}")
            lines.append("")

        lines.append(f"🔗 Track in {self.app_name}: {self.app_url}")

        return "\n".join(lines)

    def generate_google_calendar_link(self, action: Dict) -> str:
        """
        Generate a Google Calendar "Add Event" link

        Args:
            action: Action dictionary

        Returns:
            URL to add event to Google Calendar
        """
        import urllib.parse

        title = f"[{self.app_name}] {action['title']}"
        description = self._format_description(action)

        # Get target date
        if 'target_date' in action:
            start_date = datetime.fromisoformat(action['target_date'].replace('Z', '+00:00'))
        else:
            start_date = datetime.now() + timedelta(days=90)

        # Format dates for Google Calendar (yyyyMMddTHHmmss)
        start = start_date.strftime('%Y%m%dT%H%M%S')
        end = (start_date + timedelta(hours=1)).strftime('%Y%m%dT%H%M%S')

        params = {
            'action': 'TEMPLATE',
            'text': title,
            'dates': f"{start}/{end}",
            'details': description,
            'location': self.app_url
        }

        query_string = urllib.parse.urlencode(params)
        return f"https://calendar.google.com/calendar/render?{query_string}"

    def generate_outlook_link(self, action: Dict) -> str:
        """
        Generate an Outlook "Add Event" link (web version)

        Args:
            action: Action dictionary

        Returns:
            URL to add event to Outlook Calendar
        """
        import urllib.parse

        title = f"[{self.app_name}] {action['title']}"
        description = self._format_description(action)

        # Get target date
        if 'target_date' in action:
            start_date = datetime.fromisoformat(action['target_date'].replace('Z', '+00:00'))
        else:
            start_date = datetime.now() + timedelta(days=90)

        end_date = start_date + timedelta(hours=1)

        # Format dates for Outlook (ISO 8601)
        start = start_date.strftime('%Y-%m-%dT%H:%M:%S')
        end = end_date.strftime('%Y-%m-%dT%H:%M:%S')

        params = {
            'path': '/calendar/action/compose',
            'rru': 'addevent',
            'subject': title,
            'body': description,
            'startdt': start,
            'enddt': end,
            'location': self.app_url
        }

        query_string = urllib.parse.urlencode(params)
        return f"https://outlook.live.com/calendar/0/deeplink/compose?{query_string}"

    def generate_api_integration_example(self) -> Dict[str, str]:
        """
        Generate example code for OAuth integration with Google Calendar and Microsoft Graph

        Returns:
            Dictionary with Python code examples
        """
        google_example = '''
# Google Calendar API Integration
# Install: pip install google-auth google-auth-oauthlib google-api-python-client

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from datetime import datetime, timedelta

def add_action_to_google_calendar(action, credentials):
    """Add a climate action to Google Calendar"""
    service = build('calendar', 'v3', credentials=credentials)

    event = {
        'summary': f'[Green App] {action["title"]}',
        'description': action['description'],
        'start': {
            'dateTime': action['target_date'],
            'timeZone': 'UTC',
        },
        'end': {
            'dateTime': (datetime.fromisoformat(action['target_date']) + timedelta(hours=1)).isoformat(),
            'timeZone': 'UTC',
        },
        'reminders': {
            'useDefault': False,
            'overrides': [
                {'method': 'email', 'minutes': 24 * 60 * 7},  # 7 days before
                {'method': 'popup', 'minutes': 60},  # 1 hour before
            ],
        },
    }

    event = service.events().insert(calendarId='primary', body=event).execute()
    return event.get('htmlLink')

# OAuth 2.0 Setup:
# 1. Go to https://console.cloud.google.com/
# 2. Create a project and enable Google Calendar API
# 3. Create OAuth 2.0 credentials
# 4. Download client_secret.json
# 5. Run authentication flow:

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ['https://www.googleapis.com/auth/calendar']
flow = InstalledAppFlow.from_client_secrets_file('client_secret.json', SCOPES)
creds = flow.run_local_server(port=0)

# Save credentials for future use
with open('token.json', 'w') as token:
    token.write(creds.to_json())
'''

        outlook_example = '''
# Microsoft Outlook / Graph API Integration
# Install: pip install msal requests

import msal
import requests
from datetime import datetime, timedelta

def add_action_to_outlook(action, access_token):
    """Add a climate action to Outlook Calendar"""

    endpoint = 'https://graph.microsoft.com/v1.0/me/calendar/events'

    event = {
        'subject': f'[Green App] {action["title"]}',
        'body': {
            'contentType': 'Text',
            'content': action['description']
        },
        'start': {
            'dateTime': action['target_date'],
            'timeZone': 'UTC'
        },
        'end': {
            'dateTime': (datetime.fromisoformat(action['target_date']) + timedelta(hours=1)).isoformat(),
            'timeZone': 'UTC'
        },
        'reminderMinutesBeforeStart': 10080,  # 7 days
    }

    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }

    response = requests.post(endpoint, json=event, headers=headers)
    return response.json()

# OAuth 2.0 Setup:
# 1. Go to https://portal.azure.com/
# 2. Register an application in Azure AD
# 3. Add "Calendars.ReadWrite" permission
# 4. Get Client ID and Client Secret
# 5. Run authentication:

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

# Interactive flow (for desktop apps)
flow = app.initiate_device_flow(scopes=SCOPES)
print(flow['message'])
result = app.acquire_token_by_device_flow(flow)
access_token = result['access_token']
'''

        return {
            'google_calendar': google_example,
            'microsoft_outlook': outlook_example
        }


def export_to_google_calendar(actions: List[Dict], app_url: str = "http://localhost:8080") -> List[str]:
    """
    Generate Google Calendar links for all actions

    Args:
        actions: List of action dictionaries
        app_url: URL to the application

    Returns:
        List of Google Calendar "Add Event" URLs
    """
    sync = CalendarSync(app_url=app_url)
    return [sync.generate_google_calendar_link(action) for action in actions]


def export_to_outlook(actions: List[Dict], app_url: str = "http://localhost:8080") -> List[str]:
    """
    Generate Outlook Calendar links for all actions

    Args:
        actions: List of action dictionaries
        app_url: URL to the application

    Returns:
        List of Outlook Calendar "Add Event" URLs
    """
    sync = CalendarSync(app_url=app_url)
    return [sync.generate_outlook_link(action) for action in actions]


def export_to_ics(actions: List[Dict], output_path: str, app_url: str = "http://localhost:8080") -> str:
    """
    Export actions to .ics file (compatible with all calendar apps)

    Args:
        actions: List of action dictionaries
        output_path: Path to save .ics file
        app_url: URL to the application

    Returns:
        Path to generated .ics file
    """
    sync = CalendarSync(app_url=app_url)
    return sync.generate_ics_file(actions, output_path)
