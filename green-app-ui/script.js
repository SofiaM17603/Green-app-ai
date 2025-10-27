// === Configuration ===
const API_BASE_URL = 'http://localhost:8000';

// === Variables globales ===
let selectedFile = null;
let enrichedFileBlob = null;
let forecastChart = null;
let categoryChart = null;
let timelineChart = null;

// === Chart.js Configuration ===
const chartColors = {
    primary: '#10b981',
    secondary: '#3b82f6',
    accent: '#8b5cf6',
    red: '#ef4444',
    yellow: '#f59e0b',
    purple: '#a78bfa',
    pink: '#ec4899',
    teal: '#14b8a6',
};

const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                padding: 15,
                font: {
                    size: 12,
                    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
                }
            }
        }
    }
};

// === Navigation ===
function navigateTo(pageName) {
    // Désactiver toutes les pages
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

    // Activer la page sélectionnée
    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) targetPage.classList.add('active');

    const targetLink = document.querySelector(`[data-page="${pageName}"]`);
    if (targetLink) targetLink.classList.add('active');

    // Charger les données du dashboard si nécessaire
    if (pageName === 'dashboard') {
        loadDashboard();
    }

    // Check QuickBooks status and load files when navigating to analyze page
    if (pageName === 'analyze') {
        checkQuickBooksStatus();
        loadFiles(); // Load files section integrated in analyze page
        setupFileUpload(); // Re-setup file upload when navigating to analyze page
    }
}

// === Initialization ===
document.addEventListener('DOMContentLoaded', () => {
    // Navigation setup
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            navigateTo(page);
        });
    });

    // File upload setup
    setupFileUpload();

    // Initialize dashboard filters
    initDashboardFilters();

    // Load dashboard data on startup
    loadDashboard();

    // Check QuickBooks status on startup
    checkQuickBooksStatus();

    // Listen for language change events to refresh dynamic content
    document.addEventListener('languageChanged', () => {
        // Reload current page data to update units
        const currentPage = document.querySelector('.page.active')?.id;

        if (currentPage === 'dashboard-page') {
            loadDashboard();
        } else if (currentPage === 'analyze-page') {
            loadFiles(); // Reload files in analyze page
        }

        // Refresh charts if they exist
        if (categoryChart) {
            updateCategoryChart(categoryChart.data.datasets[0].data);
        }
        if (timelineChart) {
            const timelineData = timelineChart.data.datasets[0].data.map((val, idx) => ({
                emissions: val,
                date: timelineChart.data.labels[idx]
            }));
            updateTimelineChart(timelineData);
        }
    });
});

// === Dashboard Functions ===
async function loadDashboard() {
    console.log('🔵 loadDashboard called');
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard`);
        console.log('🔵 Dashboard API response status:', response.status);
        const data = await response.json();
        console.log('🔵 Dashboard data received:', data);

        if (data.error) {
            console.log('❌ Dashboard returned error:', data.error);
            // Show empty state
            document.getElementById('dashboardEmpty').style.display = 'block';
            document.getElementById('dashboardContent').style.display = 'none';
            return;
        }

        // Store full data for filtering
        dashboardFullData = data;
        dashboardRawData = data;
        console.log('✅ Dashboard data stored. Invoices count:', data.invoices?.length || 0);

        // Hide empty state, show content
        document.getElementById('dashboardEmpty').style.display = 'none';
        document.getElementById('dashboardContent').style.display = 'block';

        // Show ESG Report button when data is available
        const reportBtn = document.getElementById('generateReportBtn');
        if (reportBtn) {
            reportBtn.style.display = 'inline-flex';
        }

        // Apply default filter (this year) which will update everything
        console.log('🔵 Applying default filters...');
        applyDashboardFilters();

    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
        document.getElementById('dashboardEmpty').style.display = 'block';
        document.getElementById('dashboardContent').style.display = 'none';
    }
}

function updateKPIs(kpis) {
    // Carbon score
    const score = kpis.carbon_score || 0;
    document.getElementById('carbonScore').textContent = score.toFixed(1);
    document.getElementById('scoreProgress').style.width = `${score}%`;

    // Total emissions - use conversion system
    const emissionsEl = document.getElementById('totalEmissionsDash');
    emissionsEl.textContent = window.i18n.formatWeight(kpis.total_emissions);

    // Total invoices
    document.getElementById('totalInvoicesDash').textContent = kpis.total_invoices;

    // Month change
    const change = kpis.month_change || 0;
    const changeEl = document.getElementById('monthChange');
    const trendEl = document.getElementById('trendIndicator');

    if (change > 0) {
        changeEl.textContent = `+${change.toFixed(1)}%`;
        changeEl.style.color = '#ef4444';
        trendEl.innerHTML = `📈 ${window.i18n.t('dashboard.kpi.increasing')}`;
        trendEl.className = 'kpi-trend trend-up';
    } else if (change < 0) {
        changeEl.textContent = `${change.toFixed(1)}%`;
        changeEl.style.color = '#10b981';
        trendEl.innerHTML = `📉 ${window.i18n.t('dashboard.kpi.decreasing')}`;
        trendEl.className = 'kpi-trend trend-down';
    } else {
        changeEl.textContent = '0%';
        trendEl.innerHTML = `➖ ${window.i18n.t('dashboard.kpi.stable')}`;
    }
}

function updateCategoryChart(byCategory) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    // Destroy existing chart
    if (categoryChart) {
        categoryChart.destroy();
    }

    const labels = Object.keys(byCategory).map(cat => formatCategoryName(cat));
    const values = Object.values(byCategory);
    const colors = [
        chartColors.primary,
        chartColors.secondary,
        chartColors.accent,
        chartColors.yellow,
        chartColors.pink,
        chartColors.teal
    ];

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${window.i18n.formatWeight(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateTimelineChart(timeline) {
    const ctx = document.getElementById('timelineChart');
    if (!ctx) return;

    // Destroy existing chart
    if (timelineChart) {
        timelineChart.destroy();
    }

    const labels = timeline.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    });

    const values = timeline.map(item => item.emissions);

    timelineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Émissions mensuelles',
                data: values,
                borderColor: chartColors.primary,
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: chartColors.primary,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: window.i18n.getUnitSymbol('weightCO2')
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                ...chartOptions.plugins,
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return window.i18n.formatWeight(context.parsed.y);
                        }
                    }
                }
            }
        }
    });
}

function updateTopCategories(topCategories) {
    const container = document.getElementById('topCategoriesList');
    if (!container) return;

    container.innerHTML = '';

    topCategories.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'top-category-card';

        // Use proper translation for invoices
        const invoiceText = cat.count > 1
            ? window.i18n.t('unit.invoices')
            : window.i18n.t('unit.invoice');

        card.innerHTML = `
            <div class="category-name">${formatCategoryName(cat.category)}</div>
            <div class="category-stats">
                <span class="category-emissions">${window.i18n.formatWeight(cat.emissions)}</span>
                <span>${cat.count} ${invoiceText}</span>
            </div>
        `;

        container.appendChild(card);
    });
}

// === File Upload ===
function setupFileUpload() {
    console.log('🔵 setupFileUpload() called');

    const fileInput = document.getElementById('fileInput');
    const uploadBox = document.getElementById('uploadBox');

    console.log('📋 Elements found:', {
        fileInput: !!fileInput,
        uploadBox: !!uploadBox
    });

    if (!fileInput || !uploadBox) {
        console.error('❌ File input or upload box not found!');
        return;
    }

    // SIMPLE: Just attach onchange to fileInput
    // The <label for="fileInput"> will handle opening the file picker automatically!
    fileInput.onchange = (e) => {
        console.log('📁📁📁 FILE INPUT CHANGE EVENT TRIGGERED! 📁📁📁');
        console.log('📁 Event:', e);
        console.log('📁 Files:', e.target.files);

        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            console.log('✅✅✅ FILE DETECTED:', file.name);
            console.log('📁 File size:', file.size);
            console.log('📁 File type:', file.type);
            handleFileSelect(file);
        } else {
            console.warn('⚠️ NO FILES SELECTED');
        }
    };
    console.log('✅ onchange handler attached to fileInput');

    // Drag and drop handlers (these work fine)
    uploadBox.ondragover = (e) => {
        e.preventDefault();
        uploadBox.classList.add('drag-over');
    };

    uploadBox.ondragleave = () => {
        uploadBox.classList.remove('drag-over');
    };

    uploadBox.ondrop = (e) => {
        e.preventDefault();
        uploadBox.classList.remove('drag-over');
        console.log('📁 FILE DROPPED!');

        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) {
            console.log('✅ Valid CSV file dropped:', file.name);
            handleFileSelect(file);
        } else {
            console.error('❌ Invalid file type');
            alert('Veuillez sélectionner un fichier CSV');
        }
    };

    console.log('✅ Drag & drop handlers attached');
    console.log('✅✅✅ FILE UPLOAD SETUP COMPLETE! ✅✅✅');
    console.log('💡 Click on "Browse Files" button to select a file (uses native HTML label)');
}

function handleFileSelect(file) {
    console.log('handleFileSelect() called with file:', file);

    if (!file) {
        console.warn('handleFileSelect: No file provided');
        return;
    }

    console.log('File name:', file.name, 'File type:', file.type, 'File size:', file.size);

    if (!file.name.endsWith('.csv')) {
        console.error('File is not a CSV:', file.name);
        alert('Veuillez sélectionner un fichier CSV');
        return;
    }

    selectedFile = file;
    console.log('selectedFile set to:', selectedFile);

    const fileNameElement = document.getElementById('fileName');
    const uploadBoxElement = document.getElementById('uploadBox');
    const fileInfoElement = document.getElementById('fileInfo');

    console.log('DOM elements:', {
        fileNameElement,
        uploadBoxElement,
        fileInfoElement
    });

    if (fileNameElement) {
        fileNameElement.textContent = file.name;
        console.log('File name displayed:', file.name);
    } else {
        console.error('fileName element not found!');
    }

    if (uploadBoxElement) {
        uploadBoxElement.style.display = 'none';
        console.log('Upload box hidden');
    } else {
        console.error('uploadBox element not found!');
    }

    if (fileInfoElement) {
        fileInfoElement.style.display = 'block';
        console.log('File info shown - Analyze button should be visible now');
    } else {
        console.error('fileInfo element not found!');
    }

    console.log('File selected successfully:', file.name);
}

function resetUpload() {
    selectedFile = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('uploadBox').style.display = 'flex';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('analysisResults').style.display = 'none';
}

// === File Upload & Analysis ===
async function uploadFile() {
    console.log('uploadFile() called, selectedFile:', selectedFile);

    if (!selectedFile) {
        console.error('No file selected!');
        alert('Please select a file first');
        return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    console.log('Starting upload to:', `${API_BASE_URL}/analyze_invoices`);

    document.getElementById('loadingSpinner').style.display = 'block';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('analysisResults').style.display = 'none';

    try {
        console.log('Sending request...');
        const response = await fetch(`${API_BASE_URL}/analyze_invoices`, {
            method: 'POST',
            body: formData
        });

        console.log('Response received:', response.status, response.ok);

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        enrichedFileBlob = await response.blob();

        // Parse and display stats
        const text = await enrichedFileBlob.text();
        const stats = calculateStats(text);
        displayResults(stats);

        // Reload dashboard and files
        setTimeout(() => {
            loadDashboard();
            loadFiles();
        }, 500);

    } catch (error) {
        console.error('Erreur lors de l\'analyse:', error);
        alert(`Erreur lors de l'analyse: ${error.message}\n\nAssurez-vous que le backend FastAPI est lancé sur ${API_BASE_URL}`);
    } finally {
        document.getElementById('loadingSpinner').style.display = 'none';
    }
}

