/**
 * Green App Dashboard - Internationalization & Unit Conversion
 * Supports: French (fr), English (en)
 * Default: English
 * Auto-converts: kg↔lbs, km↔mi, €↔$
 */

// ============================================
// CONFIGURATION
// ============================================

let currentLang = 'en'; // Default language: English

// Unit conversion factors
const CONVERSION_FACTORS = {
    KG_TO_LBS: 2.20462,      // 1 kg = 2.20462 lbs
    LBS_TO_KG: 0.453592,     // 1 lbs = 0.453592 kg
    KM_TO_MI: 0.621371,      // 1 km = 0.621371 mi
    MI_TO_KM: 1.60934,       // 1 mi = 1.60934 km
    EUR_TO_USD: 1.1          // Approximate conversion rate
};

// Unit symbols by language
const UNIT_SYMBOLS = {
    en: {
        weight: 'lbs',
        weightCO2: 'lbs CO₂e',
        distance: 'mi',
        currency: '$'
    },
    fr: {
        weight: 'kg',
        weightCO2: 'kg CO₂e',
        distance: 'km',
        currency: '€'
    }
};

// ============================================
// TRANSLATIONS
// ============================================

const translations = {
    en: {
        // Page
        'page.title': 'Green App - Carbon Dashboard',

        // Header
        'header.tagline': 'Carbon Analytics Dashboard',
        'export.pdf': '📄 Export PDF',
        'export.excel': '📊 Export Excel',

        // Filters
        'filters.title': 'Filters',
        'filters.period.label': 'Period',
        'filters.period.all': 'All Time',
        'filters.period.month': 'This Month',
        'filters.period.quarter': 'This Quarter',
        'filters.period.year': 'This Year',
        'filters.period.custom': 'Custom Range',
        'filters.date.start': 'Start Date',
        'filters.date.end': 'End Date',
        'filters.type.label': 'Invoice Type',
        'filters.type.all': 'All Types',
        'filters.sector.label': 'Business Sector',
        'filters.sector.all': 'All Sectors',
        'filters.sector.tech': 'Technology',
        'filters.sector.retail': 'Retail',
        'filters.sector.manufacturing': 'Manufacturing',
        'filters.sector.services': 'Services',
        'filters.sector.transport': 'Transportation',
        'filters.apply': 'Apply Filters',
        'filters.reset': 'Reset',

        // Categories
        'category.voyages_aeriens': 'Air Travel',
        'category.transport_routier': 'Road Transport',
        'category.energie': 'Energy',
        'category.materiaux': 'Materials',
        'category.services': 'Services',
        'category.equipements': 'Equipment',
        'category.autres': 'Other',

        // KPIs
        'kpi.totalEmissions': 'Total Emissions',
        'kpi.invoicesCount': 'Invoices Analyzed',
        'kpi.avgEmissions': 'Average per Invoice',
        'kpi.carbonScore': 'Carbon Score',

        // Charts
        'charts.monthly.title': 'Monthly Emissions',
        'charts.monthly.subtitle': 'Track your carbon footprint over time',
        'charts.category.title': 'Emissions by Category',
        'charts.category.subtitle': 'Distribution of your emissions',
        'charts.supplier.title': 'Top Suppliers by Emissions',
        'charts.supplier.subtitle': 'Identify high-impact suppliers',

        // Table
        'table.title': 'Detailed Invoices',
        'table.search': 'Search...',
        'table.sort.dateDesc': 'Date (Newest)',
        'table.sort.dateAsc': 'Date (Oldest)',
        'table.sort.emissionsDesc': 'Emissions (High to Low)',
        'table.sort.emissionsAsc': 'Emissions (Low to High)',
        'table.header.date': 'Date',
        'table.header.supplier': 'Supplier',
        'table.header.category': 'Category',
        'table.header.amount': 'Amount',
        'table.header.emissions': 'Emissions',
        'table.header.impact': 'Impact',

        // Impact levels
        'impact.high': 'High',
        'impact.medium': 'Medium',
        'impact.low': 'Low',

        // Footer
        'footer.copyright': '© 2025 Green App - Carbon Analytics Platform',
        'footer.tagline': 'Measure, analyze, reduce your carbon footprint',

        // Loading
        'loading.message': 'Loading data...',

        // Pagination
        'pagination.previous': 'Previous',
        'pagination.next': 'Next',
        'pagination.showing': 'Showing',
        'pagination.to': 'to',
        'pagination.of': 'of',
        'pagination.entries': 'entries'
    },
    fr: {
        // Page
        'page.title': 'Green App - Dashboard Carbone',

        // Header
        'header.tagline': 'Tableau de bord analytique carbone',
        'export.pdf': '📄 Exporter PDF',
        'export.excel': '📊 Exporter Excel',

        // Filters
        'filters.title': 'Filtres',
        'filters.period.label': 'Période',
        'filters.period.all': 'Tout',
        'filters.period.month': 'Ce mois',
        'filters.period.quarter': 'Ce trimestre',
        'filters.period.year': 'Cette année',
        'filters.period.custom': 'Personnalisé',
        'filters.date.start': 'Date de début',
        'filters.date.end': 'Date de fin',
        'filters.type.label': 'Type de facture',
        'filters.type.all': 'Tous les types',
        'filters.sector.label': 'Secteur d\'activité',
        'filters.sector.all': 'Tous les secteurs',
        'filters.sector.tech': 'Technologie',
        'filters.sector.retail': 'Commerce',
        'filters.sector.manufacturing': 'Industrie',
        'filters.sector.services': 'Services',
        'filters.sector.transport': 'Transport',
        'filters.apply': 'Appliquer les filtres',
        'filters.reset': 'Réinitialiser',

        // Categories
        'category.voyages_aeriens': 'Voyages aériens',
        'category.transport_routier': 'Transport routier',
        'category.energie': 'Énergie',
        'category.materiaux': 'Matériaux',
        'category.services': 'Services',
        'category.equipements': 'Équipements',
        'category.autres': 'Autres',

        // KPIs
        'kpi.totalEmissions': 'Émissions totales',
        'kpi.invoicesCount': 'Factures analysées',
        'kpi.avgEmissions': 'Moyenne par facture',
        'kpi.carbonScore': 'Score carbone',

        // Charts
        'charts.monthly.title': 'Émissions mensuelles',
        'charts.monthly.subtitle': 'Suivez votre empreinte carbone au fil du temps',
        'charts.category.title': 'Émissions par catégorie',
        'charts.category.subtitle': 'Distribution de vos émissions',
        'charts.supplier.title': 'Principaux fournisseurs par émissions',
        'charts.supplier.subtitle': 'Identifiez les fournisseurs à fort impact',

        // Table
        'table.title': 'Factures détaillées',
        'table.search': 'Rechercher...',
        'table.sort.dateDesc': 'Date (Plus récent)',
        'table.sort.dateAsc': 'Date (Plus ancien)',
        'table.sort.emissionsDesc': 'Émissions (Élevé à Faible)',
        'table.sort.emissionsAsc': 'Émissions (Faible à Élevé)',
        'table.header.date': 'Date',
        'table.header.supplier': 'Fournisseur',
        'table.header.category': 'Catégorie',
        'table.header.amount': 'Montant',
        'table.header.emissions': 'Émissions',
        'table.header.impact': 'Impact',

        // Impact levels
        'impact.high': 'Élevé',
        'impact.medium': 'Moyen',
        'impact.low': 'Faible',

        // Footer
        'footer.copyright': '© 2025 Green App - Carbon Analytics Platform',
        'footer.tagline': 'Mesurez, analysez, réduisez votre empreinte carbone',

        // Loading
        'loading.message': 'Chargement des données...',

        // Pagination
        'pagination.previous': 'Précédent',
        'pagination.next': 'Suivant',
        'pagination.showing': 'Affichage de',
        'pagination.to': 'à',
        'pagination.of': 'sur',
        'pagination.entries': 'entrées'
    }
};

