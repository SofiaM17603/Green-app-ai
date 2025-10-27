# 🌱 Green App - Interactive Carbon Dashboard

A modern, multilingual, interactive dashboard for carbon emissions analytics with real-time data visualization, smart filtering, and export capabilities.

## ✨ Features

### 📊 Interactive Visualizations
- **Monthly Emissions Chart**: Line chart tracking carbon footprint over time
- **Category Distribution**: Doughnut chart showing emissions by category (transport, energy, materials, etc.)
- **Top Suppliers**: Bar chart identifying high-impact suppliers

### 🎯 Key Performance Indicators (KPIs)
- Total carbon emissions with period-over-period comparison
- Number of analyzed invoices
- Average emissions per invoice
- Carbon score (0-100)

### 🔍 Advanced Filtering
- **Period filters**: Month, Quarter, Year, Custom date range
- **Invoice type filters**: Filter by category (air travel, road transport, energy, etc.)
- **Sector filters**: Filter by business sector (tech, retail, manufacturing, etc.)
- Real-time data updates on filter changes

### 🌍 Multilingual Support (FR/EN)
- **Default language**: English
- **Toggle button**: Switch between French and English instantly
- **Auto unit conversion**:
  - Weight: kg ↔ lbs (1 kg = 2.20462 lbs)
  - Distance: km ↔ mi (1 km = 0.621371 mi)
  - Currency: € ↔ $ (approximate conversion)

### 📤 Export Capabilities
- **PDF Export**: Generate professional carbon reports with charts and data
- **Excel Export**: Export filtered data with summary statistics
- Includes all filters and current view

### 📱 Responsive Design
- Mobile-friendly layout
- Tablet-optimized views
- Desktop-first design with progressive enhancement

## 📁 File Structure

```
dashboard/
├── index.html      # Main HTML structure
├── style.css       # Responsive styling with CSS variables
├── lang.js         # i18n and unit conversion logic
├── dashboard.js    # Charts, filters, and data management
├── export.js       # PDF and Excel export functionality
└── README.md       # This documentation
```

## 🚀 Quick Start

### 1. Open the Dashboard

Simply open `index.html` in your browser:

```bash
# Option 1: Direct file open
open dashboard/index.html

# Option 2: Local server (recommended)
cd dashboard
python -m http.server 3000
# Then open http://localhost:3000
```

### 2. Explore the Features

The dashboard will load with **sample data** by default. You can:

- **Change language**: Click the language toggle button (EN/FR)
- **Apply filters**: Use the filters section to narrow down data
- **View charts**: Interactive charts update automatically
- **Export reports**: Click PDF or Excel export buttons
- **Search invoices**: Use the search bar in the data table

## 🔌 Integration with Your Project

### Option 1: Standalone Dashboard

The dashboard works independently with sample data. No backend required!

### Option 2: Connect to Green App API

To connect the dashboard to your existing Green App backend:

1. **Update API URL** in `dashboard.js`:

```javascript
const API_BASE_URL = 'http://localhost:8000'; // Your backend URL
```

2. **Ensure your API returns data in this format**:

```javascript
// GET /dashboard endpoint should return:
{
  "invoices": [
    {
      "id": "INV-001",
      "date": "2025-01-15",
      "supplier": "Air France",
      "category": "voyages_aeriens",
      "sector": "transport",
      "amount": 1250.00,
      "emissions": 850.5,
      "impact": "high"
    },
    // ... more invoices
  ]
}
```

3. **API Integration Points**:

The dashboard calls these endpoints:
- `GET /dashboard` - Get all invoices and analytics data

If the API is not available, the dashboard automatically falls back to sample data.

### Option 3: Embed in Existing App

To embed the dashboard in your existing HTML:

```html
<!-- In your main application HTML -->
<div id="dashboard-container">
  <!-- Copy content from dashboard/index.html body -->
</div>

<!-- Add required scripts -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script src="dashboard/lang.js"></script>
<script src="dashboard/dashboard.js"></script>
<script src="dashboard/export.js"></script>

<!-- Add styles -->
<link rel="stylesheet" href="dashboard/style.css">
```

## ⚙️ Customization

### Adding a New Language

Edit `lang.js` and add translations:

```javascript
const translations = {
  en: { /* existing */ },
  fr: { /* existing */ },
  es: { // New Spanish translations
    'page.title': 'Green App - Panel de Carbono',
    'kpi.totalEmissions': 'Emisiones Totales',
    // ... add all translation keys
  }
};

// Add unit symbols for Spanish
const UNIT_SYMBOLS = {
  en: { /* existing */ },
  fr: { /* existing */ },
  es: {
    weight: 'kg',
    weightCO2: 'kg CO₂e',
    distance: 'km',
    currency: '€'
  }
};
```