function calculateStats(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');
    const emissionsIndex = headers.findIndex(h => h.toLowerCase().includes('co2'));

    let totalEmissions = 0;
    let count = 0;

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (emissionsIndex >= 0 && values[emissionsIndex]) {
            const emission = parseFloat(values[emissionsIndex]);
            if (!isNaN(emission)) {
                totalEmissions += emission;
                count++;
            }
        }
    }

    return {
        totalEmissions: totalEmissions.toFixed(2),
        invoicesCount: count,
        avgEmissions: count > 0 ? (totalEmissions / count).toFixed(2) : 0
    };
}

function displayResults(stats) {
    // Convert emissions values using i18n system
    document.getElementById('totalEmissions').textContent = window.i18n.formatWeight(parseFloat(stats.totalEmissions));
    document.getElementById('invoicesCount').textContent = stats.invoicesCount;
    document.getElementById('avgEmissions').textContent = window.i18n.formatWeight(parseFloat(stats.avgEmissions));
    document.getElementById('analysisResults').style.display = 'block';
}

function downloadEnrichedFile() {
    if (!enrichedFileBlob) {
        alert('Aucun fichier à télécharger');
        return;
    }

    const url = window.URL.createObjectURL(enrichedFileBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'factures_enrichies.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// === Forecast ===
// === Enhanced Forecast Functions ===
async function generateForecast() {
    const lang = window.i18n.getCurrentLang();

    // Get parameters
    const periods = document.getElementById('forecastPeriods').value;
    const frequency = document.getElementById('forecastFrequency').value;
    const budgetFile = document.getElementById('budgetFile').files[0];

    // Show loading, hide everything else
    document.getElementById('forecastLoading').style.display = 'block';
    document.getElementById('forecastSummary').style.display = 'none';
    document.getElementById('forecastAlerts').style.display = 'none';
    document.getElementById('forecastChart').style.display = 'none';
    document.getElementById('forecastCategories').style.display = 'none';
    document.getElementById('forecastRecommendations').style.display = 'none';
    document.getElementById('forecastError').style.display = 'none';

    try {
        // Build form data
        const formData = new FormData();
        if (budgetFile) {
            formData.append('budget_file', budgetFile);
        }

        // Build URL with query parameters
        const params = new URLSearchParams({
            periods: periods,
            frequency: frequency,
            lang: lang
        });

        const response = await fetch(`${API_BASE_URL}/forecast?${params}`, {
            method: 'POST',
            body: budgetFile ? formData : undefined
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to generate forecast');
        }

        // Display forecast
        displayForecast(data);

    } catch (error) {
        console.error('Error generating forecast:', error);
        document.getElementById('forecastError').textContent =
            window.i18n.t('forecast.error') + ': ' + error.message;
        document.getElementById('forecastError').style.display = 'block';
    } finally {
        document.getElementById('forecastLoading').style.display = 'none';
    }
}

function displayForecast(data) {
    const forecastData = data.forecast_data;
    const budgetComparison = data.budget_comparison;

    // Display summary
    displayForecastSummary(forecastData, budgetComparison);

    // Display alerts if budget comparison exists
    if (budgetComparison && budgetComparison.alerts) {
        displayForecastAlerts(budgetComparison.alerts);
    }

    // Display chart
    displayForecastChart(forecastData);

    // Display category breakdown
    displayCategoryBreakdown(forecastData, budgetComparison);

    // Display recommendations
    if (budgetComparison && budgetComparison.recommendations) {
        displayForecastRecommendations(budgetComparison.recommendations);
    }
}

function displayForecastSummary(forecastData, budgetComparison) {
    const metrics = forecastData.metrics;

    // Average forecast
    document.getElementById('avgForecast').textContent =
        window.i18n.formatWeight(metrics.avg_forecast);

    // Trend direction
    const trendIcons = {
        'increasing': '📈',
        'decreasing': '📉',
        'stable': '➡️'
    };
    const trendIcon = trendIcons[metrics.trend_direction] || '➡️';
    document.getElementById('trendDirection').textContent =
        trendIcon + ' ' + window.i18n.t(`forecast.trend.${metrics.trend_direction}`);

    // Budget status
    if (budgetComparison && budgetComparison.summary) {
        const summary = budgetComparison.summary;
        const statusIcons = {
            'on_track': '✅',
            'warning': '⚠️',
            'medium': '⚠️',
            'high': '🔴',
            'critical': '🚨'
        };
        const statusIcon = statusIcons[summary.overall_status] || '❓';
        document.getElementById('budgetStatus').textContent =
            statusIcon + ' ' + window.i18n.t(`forecast.status.${summary.overall_status}`);

        // Alert count
        document.getElementById('alertCount').textContent = summary.total_alerts || 0;
    } else {
        document.getElementById('budgetStatus').textContent = window.i18n.t('forecast.status.no_budget');
        document.getElementById('alertCount').textContent = '0';
    }

    document.getElementById('forecastSummary').style.display = 'block';
}

function displayForecastAlerts(alerts) {
    const alertsContainer = document.getElementById('forecastAlerts');
    alertsContainer.innerHTML = '';

    if (!alerts || alerts.length === 0) {
        return;
    }

    const lang = window.i18n.getCurrentLang();

    alerts.forEach(alert => {
        const alertCard = document.createElement('div');
        alertCard.className = `alert-card alert-${alert.severity}`;

        const message = alert.message[lang] || alert.message.fr;

        alertCard.innerHTML = `
            <div class="alert-header">
                <span class="alert-severity">${getSeverityIcon(alert.severity)}</span>
                <span class="alert-category">${alert.category}</span>
            </div>
            <div class="alert-message">${message}</div>
            <div class="alert-details">
                <span>${window.i18n.t('forecast.alert.forecast')}: ${window.i18n.formatWeight(alert.forecast_avg)}</span>
                <span>${window.i18n.t('forecast.alert.budget')}: ${window.i18n.formatWeight(alert.budget)}</span>
                <span>${window.i18n.t('forecast.alert.difference')}: ${alert.difference_pct > 0 ? '+' : ''}${alert.difference_pct}%</span>
            </div>
        `;

        alertsContainer.appendChild(alertCard);
    });

    alertsContainer.style.display = 'block';
}

function getSeverityIcon(severity) {
    const icons = {
        'critical': '🚨',
        'high': '🔴',
        'medium': '⚠️',
        'warning': 'ℹ️',
        'on_track': '✅'
    };
    return icons[severity] || 'ℹ️';
}

function displayForecastChart(forecastData) {
    const ctx = document.getElementById('forecastCanvas').getContext('2d');

    if (forecastChart) {
        forecastChart.destroy();
    }

    const overallForecast = forecastData.forecasts.overall;
    if (!overallForecast) return;

    // Prepare data
    const historicalDates = overallForecast.historical.dates || [];
    const historicalValues = overallForecast.historical.values || [];
    const forecastDates = overallForecast.forecast.dates || [];
    const forecastValues = overallForecast.forecast.values || [];
    const lowerBounds = overallForecast.forecast.lower_bound || [];
    const upperBounds = overallForecast.forecast.upper_bound || [];

    // Combine labels
    const allLabels = [...historicalDates, ...forecastDates].map(date => {
        const d = new Date(date);
        return d.toLocaleDateString(window.i18n.getCurrentLang() === 'fr' ? 'fr-FR' : 'en-US',
            { month: 'short', year: 'numeric' });
    });

    // Prepare datasets with nulls for spacing
    const historicalData = [...historicalValues, ...Array(forecastDates.length).fill(null)];
    const forecastChartData = [...Array(historicalDates.length).fill(null), ...forecastValues];
    const lowerData = [...Array(historicalDates.length).fill(null), ...lowerBounds];
    const upperData = [...Array(historicalDates.length).fill(null), ...upperBounds];

    forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: allLabels,
            datasets: [
                {
                    label: window.i18n.t('forecast.chart.historical'),
                    data: historicalData,
                    borderColor: chartColors.secondary,
                    backgroundColor: 'rgba(147, 197, 253, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: chartColors.secondary
                },
                {
                    label: window.i18n.t('forecast.chart.forecast'),
                    data: forecastChartData,
                    borderColor: chartColors.primary,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 6,
                    pointBackgroundColor: chartColors.primary,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                {
                    label: window.i18n.t('forecast.chart.lower'),
                    data: lowerData,
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0
                },
                {
                    label: window.i18n.t('forecast.chart.upper'),
                    data: upperData,
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: window.i18n.t('forecast.chart.title'),
                    font: { size: 18, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            if (context.parsed.y === null) return null;
                            return `${context.dataset.label}: ${window.i18n.formatWeight(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: window.i18n.getUnitSymbol('weightCO2')
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: window.i18n.t('forecast.chart.period')
                    }
                }
            }
        }
    });

    document.getElementById('forecastChart').style.display = 'block';
}

function displayCategoryBreakdown(forecastData, budgetComparison) {
    const categoriesGrid = document.getElementById('categoriesGrid');
    categoriesGrid.innerHTML = '';

    const forecasts = forecastData.forecasts;

    Object.keys(forecasts).forEach(category => {
        if (category === 'overall') return;

        const forecast = forecasts[category];
        const forecastValues = forecast.forecast?.values || [];
        const avgForecast = forecastValues.reduce((a, b) => a + b, 0) / forecastValues.length;

        // Get budget comparison if available
        let comparison = null;
        if (budgetComparison && budgetComparison.by_category) {
            comparison = budgetComparison.by_category[category];
        }

        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';

        categoryCard.innerHTML = `
            <div class="category-header">
                <span class="category-name">${window.i18n.t(`categories.${category}`)}</span>
                ${comparison ? `<span class="category-status status-${comparison.status}">${getSeverityIcon(comparison.status)}</span>` : ''}
            </div>
            <div class="category-value">${window.i18n.formatWeight(avgForecast)}</div>
            <div class="category-trend">
                ${forecast.trend ? `${getTrendIcon(forecast.trend.direction)} ${window.i18n.t(`forecast.trend.${forecast.trend.direction}`)}` : ''}
            </div>
            ${comparison ? `
                <div class="category-comparison">
                    <div class="comparison-row">
                        <span>${window.i18n.t('forecast.budget')}:</span>
                        <span>${window.i18n.formatWeight(comparison.budget)}</span>
                    </div>
                    <div class="comparison-row">
                        <span>${window.i18n.t('forecast.difference')}:</span>
                        <span class="${comparison.difference > 0 ? 'text-danger' : 'text-success'}">
                            ${comparison.difference > 0 ? '+' : ''}${window.i18n.formatWeight(comparison.difference)}
                            (${comparison.difference_pct > 0 ? '+' : ''}${comparison.difference_pct}%)
                        </span>
                    </div>
                </div>
            ` : ''}
        `;

        categoriesGrid.appendChild(categoryCard);
    });

    document.getElementById('forecastCategories').style.display = 'block';
}

function getTrendIcon(direction) {
    const icons = {
        'increasing': '📈',
        'decreasing': '📉',
        'stable': '➡️'
    };
    return icons[direction] || '➡️';
}

function displayForecastRecommendations(recommendations) {
    const recommendationsList = document.getElementById('recommendationsList');
    recommendationsList.innerHTML = '';

    if (!recommendations || recommendations.length === 0) {
        return;
    }

    recommendations.forEach(rec => {
        const recCard = document.createElement('div');
        recCard.className = 'recommendation-card';

        const priorityClass = rec.priority === 'haute' || rec.priority === 'high' ? 'priority-high' : 'priority-medium';

        recCard.innerHTML = `
            <div class="rec-header">
                <span class="rec-title">${rec.title}</span>
                <span class="rec-priority ${priorityClass}">${rec.priority}</span>
            </div>
            <div class="rec-description">${rec.description}</div>
            ${rec.actions && rec.actions.length > 0 ? `
                <div class="rec-actions">
                    <ul>
                        ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;

        recommendationsList.appendChild(recCard);
    });

    document.getElementById('forecastRecommendations').style.display = 'block';
}

// === Recommendations ===
async function getRecommendations() {
    document.getElementById('recommendationsLoading').style.display = 'block';
    document.getElementById('recommendationsList').style.display = 'none';
    document.getElementById('recommendationsSummary').style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/recommendations`);
        const data = await response.json();

        if (data.error) {
            alert(data.error);
            return;
        }

        // Show summary - use conversion system
        document.getElementById('potentialReduction').textContent =
            window.i18n.formatWeight(data.total_potential_reduction);
        document.getElementById('recommendationsSummary').style.display = 'block';

        // Display recommendations
        displayRecommendations(data.recommendations);

    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du chargement des recommandations');
    } finally {
        document.getElementById('recommendationsLoading').style.display = 'none';
    }
}

function displayRecommendations(recommendations) {
    const container = document.getElementById('recommendationsList');
    container.innerHTML = '';

    const impactText = {
        'high': 'Impact élevé',
        'medium': 'Impact moyen',
        'low': 'Impact faible'
    };

    recommendations.forEach(rec => {
        const card = document.createElement('div');
        card.className = 'recommendation-card';

        card.innerHTML = `
            <h3>${rec.icon} ${rec.title}</h3>
            <p>${rec.description}</p>
            <div>
                <span class="recommendation-impact impact-${rec.impact}">${impactText[rec.impact]}</span>
                <span class="reduction-potential">💚 -${window.i18n.formatWeight(rec.potential_reduction)} possible</span>
            </div>
        `;

        container.appendChild(card);
    });

    container.style.display = 'block';
}

// === Utility Functions ===
function formatNumber(num) {
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

function formatCategoryName(category) {
    const names = {
        'voyages_aeriens': 'Voyages aériens',
        'transport_routier': 'Transport routier',
        'energie': 'Énergie',
        'materiaux': 'Matériaux',
        'services': 'Services',
        'equipements': 'Équipements',
        'autres': 'Autres'
    };
    return names[category] || category;
}

// === Files Management ===
async function loadFiles() {
    document.getElementById('filesLoading').style.display = 'block';
    document.getElementById('filesEmpty').style.display = 'none';
    document.getElementById('filesList').style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/files`);
        const data = await response.json();

        if (!data.files || data.files.length === 0) {
            document.getElementById('filesEmpty').style.display = 'block';
            document.getElementById('totalFilesCount').textContent = '0';
            document.getElementById('totalFilesEmissions').textContent = window.i18n.formatWeight(0);
            document.getElementById('totalFilesInvoices').textContent = '0';
            return;
        }

        // Calculate totals
        const totalEmissions = data.files.reduce((sum, f) => sum + f.total_emissions, 0);
        const totalInvoices = data.files.reduce((sum, f) => sum + f.invoice_count, 0);

        // Update stats - use conversion system for emissions
        document.getElementById('totalFilesCount').textContent = data.files.length;
        document.getElementById('totalFilesEmissions').textContent = window.i18n.formatWeight(totalEmissions);
        document.getElementById('totalFilesInvoices').textContent = totalInvoices;

        // Display files
        displayFilesList(data.files);

    } catch (error) {
        console.error('Error loading files:', error);
        alert('Erreur lors du chargement des fichiers');
    } finally {
        document.getElementById('filesLoading').style.display = 'none';
    }
}

function displayFilesList(files) {
    const container = document.getElementById('filesList');
    container.innerHTML = '';

    // Sort by upload date (newest first)
    files.sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date));

    files.forEach(file => {
        const card = document.createElement('div');
        card.className = 'file-card';
        card.setAttribute('data-file-id', file.id);

        const uploadDate = new Date(file.upload_date);
        const formattedDate = uploadDate.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const sizeKB = (file.size_bytes / 1024).toFixed(1);

        card.innerHTML = `
            <div class="file-card-header">
                <div class="file-card-title">
                    <span class="file-icon">📄</span>
                    <span>${file.original_filename}</span>
                </div>
                <div class="file-actions">
                    <button class="file-action-btn" onclick="downloadFileById('${file.id}')" title="Télécharger">
                        💾
                    </button>
                    <button class="file-action-btn delete" onclick="deleteFile('${file.id}')" title="Supprimer">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="file-card-meta">
                <div class="file-meta-row">
                    <span class="file-meta-label">Émissions totales</span>
                    <span class="file-meta-value emissions">${window.i18n.formatWeight(file.total_emissions)}</span>
                </div>
                <div class="file-meta-row">
                    <span class="file-meta-label">Factures analysées</span>
                    <span class="file-meta-value">${file.invoice_count}</span>
                </div>
                <div class="file-meta-row">
                    <span class="file-meta-label">Taille</span>
                    <span class="file-meta-value">${sizeKB} KB</span>
                </div>
            </div>
            <div class="file-card-footer">
                Uploadé le ${formattedDate}
            </div>
        `;

        container.appendChild(card);
    });

    container.style.display = 'grid';
}

async function deleteFile(fileId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ? Cette action est irréversible.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la suppression');
        }

        // Remove the card from DOM with animation
        const card = document.querySelector(`[data-file-id="${fileId}"]`);
        if (card) {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            setTimeout(() => {
                card.remove();
                // Reload files to update stats
                loadFiles();
                // Reload dashboard to update data
                loadDashboard();
            }, 300);
        }

    } catch (error) {
        console.error('Error deleting file:', error);
        alert('Erreur lors de la suppression du fichier');
    }
}

async function downloadFileById(fileId) {
    try {
        const url = `${API_BASE_URL}/files/${fileId}/download`;
        window.open(url, '_blank');
    } catch (error) {
        console.error('Error downloading file:', error);
        alert('Erreur lors du téléchargement');
    }
}

// === QuickBooks Integration ===

/**
 * Check QuickBooks connection status on page load
 * Updates UI to show connected or not connected state
 */
async function checkQuickBooksStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/quickbooks/status`);
        const data = await response.json();

        if (data.connected) {
            // Show connected state
            document.getElementById('qbStatusCard').style.display = 'block';
            document.getElementById('qbCompanyName').textContent = data.company.name;
            document.getElementById('qbConnectSection').style.display = 'none';
            document.getElementById('qbSyncSection').style.display = 'block';

            // Set default date range (last 90 days)
            const today = new Date();
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(today.getMonth() - 3);

            const endDateInput = document.getElementById('qbEndDate');
            const startDateInput = document.getElementById('qbStartDate');

            if (endDateInput) endDateInput.valueAsDate = today;
            if (startDateInput) startDateInput.valueAsDate = threeMonthsAgo;
        } else {
            // Show not connected state
            document.getElementById('qbStatusCard').style.display = 'none';
            document.getElementById('qbConnectSection').style.display = 'block';
            document.getElementById('qbSyncSection').style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking QuickBooks status:', error);
        // Show not connected state on error
        const statusCard = document.getElementById('qbStatusCard');
        const connectSection = document.getElementById('qbConnectSection');
        const syncSection = document.getElementById('qbSyncSection');

        if (statusCard) statusCard.style.display = 'none';
        if (connectSection) connectSection.style.display = 'block';
        if (syncSection) syncSection.style.display = 'none';
    }
}

/**
 * Initiate QuickBooks OAuth connection
 * Opens authorization URL in a new popup window
 */
async function connectQuickBooks() {
    try {
        // Show loading state
        const loadingDiv = document.getElementById('qbLoading');
        const loadingText = document.getElementById('qbLoadingText');
        if (loadingDiv) loadingDiv.style.display = 'block';
        if (loadingText) loadingText.textContent = 'Connexion à QuickBooks...';

        const response = await fetch(`${API_BASE_URL}/quickbooks/connect`);
        const data = await response.json();

        if (loadingDiv) loadingDiv.style.display = 'none';

        if (data.auth_url) {
            // Open QuickBooks authorization in popup window
            const width = 800;
            const height = 600;
            const left = (screen.width - width) / 2;
            const top = (screen.height - height) / 2;

            const popup = window.open(
                data.auth_url,
                'QuickBooks Authorization',
                `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
            );

            // Check if popup was blocked
            if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                alert('Le popup a été bloqué. Veuillez autoriser les popups pour ce site et réessayer.');
                return;
            }

            // Poll for connection status after authorization
            const checkInterval = setInterval(async () => {
                if (popup.closed) {
                    clearInterval(checkInterval);
                    // Check status after popup is closed
                    setTimeout(() => checkQuickBooksStatus(), 1000);
                }
            }, 1000);
        } else {
            alert('Erreur lors de la connexion à QuickBooks');
        }
    } catch (error) {
        console.error('Error connecting to QuickBooks:', error);
        alert('Erreur lors de la connexion à QuickBooks. Vérifiez que le backend est démarré.');
        const loadingDiv = document.getElementById('qbLoading');
        if (loadingDiv) loadingDiv.style.display = 'none';
    }
}

/**
 * Synchronize invoices from QuickBooks
 * Fetches invoices for the selected date range and analyzes them
 */
async function syncQuickBooksInvoices() {
    try {
        // Get date range from inputs
        const startDate = document.getElementById('qbStartDate').value;
        const endDate = document.getElementById('qbEndDate').value;

        // Validate dates
        if (!startDate || !endDate) {
            alert('Veuillez sélectionner une plage de dates');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            alert('La date de début doit être antérieure à la date de fin');
            return;
        }

        // Show loading state
        document.getElementById('qbLoading').style.display = 'block';
        document.getElementById('qbLoadingText').textContent = 'Synchronisation des factures...';
        document.getElementById('qbSyncSection').style.display = 'none';

        // Build API URL with parameters
        const url = new URL(`${API_BASE_URL}/quickbooks/sync`);
        url.searchParams.append('start_date', startDate);
        url.searchParams.append('end_date', endDate);
        url.searchParams.append('auto_analyze', 'true');

        const response = await fetch(url, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();

        // Hide loading state
        document.getElementById('qbLoading').style.display = 'none';
        document.getElementById('qbSyncSection').style.display = 'block';

        if (data.success) {
            // Show success message with details
            const invoiceCount = data.sync_info.invoice_count;
            const totalEmissions = window.i18n.formatWeight(data.analysis.total_emissions_kg);

            alert(
                `✅ Synchronisation réussie !\n\n` +
                `Factures synchronisées: ${invoiceCount}\n` +
                `Émissions totales: ${totalEmissions}\n\n` +
                `Les données ont été ajoutées à votre dashboard.`
            );

            // Reload dashboard and files to show new data
            loadDashboard();
            loadFiles();

            // Navigate to dashboard to see results
            setTimeout(() => {
                navigateTo('dashboard');
            }, 500);
        } else {
            alert('Erreur lors de la synchronisation: ' + (data.message || 'Erreur inconnue'));
        }
    } catch (error) {
        console.error('Error syncing QuickBooks invoices:', error);
        alert(`Erreur lors de la synchronisation: ${error.message}`);

        // Hide loading and show sync section again
        document.getElementById('qbLoading').style.display = 'none';
        document.getElementById('qbSyncSection').style.display = 'block';
    }
}

/**
 * Disconnect from QuickBooks
 * Removes stored tokens and updates UI to show not connected state
 */
async function disconnectQuickBooks() {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter QuickBooks ? Vous devrez vous reconnecter pour synchroniser de nouvelles factures.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/quickbooks/disconnect`);
        const data = await response.json();

        if (data.success) {
            alert('✅ Déconnexion réussie de QuickBooks');
            // Update UI to not connected state
            checkQuickBooksStatus();
        } else {
            alert('Erreur lors de la déconnexion');
        }
    } catch (error) {
        console.error('Error disconnecting from QuickBooks:', error);
        alert('Erreur lors de la déconnexion');
    }
}

// === Dashboard Filters & Export ===
let dashboardRawData = null; // Store full dashboard data
let dashboardFullData = null; // Store original unfiltered data
let supplierChart = null; // Global supplier chart instance
let comparisonChart = null; // Global comparison chart instance

/**
 * Apply dashboard filters
 */
function applyDashboardFilters() {
    console.log('🔵 applyDashboardFilters called');
    console.log('🔵 dashboardFullData exists?', !!dashboardFullData);
    console.log('🔵 dashboardFullData:', dashboardFullData);

    if (!dashboardFullData) {
        console.error('❌ dashboardFullData is null or undefined');
        console.log('⚠️ This might be the first load, calling loadDashboard...');
        loadDashboard();
        return;
    }

    if (!dashboardFullData.invoices) {
        console.error('❌ dashboardFullData.invoices is missing');
        console.log('❌ dashboardFullData structure:', Object.keys(dashboardFullData));
        alert('No invoices data available. Please analyze invoices first.');
        return;
    }

    const periodFilter = document.getElementById('dashboardPeriodFilter').value;
    const typeFilter = document.getElementById('dashboardTypeFilter').value;

    console.log('Filters:', { periodFilter, typeFilter });
    console.log('Total invoices before filter:', dashboardFullData.invoices.length);

    // Filter invoices
    let filteredInvoices = dashboardFullData.invoices;

    // Period filter
    if (periodFilter === 'custom') {
        // Custom date range
        const startDate = document.getElementById('dashboardStartDate').value;
        const endDate = document.getElementById('dashboardEndDate').value;

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            filteredInvoices = filteredInvoices.filter(inv => {
                const invDate = new Date(inv.date);
                return invDate >= start && invDate <= end;
            });
        }
    } else if (periodFilter !== 'all') {
        const now = new Date();
        const filterDate = new Date();

        switch (periodFilter) {
            case 'month':
                filterDate.setMonth(now.getMonth() - 1);
                break;
            case 'quarter':
                filterDate.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                filterDate.setFullYear(now.getFullYear() - 1);
                break;
        }

        filteredInvoices = filteredInvoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= filterDate;
        });
    }

    // Type filter
    if (typeFilter !== 'all') {
        filteredInvoices = filteredInvoices.filter(inv => inv.category === typeFilter);
    }

    console.log('Total invoices after filter:', filteredInvoices.length);

    // Recalculate everything from filtered data
    recalculateDashboard(filteredInvoices);

    console.log('Dashboard recalculated with filtered data');
}

/**
 * Reset dashboard filters
 */
function resetDashboardFilters() {
    console.log('🔵 Resetting dashboard filters');

    // Reset hidden selects
    document.getElementById('dashboardPeriodFilter').value = 'year';
    document.getElementById('dashboardTypeFilter').value = 'all';

    // Clear custom date inputs
    document.getElementById('dashboardStartDate').value = '';
    document.getElementById('dashboardEndDate').value = '';

    // Reset period pills
    document.querySelectorAll('[data-period]').forEach(pill => {
        pill.classList.remove('active');
        if (pill.getAttribute('data-period') === 'year') {
            pill.classList.add('active');
        }
    });

    // Reset category pills
    document.querySelectorAll('[data-category]').forEach(pill => {
        pill.classList.remove('active');
        if (pill.getAttribute('data-category') === 'all') {
            pill.classList.add('active');
        }
    });

    console.log('✅ Filters reset to default (This Year, All Categories)');

    // Apply year filter (default)
    applyDashboardFilters();
}

/**
 * Initialize dashboard filter event listeners
 */
function initDashboardFilters() {
    // No longer needed - pills handle their own clicks
    // Custom date range is now always visible
    console.log('✅ Dashboard filters initialized (using pill buttons + always-visible calendar)');
}

/**
 * Recalculate dashboard from filtered invoices
 */
function recalculateDashboard(invoices) {
    console.log('recalculateDashboard called with', invoices.length, 'invoices');

    // Calculate KPIs
    const totalEmissions = invoices.reduce((sum, inv) => sum + inv.emissions, 0);
    console.log('Total emissions:', totalEmissions);
    const totalInvoices = invoices.length;
    const avgEmissions = totalInvoices > 0 ? totalEmissions / totalInvoices : 0;
    const carbonScore = Math.max(0, Math.min(100, 100 - (avgEmissions / 10)));

    const kpis = {
        total_emissions: totalEmissions,
        total_invoices: totalInvoices,
        avg_emissions: avgEmissions,
        carbon_score: carbonScore,
        month_change: 0 // Will calculate if needed
    };

    updateKPIs(kpis);

    // Group by category
    const byCategory = {};
    invoices.forEach(inv => {
        const cat = inv.category || 'autres';
        byCategory[cat] = (byCategory[cat] || 0) + inv.emissions;
    });

    updateCategoryChart(byCategory);

    // Group by month for timeline
    const byMonth = {};
    invoices.forEach(inv => {
        const date = new Date(inv.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
        byMonth[monthKey] = (byMonth[monthKey] || 0) + inv.emissions;
    });

    const timeline = Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, emissions]) => ({ date, emissions }));

    updateTimelineChart(timeline);

    // Update top categories
    const topCategories = Object.entries(byCategory)
        .map(([category, emissions]) => ({
            category,
            emissions,
            count: invoices.filter(inv => inv.category === category).length
        }))
        .sort((a, b) => b.emissions - a.emissions)
        .slice(0, 5);

    updateTopCategories(topCategories);

    // Update supplier chart
    const bySupplier = {};
    invoices.forEach(inv => {
        const supplier = inv.client_id || 'Unknown';
        bySupplier[supplier] = (bySupplier[supplier] || 0) + inv.emissions;
    });

    const topSuppliers = Object.entries(bySupplier)
        .map(([supplier, emissions]) => ({
            supplier,
            emissions,
            count: invoices.filter(inv => inv.client_id === supplier).length
        }))
        .sort((a, b) => b.emissions - a.emissions)
        .slice(0, 10);

    updateSupplierChartFromData(topSuppliers);

    // Update comparison chart (use full dataset for proper period comparison)
    updateComparisonChart(dashboardFullData?.invoices || invoices);

    // Store filtered data for export
    dashboardRawData = {
        kpis,
        by_category: byCategory,
        timeline,
        top_categories: topCategories,
        top_suppliers: topSuppliers,
        invoices
    };
}

/**
 * Update supplier chart with real supplier data
 */
function updateSupplierChartFromData(topSuppliers) {
    const ctx = document.getElementById('supplierChart');
    if (!ctx) return;

    const labels = topSuppliers.map(s => s.supplier);
    const values = topSuppliers.map(s => s.emissions);

    // Destroy existing chart
    if (supplierChart) {
        supplierChart.destroy();
    }

    // Create new chart
    supplierChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: window.i18n.t('charts.supplier.title'),
                data: values,
                backgroundColor: chartColors.secondary,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            ...chartOptions,
            indexAxis: 'y',
            plugins: {
                ...chartOptions.plugins,
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => window.i18n.formatWeight(context.parsed.x)
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: window.i18n.getUnitSymbol('weightCO2')
                    },
                    ticks: {
                        callback: (value) => window.i18n.formatNumber(
                            window.i18n.convertWeight(value), 0
                        )
                    }
                }
            }
        }
    });
}

