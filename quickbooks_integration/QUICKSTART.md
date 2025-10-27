# ⚡ QuickBooks Integration - Quick Start Guide

Get up and running with QuickBooks in 5 minutes!

---

## 🚀 5-Minute Setup

### Step 1: Create QuickBooks App (5 min)

1. Go to [https://developer.intuit.com/](https://developer.intuit.com/)
2. Sign in with your Intuit/QuickBooks account
3. Click **"My Apps"** → **"Create an app"**
4. Select **"QuickBooks Online and Payments"**
5. Fill in app details:
   - Name: `Green App Carbon Analytics`
   - Description: `Carbon emissions analysis`
6. Go to **"Keys & credentials"** tab
7. Under **"Development"**, copy:
   - ✅ Client ID
   - ✅ Client Secret
8. Add Redirect URI: `http://localhost:8000/quickbooks/callback`
9. Click **"Save"**

### Step 2: Configure Environment (1 min)

```bash
cd "/Users/sofia/Desktop/Green App"

# Copy the example file
cp .env.example .env

# Edit .env and paste your keys
nano .env
```

Add your credentials:
```env
QUICKBOOKS_CLIENT_ID=paste_your_client_id_here
QUICKBOOKS_CLIENT_SECRET=paste_your_client_secret_here
QUICKBOOKS_REDIRECT_URI=http://localhost:8000/quickbooks/callback
QUICKBOOKS_ENVIRONMENT=sandbox
```

Save and exit (Ctrl+X, Y, Enter)

### Step 3: Start Backend (30 seconds)

```bash
cd "/Users/sofia/Desktop/Green App"
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
✅ QuickBooks integration loaded successfully
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 4: Connect to QuickBooks (2 min)

```bash
# Open in browser or use curl
curl http://localhost:8000/quickbooks/connect
```

Copy the `auth_url` from the response and paste in your browser.

1. Sign in to QuickBooks
2. Select a company
3. Click **"Connect"**
4. You'll be redirected back → SUCCESS!

### Step 5: Sync Invoices (30 seconds)

```bash
curl -X POST "http://localhost:8000/quickbooks/sync?auto_analyze=true"
```

**Done!** 🎉 Your invoices are now in Green App!

---

## 🧪 Quick Test

```bash
# 1. Check status
curl http://localhost:8000/quickbooks/status

# 2. Test transformation
curl http://localhost:8000/quickbooks/test-transform

# 3. Sync last 30 days
curl -X POST "http://localhost:8000/quickbooks/sync?start_date=2025-01-01&auto_analyze=true"

# 4. Open dashboard
# Go to http://localhost:8080 and view your data!
```

---

## 📍 API Endpoints

- `GET /quickbooks/connect` - Start OAuth flow
- `GET /quickbooks/callback` - OAuth callback (automatic)
- `GET /quickbooks/status` - Check connection
- `POST /quickbooks/sync` - Sync invoices
- `GET /quickbooks/disconnect` - Disconnect
- `GET /quickbooks/test-transform` - Test data transformation

---

## 🐛 Troubleshooting

### "Missing required environment variables"
➡️ Make sure `.env` file exists and has all 3 variables

### "401 Unauthorized"
➡️ Run `/quickbooks/connect` again (token expired)

### "No invoices found"
➡️ Check you have invoices in QuickBooks for the date range

### "Redirect URI mismatch"
➡️ Make sure redirect URI in `.env` matches QuickBooks app settings

---

## 📚 Full Documentation

For detailed setup, see [README.md](./README.md)

---

## ✨ Next Steps

1. ✅ Add test invoices in QuickBooks Sandbox
2. ✅ Sync and view in Green App dashboard
3. ✅ Test with different date ranges
4. ✅ Set up automated daily sync (coming soon!)

Happy analyzing! 💚
