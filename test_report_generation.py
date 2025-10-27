#!/usr/bin/env python3
"""
Test script for ESG/CSR Carbon Reporting Module
Tests PDF and DOCX generation in both French and English
"""

import os
import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from reporting import generate_report, export_pdf, export_docx

def test_report_generation():
    """Test all report generation variations"""

    print("🧪 Testing ESG/CSR Carbon Reporting Module")
    print("=" * 60)

    csv_path = "factures_enrichies.csv"

    if not os.path.exists(csv_path):
        print(f"❌ Error: {csv_path} not found")
        return False

    print(f"✓ Found data file: {csv_path}")
    print()

    # Test 1: French PDF Report
    print("📄 Test 1: Generating French PDF report...")
    try:
        report_data_fr = generate_report(
            csv_path=csv_path,
            lang='fr',
            climate_commitments="Nous nous engageons à réduire nos émissions de 50% d'ici 2030 conformément aux objectifs Science-Based Targets."
        )
        export_pdf(report_data_fr, "test_report_fr.pdf")
        print("   ✓ French PDF generated: test_report_fr.pdf")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

    # Test 2: English PDF Report
    print("📄 Test 2: Generating English PDF report...")
    try:
        report_data_en = generate_report(
            csv_path=csv_path,
            lang='en',
            climate_commitments="We commit to reducing our emissions by 50% by 2030 in line with Science-Based Targets."
        )
        export_pdf(report_data_en, "test_report_en.pdf")
        print("   ✓ English PDF generated: test_report_en.pdf")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

    # Test 3: French DOCX Report
    print("📄 Test 3: Generating French DOCX report...")
    try:
        export_docx(report_data_fr, "test_report_fr.docx")
        print("   ✓ French DOCX generated: test_report_fr.docx")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

    # Test 4: English DOCX Report
    print("📄 Test 4: Generating English DOCX report...")
    try:
        export_docx(report_data_en, "test_report_en.docx")
        print("   ✓ English DOCX generated: test_report_en.docx")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

    print()
    print("=" * 60)
    print("✅ All tests passed successfully!")
    print()
    print("Generated files:")
    print("  - test_report_fr.pdf    (French PDF)")
    print("  - test_report_en.pdf    (English PDF)")
    print("  - test_report_fr.docx   (French DOCX)")
    print("  - test_report_en.docx   (English DOCX)")
    print()
    print("📊 Report data summary:")
    print(f"  - Total emissions: {report_data_fr['summary']['total_emissions']:.2f} kg CO₂e")
    print(f"  - Invoices analyzed: {report_data_fr['summary']['invoice_count']}")
    print(f"  - Reporting period: {report_data_fr['summary']['period']}")
    print(f"  - Categories found: {len(report_data_fr['breakdown']['by_category'])}")
    print(f"  - Recommendations: {len(report_data_fr['recommendations'])}")

    return True

if __name__ == "__main__":
    success = test_report_generation()
    sys.exit(0 if success else 1)