/**
 * Update comparison chart (current vs previous period)
 */
function updateComparisonChart(invoices) {
    const ctx = document.getElementById('comparisonChart');
    if (!ctx) return;

    // Determine period length based on current filter
    const periodFilter = document.getElementById('dashboardPeriodFilter')?.value || 'year';

    let periodDays = 365; // Default to year
    switch (periodFilter) {
        case 'month':
            periodDays = 30;
            break;
        case 'quarter':
            periodDays = 90;
            break;
        case 'year':
            periodDays = 365;
            break;
        case 'custom':
            // Calculate days from date range
            const startDate = document.getElementById('dashboardStartDate')?.value;
            const endDate = document.getElementById('dashboardEndDate')?.value;
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                periodDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            }
            break;
    }

    // Split invoices into current and previous periods
    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(now.getDate() - periodDays);
    const previousPeriodStart = new Date(periodStart);
    previousPeriodStart.setDate(periodStart.getDate() - periodDays);

    const currentPeriodInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate >= periodStart && invDate <= now;
    });

    const previousPeriodInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate >= previousPeriodStart && invDate < periodStart;
    });

    // Calculate totals
    const currentTotal = currentPeriodInvoices.reduce((sum, inv) => sum + (inv.emissions || 0), 0);
    const previousTotal = previousPeriodInvoices.reduce((sum, inv) => sum + (inv.emissions || 0), 0);

    // Calculate percentage change
    const percentChange = previousTotal > 0
        ? ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1)
        : 0;

    // Destroy existing chart
    if (comparisonChart) {
        comparisonChart.destroy();
    }

    // Create comparison chart
    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [
                window.i18n.t('dashboard.chart.comparison.previous') || 'Previous Period',
                window.i18n.t('dashboard.chart.comparison.current') || 'Current Period'
            ],
            datasets: [{
                label: window.i18n.t('table.header.emissions'),
                data: [previousTotal, currentTotal],
                backgroundColor: [chartColors.secondary, chartColors.primary],
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => window.i18n.formatWeight(context.parsed.y)
                    }
                },
                title: {
                    display: true,
                    text: `${percentChange > 0 ? '+' : ''}${percentChange}% ${window.i18n.t('dashboard.chart.comparison.change') || 'change'}`,
                    color: percentChange > 0 ? chartColors.red : chartColors.primary,
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: window.i18n.getUnitSymbol('weightCO2')
                    },
                    ticks: {
                        callback: (value) => window.i18n.formatNumber(
                            window.i18n.convertWeight(value), 0
                        )
                    }
                }
            }
        }
    });
}

