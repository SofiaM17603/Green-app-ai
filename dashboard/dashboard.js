/**
 * Green App Dashboard - Main Logic
 * Handles data loading, filtering, charts, and KPIs
 */

// ============================================
// CONFIGURATION
// ============================================

const API_BASE_URL = 'http://localhost:8000';
const ITEMS_PER_PAGE = 10;

// Chart.js color palette
const CHART_COLORS = {
    primary: '#10b981',
    secondary: '#3b82f6',
    accent: '#8b5cf6',
    danger: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
    purple: '#a78bfa',
    pink: '#ec4899',
    teal: '#14b8a6',
    orange: '#fb923c'
};

// ============================================
// STATE MANAGEMENT
// ============================================

let rawData = []; // All invoice data
let filteredData = []; // Data after applying filters
let currentPage = 1;

// Chart instances
let monthlyChart = null;
let categoryChart = null;
let supplierChart = null;

// ============================================
// DATA LOADING
// ============================================

/**
 * Load data from API or generate sample data
 */
async function loadData() {
    showLoading(true);

    try {
        // Try to load from API first
        const response = await fetch(`${API_BASE_URL}/dashboard`);

        if (response.ok) {
            const data = await response.json();
            rawData = transformApiData(data);
        } else {
            // If API fails, use sample data
            rawData = generateSampleData();
        }
    } catch (error) {
        console.log('API not available, using sample data');
        rawData = generateSampleData();
    }

    filteredData = [...rawData];

    showLoading(false);
    refreshDashboard();
}

/**
 * Transform API data to dashboard format
 */
function transformApiData(apiData) {
    // This function will transform your API response to the format expected by the dashboard
    // Adjust based on your actual API response structure
    return apiData.invoices || [];
}

/**
 * Generate realistic sample data for demo
 */
