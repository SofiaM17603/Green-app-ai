# 🌍 Green App - Internationalization & Unit Conversion System

Complete documentation for the multilingual support and automatic unit conversion system.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Quick Start](#quick-start)
4. [How It Works](#how-it-works)
5. [Unit Conversion System](#unit-conversion-system)
6. [HTML Implementation](#html-implementation)
7. [JavaScript API](#javascript-api)
8. [Adding New Languages](#adding-new-languages)
9. [Adding New Units](#adding-new-units)
10. [Troubleshooting](#troubleshooting)
11. [Examples](#examples)

---

## 🎯 Overview

The Green App includes a robust internationalization (i18n) system with automatic unit conversion. When users switch languages:

- **All text** is translated dynamically without page reload
- **Units are converted** automatically (kg↔lbs, km↔mi, €↔$)
- **Number formatting** adapts to locale (1,234.56 vs 1 234,56)
- **Preference is saved** in browser localStorage

### Supported Languages

- 🇬🇧 **English (en)** - Default language, US units (lbs, miles, dollars)
- 🇫🇷 **French (fr)** - European units (kg, km, euros)

---

## ✨ Features

### Translation System
- ✅ 100+ translation keys covering entire interface
- ✅ Dynamic text replacement without page reload
- ✅ Nested translation structure (page.section.element)
- ✅ Placeholder and title attribute translation
- ✅ localStorage persistence

### Unit Conversion System
- ✅ Automatic weight conversion (kg ↔ lbs)
- ✅ Automatic distance conversion (km ↔ mi)
- ✅ Currency symbol switching (€ ↔ $)
- ✅ Locale-aware number formatting
- ✅ Dual-attribute system (data-value + data-unit)

---

## 🚀 Quick Start

### Basic HTML Usage

```html
<!-- 1. Include the script -->
<script src="lang.js"></script>

<!-- 2. Add translation keys -->
<h1 data-i18n="dashboard.title">Overview</h1>

<!-- 3. Add unit conversion -->
<div data-value="150" data-unit="co2">150 kg CO₂e</div>

<!-- 4. Add language toggle button -->
<button id="langToggle" onclick="window.i18n.toggleLanguage()">FR</button>
```

### JavaScript Usage

```javascript
// Get translated text
const welcomeText = window.i18n.t('dashboard.title');

// Format values with units
const emissions = window.i18n.formatWeight(150); // "330.69 lbs CO₂e" in EN
const distance = window.i18n.formatDistance(100); // "62.14 mi" in EN
const currency = window.i18n.formatCurrency(1234.56); // "$1,234.56" in EN

// Manual conversion
const lbs = window.i18n.kgToLbs(100); // 220.462
const mi = window.i18n.kmToMi(100);   // 62.1371

// Switch language programmatically
window.i18n.switchLanguage('fr'); // Switch to French
window.i18n.toggleLanguage();     // Toggle between EN/FR

// Get current language
const currentLang = window.i18n.getCurrentLang(); // 'en' or 'fr'
```

---

## ⚙️ How It Works

### Translation Flow

```
User clicks language button
        ↓
toggleLanguage() called
        ↓
currentLang = 'fr' (or 'en')
        ↓
updatePageLanguage() triggered
        ↓
┌───────────────────────────────────┐
│ 1. Translate all [data-i18n]     │
│ 2. Update all [data-value]       │
│ 3. Convert units automatically   │
│ 4. Update language button text   │
│ 5. Save preference to localStorage│
└───────────────────────────────────┘
        ↓
Page updated (no reload!)
```

### Unit Conversion Flow

```
Element with data-value="150" data-unit="co2"
        ↓
updateUnitsOnPage() detects it
        ↓
Reads: value = 150 (kg), unit = "co2"
        ↓
If lang = 'en':
  - Convert: 150 kg → 330.69 lbs
  - Format: "330.69 lbs CO₂e"
If lang = 'fr':
  - Keep: 150 kg
  - Format: "150,00 kg CO₂e"
        ↓
Updates element.textContent
```

---

## 🔄 Unit Conversion System

### Conversion Factors

All values are stored in **base units** (kg, km, €) and converted on-the-fly:

```javascript
const CONVERSION_FACTORS = {
    KG_TO_LBS: 2.20462,      // 1 kg = 2.20462 lbs
    LBS_TO_KG: 0.453592,     // 1 lbs = 0.453592 kg
    KM_TO_MI: 0.621371,      // 1 km = 0.621371 mi
    MI_TO_KM: 1.60934,       // 1 mi = 1.60934 km
    EUR_TO_USD: 1.1          // Approximate (display only)
};
```

### Unit Symbols per Language

```javascript
const UNIT_SYMBOLS = {
    en: {
        weight: 'lbs',
        weightCO2: 'lbs CO₂e',
        distance: 'mi',
        currency: '$',
        currencySymbol: '$'
    },
    fr: {
        weight: 'kg',
        weightCO2: 'kg CO₂e',
        distance: 'km',
        currency: '€',
        currencySymbol: '€'
    }
};
```

### Supported Unit Types

| Unit Type | Base Unit | English | French | Example Usage |
|-----------|-----------|---------|--------|---------------|
| `co2` | kg CO₂e | lbs CO₂e | kg CO₂e | Carbon emissions |
| `weight` | kg | lbs | kg | General weight |
| `distance` | km | mi | km | Travel distance |
| `currency` | € | $ | € | Money amounts |

---

## 📝 HTML Implementation

### Translation Attributes

#### `data-i18n`
Translates the **text content** of an element.

```html
<h1 data-i18n="dashboard.title">Overview</h1>
<!-- English: Overview -->
<!-- French: Vue d'ensemble -->
```

#### `data-i18n-placeholder`
Translates the **placeholder** of inputs.

```html
<input type="text" data-i18n-placeholder="search.placeholder" placeholder="Search...">
<!-- English: Search... -->
<!-- French: Rechercher... -->
```

#### `data-i18n-title`
Translates the **title** attribute (tooltips).

```html
<button data-i18n-title="action.delete" title="Delete">🗑️</button>
<!-- English: Delete -->
<!-- French: Supprimer -->
```

### Unit Conversion Attributes

#### `data-value` + `data-unit`
Enables automatic unit conversion.

```html
<!-- Carbon emissions -->
<div data-value="150" data-unit="co2">150 kg CO₂e</div>
<!-- English: 330.69 lbs CO₂e -->
<!-- French: 150,00 kg CO₂e -->

<!-- Distance -->
<div data-value="1000" data-unit="distance">1000 km</div>
<!-- English: 621.37 mi -->
<!-- French: 1 000,00 km -->

<!-- Weight -->
<div data-value="50" data-unit="weight">50 kg</div>
<!-- English: 110.23 lbs -->
<!-- French: 50,00 kg -->

<!-- Currency (symbol change only) -->
<div data-value="1234.56" data-unit="currency">€1234.56</div>
<!-- English: $1,234.56 -->
<!-- French: 1 234,56 € -->
```

**Important**:
- `data-value` must contain the **numeric value in base unit** (kg, km)
- `data-unit` must be one of: `co2`, `weight`, `distance`, `currency`
- Initial text content is overwritten on language switch

#### `data-unit-symbol`
Displays **only the unit symbol** (no value).

```html
<span data-unit-symbol="weightCO2">kg CO₂e</span>
<!-- English: lbs CO₂e -->
<!-- French: kg CO₂e -->
```

---

## 🔧 JavaScript API

### Translation Functions

#### `t(key)`
Get translation for a key.

```javascript
const title = window.i18n.t('dashboard.title');
// English: "Overview"
// French: "Vue d'ensemble"
```

#### `switchLanguage(lang)`
Switch to a specific language.

```javascript
window.i18n.switchLanguage('fr'); // Switch to French
window.i18n.switchLanguage('en'); // Switch to English
```

#### `toggleLanguage()`
Toggle between English and French.

```javascript
window.i18n.toggleLanguage();
// If current is 'en', switches to 'fr'
// If current is 'fr', switches to 'en'
```

#### `getCurrentLang()`
Get current language code.

```javascript
const lang = window.i18n.getCurrentLang();
// Returns: 'en' or 'fr'
```

### Unit Conversion Functions

#### `kgToLbs(kg)` / `lbsToKg(lbs)`
Convert weight between kg and lbs.

```javascript
const lbs = window.i18n.kgToLbs(100);  // 220.462
const kg = window.i18n.lbsToKg(220);   // 99.79
```

#### `kmToMi(km)` / `miToKm(mi)`
Convert distance between km and miles.

```javascript
const mi = window.i18n.kmToMi(100);   // 62.1371
const km = window.i18n.miToKm(62);    // 99.78
```

#### `convertWeight(value, targetLang)`
Convert weight based on target language.

```javascript
const converted = window.i18n.convertWeight(100, 'en');
// Returns: 220.462 (lbs)

const kept = window.i18n.convertWeight(100, 'fr');
// Returns: 100 (kg, no conversion)
```

#### `convertDistance(value, targetLang)`
Convert distance based on target language.

```javascript
const converted = window.i18n.convertDistance(100, 'en');
// Returns: 62.1371 (mi)

const kept = window.i18n.convertDistance(100, 'fr');
// Returns: 100 (km, no conversion)
```

### Formatting Functions

#### `formatNumber(value, decimals)`
Format number with locale-specific formatting.

```javascript
const formatted = window.i18n.formatNumber(1234.5678, 2);
// English: "1,234.57"
// French: "1 234,57"
```

#### `formatWeight(kg, decimals)`
Format weight value with appropriate unit.

```javascript
const formatted = window.i18n.formatWeight(150, 2);
// English: "330.69 lbs CO₂e"
// French: "150,00 kg CO₂e"
```

#### `formatDistance(km, decimals)`
Format distance value with appropriate unit.

```javascript
const formatted = window.i18n.formatDistance(1000, 2);
// English: "621.37 mi"
// French: "1 000,00 km"
```

#### `formatCurrency(amount, decimals)`
Format currency with appropriate symbol.

```javascript
const formatted = window.i18n.formatCurrency(1234.56, 2);
// English: "$1,234.56"
// French: "1 234,56 €"
```

#### `getUnitSymbol(unitType)`
Get unit symbol for current language.

```javascript
const symbol = window.i18n.getUnitSymbol('weightCO2');
// English: "lbs CO₂e"
// French: "kg CO₂e"

const currency = window.i18n.getUnitSymbol('currency');
// English: "$"
// French: "€"
```

#### `updateUnitsOnPage()`
Manually trigger unit conversion update for all elements.

```javascript
// Usually called automatically, but can be triggered manually
window.i18n.updateUnitsOnPage();
```

---

## 🌐 Adding New Languages

### Step 1: Add Translation Dictionary

Open `lang.js` and add your language to the `translations` object:

```javascript
const translations = {
    en: { /* existing */ },
    fr: { /* existing */ },
    es: { // NEW: Spanish
        'nav.dashboard': 'Panel de control',
        'dashboard.title': 'Resumen',
        // ... add all keys
    }
};
```

### Step 2: Add Unit Symbols

Add unit symbols for your language:

```javascript
const UNIT_SYMBOLS = {
    en: { /* existing */ },
    fr: { /* existing */ },
    es: { // NEW: Spanish
        weight: 'kg',
        weightCO2: 'kg CO₂e',
        distance: 'km',
        currency: '€',
        currencySymbol: '€'
    }
};
```

### Step 3: Update Language Toggle

Modify the toggle button logic if needed:

```javascript
function toggleLanguage() {
    const languages = ['en', 'fr', 'es']; // Add 'es'
    const currentIndex = languages.indexOf(currentLang);
    const nextIndex = (currentIndex + 1) % languages.length;
    currentLang = languages[nextIndex];
    updatePageLanguage();
}
```

### Step 4: Update Button Display

Update the language button to show appropriate text:

```javascript
// In updatePageLanguage()
const langBtn = document.getElementById('langToggle');
if (langBtn) {
    const langLabels = { en: 'FR', fr: 'ES', es: 'EN' };
    langBtn.textContent = langLabels[currentLang];
}
```

---

## ⚡ Adding New Units

### Step 1: Add Conversion Factor

Add conversion factor to `CONVERSION_FACTORS`:

```javascript
const CONVERSION_FACTORS = {
    // Existing...
    KG_TO_LBS: 2.20462,

    // NEW: Temperature
    C_TO_F_RATIO: 1.8,
    C_TO_F_OFFSET: 32
};
```

### Step 2: Add Unit Symbols

Add symbols for each language:

```javascript
const UNIT_SYMBOLS = {
    en: {
        // Existing...
        weightCO2: 'lbs CO₂e',

        // NEW: Temperature
        temperature: '°F'
    },
    fr: {
        // Existing...
        weightCO2: 'kg CO₂e',

        // NEW: Temperature
        temperature: '°C'
    }
};
```

### Step 3: Add Conversion Function

Create conversion function:

```javascript
/**
 * Convert Celsius to Fahrenheit
 * @param {number} celsius - Temperature in Celsius
 * @returns {number} Temperature in Fahrenheit
 */
function celsiusToFahrenheit(celsius) {
    return (celsius * CONVERSION_FACTORS.C_TO_F_RATIO) + CONVERSION_FACTORS.C_TO_F_OFFSET;
}

/**
 * Convert temperature based on current language
 * @param {number} value - Temperature value (always stored in Celsius)
 * @param {string} targetLang - Target language ('en' or 'fr')
 * @returns {number} Converted temperature
 */
function convertTemperature(value, targetLang = currentLang) {
    if (targetLang === 'en') {
        return celsiusToFahrenheit(value);
    }
    return value; // Keep as Celsius for French
}
```

### Step 4: Add Format Function

Create formatting function:

```javascript
/**
 * Format temperature value with unit
 * @param {number} celsius - Temperature in Celsius (base unit)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted temperature with unit (e.g., "20 °C" or "68 °F")
 */
function formatTemperature(celsius, decimals = 1) {
    const converted = convertTemperature(celsius);
    const formatted = formatNumber(converted, decimals);
    const unit = UNIT_SYMBOLS[currentLang].temperature;
    return `${formatted} ${unit}`;
}
```

### Step 5: Update Unit Conversion Switch

Add case to `updateUnitsOnPage()`:

```javascript
function updateUnitsOnPage() {
    document.querySelectorAll('[data-value][data-unit]').forEach(element => {
        const value = parseFloat(element.getAttribute('data-value'));
        const unitType = element.getAttribute('data-unit');

        if (isNaN(value)) return;

        let formattedValue = '';

        switch (unitType) {
            case 'weight':
            case 'co2':
                formattedValue = formatWeight(value);
                break;
            case 'distance':
                formattedValue = formatDistance(value);
                break;
            case 'currency':
                formattedValue = formatCurrency(value);
                break;
            case 'temperature': // NEW
                formattedValue = formatTemperature(value);
                break;
            default:
                formattedValue = formatNumber(value);
        }

        element.textContent = formattedValue;
    });
}
```

### Step 6: Export New Functions

Add to exports:

```javascript
window.i18n = {
    // Existing...
    formatWeight,
    formatDistance,

    // NEW
    celsiusToFahrenheit,
    convertTemperature,
    formatTemperature
};
```

### Step 7: Use in HTML

```html
<div data-value="20" data-unit="temperature">20 °C</div>
<!-- English: 68.0 °F -->
<!-- French: 20,0 °C -->
```

---

## 🐛 Troubleshooting

### Units Not Converting

**Problem**: Units stay in original format when switching language.

**Solutions**:
1. Check that element has **both** `data-value` and `data-unit` attributes
2. Verify `data-value` contains a **numeric value** (not formatted text)
3. Ensure `data-unit` is a valid type: `co2`, `weight`, `distance`, `currency`
4. Check browser console for JavaScript errors

```html
<!-- ❌ WRONG -->
<div data-value="150 kg" data-unit="co2">150 kg CO₂e</div>

<!-- ✅ CORRECT -->
<div data-value="150" data-unit="co2">150 kg CO₂e</div>
```

### Translation Not Updating

**Problem**: Text doesn't change when switching language.

**Solutions**:
1. Verify translation key exists in **both** `en` and `fr` dictionaries
2. Check for typos in `data-i18n` attribute value
3. Ensure `lang.js` is loaded **before** `script.js`
4. Check browser console for errors

```html
<!-- ❌ WRONG KEY -->
<h1 data-i18n="dashboard.titel">Overview</h1>

<!-- ✅ CORRECT KEY -->
<h1 data-i18n="dashboard.title">Overview</h1>
```

### Number Format Issues

**Problem**: Numbers display with wrong decimal separator.

**Solution**: The `formatNumber()` function automatically uses the correct locale. Ensure you're using it correctly:

```javascript
// ❌ WRONG
element.textContent = value.toFixed(2);

// ✅ CORRECT
element.textContent = window.i18n.formatNumber(value, 2);
```

### Language Not Persisting

**Problem**: Language resets to English on page reload.

**Solutions**:
1. Check browser localStorage support
2. Verify no errors in console during `initLanguage()`
3. Clear localStorage and try again: `localStorage.removeItem('greenapp-lang')`

### Conversion Factors Incorrect

**Problem**: Unit conversions produce wrong values.

**Solution**: Verify conversion factors in `CONVERSION_FACTORS`:

```javascript
// Standard conversion factors:
const CONVERSION_FACTORS = {
    KG_TO_LBS: 2.20462,      // 1 kg = 2.20462 lbs (exact)
    LBS_TO_KG: 0.453592,     // 1 lbs = 0.453592 kg (exact)
    KM_TO_MI: 0.621371,      // 1 km = 0.621371 mi (exact)
    MI_TO_KM: 1.60934,       // 1 mi = 1.60934 km (exact)
    EUR_TO_USD: 1.1          // Approximate (display only)
};
```

To update conversion rates:
1. Open `lang.js`
2. Find `CONVERSION_FACTORS` (line 16)
3. Modify the values
4. Reload the page

---

## 💡 Examples

### Example 1: Dashboard KPI Card with Conversion

```html
<!-- KPI Card -->
<div class="kpi-card">
    <div class="kpi-header">
        <span class="kpi-icon">☁️</span>
        <span class="kpi-label" data-i18n="dashboard.kpi.totalEmissions">Total Emissions</span>
    </div>
    <!-- Value with automatic conversion -->
    <div class="kpi-value" data-value="1234.56" data-unit="co2">1,234.56 kg CO₂e</div>
    <!-- Unit symbol only -->
    <div class="kpi-unit" data-unit-symbol="weightCO2">kg CO₂e</div>
</div>
```

**Result**:
- **English**: "Total Emissions" | "2,720.60 lbs CO₂e" | "lbs CO₂e"
- **French**: "Émissions totales" | "1 234,56 kg CO₂e" | "kg CO₂e"

### Example 2: Dynamic Value Update with JavaScript

```javascript
// Fetch emissions data from API
fetch('/api/emissions')
    .then(response => response.json())
    .then(data => {
        const emissionsElement = document.getElementById('totalEmissions');

        // Set base value (always in kg)
        emissionsElement.setAttribute('data-value', data.emissions_kg);
        emissionsElement.setAttribute('data-unit', 'co2');

        // Format and display with current language
        emissionsElement.textContent = window.i18n.formatWeight(data.emissions_kg);
    });
```

### Example 3: Chart Labels with Unit Conversion

```javascript
// Configure Chart.js with dynamic units
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: months,
        datasets: [{
            label: window.i18n.t('dashboard.chart.timeline.title'),
            data: emissionsData.map(kg => window.i18n.convertWeight(kg))
        }]
    },
    options: {
        scales: {
            y: {
                title: {
                    display: true,
                    text: window.i18n.getUnitSymbol('weightCO2')
                }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const value = context.parsed.y;
                        return window.i18n.formatWeight(value);
                    }
                }
            }
        }
    }
});

// Update chart when language changes
window.addEventListener('languageChanged', () => {
    chart.options.scales.y.title.text = window.i18n.getUnitSymbol('weightCO2');
    chart.update();
});
```

### Example 4: Form Input with Unit Toggle

```html
<div class="input-group">
    <label data-i18n="form.distance">Distance</label>
    <input type="number" id="distanceInput" placeholder="0">
    <span id="distanceUnit" data-unit-symbol="distance">km</span>
</div>

<script>
document.getElementById('distanceInput').addEventListener('change', (e) => {
    const value = parseFloat(e.target.value);

    // Store in base unit (km)
    const kmValue = window.i18n.getCurrentLang() === 'en'
        ? window.i18n.miToKm(value)  // Convert from mi to km
        : value;                      // Already in km

    console.log('Stored value (km):', kmValue);
});
</script>
```

### Example 5: Multi-Unit Summary Card

```html
<div class="summary-card">
    <h3 data-i18n="summary.title">Trip Summary</h3>

    <div class="summary-row">
        <span data-i18n="summary.distance">Distance</span>
        <span data-value="150" data-unit="distance">150 km</span>
    </div>

    <div class="summary-row">
        <span data-i18n="summary.emissions">Emissions</span>
        <span data-value="45.5" data-unit="co2">45.5 kg CO₂e</span>
    </div>

    <div class="summary-row">
        <span data-i18n="summary.cost">Cost</span>
        <span data-value="125.00" data-unit="currency">€125.00</span>
    </div>
</div>
```

**Result in English**:
- Distance: **93.21 mi**
- Emissions: **100.31 lbs CO₂e**
- Cost: **$125.00**

**Result in French**:
- Distance: **150,00 km**
- Emissions: **45,50 kg CO₂e**
- Cost: **125,00 €**

---

## 📊 Performance Considerations

### Optimization Tips

1. **Use `data-value` sparingly**: Only add conversion attributes to values that need it
2. **Batch updates**: Language switching updates all elements at once (efficient)
3. **Cache translations**: The `t()` function uses simple object lookup (fast)
4. **Avoid inline conversion**: Use `data-value` attributes instead of calling conversion functions in loops

### Memory Usage

- Translation dictionary: ~30 KB
- Conversion functions: ~5 KB
- Total overhead: **~35 KB** (negligible)

---

## 🎓 Best Practices

### 1. Always Store in Base Units

```javascript
// ❌ BAD: Storing converted values
const emissionsInLbs = 264.55;
element.setAttribute('data-value', emissionsInLbs);

// ✅ GOOD: Storing base unit (kg)
const emissionsInKg = 120;
element.setAttribute('data-value', emissionsInKg);
```

### 2. Use Semantic Translation Keys

```javascript
// ❌ BAD: Generic keys
'text1': 'Overview',
'text2': 'Analysis',

// ✅ GOOD: Semantic keys
'dashboard.title': 'Overview',
'dashboard.subtitle': 'Real-time carbon footprint analysis',
```

### 3. Provide Fallback Text

```html
<!-- Always provide default text in English -->
<h1 data-i18n="dashboard.title">Overview</h1>
<!-- If translation fails, shows "Overview" -->
```

### 4. Use Appropriate Decimal Places

```javascript
// Emissions: 2 decimals
window.i18n.formatWeight(150.12345, 2); // "330.69 lbs CO₂e"

// Distance: 2 decimals
window.i18n.formatDistance(1000, 2); // "621.37 mi"

// Currency: 2 decimals
window.i18n.formatCurrency(1234.567, 2); // "$1,234.57"

// Percentages: 1 decimal
window.i18n.formatNumber(15.678, 1); // "15.7"
```

---

## 📞 Support

For issues, questions, or contributions:

- **GitHub Issues**: [github.com/yourrepo/issues](https://github.com/yourrepo/issues)
- **Documentation**: This README
- **Examples**: See `/examples` directory

---

## 📄 License

MIT License - See LICENSE file for details.

---

## 🎉 Credits

- **Conversion factors**: [NIST Guide to SI](https://www.nist.gov/pml/weights-and-measures/metric-si/si-units)
- **Number formatting**: [Intl.NumberFormat API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- **Design system**: Emerald Finance v2.0

---

**Last Updated**: October 24, 2025
**Version**: 1.0.0
**Maintainer**: Green App Team