// === Export Functions ===

/**
 * Export dashboard to PDF
 */
async function exportDashboardToPDF() {
    try {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            alert('PDF library not loaded. Please refresh the page.');
            return;
        }

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        let yPosition = 20;

        // Header
        pdf.setFontSize(24);
        pdf.setTextColor(16, 185, 129);
        pdf.text('🌱 Green App', 15, yPosition);
        yPosition += 10;

        pdf.setFontSize(12);
        pdf.setTextColor(100, 100, 100);
        pdf.text(window.i18n.t('dashboard.subtitle'), 15, yPosition);
        yPosition += 5;

        pdf.setFontSize(10);
        const today = new Date().toLocaleDateString(
            window.i18n.getCurrentLang() === 'fr' ? 'fr-FR' : 'en-US',
            { year: 'numeric', month: 'long', day: 'numeric' }
        );
        pdf.text(`Export: ${today}`, 15, yPosition);
        yPosition += 15;

        // KPIs
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Key Metrics', 15, yPosition);
        yPosition += 10;

        pdf.setFontSize(11);
        const totalEmissions = document.getElementById('totalEmissionsDash').textContent;
        const totalInvoices = document.getElementById('totalInvoicesDash').textContent;
        const carbonScore = document.getElementById('carbonScore').textContent;

        pdf.text(`${window.i18n.t('dashboard.kpi.totalEmissions')}: ${totalEmissions}`, 15, yPosition);
        yPosition += 7;
        pdf.text(`${window.i18n.t('dashboard.kpi.invoicesAnalyzed')}: ${totalInvoices}`, 15, yPosition);
        yPosition += 7;
        pdf.text(`${window.i18n.t('dashboard.kpi.carbonScore')}: ${carbonScore}`, 15, yPosition);
        yPosition += 15;

        // Add charts as images
        const charts = [
            { id: 'timelineChart', title: window.i18n.t('dashboard.chart.timeline.title') },
            { id: 'categoryChart', title: window.i18n.t('dashboard.chart.category.title') },
            { id: 'supplierChart', title: window.i18n.t('charts.supplier.title') }
        ];

        for (const chart of charts) {
            const canvas = document.getElementById(chart.id);
            if (!canvas) continue;

            if (yPosition > 220) {
                pdf.addPage();
                yPosition = 20;
            }

            pdf.setFontSize(14);
            pdf.text(chart.title, 15, yPosition);
            yPosition += 5;

            try {
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = pageWidth - 30;
                const imgHeight = 70;
                pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight);
                yPosition += imgHeight + 15;
            } catch (error) {
                console.error('Error adding chart:', error);
            }
        }

        // Footer
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(window.i18n.t('footer.copyright'), pageWidth / 2, pdf.internal.pageSize.getHeight() - 10, { align: 'center' });

        // Save
        const filename = `GreenApp_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(filename);

        showNotification('✅ PDF exported successfully!', 'success');
    } catch (error) {
        console.error('PDF export error:', error);
        showNotification('❌ Error exporting PDF', 'error');
    }
}

/**
 * Export dashboard to Excel (with full filtered invoice data)
 */
function exportDashboardToExcel() {
    try {
        if (!window.XLSX) {
            alert('Excel library not loaded. Please refresh the page.');
            return;
        }

        if (!dashboardRawData || !dashboardRawData.invoices) {
            alert('No data to export. Please analyze some invoices first.');
            return;
        }

        // Create workbook
        const wb = XLSX.utils.book_new();

        // 1. Add All Invoices Sheet (filtered data)
        const invoicesData = dashboardRawData.invoices.map(invoice => ({
            [window.i18n.t('table.header.date')]: invoice.date,
            [window.i18n.t('table.header.supplier')]: invoice.client_id || invoice.supplier || 'Unknown',
            ['Invoice ID']: invoice.id || '',
            [window.i18n.t('table.header.category')]: window.i18n.t(`category.${invoice.category || 'autres'}`),
            ['Sector']: window.i18n.t(`filters.sector.${invoice.sector || 'other'}`),
            ['Label']: invoice.label || invoice.libelle || '',
            [window.i18n.t('table.header.amount')]: invoice.amount || invoice.total_amount || 0,
            [`${window.i18n.t('table.header.emissions')} (${window.i18n.getUnitSymbol('weight')})`]: window.i18n.convertWeight(invoice.emissions || 0)
        }));

        if (invoicesData.length > 0) {
            const wsInvoices = XLSX.utils.json_to_sheet(invoicesData);
            wsInvoices['!cols'] = [
                { wch: 12 },  // Date
                { wch: 25 },  // Supplier
                { wch: 15 },  // Invoice ID
                { wch: 20 },  // Category
                { wch: 18 },  // Sector
                { wch: 35 },  // Label
                { wch: 12 },  // Amount
                { wch: 15 }   // Emissions
            ];
            XLSX.utils.book_append_sheet(wb, wsInvoices, 'All Invoices');
        }

        // 2. Add Summary Sheet
        const kpis = dashboardRawData.kpis || {};
        const summary = [
            { Metric: window.i18n.t('dashboard.kpi.totalEmissions'), Value: window.i18n.formatWeight(kpis.total_emissions || 0) },
            { Metric: window.i18n.t('dashboard.kpi.invoicesAnalyzed'), Value: kpis.total_invoices || 0 },
            { Metric: window.i18n.t('dashboard.kpi.carbonScore'), Value: (kpis.carbon_score || 0).toFixed(1) },
            { Metric: 'Average Emissions per Invoice', Value: window.i18n.formatWeight(kpis.avg_emissions || 0) }
        ];

        const wsSummary = XLSX.utils.json_to_sheet(summary);
        wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

        // 3. Add By Category Sheet
        const categoryData = Object.entries(dashboardRawData.by_category || {}).map(([category, emissions]) => ({
            [window.i18n.t('table.header.category')]: window.i18n.t(`category.${category}`),
            [`${window.i18n.t('table.header.emissions')} (${window.i18n.getUnitSymbol('weight')})`]: window.i18n.convertWeight(emissions),
            'Count': dashboardRawData.invoices.filter(inv => inv.category === category).length
        }));

        if (categoryData.length > 0) {
            const wsCategory = XLSX.utils.json_to_sheet(categoryData);
            wsCategory['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 10 }];
            XLSX.utils.book_append_sheet(wb, wsCategory, 'By Category');
        }

        // 4. Add By Sector Sheet
        const bySector = {};
        dashboardRawData.invoices.forEach(inv => {
            const sector = inv.sector || 'other';
            bySector[sector] = (bySector[sector] || 0) + (inv.emissions || 0);
        });

        const sectorData = Object.entries(bySector).map(([sector, emissions]) => ({
            ['Sector']: window.i18n.t(`filters.sector.${sector}`),
            [`${window.i18n.t('table.header.emissions')} (${window.i18n.getUnitSymbol('weight')})`]: window.i18n.convertWeight(emissions),
            'Count': dashboardRawData.invoices.filter(inv => inv.sector === sector).length
        }));

        if (sectorData.length > 0) {
            const wsSector = XLSX.utils.json_to_sheet(sectorData);
            wsSector['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 10 }];
            XLSX.utils.book_append_sheet(wb, wsSector, 'By Sector');
        }

        // 5. Add Top Suppliers Sheet
        if (dashboardRawData.top_suppliers && dashboardRawData.top_suppliers.length > 0) {
            const supplierData = dashboardRawData.top_suppliers.map(s => ({
                ['Supplier']: s.supplier,
                [`${window.i18n.t('table.header.emissions')} (${window.i18n.getUnitSymbol('weight')})`]: window.i18n.convertWeight(s.emissions),
                'Invoice Count': s.count
            }));

            const wsSupplier = XLSX.utils.json_to_sheet(supplierData);
            wsSupplier['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }];
            XLSX.utils.book_append_sheet(wb, wsSupplier, 'Top Suppliers');
        }

        // Save
        const filename = `GreenApp_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);

        showNotification('✅ Excel exported successfully!', 'success');
    } catch (error) {
        console.error('Excel export error:', error);
        showNotification('❌ Error exporting Excel', 'error');
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
        style.remove();
    }, 3000);
}