// ============================================
// UNIT CONVERSION FUNCTIONS
// ============================================

/**
 * Convert kilograms to pounds
 * @param {number} kg - Weight in kilograms
 * @returns {number} Weight in pounds
 */
function kgToLbs(kg) {
    return kg * CONVERSION_FACTORS.KG_TO_LBS;
}

/**
 * Convert pounds to kilograms
 * @param {number} lbs - Weight in pounds
 * @returns {number} Weight in kilograms
 */
function lbsToKg(lbs) {
    return lbs * CONVERSION_FACTORS.LBS_TO_KG;
}

/**
 * Convert kilometers to miles
 * @param {number} km - Distance in kilometers
 * @returns {number} Distance in miles
 */
function kmToMi(km) {
    return km * CONVERSION_FACTORS.KM_TO_MI;
}

/**
 * Convert miles to kilometers
 * @param {number} mi - Distance in miles
 * @returns {number} Distance in kilometers
 */
function miToKm(mi) {
    return mi * CONVERSION_FACTORS.MI_TO_KM;
}

/**
 * Convert weight based on current language
 * @param {number} value - Weight value (stored in kg)
 * @param {string} targetLang - Target language
 * @returns {number} Converted weight
 */
function convertWeight(value, targetLang = currentLang) {
    if (targetLang === 'en') {
        return kgToLbs(value);
    }
    return value; // Keep as kg for French
}

/**
 * Convert distance based on current language
 * @param {number} value - Distance value (stored in km)
 * @param {string} targetLang - Target language
 * @returns {number} Converted distance
 */
