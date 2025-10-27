"""
Green App - ESG/CSR Carbon Reporting Module

This module provides tools to generate professional carbon reports
compliant with ADEME and GHG Protocol standards.
"""

from .report_generator import CarbonReportGenerator, generate_report
from .export import export_pdf, export_docx

__version__ = '1.0.0'
__all__ = [
    'CarbonReportGenerator',
    'generate_report',
    'export_pdf',
    'export_docx'
]