// loadDashboard is now defined at the top with full filtering support - no override needed

// Debug function - you can call this in browser console
function debugFilters() {
    console.log('=== DEBUG FILTERS ===');
    console.log('dashboardFullData exists:', !!dashboardFullData);
    console.log('dashboardFullData.invoices exists:', !!(dashboardFullData && dashboardFullData.invoices));
    console.log('Number of invoices:', dashboardFullData?.invoices?.length || 0);
    console.log('Period filter value:', document.getElementById('dashboardPeriodFilter')?.value);
    console.log('Type filter value:', document.getElementById('dashboardTypeFilter')?.value);
    console.log('Apply button exists:', !!document.querySelector('[onclick="applyDashboardFilters()"]'));

    if (dashboardFullData?.invoices?.length > 0) {
        console.log('First invoice:', dashboardFullData.invoices[0]);
    }
}

// === Filter Pill Controls ===

/**
 * Select a period filter (quick filters)
 */
function selectPeriod(period) {
    console.log('🔵 selectPeriod called with:', period);

    // Remove active class from all period pills
    document.querySelectorAll('[data-period]').forEach(pill => {
        pill.classList.remove('active');
    });

    // Add active class to selected pill
    const selectedPill = document.querySelector(`[data-period="${period}"]`);
    if (selectedPill) {
        selectedPill.classList.add('active');
        console.log('✅ Period pill activated:', period);
    } else {
        console.error('❌ Period pill not found:', period);
    }

    // Update hidden select for compatibility
    const selectElement = document.getElementById('dashboardPeriodFilter');
    if (selectElement) {
        selectElement.value = period;
        console.log('✅ Hidden select updated to:', period);
    } else {
        console.error('❌ dashboardPeriodFilter select not found!');
    }

    // Clear custom date inputs when using quick filters
    if (period !== 'custom') {
        document.getElementById('dashboardStartDate').value = '';
        document.getElementById('dashboardEndDate').value = '';
        console.log('🔵 Cleared custom date inputs');
    }

    // Auto-apply filters
    console.log('🔵 Calling applyDashboardFilters...');
    applyDashboardFilters();
}

