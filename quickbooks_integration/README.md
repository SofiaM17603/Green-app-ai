# 📘 QuickBooks Online Integration for Green App

Automatically fetch and analyze invoices from QuickBooks Online without manual CSV uploads.

---

## 🎯 What This Does

This integration allows Green App to:
- ✅ Connect directly to your QuickBooks Online account via OAuth2
- ✅ Fetch invoices automatically with customizable date ranges
- ✅ Transform QuickBooks data to Green App format
- ✅ Analyze carbon emissions automatically
- ✅ Store results in your Green App dashboard

**No more manual CSV exports!** 🎉

---

## 📋 Prerequisites

Before starting, make sure you have:
- [x] A QuickBooks Online account (Sandbox or Production)
- [x] Access to [Intuit Developer Portal](https://developer.intuit.com/)
- [x] Python 3.8+ installed
- [x] Green App backend running

---

## 🚀 Step 1: Create a QuickBooks App

### 1.1 Sign Up / Log In to Intuit Developer

1. Go to [https://developer.intuit.com/](https://developer.intuit.com/)
2. Click **"Sign In"** (top right) or **"Get started for free"**
3. Use your Intuit/QuickBooks credentials to log in

### 1.2 Create a New App

1. Once logged in, go to **"My Apps"** in the dashboard
2. Click **"Create an app"**
3. Select **"QuickBooks Online and Payments"** (not Payroll)
4. Fill in the app details:
   - **App Name**: `Green App Carbon Analytics` (or your choice)
   - **Description**: `Carbon emissions analysis for QuickBooks invoices`
   - **Industry**: Select your industry
   - **Company**: Your company name

5. Click **"Create app"**

### 1.3 Configure App Settings

After creating your app:

1. Go to **"Keys & credentials"** tab
2. You'll see two environments:
   - **Development (Sandbox)**: For testing with sample data
   - **Production**: For real QuickBooks data

#### For Development/Testing:

1. Under **"Development"** section:
   - Note down your **Client ID** (starts with `AB...`)
   - Note down your **Client Secret** (starts with `...`)

2. Under **"Redirect URIs"**, add:
   ```
   http://localhost:8000/quickbooks/callback
   ```
   (Or your server's callback URL)

3. Click **"Save"**

#### For Production (Later):

1. When ready for production, go to **"Production"** section
2. Complete the same steps with production keys
3. Add your production redirect URI:
   ```
   https://yourdomain.com/quickbooks/callback
   ```

### 1.4 Set Up Scopes

1. Go to **"Scopes"** tab
2. Make sure these are enabled:
   - ✅ `Accounting` (com.intuit.quickbooks.accounting)
   - ✅ `Payment` (com.intuit.quickbooks.payment) - optional

---

## 🔑 Step 2: Configure Environment Variables

### 2.1 Create `.env` File

In your Green App root directory (next to `app.py`), create a `.env` file:

```bash
cd "/Users/sofia/Desktop/Green App"
touch .env
```

### 2.2 Add QuickBooks Credentials

Open `.env` and add:

```env
# QuickBooks OAuth2 Configuration
QUICKBOOKS_CLIENT_ID=your_client_id_here
QUICKBOOKS_CLIENT_SECRET=your_client_secret_here
QUICKBOOKS_REDIRECT_URI=http://localhost:8000/quickbooks/callback
QUICKBOOKS_ENVIRONMENT=sandbox

# Use "production" when ready for live data
# QUICKBOOKS_ENVIRONMENT=production
```

**Replace** `your_client_id_here` and `your_client_secret_here` with your actual keys from Step 1.3.

### 2.3 Example `.env` File

```env
QUICKBOOKS_CLIENT_ID=ABxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
QUICKBOOKS_CLIENT_SECRET=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
QUICKBOOKS_REDIRECT_URI=http://localhost:8000/quickbooks/callback
QUICKBOOKS_ENVIRONMENT=sandbox
```

---

## 📦 Step 3: Install Dependencies

### 3.1 Update `requirements.txt`

The following dependencies have been added:
- `requests` - For API calls
- `python-dotenv` - For environment variables

### 3.2 Install Dependencies

```bash
cd "/Users/sofia/Desktop/Green App"
pip install -r requirements.txt
```

Or install manually:

```bash
pip install requests python-dotenv
```

---

## 🎮 Step 4: Update Your Backend

### 4.1 The Integration is Already Created

The QuickBooks integration has been created in `quickbooks_integration/`:
```
quickbooks_integration/
├── __init__.py          # Package initialization
├── quickbooks.py        # OAuth2 client & API functions
├── routes.py            # FastAPI endpoints
└── README.md            # This file
```

### 4.2 Import Routes in `app.py`

**You need to manually add this to your `app.py`:**

Open `/Users/sofia/Desktop/Green App/app.py` and add at the top (after other imports):

```python
from dotenv import load_dotenv
from quickbooks_integration.routes import router as quickbooks_router

# Load environment variables
load_dotenv()
```

Then, after creating your FastAPI app (`app = FastAPI()`), add:

```python
# Include QuickBooks routes
app.include_router(quickbooks_router)
```

**Full example:**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from quickbooks_integration.routes import router as quickbooks_router

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include QuickBooks routes
app.include_router(quickbooks_router)

# ... rest of your existing code ...
```

---

## 🏃 Step 5: Start the Backend

```bash
cd "/Users/sofia/Desktop/Green App"
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ Your backend is now ready with QuickBooks integration!

---

## 🔗 Step 6: Connect to QuickBooks

### 6.1 Test the Connection

Open your browser or use `curl`:

```bash
curl http://localhost:8000/quickbooks/connect
```

**Response:**
```json
{
  "auth_url": "https://appcenter.intuit.com/connect/oauth2?...",
  "message": "Please visit the auth_url to connect your QuickBooks account",
  "instructions": [...]
}
```

### 6.2 Visit the Authorization URL

1. Copy the `auth_url` from the response
2. Paste it in your browser
3. You'll be redirected to QuickBooks
4. Sign in with your QuickBooks account
5. Select a company to connect
6. Click **"Connect"** to authorize Green App

### 6.3 Handle the Callback

After authorization:
- You'll be redirected to `http://localhost:8000/quickbooks/callback?code=...&realmId=...`
- The backend will exchange the code for access tokens
- Tokens are saved to `quickbooks_tokens.json`

**Success Response:**
```json
{
  "success": true,
  "message": "Successfully connected to QuickBooks!",
  "company": {
    "name": "Sandbox Company_US_1",
    "realm_id": "1234567890"
  },
  "next_steps": [...]
}
```

### 6.4 Check Connection Status

```bash
curl http://localhost:8000/quickbooks/status
```

**Response if connected:**
```json
{
  "connected": true,
  "company": {
    "name": "Your Company Name",
    "realm_id": "1234567890",
    "country": "US"
  },
  "token_valid": true
}
```

---

## 📊 Step 7: Sync Invoices

### 7.1 Sync Recent Invoices (Last 90 Days)

```bash
curl -X POST "http://localhost:8000/quickbooks/sync?auto_analyze=true"
```

### 7.2 Sync with Custom Date Range

```bash
curl -X POST "http://localhost:8000/quickbooks/sync?start_date=2025-01-01&end_date=2025-01-31&auto_analyze=true"
```

### 7.3 Sync Without Auto-Analysis

```bash
curl -X POST "http://localhost:8000/quickbooks/sync?auto_analyze=false"
```

**Success Response:**
```json
{
  "success": true,
  "message": "Successfully synced 45 invoices from QuickBooks",
  "sync_info": {
    "invoice_count": 45,
    "date_range": {
      "start": "2024-10-24",
      "end": "2025-01-22"
    },
    "synced_at": "2025-01-22T10:30:00"
  },
  "analysis": {
    "file_id": "qb_sync_20250122_103000",
    "total_emissions_kg": 12456.78,
    "total_amount": 45000.00,
    "invoice_count": 45,
    "average_emissions_per_invoice": 276.82
  },
  "invoices": [...]
}
```

✅ **Your invoices are now analyzed and visible in the Green App dashboard!**

---

## 🎨 Step 8: Use in Frontend

### 8.1 Add QuickBooks Button to UI

In your `green-app-ui/index.html`, add a QuickBooks sync button:

```html
<button class="btn btn-primary" onclick="connectQuickBooks()">
    <span>💼</span> Connect QuickBooks
</button>

<button class="btn btn-success" onclick="syncQuickBooks()">
    <span>🔄</span> Sync Invoices from QuickBooks
</button>
```

### 8.2 Add JavaScript Functions

In your `green-app-ui/script.js`, add:

```javascript
const API_BASE_URL = 'http://localhost:8000';

// Connect to QuickBooks
async function connectQuickBooks() {
    try {
        const response = await fetch(`${API_BASE_URL}/quickbooks/connect`);
        const data = await response.json();

        // Open auth URL in new window
        window.open(data.auth_url, '_blank');

        alert('Please complete the authorization in the new window');
    } catch (error) {
        console.error('Error connecting to QuickBooks:', error);
        alert('Failed to connect to QuickBooks');
    }
}

// Sync invoices from QuickBooks
async function syncQuickBooks() {
    try {
        document.getElementById('loadingSpinner').style.display = 'block';

        const response = await fetch(
            `${API_BASE_URL}/quickbooks/sync?auto_analyze=true`,
            { method: 'POST' }
        );

        const data = await response.json();

        if (data.success) {
            alert(`✅ Successfully synced ${data.sync_info.invoice_count} invoices!`);

            // Reload dashboard
            loadDashboard();
            loadFiles();
        } else {
            alert('Failed to sync invoices');
        }
    } catch (error) {
        console.error('Error syncing invoices:', error);
        alert('Failed to sync invoices');
    } finally {
        document.getElementById('loadingSpinner').style.display = 'none';
    }
}

// Check QuickBooks connection status
async function checkQuickBooksStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/quickbooks/status`);
        const data = await response.json();

        if (data.connected) {
            // Show connected status
            document.getElementById('qbStatus').textContent =
                `Connected to ${data.company.name}`;
        } else {
            document.getElementById('qbStatus').textContent =
                'Not connected';
        }
    } catch (error) {
        console.error('Error checking status:', error);
    }
}
```

---

## 🔧 API Reference

### Endpoints

#### `GET /quickbooks/connect`
Initiate OAuth2 connection to QuickBooks.

**Response:**
```json
{
  "auth_url": "https://...",
  "message": "Please visit the auth_url..."
}
```

#### `GET /quickbooks/callback`
OAuth2 callback endpoint (handled automatically after authorization).

**Query Parameters:**
- `code`: Authorization code
- `realmId`: Company ID

#### `GET /quickbooks/status`
Check connection status.

**Response:**
```json
{
  "connected": true,
  "company": {
    "name": "Company Name",
    "realm_id": "123456"
  }
}
```

#### `POST /quickbooks/sync`
Sync invoices from QuickBooks.

**Query Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format
- `max_results` (optional): Maximum invoices to fetch (default: 1000)
- `auto_analyze` (optional): Auto-analyze invoices (default: true)

**Response:**
```json
{
  "success": true,
  "message": "Successfully synced X invoices",
  "sync_info": {...},
  "analysis": {...}
}
```

#### `GET /quickbooks/disconnect`
Disconnect from QuickBooks and clear tokens.

#### `GET /quickbooks/test-transform`
Test data transformation with sample invoice.

---

## 🧪 Testing with Sandbox

### Create Test Data in QuickBooks Sandbox

1. Log in to [QuickBooks Sandbox](https://developer.intuit.com/app/developer/sandbox)
2. Go to **"Sales"** → **"Invoices"**
3. Click **"Create invoice"**
4. Fill in test data:
   - Customer: Select or create a test customer
   - Product/Service: Add items
   - Amount: Enter test amounts
5. Save the invoice
6. Create 5-10 test invoices with different dates and amounts

### Test the Integration

```bash
# 1. Connect to QuickBooks
curl http://localhost:8000/quickbooks/connect