function generateSampleData() {
    const categories = [
        'voyages_aeriens',
        'transport_routier',
        'energie',
        'materiaux',
        'services',
        'equipements',
        'autres'
    ];

    const suppliers = [
        'Air France', 'FedEx', 'DHL', 'UPS', 'Total Energies',
        'EDF', 'Amazon', 'Microsoft', 'Dell', 'HP',
        'Coca-Cola', 'Nestlé', 'Carrefour', 'IKEA', 'Renault'
    ];

    const sectors = ['tech', 'retail', 'manufacturing', 'services', 'transport'];

    const data = [];
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2025-01-31');

    // Generate 150 sample invoices
    for (let i = 0; i < 150; i++) {
        const randomDate = new Date(
            startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
        );

        const category = categories[Math.floor(Math.random() * categories.length)];
        const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
        const sector = sectors[Math.floor(Math.random() * sectors.length)];

        // Generate emissions based on category
        let emissionsBase = 0;
        switch (category) {
            case 'voyages_aeriens':
                emissionsBase = 500 + Math.random() * 2000;
                break;
            case 'transport_routier':
                emissionsBase = 100 + Math.random() * 500;
                break;
            case 'energie':
                emissionsBase = 200 + Math.random() * 1000;
                break;
            default:
                emissionsBase = 50 + Math.random() * 300;
        }

        const emissions = Math.round(emissionsBase * 10) / 10;
        const amount = Math.round(emissions * (2 + Math.random() * 3) * 100) / 100;

        // Determine impact level
        let impact = 'low';
        if (emissions > 1000) impact = 'high';
        else if (emissions > 300) impact = 'medium';

        data.push({
            id: `INV-${1000 + i}`,
            date: randomDate.toISOString().split('T')[0],
            supplier: supplier,
            category: category,
            sector: sector,
            amount: amount,
            emissions: emissions,
            impact: impact
        });
    }

    // Sort by date (newest first)
    return data.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ============================================
// FILTERING
// ============================================

/**
 * Apply filters to data
 */
function applyFilters() {
    const periodFilter = document.getElementById('periodFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const sectorFilter = document.getElementById('sectorFilter').value;

    filteredData = rawData.filter(invoice => {
        // Period filter
        if (periodFilter !== 'all') {
            const invoiceDate = new Date(invoice.date);
            const today = new Date();
            let startDate = new Date();

            switch (periodFilter) {
                case 'month':
                    startDate.setMonth(today.getMonth() - 1);
                    break;
                case 'quarter':
                    startDate.setMonth(today.getMonth() - 3);
                    break;
                case 'year':
                    startDate.setFullYear(today.getFullYear() - 1);
                    break;
                case 'custom':
                    const customStart = document.getElementById('startDate').value;
                    const customEnd = document.getElementById('endDate').value;
                    if (customStart && customEnd) {
                        startDate = new Date(customStart);
                        const endDate = new Date(customEnd);
                        if (invoiceDate < startDate || invoiceDate > endDate) {
                            return false;
                        }
                    }
                    return true;
            }

            if (invoiceDate < startDate) {
                return false;
            }
        }

        // Type filter
        if (typeFilter !== 'all' && invoice.category !== typeFilter) {
            return false;
        }

        // Sector filter
        if (sectorFilter !== 'all' && invoice.sector !== sectorFilter) {
            return false;
        }

        return true;
    });

    currentPage = 1;
    refreshDashboard();
}

/**
 * Reset all filters
 */
function resetFilters() {
    document.getElementById('periodFilter').value = 'year';
    document.getElementById('typeFilter').value = 'all';
    document.getElementById('sectorFilter').value = 'all';
    document.getElementById('customDateRange').style.display = 'none';

    filteredData = [...rawData];
    currentPage = 1;
    refreshDashboard();
}

// ============================================
// KPI CALCULATIONS
// ============================================

/**
 * Calculate and update KPIs
 */
function updateKPIs() {
    const totalEmissions = filteredData.reduce((sum, inv) => sum + inv.emissions, 0);
    const invoicesCount = filteredData.length;
    const avgEmissions = invoicesCount > 0 ? totalEmissions / invoicesCount : 0;

    // Calculate carbon score (0-100, lower emissions = higher score)
    const maxPossibleEmissions = invoicesCount * 1000; // Assume 1000 kg per invoice as baseline
    const carbonScore = maxPossibleEmissions > 0
        ? Math.max(0, Math.min(100, 100 - (totalEmissions / maxPossibleEmissions) * 100))
        : 0;

    // Calculate changes (compare with previous period)
    const changes = calculateChanges();

    // Update KPI values with unit conversion
    document.getElementById('kpiTotalEmissions').textContent = window.i18n.formatWeight(totalEmissions);
    document.getElementById('kpiInvoicesCount').textContent = invoicesCount.toLocaleString();
    document.getElementById('kpiAvgEmissions').textContent = window.i18n.formatWeight(avgEmissions);
    document.getElementById('kpiCarbonScore').textContent = `${carbonScore.toFixed(1)}/100`;

    // Update change indicators
    updateChangeIndicator('kpiEmissionsChange', changes.emissions);
    updateChangeIndicator('kpiInvoicesChange', changes.invoices);
    updateChangeIndicator('kpiAvgChange', changes.avg);
    updateChangeIndicator('kpiScoreChange', changes.score);
}

/**
 * Calculate period-over-period changes
 */
function calculateChanges() {
    // This is a simplified version - you can enhance it based on your needs
    return {
        emissions: Math.random() > 0.5 ? (Math.random() * 20) : -(Math.random() * 20),
        invoices: Math.random() > 0.5 ? (Math.random() * 15) : -(Math.random() * 15),
        avg: Math.random() > 0.5 ? (Math.random() * 10) : -(Math.random() * 10),
        score: Math.random() > 0.5 ? (Math.random() * 5) : -(Math.random() * 5)
    };
}

/**
 * Update change indicator styling and text
 */
function updateChangeIndicator(elementId, change) {
    const element = document.getElementById(elementId);
    const absChange = Math.abs(change);
    const sign = change > 0 ? '+' : '';

    element.textContent = `${sign}${absChange.toFixed(1)}%`;
    element.className = 'kpi-change';

    if (change > 0) {
        element.classList.add('negative');
    } else if (change < 0) {
        element.classList.add('positive');
    } else {
        element.classList.add('neutral');
    }
}

// ============================================
// CHARTS
// ============================================

/**
 * Create/Update monthly emissions chart
 */
function updateMonthlyChart() {
    const ctx = document.getElementById('monthlyChart');
    if (!ctx) return;

    // Group data by month
    const monthlyData = {};
    filteredData.forEach(invoice => {
        const date = new Date(invoice.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = 0;
        }
        monthlyData[monthKey] += invoice.emissions;
    });

    // Sort by month
    const sortedMonths = Object.keys(monthlyData).sort();
    const labels = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(year, parseInt(monthNum) - 1);
        return date.toLocaleDateString(window.i18n.getCurrentLang() === 'fr' ? 'fr-FR' : 'en-US', {
            month: 'short',
            year: 'numeric'
        });
    });
    const values = sortedMonths.map(month => monthlyData[month]);

    // Destroy existing chart
    if (monthlyChart) {
        monthlyChart.destroy();
    }

    // Create new chart
    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: window.i18n.t('charts.monthly.title'),
                data: values,
                borderColor: CHART_COLORS.primary,
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: CHART_COLORS.primary,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => window.i18n.formatWeight(context.parsed.y)
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

/**
 * Create/Update category emissions chart
 */
function updateCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    // Group data by category
    const categoryData = {};
    filteredData.forEach(invoice => {
        if (!categoryData[invoice.category]) {
            categoryData[invoice.category] = 0;
        }
        categoryData[invoice.category] += invoice.emissions;
    });

    const categories = Object.keys(categoryData);
    const labels = categories.map(cat => window.i18n.t(`category.${cat}`));
    const values = categories.map(cat => categoryData[cat]);

    const colors = [
        CHART_COLORS.primary,
        CHART_COLORS.secondary,
        CHART_COLORS.accent,
        CHART_COLORS.warning,
        CHART_COLORS.pink,
        CHART_COLORS.teal,
        CHART_COLORS.orange
    ];

    // Destroy existing chart
    if (categoryChart) {
        categoryChart.destroy();
    }

    // Create new chart
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
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
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

/**
 * Create/Update supplier emissions chart
 */
function updateSupplierChart() {
    const ctx = document.getElementById('supplierChart');
    if (!ctx) return;

    // Group data by supplier
    const supplierData = {};
    filteredData.forEach(invoice => {
        if (!supplierData[invoice.supplier]) {
            supplierData[invoice.supplier] = 0;
        }
        supplierData[invoice.supplier] += invoice.emissions;
    });

    // Get top 10 suppliers
    const sortedSuppliers = Object.entries(supplierData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const labels = sortedSuppliers.map(([supplier]) => supplier);
    const values = sortedSuppliers.map(([, emissions]) => emissions);

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
                backgroundColor: CHART_COLORS.secondary,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
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

// ============================================
// DATA TABLE
// ============================================

/**
 * Update invoices table with pagination
 */
function updateTable() {
    const tbody = document.getElementById('invoicesTableBody');
    const searchTerm = document.getElementById('searchTable').value.toLowerCase();
    const sortBy = document.getElementById('sortTable').value;

    // Filter by search term
    let tableData = filteredData.filter(invoice =>
        invoice.supplier.toLowerCase().includes(searchTerm) ||
        invoice.id.toLowerCase().includes(searchTerm) ||
        window.i18n.t(`category.${invoice.category}`).toLowerCase().includes(searchTerm)
    );

    // Sort data
    tableData.sort((a, b) => {
        switch (sortBy) {
            case 'date-desc':
                return new Date(b.date) - new Date(a.date);
            case 'date-asc':
                return new Date(a.date) - new Date(b.date);
            case 'emissions-desc':
                return b.emissions - a.emissions;
            case 'emissions-asc':
                return a.emissions - b.emissions;
            default:
                return 0;
        }
    });

    // Pagination
    const totalPages = Math.ceil(tableData.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageData = tableData.slice(startIndex, endIndex);

    // Clear table
    tbody.innerHTML = '';

    // Populate table
    pageData.forEach(invoice => {
        const row = document.createElement('tr');

        const formattedDate = new Date(invoice.date).toLocaleDateString(
            window.i18n.getCurrentLang() === 'fr' ? 'fr-FR' : 'en-US',
            { year: 'numeric', month: 'short', day: 'numeric' }
        );

        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${invoice.supplier}</td>
            <td>${window.i18n.t(`category.${invoice.category}`)}</td>
            <td>${window.i18n.formatCurrency(invoice.amount)}</td>
            <td>${window.i18n.formatWeight(invoice.emissions)}</td>
            <td><span class="impact-badge ${invoice.impact}">${window.i18n.t(`impact.${invoice.impact}`)}</span></td>
        `;

        tbody.appendChild(row);
    });

    // Update pagination
    updatePagination(totalPages, tableData.length);
}

/**
 * Update pagination controls
 */
function updatePagination(totalPages, totalItems) {
    const container = document.getElementById('tablePagination');
    container.innerHTML = '';

    if (totalPages <= 1) return;

    const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.textContent = window.i18n.t('pagination.previous');
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            updateTable();
        }
    };
    container.appendChild(prevBtn);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 ||
            i === totalPages ||
            (i >= currentPage - 1 && i <= currentPage + 1)
        ) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.onclick = () => {
                currentPage = i;
                updateTable();
            };
            container.appendChild(pageBtn);
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.padding = '0 8px';
            container.appendChild(dots);
        }
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.textContent = window.i18n.t('pagination.next');
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            updateTable();
        }
    };
    container.appendChild(nextBtn);

    // Info text
    const info = document.createElement('span');
    info.className = 'pagination-info';
    info.textContent = `${window.i18n.t('pagination.showing')} ${startItem} ${window.i18n.t('pagination.to')} ${endItem} ${window.i18n.t('pagination.of')} ${totalItems} ${window.i18n.t('pagination.entries')}`;
    container.appendChild(info);
}

// ============================================
// DASHBOARD REFRESH
// ============================================

/**
 * Refresh all dashboard components
 */
function refreshDashboard() {
    updateKPIs();
    updateMonthlyChart();
    updateCategoryChart();
    updateSupplierChart();
    updateTable();
}

// ============================================
// LOADING STATE
// ============================================

/**
 * Show/hide loading overlay
 */
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Load initial data
    loadData();

    // Filter event listeners
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);

    // Period filter - show/hide custom date range
    document.getElementById('periodFilter').addEventListener('change', (e) => {
        const customRange = document.getElementById('customDateRange');
        customRange.style.display = e.target.value === 'custom' ? 'grid' : 'none';
    });

    // Table search and sort
    document.getElementById('searchTable').addEventListener('input', () => {
        currentPage = 1;
        updateTable();
    });

    document.getElementById('sortTable').addEventListener('change', () => {
        currentPage = 1;
        updateTable();
    });

    // Language change event - refresh dashboard to update units
    document.addEventListener('languageChanged', () => {
        refreshDashboard();
    });
});

// ============================================
// EXPORTS
// ============================================

// Export functions for use by export.js
window.dashboardData = {
    getRawData: () => rawData,
    getFilteredData: () => filteredData,
    getCharts: () => ({
        monthly: monthlyChart,
        category: categoryChart,
        supplier: supplierChart
    })
};