/**
 * Select a category filter
 */
function selectCategory(category) {
    console.log('Selecting category:', category);

    // Remove active class from all category pills
    document.querySelectorAll('[data-category]').forEach(pill => {
        pill.classList.remove('active');
    });

    // Add active class to selected pill
    const selectedPill = document.querySelector(`[data-category="${category}"]`);
    if (selectedPill) {
        selectedPill.classList.add('active');
    }

    // Update hidden select for compatibility
    const selectElement = document.getElementById('dashboardTypeFilter');
    if (selectElement) {
        selectElement.value = category;
    }

    // Auto-apply filters
    applyDashboardFilters();
}

/**
 * Apply custom date range filter
 */
function applyCustomDateRange() {
    console.log('🔵 applyCustomDateRange called');

    const startDate = document.getElementById('dashboardStartDate').value;
    const endDate = document.getElementById('dashboardEndDate').value;

    console.log('📅 Custom dates:', { startDate, endDate });

    if (!startDate || !endDate) {
        alert(window.i18n.getCurrentLang() === 'fr'
            ? 'Veuillez sélectionner une date de début et une date de fin'
            : 'Please select both start and end dates');
        return;
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
        alert(window.i18n.getCurrentLang() === 'fr'
            ? 'La date de début doit être antérieure à la date de fin'
            : 'Start date must be before end date');
        return;
    }

    // Remove active class from period pills (custom range is being used)
    document.querySelectorAll('[data-period]').forEach(pill => {
        pill.classList.remove('active');
    });

    // Set hidden select to custom
    const selectElement = document.getElementById('dashboardPeriodFilter');
    if (selectElement) {
        selectElement.value = 'custom';
    }

    console.log('✅ Applying custom date range filter');
    applyDashboardFilters();
}

