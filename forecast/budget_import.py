"""
Budget Carbon Importer

Handles import and validation of carbon budget CSV files for comparison
with emission forecasts.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from dateutil.relativedelta import relativedelta
import warnings
warnings.filterwarnings('ignore')


class BudgetImporter:
    """Import and validate carbon budget data"""

    def __init__(self, csv_path: str):
        """
        Initialize budget importer

        Args:
            csv_path: Path to budget CSV file
        """
        self.csv_path = csv_path
        self.df = None
        self.budget_data = None
        self.budget_type = None  # 'monthly' or 'annual'
        self.errors = []

    def validate_and_load(self) -> Tuple[bool, List[str]]:
        """
        Validate CSV format and load budget data

        Returns:
            Tuple of (is_valid, error_messages)
        """
        self.errors = []

        try:
            # Load CSV
            self.df = pd.read_csv(self.csv_path)
        except FileNotFoundError:
            self.errors.append(f"File not found: {self.csv_path}")
            return False, self.errors
        except Exception as e:
            self.errors.append(f"Error reading CSV: {str(e)}")
            return False, self.errors

        # Check required columns
        required_cols = ['Categorie']
        missing_cols = [col for col in required_cols if col not in self.df.columns]

        if missing_cols:
            self.errors.append(f"Missing required columns: {', '.join(missing_cols)}")

        # Check for budget columns
        budget_cols = [col for col in self.df.columns if 'budget' in col.lower()]
        if not budget_cols:
            self.errors.append("No budget column found. Expected columns like 'Budget_mensuel', 'Budget_annuel', or 'Budget'")

        # Check for empty data
        if len(self.df) == 0:
            self.errors.append("CSV file is empty")

        # Check for duplicate categories
        if self.df['Categorie'].duplicated().any():
            duplicates = self.df[self.df['Categorie'].duplicated()]['Categorie'].unique()
            self.errors.append(f"Duplicate categories found: {', '.join(duplicates)}")

        if self.errors:
            return False, self.errors

        # Detect budget type
        self._detect_budget_type()

        # Process budget data
        self.budget_data = self._process_budget_data()

        return True, []

    def _detect_budget_type(self):
        """Detect whether budget is monthly or annual"""
        budget_cols = [col for col in self.df.columns if 'budget' in col.lower()]

        if any('mensuel' in col.lower() or 'monthly' in col.lower() for col in budget_cols):
            self.budget_type = 'monthly'
        elif any('annuel' in col.lower() or 'annual' in col.lower() or 'yearly' in col.lower() for col in budget_cols):
            self.budget_type = 'annual'
        else:
            # Default to annual if not specified
            self.budget_type = 'annual'

    def _process_budget_data(self) -> Dict:
        """Process and structure budget data"""
        budget_dict = {}

        # Find budget column
        budget_cols = [col for col in self.df.columns if 'budget' in col.lower()]
        budget_col = budget_cols[0] if budget_cols else 'Budget'

        for _, row in self.df.iterrows():
            category = row['Categorie']
            budget_value = row[budget_col]

            # Convert to numeric
            try:
                budget_value = float(budget_value)
            except (ValueError, TypeError):
                self.errors.append(f"Invalid budget value for category '{category}': {budget_value}")
                continue

            # Store budget
            budget_dict[category] = {
                'value': budget_value,
                'type': self.budget_type
            }

        # Add overall budget (sum of all categories)
        total_budget = sum(cat['value'] for cat in budget_dict.values())
        budget_dict['overall'] = {
            'value': total_budget,
            'type': self.budget_type
        }

        return budget_dict

    def get_monthly_budgets(self, categories: Optional[List[str]] = None) -> Dict:
        """
        Get budgets normalized to monthly values

        Args:
            categories: List of categories to include (None = all)

        Returns:
            Dictionary of monthly budgets by category
        """
        if self.budget_data is None:
            raise ValueError("Budget data not loaded. Call validate_and_load() first.")

        monthly_budgets = {}

        # Filter categories if specified
        cats = categories if categories else self.budget_data.keys()

        for category in cats:
            if category not in self.budget_data:
                continue

            budget_info = self.budget_data[category]
            value = budget_info['value']
            budget_type = budget_info['type']

            # Convert to monthly
            if budget_type == 'annual':
                monthly_value = value / 12
            else:
                monthly_value = value

            monthly_budgets[category] = monthly_value

        return monthly_budgets

    def get_quarterly_budgets(self, categories: Optional[List[str]] = None) -> Dict:
        """
        Get budgets normalized to quarterly values

        Args:
            categories: List of categories to include (None = all)

        Returns:
            Dictionary of quarterly budgets by category
        """
        if self.budget_data is None:
            raise ValueError("Budget data not loaded. Call validate_and_load() first.")

        quarterly_budgets = {}

        # Filter categories if specified
        cats = categories if categories else self.budget_data.keys()

        for category in cats:
            if category not in self.budget_data:
                continue

            budget_info = self.budget_data[category]
            value = budget_info['value']
            budget_type = budget_info['type']

            # Convert to quarterly
            if budget_type == 'annual':
                quarterly_value = value / 4
            elif budget_type == 'monthly':
                quarterly_value = value * 3
            else:
                quarterly_value = value

            quarterly_budgets[category] = quarterly_value

        return quarterly_budgets

    def get_annual_budgets(self, categories: Optional[List[str]] = None) -> Dict:
        """
        Get budgets normalized to annual values

        Args:
            categories: List of categories to include (None = all)

        Returns:
            Dictionary of annual budgets by category
        """
        if self.budget_data is None:
            raise ValueError("Budget data not loaded. Call validate_and_load() first.")

        annual_budgets = {}

        # Filter categories if specified
        cats = categories if categories else self.budget_data.keys()

        for category in cats:
            if category not in self.budget_data:
                continue

            budget_info = self.budget_data[category]
            value = budget_info['value']
            budget_type = budget_info['type']

            # Convert to annual
            if budget_type == 'monthly':
                annual_value = value * 12
            else:
                annual_value = value

            annual_budgets[category] = annual_value

        return annual_budgets

    def get_budget_summary(self) -> Dict:
        """
        Get summary of budget data

        Returns:
            Dictionary with budget summary information
        """
        if self.budget_data is None:
            raise ValueError("Budget data not loaded. Call validate_and_load() first.")

        categories = [cat for cat in self.budget_data.keys() if cat != 'overall']

        summary = {
            'total_categories': len(categories),
            'budget_type': self.budget_type,
            'categories': categories,
            'total_budget': self.budget_data['overall']['value'],
            'by_category': {}
        }

        for category in categories:
            budget_info = self.budget_data[category]
            summary['by_category'][category] = {
                'value': budget_info['value'],
                'percentage': (budget_info['value'] / self.budget_data['overall']['value'] * 100) if self.budget_data['overall']['value'] > 0 else 0
            }

        return summary


def validate_budget(csv_path: str) -> Tuple[bool, List[str]]:
    """
    Validate a budget CSV file

    Args:
        csv_path: Path to budget CSV file

    Returns:
        Tuple of (is_valid, error_messages)
    """
    importer = BudgetImporter(csv_path)
    is_valid, errors = importer.validate_and_load()
    return is_valid, errors


def load_budget(
    csv_path: str,
    frequency: str = 'monthly',
    categories: Optional[List[str]] = None
) -> Dict:
    """
    Load and normalize budget data

    Args:
        csv_path: Path to budget CSV file
        frequency: 'monthly', 'quarterly', or 'annual'
        categories: List of categories to include (None = all)

    Returns:
        Dictionary of budgets by category

    Raises:
        ValueError: If CSV is invalid or budget not loaded
    """
    importer = BudgetImporter(csv_path)
    is_valid, errors = importer.validate_and_load()

    if not is_valid:
        raise ValueError(f"Invalid budget CSV: {'; '.join(errors)}")

    if frequency == 'monthly':
        return importer.get_monthly_budgets(categories)
    elif frequency == 'quarterly':
        return importer.get_quarterly_budgets(categories)
    elif frequency == 'annual':
        return importer.get_annual_budgets(categories)
    else:
        raise ValueError(f"Invalid frequency: {frequency}. Must be 'monthly', 'quarterly', or 'annual'")