function convertDistance(value, targetLang = currentLang) {
    if (targetLang === 'en') {
        return kmToMi(value);
    }
    return value; // Keep as km for French
}

/**
 * Convert currency based on current language
 * @param {number} value - Currency value (stored in EUR)
 * @param {string} targetLang - Target language
 * @returns {number} Converted currency
 */
function convertCurrency(value, targetLang = currentLang) {
    if (targetLang === 'en') {
        return value * CONVERSION_FACTORS.EUR_TO_USD;
    }
    return value; // Keep as EUR for French
}

// ============================================
// FORMATTING FUNCTIONS
// ============================================

/**
 * Format number with locale-specific formatting
 * @param {number} value - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
function formatNumber(value, decimals = 2) {
    const locale = currentLang === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

/**
 * Format weight value with unit
 * @param {number} kg - Weight in kilograms (base unit)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted weight with unit
 */
function formatWeight(kg, decimals = 2) {
    const converted = convertWeight(kg);
    const formatted = formatNumber(converted, decimals);
    const unit = UNIT_SYMBOLS[currentLang].weightCO2;
    return `${formatted} ${unit}`;
}

/**
 * Format distance value with unit
 * @param {number} km - Distance in kilometers (base unit)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted distance with unit
 */
function formatDistance(km, decimals = 2) {
    const converted = convertDistance(km);
    const formatted = formatNumber(converted, decimals);
    const unit = UNIT_SYMBOLS[currentLang].distance;
    return `${formatted} ${unit}`;
}

/**
 * Format currency value with symbol
 * @param {number} amount - Amount to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted currency
 */
function formatCurrency(amount, decimals = 2) {
    const converted = convertCurrency(amount);
    const formatted = formatNumber(converted, decimals);
    const symbol = UNIT_SYMBOLS[currentLang].currency;
    return currentLang === 'fr' ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
}

/**
 * Get unit symbol for current language
 * @param {string} unitType - Type of unit ('weight', 'weightCO2', 'distance', 'currency')
 * @returns {string} Unit symbol
 */
function getUnitSymbol(unitType) {
    return UNIT_SYMBOLS[currentLang][unitType] || '';
}

// ============================================
// TRANSLATION FUNCTIONS
// ============================================

/**
 * Get translation for a key in current language
 * @param {string} key - Translation key
 * @returns {string} Translated text
 */
function t(key) {
    return translations[currentLang][key] || key;
}

/**
 * Update all elements with data-i18n attribute
 */
function updatePageLanguage() {
    // Update text content
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);

        if (element.tagName === 'INPUT' && element.type === 'button') {
            element.value = translation;
        } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.placeholder = translation;
        } else if (element.tagName === 'OPTION') {
            element.textContent = translation;
        } else {
            element.textContent = translation;
        }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });

    // Update titles
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        element.title = t(key);
    });

    // Update page title
    document.title = t('page.title');

    // Update language toggle button
    const langBtn = document.getElementById('langToggle');
    if (langBtn) {
        langBtn.textContent = currentLang === 'en' ? 'FR' : 'EN';
    }

    // Save language preference
    localStorage.setItem('greenapp-dashboard-lang', currentLang);

    // Dispatch custom event
    document.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { language: currentLang }
    }));
}

/**
 * Switch to a specific language
 * @param {string} lang - Language code ('en' or 'fr')
 */
function switchLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        updatePageLanguage();
    }
}

/**
 * Toggle between English and French
 */
function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'fr' : 'en';
    updatePageLanguage();
}

/**
 * Get current language
 * @returns {string} Current language code
 */
function getCurrentLang() {
    return currentLang;
}

/**
 * Initialize language from localStorage or default to English
 */
function initLanguage() {
    const savedLang = localStorage.getItem('greenapp-dashboard-lang');

    if (savedLang && translations[savedLang]) {
        currentLang = savedLang;
    } else {
        currentLang = 'en'; // Default to English
    }

    updatePageLanguage();
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initLanguage();

    // Setup language toggle button
    const langBtn = document.getElementById('langToggle');
    if (langBtn) {
        langBtn.addEventListener('click', toggleLanguage);
    }
});

// ============================================
// EXPORTS
// ============================================

window.i18n = {
    // Translation
    t,
    switchLanguage,
    toggleLanguage,
    getCurrentLang,

    // Unit conversion
    kgToLbs,
    lbsToKg,
    kmToMi,
    miToKm,
    convertWeight,
    convertDistance,
    convertCurrency,

    // Formatting
    formatNumber,
    formatWeight,
    formatDistance,
    formatCurrency,
    getUnitSymbol,

    // Update functions
    updatePageLanguage,

    // Constants
    CONVERSION_FACTORS,
    UNIT_SYMBOLS
};