### Customizing Chart Colors

Edit the color palette in `dashboard.js`:

```javascript
const CHART_COLORS = {
  primary: '#10b981',    // Change to your brand color
  secondary: '#3b82f6',
  accent: '#8b5cf6',
  // ... add more colors
};
```

### Customizing Filters

Add new filter options in `index.html`:

```html
<!-- Add a new filter -->
<div class="filter-group">
  <label for="yourFilter">Your Custom Filter</label>
  <select id="yourFilter" class="filter-select">
    <option value="all">All Options</option>
    <option value="option1">Option 1</option>
    <option value="option2">Option 2</option>
  </select>
</div>
```

Then update the filter logic in `dashboard.js`:

```javascript
function applyFilters() {
  const yourFilter = document.getElementById('yourFilter').value;

  filteredData = rawData.filter(invoice => {
    // Your custom filter logic
    if (yourFilter !== 'all' && invoice.yourField !== yourFilter) {
      return false;
    }
    return true;
  });

  refreshDashboard();
}
```

### Customizing Export Format

Edit `export.js` to customize PDF or Excel output:

```javascript
// Customize PDF layout
function exportToPDF() {
  // Modify page size
  const pdf = new jsPDF('landscape', 'mm', 'a3'); // Change orientation/size

  // Add your company logo
  pdf.addImage('logo.png', 'PNG', 10, 10, 50, 20);

  // ... rest of PDF generation
}

// Customize Excel columns
function exportToExcel() {
  const excelData = data.map(invoice => ({
    'Custom Column 1': invoice.field1,
    'Custom Column 2': invoice.field2,
    // ... your custom columns
  }));
}
```

### Styling Customization

The dashboard uses CSS variables for easy theming. Edit `style.css`:

```css
:root {
  /* Change primary color */
  --color-primary: #10b981;        /* Your brand green */
  --color-primary-dark: #059669;
  --color-primary-light: #d1fae5;

  /* Change spacing */
  --spacing-xl: 2rem;              /* Adjust spacing */

  /* Change font */
  --font-family: 'Your Custom Font', sans-serif;

  /* Change border radius */
  --radius-lg: 1rem;               /* More/less rounded corners */
}
```

## 📊 Data Format

### Invoice Object Structure

Each invoice in the data array should follow this structure:

```javascript
{
  id: "INV-001",              // Unique invoice ID
  date: "2025-01-15",         // ISO date format (YYYY-MM-DD)
  supplier: "Air France",     // Supplier/vendor name
  category: "voyages_aeriens",// Category slug (see categories below)
  sector: "transport",        // Business sector
  amount: 1250.00,            // Invoice amount in EUR (base currency)
  emissions: 850.5,           // CO2 emissions in kg (base unit)
  impact: "high"              // Impact level: "high", "medium", or "low"
}
```

### Supported Categories

The dashboard supports these categories (defined in `lang.js`):

- `voyages_aeriens` - Air Travel
- `transport_routier` - Road Transport
- `energie` - Energy
- `materiaux` - Materials
- `services` - Services
- `equipements` - Equipment
- `autres` - Other

### Impact Levels

- `high` - Emissions > 1000 kg CO₂e
- `medium` - Emissions 300-1000 kg CO₂e
- `low` - Emissions < 300 kg CO₂e

## 🔧 Technical Details

### Dependencies

All dependencies are loaded via CDN (no npm install required):

- **Chart.js 4.4.0**: Data visualization
- **jsPDF 2.5.1**: PDF generation
- **html2canvas 1.4.1**: Chart to image conversion
- **SheetJS (xlsx) 0.18.5**: Excel file generation

### Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Performance

- **Initial load**: < 1 second (with sample data)
- **Filter update**: Instant (< 100ms)
- **Chart rendering**: < 500ms
- **Export**: 1-3 seconds (depending on data size)

### Data Limits

- **Recommended**: Up to 1,000 invoices for optimal performance
- **Maximum**: Can handle 10,000+ invoices (with some performance degradation)
- **PDF export**: Limited to first 30 rows (to keep file size reasonable)
- **Excel export**: No limit

## 🌐 Multilingual System

### How Translation Works

The i18n system uses the `data-i18n` attribute:

