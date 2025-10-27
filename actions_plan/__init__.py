"""
Green App - Climate Action Plan Module

This module provides tools to generate actionable climate plans
and integrate them with calendar systems (Google Calendar, Outlook).
"""

from .plan_generator import ActionPlanGenerator, generate_action_plan
from .calendar_sync import CalendarSync, export_to_google_calendar, export_to_outlook

__version__ = '1.0.0'
__all__ = [
    'ActionPlanGenerator',
    'generate_action_plan',
    'CalendarSync',
    'export_to_google_calendar',
    'export_to_outlook'
]