# 2. Visit the auth_url and authorize

# 3. Check status
curl http://localhost:8000/quickbooks/status

# 4. Sync invoices
curl -X POST "http://localhost:8000/quickbooks/sync?auto_analyze=true"

# 5. View in dashboard
# Open http://localhost:8080 and check Dashboard page
```

---

## 🐛 Troubleshooting

### Issue: "Missing required environment variables"

**Solution:** Make sure `.env` file exists and contains all required variables:
```env
QUICKBOOKS_CLIENT_ID=...
QUICKBOOKS_CLIENT_SECRET=...
QUICKBOOKS_REDIRECT_URI=...
```

### Issue: "401 Unauthorized" when syncing

**Solution:**
1. Check if you're connected: `curl http://localhost:8000/quickbooks/status`
2. If not connected, reconnect: `curl http://localhost:8000/quickbooks/connect`
3. If token expired, reconnect (tokens last 1 hour)

### Issue: "No invoices found"

**Solution:**
1. Verify you have invoices in QuickBooks for the date range
2. Try a wider date range: `?start_date=2024-01-01&end_date=2025-12-31`
3. Check you're connected to the right company

### Issue: Redirect URI mismatch

**Solution:**
1. Go to [Intuit Developer Portal](https://developer.intuit.com/)
2. Go to your app → "Keys & credentials"
3. Under "Redirect URIs", make sure `http://localhost:8000/quickbooks/callback` is added
4. Save changes

### Issue: "Invalid client" error

**Solution:**
1. Verify your Client ID and Client Secret in `.env`
2. Make sure there are no extra spaces or quotes
3. Regenerate keys if needed from Intuit Developer Portal

---

## 🔒 Security Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use environment-specific keys** - Sandbox for dev, Production for prod
3. **Rotate secrets regularly** - Regenerate Client Secret periodically
4. **Use HTTPS in production** - Never use HTTP for OAuth in production
5. **Implement state validation** - Prevent CSRF attacks (already implemented)
6. **Store tokens securely** - In production, use encrypted database, not JSON file

---

## 🚀 Going to Production

### 1. Complete App Review

1. Go to [Intuit Developer Portal](https://developer.intuit.com/)
2. Go to your app → "Production"
3. Complete the **App Assessment** questionnaire
4. Submit for review (may take 1-2 weeks)

### 2. Update Environment Variables

```env
QUICKBOOKS_CLIENT_ID=production_client_id
QUICKBOOKS_CLIENT_SECRET=production_client_secret
QUICKBOOKS_REDIRECT_URI=https://yourdomain.com/quickbooks/callback
QUICKBOOKS_ENVIRONMENT=production
```

### 3. Update Redirect URI

1. In Intuit Developer Portal, add production redirect URI
2. Update your domain's redirect URI to match

### 4. Deploy

Deploy your app with the production configuration.

---

## 📚 Additional Resources

- [QuickBooks API Documentation](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/invoice)
- [OAuth 2.0 Guide](https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0)
- [API Explorer](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/invoice) - Test API calls
- [Intuit Developer Community](https://help.developer.intuit.com/s/) - Ask questions

---

## ✨ Features

✅ OAuth2 authentication with automatic token refresh
✅ Fetch invoices with customizable date ranges
✅ Transform QuickBooks data to Green App format
✅ Automatic carbon emissions analysis
✅ Persistent token storage
✅ Connection status monitoring
✅ Sandbox and production support
✅ Comprehensive error handling

---

## 🎉 You're All Set!

You can now:
- Connect to QuickBooks with one click
- Sync invoices automatically
- Analyze carbon emissions without manual CSV uploads
- View results in your beautiful Green App dashboard

Happy analyzing! 💚🌱

---

**Questions?** Check the troubleshooting section or open an issue on GitHub.