```html
<!-- HTML with translation key -->
<h1 data-i18n="page.title">Green App - Carbon Dashboard</h1>

<!-- JavaScript updates it automatically -->
element.textContent = window.i18n.t('page.title');
```

### How Unit Conversion Works

All data is stored in **base units** (kg, km, EUR):

```javascript
// Storage (always in base units)
const invoice = {
  emissions: 100,  // Always in kg
  amount: 1000     // Always in EUR
};

// Display (converted based on language)
if (currentLang === 'en') {
  display = 100 * 2.20462;  // Convert to lbs
  unit = 'lbs CO₂e';
} else {
  display = 100;             // Keep as kg
  unit = 'kg CO₂e';
}
```

### Adding New Translation Keys

1. Add the key to both languages in `lang.js`:

```javascript
const translations = {
  en: {
    'your.new.key': 'English text'
  },
  fr: {
    'your.new.key': 'Texte français'
  }
};
```

2. Use it in HTML with `data-i18n`:

```html
<p data-i18n="your.new.key">Default text</p>
```

3. Or use it in JavaScript:

```javascript
const text = window.i18n.t('your.new.key');
```

## 🎨 Design System

### Color Palette

```css
Primary:   #10b981 (Green)
Secondary: #3b82f6 (Blue)
Accent:    #8b5cf6 (Purple)
Danger:    #ef4444 (Red)
Warning:   #f59e0b (Orange)
Success:   #10b981 (Green)
```

### Typography

- **Headings**: Bold, large sizes (1.5rem - 2rem)
- **Body**: Regular, 1rem
- **Small**: 0.875rem
- **Tiny**: 0.75rem

### Spacing Scale

- **xs**: 0.25rem (4px)
- **sm**: 0.5rem (8px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)

## 🐛 Troubleshooting

### Charts not displaying

**Problem**: Charts appear as blank canvases

**Solution**:
- Ensure Chart.js is loaded before `dashboard.js`
- Check browser console for errors
- Verify canvas elements exist in HTML

### Export not working

**Problem**: PDF/Excel export buttons don't work

**Solution**:
- Check that jsPDF and XLSX libraries are loaded
- Ensure you're not blocking popups (for file download)
- Check browser console for errors

### Language toggle not working

**Problem**: Clicking language button doesn't change text

**Solution**:
- Verify `lang.js` is loaded before other scripts
- Check that elements have `data-i18n` attributes
- Inspect browser console for JavaScript errors

### API connection failing

**Problem**: Dashboard shows "Loading..." indefinitely

**Solution**:
- Verify your backend is running (check `http://localhost:8000/dashboard`)
- Update `API_BASE_URL` in `dashboard.js` if using different port
- Check CORS headers on your backend
- Dashboard will fall back to sample data if API fails

### Filters not working

**Problem**: Applying filters doesn't update charts

**Solution**:
- Ensure `applyFilters()` function is called on filter change
- Check that filter IDs match between HTML and JavaScript
- Verify `refreshDashboard()` is called after filtering

## 📝 Best Practices

### Data Management

1. **Always use base units** in your data (kg, km, EUR)
2. **Let the i18n system handle conversions** - don't convert before storing
3. **Validate data format** before passing to dashboard
4. **Keep data consistent** - use same category slugs across all invoices

### Performance

1. **Limit initial data load** to last 12 months
2. **Implement pagination** on backend for large datasets
3. **Debounce filter updates** if you have > 1000 invoices
4. **Lazy load charts** only when visible

### Accessibility

1. All charts have **descriptive labels**
2. Color is not the only indicator (use icons/text too)
3. Keyboard navigation supported
4. Screen reader friendly

## 🔮 Future Enhancements

Potential features to add:

- [ ] Date range picker with calendar UI
- [ ] Save/load custom filter presets
- [ ] Comparison mode (compare two periods)
- [ ] Trend analysis and predictions
- [ ] Custom KPI builder
- [ ] Email report scheduling
- [ ] Dark mode toggle
- [ ] More chart types (scatter, radar)
- [ ] Drill-down capabilities
- [ ] Real-time data updates (WebSocket)

## 📚 Additional Resources

- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [SheetJS Documentation](https://docs.sheetjs.com/)
- [MDN Web Docs - Internationalization](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)

## 🤝 Support

For issues or questions:

1. Check this README first
2. Review the code comments
3. Check browser console for errors
4. Verify all dependencies are loaded

## 📄 License

Part of the Green App Carbon Analytics Platform
© 2025 Green App

---

**Happy Carbon Tracking! 🌱💚**
