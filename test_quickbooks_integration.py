"""
Test script for QuickBooks Integration
Quick validation that everything is set up correctly
"""

import sys
from pathlib import Path

def test_imports():
    """Test that all required modules can be imported"""
    print("🧪 Testing imports...")

    try:
        from quickbooks_integration.quickbooks import QuickBooksClient
        print("  ✅ QuickBooksClient imported")
    except ImportError as e:
        print(f"  ❌ Failed to import QuickBooksClient: {e}")
        return False

    try:
        from quickbooks_integration.routes import router
        print("  ✅ QuickBooks router imported")
    except ImportError as e:
        print(f"  ❌ Failed to import router: {e}")
        return False

    try:
        from dotenv import load_dotenv
        print("  ✅ python-dotenv imported")
    except ImportError as e:
        print(f"  ❌ Failed to import dotenv: {e}")
        print("  💡 Run: pip install python-dotenv")
        return False

    try:
        import requests
        print("  ✅ requests imported")
    except ImportError as e:
        print(f"  ❌ Failed to import requests: {e}")
        return False

    return True


def test_file_structure():
    """Test that all required files exist"""
    print("\n📁 Testing file structure...")

    required_files = [
        "quickbooks_integration/__init__.py",
        "quickbooks_integration/quickbooks.py",
        "quickbooks_integration/routes.py",
        "quickbooks_integration/README.md",
        ".env.example",
        ".gitignore"
    ]

    all_exist = True
    for file_path in required_files:
        path = Path(file_path)
        if path.exists():
            print(f"  ✅ {file_path}")
        else:
            print(f"  ❌ {file_path} not found")
            all_exist = False

    return all_exist


def test_env_config():
    """Test environment configuration"""
    print("\n⚙️  Testing environment configuration...")

    # Check if .env.example exists
    if not Path(".env.example").exists():
        print("  ❌ .env.example not found")
        return False

    print("  ✅ .env.example exists")

    # Check if .env exists
    if not Path(".env").exists():
        print("  ⚠️  .env file not found (optional for now)")
        print("  💡 Copy .env.example to .env and add your QuickBooks credentials")
    else:
        print("  ✅ .env file exists")

    return True


def test_quickbooks_client():
    """Test QuickBooks client initialization"""
    print("\n🔧 Testing QuickBooks client...")

    try:
        from quickbooks_integration.quickbooks import QuickBooksClient

        # Create client with dummy credentials
        client = QuickBooksClient(
            client_id="test_client_id",
            client_secret="test_secret",
            redirect_uri="http://localhost:8000/quickbooks/callback",
            environment="sandbox"
        )

        print("  ✅ QuickBooksClient initialized successfully")

        # Test authorization URL generation
        auth_url = client.get_authorization_url()
        if "appcenter.intuit.com" in auth_url:
            print("  ✅ Authorization URL generated correctly")
        else:
            print("  ❌ Authorization URL seems incorrect")
            return False

        # Test transformation with sample data
        sample_invoice = {
            "Id": "123",
            "DocNumber": "INV-001",
            "TxnDate": "2025-01-15",
            "CustomerRef": {"value": "1", "name": "Test Customer"},
            "Line": [
                {
                    "DetailType": "SalesItemLineDetail",
                    "Description": "Test product",
                    "Amount": 100.00
                }
            ],
            "TotalAmt": 100.00
        }

        transformed = client.transform_invoices_for_green_app([sample_invoice])

        if len(transformed) == 1:
            print("  ✅ Invoice transformation working")

            invoice = transformed[0]
            required_fields = ["InvoiceId", "Date", "ClientId", "Libellé", "Montant total"]
            if all(field in invoice for field in required_fields):
                print("  ✅ Transformed invoice has all required fields")
            else:
                print("  ❌ Transformed invoice missing required fields")
                return False
        else:
            print("  ❌ Transformation returned wrong number of invoices")
            return False

        return True

    except Exception as e:
        print(f"  ❌ Error testing QuickBooks client: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("🧪 QuickBooks Integration Test Suite")
    print("=" * 60)

    tests = [
        ("Imports", test_imports),
        ("File Structure", test_file_structure),
        ("Environment Config", test_env_config),
        ("QuickBooks Client", test_quickbooks_client)
    ]

    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ {test_name} test crashed: {e}")
            results.append((test_name, False))

    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)

    all_passed = True
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} - {test_name}")
        if not result:
            all_passed = False

    print("=" * 60)

    if all_passed:
        print("\n🎉 All tests passed!")
        print("\n✨ Next steps:")
        print("  1. Create a QuickBooks app at https://developer.intuit.com/")
        print("  2. Copy .env.example to .env and add your credentials")
        print("  3. Start the backend: uvicorn app:app --reload")
        print("  4. Test connection: curl http://localhost:8000/quickbooks/connect")
        print("\n📖 Full guide: quickbooks_integration/README.md")
        return 0
    else:
        print("\n❌ Some tests failed. Please check the output above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
