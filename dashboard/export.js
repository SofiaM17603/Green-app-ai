/**
 * Green App Dashboard - Export Functionality
 * Handles PDF and Excel export
 */

// ============================================
// PDF EXPORT
// ============================================

/**
 * Export dashboard as PDF
 */
async function exportToPDF() {
    try {
        showLoading(true);

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        let yPosition = margin;

        // Helper function to add new page if needed
        const checkNewPage = (requiredHeight) => {
            if (yPosition + requiredHeight > pageHeight - margin) {
                pdf.addPage();
                yPosition = margin;
                return true;
            }
            return false;
        };

        // Add header
        pdf.setFontSize(24);
        pdf.setTextColor(16, 185, 129); // Primary green
        pdf.text('🌱 Green App', margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(12);
        pdf.setTextColor(100, 100, 100);
        pdf.text(window.i18n.t('header.tagline'), margin, yPosition);
        yPosition += 5;

        pdf.setFontSize(10);
        const exportDate = new Date().toLocaleDateString(
            window.i18n.getCurrentLang() === 'fr' ? 'fr-FR' : 'en-US',
            { year: 'numeric', month: 'long', day: 'numeric' }
        );
        pdf.text(`${window.i18n.t('loading.message').replace('...', '')}: ${exportDate}`, margin, yPosition);
        yPosition += 15;

        // Add separator line
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

        // Get filtered data
        const data = window.dashboardData.getFilteredData();

        // Calculate KPIs
        const totalEmissions = data.reduce((sum, inv) => sum + inv.emissions, 0);
        const invoicesCount = data.length;
        const avgEmissions = invoicesCount > 0 ? totalEmissions / invoicesCount : 0;

        // Add KPIs section
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Key Performance Indicators', margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(11);
        pdf.setTextColor(60, 60, 60);

        const kpis = [
            {
                label: window.i18n.t('kpi.totalEmissions'),
                value: window.i18n.formatWeight(totalEmissions)
            },
            {
                label: window.i18n.t('kpi.invoicesCount'),
                value: invoicesCount.toString()
            },
            {
                label: window.i18n.t('kpi.avgEmissions'),
                value: window.i18n.formatWeight(avgEmissions)
            }
        ];

        kpis.forEach(kpi => {
            pdf.setFont('helvetica', 'bold');
            pdf.text(kpi.label + ':', margin, yPosition);
            pdf.setFont('helvetica', 'normal');
            pdf.text(kpi.value, margin + 60, yPosition);
            yPosition += 7;
        });

        yPosition += 10;

        // Add charts as images
        const charts = document.querySelectorAll('.chart-card canvas');
        for (const canvas of charts) {
            checkNewPage(80);

            const chartTitle = canvas.closest('.chart-card').querySelector('.chart-title').textContent;

            pdf.setFontSize(14);
            pdf.setTextColor(0, 0, 0);
            pdf.text(chartTitle, margin, yPosition);
            yPosition += 5;

            try {
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = pageWidth - 2 * margin;
                const imgHeight = 70;

                pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
                yPosition += imgHeight + 10;
            } catch (error) {
                console.error('Error adding chart to PDF:', error);
            }
        }

        // Add data table
        checkNewPage(60);

        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        pdf.text(window.i18n.t('table.title'), margin, yPosition);
        yPosition += 10;

        // Table headers
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(100, 100, 100);

        const colWidths = [25, 45, 40, 30, 35];
        const headers = [
            window.i18n.t('table.header.date'),
            window.i18n.t('table.header.supplier'),
            window.i18n.t('table.header.category'),
            window.i18n.t('table.header.amount'),
            window.i18n.t('table.header.emissions')
        ];

        let xPos = margin;
        headers.forEach((header, i) => {
            pdf.text(header, xPos, yPosition);
            xPos += colWidths[i];
        });
        yPosition += 5;

        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;

        // Table rows (limit to first 30 for PDF)
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(8);

        const maxRows = 30;
        data.slice(0, maxRows).forEach((invoice, index) => {
            checkNewPage(10);

            const formattedDate = new Date(invoice.date).toLocaleDateString(
                window.i18n.getCurrentLang() === 'fr' ? 'fr-FR' : 'en-US',
                { year: 'numeric', month: 'short', day: 'numeric' }
            );

            const row = [
                formattedDate,
                invoice.supplier.substring(0, 20),
                window.i18n.t(`category.${invoice.category}`).substring(0, 18),
                window.i18n.formatCurrency(invoice.amount),
                window.i18n.formatWeight(invoice.emissions)
            ];

            xPos = margin;
            row.forEach((cell, i) => {
                pdf.text(cell, xPos, yPosition);
                xPos += colWidths[i];
            });
            yPosition += 6;

            // Add subtle row separator every 5 rows
            if ((index + 1) % 5 === 0) {
                pdf.setDrawColor(240, 240, 240);
                pdf.line(margin, yPosition, pageWidth - margin, yPosition);
                yPosition += 2;
            }
        });

        if (data.length > maxRows) {
            yPosition += 5;
            pdf.setFontSize(9);
            pdf.setTextColor(150, 150, 150);
            pdf.text(`... ${data.length - maxRows} more entries`, margin, yPosition);
        }

        // Add footer on all pages
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text(
                window.i18n.t('footer.copyright'),
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
            pdf.text(
                `Page ${i} of ${pageCount}`,
                pageWidth - margin,
                pageHeight - 10,
                { align: 'right' }
            );
        }

        // Save PDF
        const filename = `GreenApp_Carbon_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(filename);

        showLoading(false);
        showNotification('PDF exported successfully!', 'success');

    } catch (error) {
        console.error('Error exporting PDF:', error);
        showLoading(false);
        showNotification('Error exporting PDF. Please try again.', 'error');
    }
}

// ============================================
// EXCEL EXPORT
// ============================================

/**
 * Export data as Excel file
 */
function exportToExcel() {
    try {
        showLoading(true);

        const data = window.dashboardData.getFilteredData();

        // Prepare data for Excel
        const excelData = data.map(invoice => ({
            [window.i18n.t('table.header.date')]: invoice.date,
            [window.i18n.t('table.header.supplier')]: invoice.supplier,
            [window.i18n.t('table.header.category')]: window.i18n.t(`category.${invoice.category}`),
            [window.i18n.t('table.header.amount')]: invoice.amount,
            [`${window.i18n.t('table.header.emissions')} (${window.i18n.getUnitSymbol('weight')})`]: window.i18n.convertWeight(invoice.emissions),
            [window.i18n.t('table.header.impact')]: window.i18n.t(`impact.${invoice.impact}`)
        }));

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Add main data sheet
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Set column widths
        ws['!cols'] = [
            { wch: 12 }, // Date
            { wch: 25 }, // Supplier
            { wch: 20 }, // Category
            { wch: 12 }, // Amount
            { wch: 15 }, // Emissions
            { wch: 10 }  // Impact
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Invoices');

        // Add summary sheet
        const totalEmissions = data.reduce((sum, inv) => sum + inv.emissions, 0);
        const invoicesCount = data.length;
        const avgEmissions = invoicesCount > 0 ? totalEmissions / invoicesCount : 0;

        // Group by category
        const categoryData = {};
        data.forEach(invoice => {
            if (!categoryData[invoice.category]) {
                categoryData[invoice.category] = 0;
            }
            categoryData[invoice.category] += invoice.emissions;
        });

        const summaryData = [
            { Metric: window.i18n.t('kpi.totalEmissions'), Value: window.i18n.formatWeight(totalEmissions) },
            { Metric: window.i18n.t('kpi.invoicesCount'), Value: invoicesCount },
            { Metric: window.i18n.t('kpi.avgEmissions'), Value: window.i18n.formatWeight(avgEmissions) },
            { Metric: '', Value: '' }, // Empty row
            { Metric: 'Category Breakdown', Value: '' }
        ];

        Object.entries(categoryData).forEach(([category, emissions]) => {
            summaryData.push({
                Metric: window.i18n.t(`category.${category}`),
                Value: window.i18n.formatWeight(emissions)
            });
        });

        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

        // Save file
        const filename = `GreenApp_Carbon_Data_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);

        showLoading(false);
        showNotification('Excel file exported successfully!', 'success');

    } catch (error) {
        console.error('Error exporting Excel:', error);
        showLoading(false);
        showNotification('Error exporting Excel. Please try again.', 'error');
    }
}

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
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

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
            document.head.removeChild(style);
        }, 300);
    }, 3000);
}

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
    // PDF export button
    const pdfBtn = document.getElementById('exportPdfBtn');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', exportToPDF);
    }

    // Excel export button
    const excelBtn = document.getElementById('exportExcelBtn');
    if (excelBtn) {
        excelBtn.addEventListener('click', exportToExcel);
    }
});