// ==========================================
// ESG REPORT GENERATION
// ==========================================

function openReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) {
        modal.style.display = 'flex';
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    }
}

function closeReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) {
        modal.style.display = 'none';
        // Restore body scroll
        document.body.style.overflow = 'auto';
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('reportModal');
    if (event.target === modal) {
        closeReportModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeReportModal();
    }
});

async function generateESGReport() {
    const langRadios = document.getElementsByName('reportLang');
    const formatRadios = document.getElementsByName('reportFormat');
    const commitments = document.getElementById('climateCommitments').value;

    let selectedLang = 'fr';
    let selectedFormat = 'pdf';

    // Get selected language
    for (const radio of langRadios) {
        if (radio.checked) {
            selectedLang = radio.value;
            break;
        }
    }

    // Get selected format
    for (const radio of formatRadios) {
        if (radio.checked) {
            selectedFormat = radio.value;
            break;
        }
    }

    // Close modal
    closeReportModal();

    // Show loading indicator
    let loadingMsg = 'Generating report...';
    if (window.i18n && typeof window.i18n.getCurrentLang === 'function') {
        loadingMsg = window.i18n.getCurrentLang() === 'fr'
            ? 'Génération du rapport en cours...'
            : 'Generating report...';
    }
    showNotification(loadingMsg, 'info');

    try {
        // Build API URL with parameters
        let url = `${API_BASE_URL}/generate_report?lang=${selectedLang}&format=${selectedFormat}`;
        if (commitments) {
            url += `&climate_commitments=${encodeURIComponent(commitments)}`;
        }

        // Fetch the report
        const response = await fetch(url, {
            method: 'POST'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get the blob
        const blob = await response.blob();

        // Create download link
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;

        // Set filename based on format and language
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `carbon_report_${timestamp}.${selectedFormat}`;
        a.download = filename;

        // Trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);

        // Show success message
        let successMsg = `Report downloaded: ${filename}`;
        if (window.i18n && typeof window.i18n.getCurrentLang === 'function') {
            successMsg = window.i18n.getCurrentLang() === 'fr'
                ? `Rapport téléchargé : ${filename}`
                : `Report downloaded: ${filename}`;
        }
        showNotification(successMsg, 'success');

    } catch (error) {
        console.error('Error generating report:', error);

        let errorMsg = 'Error generating report';
        if (window.i18n && typeof window.i18n.getCurrentLang === 'function') {
            errorMsg = window.i18n.getCurrentLang() === 'fr'
                ? 'Erreur lors de la génération du rapport'
                : 'Error generating report';
        }
        showNotification(errorMsg, 'error');
    }
}

function showNotification(message, type = 'info') {
    try {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Use direct colors instead of CSS variables to avoid issues
        let bgColor = '#047857'; // primary
        if (type === 'success') bgColor = '#10b981'; // emerald
        if (type === 'error') bgColor = '#dc2626'; // red

        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${bgColor};
            color: white;
            border-radius: 1rem;
            box-shadow: 0 8px 40px rgba(10, 31, 26, 0.16);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            font-weight: 600;
            max-width: 400px;
        `;

        document.body.appendChild(notification);

        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    } catch (error) {
        console.error('Error showing notification:', error);
    }
}

// ==========================================
// ACTION PLAN MODULE
// ==========================================

let currentActionPlan = null;
let completedActions = new Set();

async function generateActionPlan() {
    const loadingEl = document.getElementById('actionPlanLoading');
    const emptyEl = document.getElementById('actionPlanEmpty');

    emptyEl.style.display = 'none';
    loadingEl.style.display = 'flex';

    try {
        const lang = window.i18n.getCurrentLang();
        console.log('Generating action plan in language:', lang);
        const response = await fetch(`${API_BASE_URL}/generate_plan?lang=${lang}&max_actions=15`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const planData = await response.json();
        currentActionPlan = planData;

        loadingEl.style.display = 'none';
        displayActionPlan(planData);

    } catch (error) {
        console.error('Error generating action plan:', error);
        loadingEl.style.display = 'none';
        emptyEl.style.display = 'block';

        let errorMsg = window.i18n && typeof window.i18n.getCurrentLang === 'function' && window.i18n.getCurrentLang() === 'fr'
            ? 'Erreur lors de la génération du plan d\'action'
            : 'Error generating action plan';
        showNotification(errorMsg, 'error');
    }
}

function displayActionPlan(planData) {
    // Show summary
    const summaryEl = document.getElementById('actionPlanSummary');
    summaryEl.style.display = 'block';

    // Update summary cards
    document.getElementById('totalActions').textContent = planData.summary.total_actions;
    document.getElementById('potentialReduction').textContent =
        window.i18n.formatWeight(planData.summary.potential_reduction, 1);
    document.getElementById('highPriority').textContent = planData.summary.high_priority;
    document.getElementById('completedActions').textContent = completedActions.size;

    // Display actions
    const actionsListEl = document.getElementById('actionsList');
    actionsListEl.style.display = 'grid';
    actionsListEl.innerHTML = '';

    planData.actions.forEach(action => {
        const actionCard = createActionCard(action);
        actionsListEl.appendChild(actionCard);
    });

    // Setup filter buttons
    setupFilterButtons();
}

function createActionCard(action) {
    const card = document.createElement('div');
    card.className = `action-card priority-${action.priority}`;
    card.dataset.priority = action.priority;
    card.dataset.actionId = action.id;

    if (completedActions.has(action.id)) {
        card.classList.add('completed');
    }

    const impactText = window.i18n.t(`actionplan.impact.${action.impact}`);
    const feasibilityText = window.i18n.t(`actionplan.feasibility.${action.feasibility}`);
    const priorityText = window.i18n.t(`actionplan.filter.${action.priority}`);

    card.innerHTML = `
        <div class="action-header">
            <h3 class="action-title">${action.title}</h3>
            <div class="action-badges">
                <span class="action-badge priority-${action.priority}">${priorityText}</span>
                <span class="action-badge impact">${impactText}</span>
                <span class="action-badge feasibility">${feasibilityText}</span>
            </div>
        </div>

        <p class="action-description">${action.description}</p>

        <div class="action-metrics">
            <div class="action-metric">
                <div class="action-metric-value">${window.i18n.formatWeight(action.estimated_reduction, 1)}</div>
                <div class="action-metric-label">${window.i18n.t('actionplan.action.reduction')}</div>
            </div>
            <div class="action-metric">
                <div class="action-metric-value">${action.priority_score.toFixed(0)}/100</div>
                <div class="action-metric-label">${window.i18n.t('actionplan.action.priority')}</div>
            </div>
        </div>

        <div class="action-footer">
            <button class="action-btn ${completedActions.has(action.id) ? 'completed-btn' : ''}"
                    onclick="toggleActionComplete('${action.id}')">
                <span>${completedActions.has(action.id) ? '✅' : '☐'}</span>
                <span>${window.i18n.t(completedActions.has(action.id) ? 'actionplan.action.completed' : 'actionplan.action.markComplete')}</span>
            </button>
            <button class="action-btn" onclick="openCalendarMenu('${action.id}')">
                <span>📅</span>
                <span>${window.i18n.t('actionplan.action.addToCalendar')}</span>
            </button>
        </div>
    `;

    return card;
}

function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');

            // Filter actions
            const filter = btn.dataset.filter;
            filterActions(filter);
        });
    });
}

function filterActions(priority) {
    const allCards = document.querySelectorAll('.action-card');

    allCards.forEach(card => {
        if (priority === 'all' || card.dataset.priority === priority) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function toggleActionComplete(actionId) {
    if (completedActions.has(actionId)) {
        completedActions.delete(actionId);
    } else {
        completedActions.add(actionId);
    }

    // Save to localStorage
    localStorage.setItem('completedActions', JSON.stringify([...completedActions]));

    // Update completed count
    document.getElementById('completedActions').textContent = completedActions.size;

    // Refresh display
    if (currentActionPlan) {
        displayActionPlan(currentActionPlan);
    }

    const statusMsg = completedActions.has(actionId)
        ? (window.i18n.getCurrentLang() === 'fr' ? 'Action marquée comme complétée' : 'Action marked as completed')
        : (window.i18n.getCurrentLang() === 'fr' ? 'Action marquée comme non complétée' : 'Action marked as not completed');

    showNotification(statusMsg, 'success');
}

function openCalendarMenu(actionId) {
    const action = currentActionPlan.actions.find(a => a.id === actionId);
    if (!action) return;

    // Open directly in Google Calendar
    const googleLink = generateGoogleCalendarLink(action);
    window.open(googleLink, '_blank');
}

function generateGoogleCalendarLink(action) {
    const title = encodeURIComponent(`[Green App] ${action.title}`);
    const description = encodeURIComponent(action.description);
    const startDate = new Date(action.target_date);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour

    const start = formatDateForGoogle(startDate);
    const end = formatDateForGoogle(endDate);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${description}`;
}

function formatDateForGoogle(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

async function exportToCalendar(type) {
    if (!currentActionPlan) {
        showNotification(
            window.i18n.getCurrentLang() === 'fr'
                ? 'Veuillez d\'abord générer un plan d\'action'
                : 'Please generate an action plan first',
            'error'
        );
        return;
    }

    if (type === 'ics') {
        // Download ICS file
        try {
            const lang = window.i18n.getCurrentLang();
            const response = await fetch(`${API_BASE_URL}/generate_plan?lang=${lang}&export_format=ics`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'green_app_action_plan.ics';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            showNotification(
                window.i18n.getCurrentLang() === 'fr'
                    ? 'Fichier calendrier téléchargé'
                    : 'Calendar file downloaded',
                'success'
            );
        } catch (error) {
            console.error('Error exporting to ICS:', error);
            showNotification(
                window.i18n.getCurrentLang() === 'fr'
                    ? 'Erreur lors de l\'export'
                    : 'Error exporting calendar',
                'error'
            );
        }
    } else if (type === 'google') {
        // Export all actions to Google Calendar
        currentActionPlan.actions.forEach(action => {
            const link = generateGoogleCalendarLink(action);
            window.open(link, '_blank');
        });

        showNotification(
            window.i18n.getCurrentLang() === 'fr'
                ? 'Export vers Google Calendar lancé'
                : 'Google Calendar export started',
            'success'
        );
    }
}

// Load completed actions from localStorage on page load
window.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('completedActions');
    if (saved) {
        completedActions = new Set(JSON.parse(saved));
    }
});
