/**
 * Green App - Multilingual Support with Unit Conversion
 * Language switcher with French and English translations
 * Automatic unit conversion (kg↔lbs, km↔mi, €↔$)
 * Default language: English
 */

// ============================================
// CONFIGURATION
// ============================================

// Current language (default: English)
let currentLang = 'en';

// Unit conversion factors
const CONVERSION_FACTORS = {
    KG_TO_LBS: 2.20462,      // 1 kg = 2.20462 lbs
    LBS_TO_KG: 0.453592,     // 1 lbs = 0.453592 kg
    KM_TO_MI: 0.621371,      // 1 km = 0.621371 mi
    MI_TO_KM: 1.60934,       // 1 mi = 1.60934 km
    EUR_TO_USD: 1.1          // Approximate rate for display purposes
};

// Unit symbols per language
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

// ============================================
// TRANSLATION DICTIONARY
// ============================================

const translations = {
    en: {
        // Navigation
        'nav.dashboard': 'Dashboard',
        'nav.files': 'My Files',
        'nav.analyze': 'Import',
        'nav.forecast': 'Forecast',
        'nav.actionplan': 'Action Plan',
        'nav.recommendations': 'Recommendations',

        // Dashboard Page
        'dashboard.title': 'Overview',
        'dashboard.subtitle': 'Real-time carbon footprint analysis',
        'dashboard.analyzeBtn': 'Analyze Invoices',
        'dashboard.empty.title': 'Start Your Carbon Analysis',
        'dashboard.empty.desc': 'Upload your first invoices to visualize your carbon footprint and get personalized recommendations',
        'dashboard.empty.action': 'Analyze My Invoices',
        'dashboard.empty.hint': 'Use the file',
        'dashboard.empty.hintFile': 'exemple_factures.csv',
        'dashboard.empty.hintEnd': 'to test',
        'dashboard.kpi.carbonScore': 'Carbon Score',
        'dashboard.kpi.outOf': 'out of 100',
        'dashboard.kpi.totalEmissions': 'Total Emissions',
        'dashboard.kpi.invoicesAnalyzed': 'Analyzed Invoices',
        'dashboard.kpi.invoices': 'invoices',
        'dashboard.kpi.monthChange': 'This month vs previous',
        'dashboard.kpi.increasing': 'Increasing',
        'dashboard.kpi.decreasing': 'Decreasing',
        'dashboard.kpi.stable': 'Stable',
        'dashboard.chart.category.title': 'Distribution by Category',
        'dashboard.chart.category.subtitle': 'Your emissions breakdown',
        'dashboard.chart.timeline.title': 'Monthly Evolution',
        'dashboard.chart.timeline.subtitle': 'Your emissions timeline',
        'dashboard.chart.comparison.title': 'Progress Tracker',
        'dashboard.chart.comparison.subtitle': 'Track your emissions reduction progress',
        'dashboard.chart.comparison.previous': 'Previous Period',
        'dashboard.chart.comparison.current': 'Current Period',
        'dashboard.chart.comparison.change': 'change',
        'dashboard.insights.title': 'Top Contributors',

        // Files Page
        'files.title': 'My Files',
        'files.subtitle': 'Manage your analyzed invoices and their history',
        'files.stats.files': 'Files',
        'files.stats.totalEmissions': 'total emissions',
        'files.stats.invoices': 'Invoices',
        'files.empty.title': 'No Analyzed Files',
        'files.empty.desc': 'Upload your first file to start tracking your carbon emissions',
        'files.empty.action': 'Analyze a File',
        'files.card.totalEmissions': 'Total Emissions',
        'files.card.invoicesAnalyzed': 'Analyzed Invoices',
        'files.card.size': 'Size',
        'files.card.uploadedOn': 'Uploaded on',
        'files.loading': 'Loading files...',

        // Analyze Page
        'analyze.title': 'Import Invoices',
        'analyze.subtitle': 'Import your invoice data to calculate carbon emissions',
        'analyze.upload.title': 'Upload CSV File',
        'analyze.upload.header.subtitle': 'Upload your invoice data from a CSV file',
        'analyze.upload.drag': 'Drag and drop your CSV file here',
        'analyze.upload.or': 'or',
        'analyze.upload.browse': 'Browse Files',
        'analyze.upload.format': 'Format: InvoiceId, Date, ClientId, Label, Total Amount',
        'analyze.file.selected': 'Selected file:',
        'analyze.file.analyze': 'Analyze',
        'analyze.file.cancel': 'Cancel',
        'analyze.divider.or': 'OR',
        'analyze.qb.title': 'Import from QuickBooks Online',
        'analyze.qb.subtitle': 'Automatically sync your invoices without manual export',
        'analyze.qb.connected': 'Connected to',
        'analyze.qb.description': 'Connect your QuickBooks account to automatically import your invoices and analyze your carbon emissions.',
        'analyze.qb.connect': 'Connect QuickBooks',
        'analyze.qb.startDate': 'Start Date',
        'analyze.qb.endDate': 'End Date',
        'analyze.qb.sync': 'Synchronize Invoices',
        'analyze.qb.disconnect': 'Disconnect',
        'analyze.qb.loading': 'Synchronizing...',
        'analyze.results.title': 'Analysis Complete',
        'analyze.results.totalEmissions': 'total emissions',
        'analyze.results.invoicesAnalyzed': 'Analyzed invoices',
        'analyze.results.avgEmissions': 'average emissions',
        'analyze.results.download': 'Download Enriched File',
        'analyze.results.viewDashboard': 'View Dashboard',
        'analyze.loading': 'Analyzing...',

        // Forecast Page
        'forecast.title': 'Carbon Forecast',
        'forecast.subtitle': 'Intelligent emission projections with budget tracking',
        'forecast.generate': 'Generate Forecast',
        'forecast.loading': 'Generating intelligent forecast...',
        'forecast.error': 'Error generating forecast',
        'forecast.options.periods': 'Periods',
        'forecast.options.frequency': 'Frequency',
        'forecast.options.budget': 'Budget (optional)',
        'forecast.frequency.monthly': 'Monthly',
        'forecast.frequency.quarterly': 'Quarterly',
        'forecast.summary.avgForecast': 'Avg. Forecast',
        'forecast.summary.trend': 'Trend',
        'forecast.summary.budgetStatus': 'Budget Status',
        'forecast.summary.alerts': 'Active Alerts',
        'forecast.trend.increasing': 'Increasing',
        'forecast.trend.decreasing': 'Decreasing',
        'forecast.trend.stable': 'Stable',
        'forecast.status.on_track': 'On Track',
        'forecast.status.warning': 'Warning',
        'forecast.status.medium': 'Caution',
        'forecast.status.high': 'Alert',
        'forecast.status.critical': 'Critical',
        'forecast.status.no_budget': 'No Budget',
        'forecast.alert.forecast': 'Forecast',
        'forecast.alert.budget': 'Budget',
        'forecast.alert.difference': 'Difference',
        'forecast.chart.title': 'CO₂ Emissions Forecast',
        'forecast.chart.historical': 'Historical',
        'forecast.chart.forecast': 'Forecast',
        'forecast.chart.lower': 'Lower Bound',
        'forecast.chart.upper': 'Upper Bound',
        'forecast.chart.period': 'Period',
        'forecast.categories.title': 'Forecast by Category',
        'forecast.budget': 'Budget',
        'forecast.difference': 'Difference',
        'forecast.recommendations.title': 'Recommended Actions',

        // Recommendations Page
        'recommendations.title': 'Recommendations',
        'recommendations.subtitle': 'Concrete actions to reduce your carbon footprint',
        'recommendations.summary.title': 'Reduction Potential',
        'recommendations.summary.unit': 'saveable',
        'recommendations.action': 'Get Recommendations',
        'recommendations.loading': 'Generating recommendations...',
        'recommendations.impact.high': 'High Impact',
        'recommendations.impact.medium': 'Medium Impact',
        'recommendations.impact.low': 'Low Impact',

        // Categories
        'category.voyages_aeriens': 'Air Travel',
        'category.transport_routier': 'Road Transport',
        'category.energie': 'Energy',
        'category.materiaux': 'Materials',
        'category.services': 'Services',
        'category.equipements': 'Equipment',
        'category.achat': 'Purchases',
        'category.approvisionnement': 'Supply',
        'category.article': 'Articles',
        'category.autres': 'Other',

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
        'filters.date.range': 'Custom Date Range',
        'filters.date.from': 'From',
        'filters.date.to': 'To',
        'filters.type.label': 'Category',
        'filters.type.all': 'All Categories',
        'filters.sector.label': 'Sector',
        'filters.sector.all': 'All Sectors',
        'filters.sector.transport': 'Transportation',
        'filters.sector.energy': 'Energy',
        'filters.sector.construction': 'Construction',
        'filters.sector.technology': 'Technology',
        'filters.sector.services': 'Services',
        'filters.sector.retail': 'Retail',
        'filters.sector.manufacturing': 'Manufacturing',
        'filters.sector.other': 'Other',
        'filters.apply': 'Apply',
        'filters.reset': 'Reset',

        // Supplier Chart
        'charts.supplier.title': 'Top Suppliers by Emissions',
        'charts.supplier.subtitle': 'Identify high-impact suppliers',

        // Export
        'export.pdf': 'Export PDF',
        'export.excel': 'Export Excel',

        // ESG Report
        'report.generate': 'Generate ESG Report',
        'report.modal.title': 'Generate ESG/CSR Report',
        'report.modal.description': 'Generate a professional carbon report compliant with ADEME and GHG Protocol standards.',
        'report.modal.language': 'Language',
        'report.modal.format': 'Format',
        'report.modal.commitments': 'Climate Commitments',
        'report.modal.includes': 'Report includes:',
        'report.modal.feature1': 'Executive summary with key metrics',
        'report.modal.feature2': 'Emissions breakdown by scope and category',
        'report.modal.feature3': 'Monthly evolution charts',
        'report.modal.feature4': 'Regulatory benchmarks (BEGES, SBT)',
        'report.modal.feature5': 'Actionable recommendations',
        'report.modal.cancel': 'Cancel',
        'report.modal.generate': 'Generate Report',

        // Action Plan
        'actionplan.title': 'Climate Action Plan',
        'actionplan.subtitle': 'Your personalized roadmap to reduce emissions',
        'actionplan.summary.totalActions': 'Total Actions',
        'actionplan.summary.potentialReduction': 'Potential Reduction',
        'actionplan.summary.highPriority': 'High Priority',
        'actionplan.summary.completed': 'Completed',
        'actionplan.filter.all': 'All Actions',
        'actionplan.filter.high': 'High Priority',
        'actionplan.filter.medium': 'Medium Priority',
        'actionplan.filter.low': 'Low Priority',
        'actionplan.export.google': 'Google Calendar',
        'actionplan.export.outlook': 'Outlook',
        'actionplan.export.ics': 'Download .ics',
        'actionplan.empty.title': 'Generate Your Action Plan',
        'actionplan.empty.desc': 'Create a personalized climate action plan based on your emissions data',
        'actionplan.empty.action': 'Generate Action Plan',
        'actionplan.loading': 'Generating your action plan...',
        'actionplan.action.priority': 'Priority',
        'actionplan.action.impact': 'Impact',
        'actionplan.action.feasibility': 'Feasibility',
        'actionplan.action.reduction': 'Potential reduction',
        'actionplan.action.markComplete': 'Mark as Complete',
        'actionplan.action.addToCalendar': 'Add to Calendar',
        'actionplan.action.addNote': 'Add Note',
        'actionplan.action.completed': 'Completed',
        'actionplan.impact.high': 'High',
        'actionplan.impact.medium': 'Medium',
        'actionplan.impact.low': 'Low',
        'actionplan.feasibility.easy': 'Easy',
        'actionplan.feasibility.medium': 'Medium',
        'actionplan.feasibility.hard': 'Hard',

        // Table Headers
        'table.header.date': 'Date',
        'table.header.supplier': 'Supplier',
        'table.header.category': 'Category',
        'table.header.amount': 'Amount',
        'table.header.emissions': 'Emissions',

        // Footer
        'footer.copyright': '© 2025 Green App - Carbon Analytics Platform',
        'footer.tagline': 'Measure, analyze, reduce your carbon footprint',

        // Units
        'unit.kgco2e': 'lbs CO₂e',
        'unit.invoice': 'invoice',
        'unit.invoices': 'invoices',

        // Demo section
        'demo.title': 'Unit Conversion Demo',
        'demo.subtitle': 'Switch language to see automatic unit conversion',
        'demo.emissions': 'Emissions',
        'demo.distance': 'Distance',
        'demo.weight': 'Weight',

        // Actions
        'action.download': 'Download',
        'action.delete': 'Delete',
        'action.cancel': 'Cancel',
        'action.confirm': 'Confirm',

        // Messages
        'message.deleteConfirm': 'Are you sure you want to delete this file? This action is irreversible.',
        'message.error': 'Error',
        'message.success': 'Success',
        'message.loading': 'Loading...'
    },
    fr: {
        // Navigation
        'nav.dashboard': 'Dashboard',
        'nav.files': 'Mes Fichiers',
        'nav.analyze': 'Importer',
        'nav.forecast': 'Prévisions',
        'nav.actionplan': 'Plan d\'Action',
        'nav.recommendations': 'Recommandations',

        // Dashboard Page
        'dashboard.title': 'Vue d\'ensemble',
        'dashboard.subtitle': 'Analyse de votre empreinte carbone en temps réel',
        'dashboard.analyzeBtn': 'Analyser des factures',
        'dashboard.empty.title': 'Commencez votre analyse carbone',
        'dashboard.empty.desc': 'Téléchargez vos premières factures pour visualiser votre empreinte carbone et obtenir des recommandations personnalisées',
        'dashboard.empty.action': 'Analyser mes factures',
        'dashboard.empty.hint': 'Utilisez le fichier',
        'dashboard.empty.hintFile': 'exemple_factures.csv',
        'dashboard.empty.hintEnd': 'pour tester',
        'dashboard.kpi.carbonScore': 'Score Carbone',
        'dashboard.kpi.outOf': 'sur 100',
        'dashboard.kpi.totalEmissions': 'Émissions totales',
        'dashboard.kpi.invoicesAnalyzed': 'Factures analysées',
        'dashboard.kpi.invoices': 'factures',
        'dashboard.kpi.monthChange': 'Ce mois vs précédent',
        'dashboard.kpi.increasing': 'En hausse',
        'dashboard.kpi.decreasing': 'En baisse',
        'dashboard.kpi.stable': 'Stable',
        'dashboard.chart.category.title': 'Répartition par catégorie',
        'dashboard.chart.category.subtitle': 'Distribution de vos émissions',
        'dashboard.chart.timeline.title': 'Évolution mensuelle',
        'dashboard.chart.timeline.subtitle': 'Timeline de vos émissions',
        'dashboard.chart.comparison.title': 'Suivi de progrès',
        'dashboard.chart.comparison.subtitle': 'Suivez vos progrès de réduction des émissions',
        'dashboard.chart.comparison.previous': 'Période précédente',
        'dashboard.chart.comparison.current': 'Période actuelle',
        'dashboard.chart.comparison.change': 'changement',
        'dashboard.insights.title': 'Principaux contributeurs',

        // Files Page
        'files.title': 'Mes Fichiers',
        'files.subtitle': 'Gérez vos factures analysées et leur historique',
        'files.stats.files': 'Fichiers',
        'files.stats.totalEmissions': 'total émissions',
        'files.stats.invoices': 'Factures',
        'files.empty.title': 'Aucun fichier analysé',
        'files.empty.desc': 'Uploadez votre premier fichier pour commencer à tracker vos émissions carbone',
        'files.empty.action': 'Analyser un fichier',
        'files.card.totalEmissions': 'Émissions totales',
        'files.card.invoicesAnalyzed': 'Factures analysées',
        'files.card.size': 'Taille',
        'files.card.uploadedOn': 'Uploadé le',
        'files.loading': 'Chargement des fichiers...',

        // Analyze Page
        'analyze.title': 'Importer des factures',
        'analyze.subtitle': 'Importez vos données de factures pour calculer les émissions carbone',
        'analyze.upload.title': 'Téléverser un fichier CSV',
        'analyze.upload.header.subtitle': 'Téléversez vos données de factures depuis un fichier CSV',
        'analyze.upload.drag': 'Glissez-déposez votre fichier CSV ici',
        'analyze.upload.or': 'ou',
        'analyze.upload.browse': 'Parcourir les fichiers',
        'analyze.upload.format': 'Format: InvoiceId, Date, ClientId, Libellé, Montant total',
        'analyze.file.selected': 'Fichier sélectionné:',
        'analyze.file.analyze': 'Analyser',
        'analyze.file.cancel': 'Annuler',
        'analyze.divider.or': 'OU',
        'analyze.qb.title': 'Importer depuis QuickBooks Online',
        'analyze.qb.subtitle': 'Synchronisez automatiquement vos factures sans export manuel',
        'analyze.qb.connected': 'Connecté à',
        'analyze.qb.description': 'Connectez votre compte QuickBooks pour importer automatiquement vos factures et analyser vos émissions carbone.',
        'analyze.qb.connect': 'Connecter QuickBooks',
        'analyze.qb.startDate': 'Date de début',
        'analyze.qb.endDate': 'Date de fin',
        'analyze.qb.sync': 'Synchroniser les factures',
        'analyze.qb.disconnect': 'Déconnecter',
        'analyze.qb.loading': 'Synchronisation en cours...',
        'analyze.results.title': 'Analyse terminée',
        'analyze.results.totalEmissions': 'total émissions',
        'analyze.results.invoicesAnalyzed': 'Factures analysées',
        'analyze.results.avgEmissions': 'émissions moyennes',
        'analyze.results.download': 'Télécharger le fichier enrichi',
        'analyze.results.viewDashboard': 'Voir le dashboard',
        'analyze.loading': 'Analyse en cours...',

        // Forecast Page
        'forecast.title': 'Prévisions carbone',
        'forecast.subtitle': 'Projections intelligentes avec suivi budgétaire',
        'forecast.generate': 'Générer les prévisions',
        'forecast.loading': 'Génération des prévisions intelligentes...',
        'forecast.error': 'Erreur lors de la génération des prévisions',
        'forecast.options.periods': 'Périodes',
        'forecast.options.frequency': 'Fréquence',
        'forecast.options.budget': 'Budget (optionnel)',
        'forecast.frequency.monthly': 'Mensuel',
        'forecast.frequency.quarterly': 'Trimestriel',
        'forecast.summary.avgForecast': 'Moy. Prévision',
        'forecast.summary.trend': 'Tendance',
        'forecast.summary.budgetStatus': 'État Budget',
        'forecast.summary.alerts': 'Alertes Actives',
        'forecast.trend.increasing': 'En hausse',
        'forecast.trend.decreasing': 'En baisse',
        'forecast.trend.stable': 'Stable',
        'forecast.status.on_track': 'Dans les Limites',
        'forecast.status.warning': 'Surveillance',
        'forecast.status.medium': 'Attention',
        'forecast.status.high': 'Alerte',
        'forecast.status.critical': 'Critique',
        'forecast.status.no_budget': 'Pas de Budget',
        'forecast.alert.forecast': 'Prévision',
        'forecast.alert.budget': 'Budget',
        'forecast.alert.difference': 'Différence',
        'forecast.chart.title': 'Prévisions des Émissions CO₂',
        'forecast.chart.historical': 'Historique',
        'forecast.chart.forecast': 'Prévision',
        'forecast.chart.lower': 'Borne Inférieure',
        'forecast.chart.upper': 'Borne Supérieure',
        'forecast.chart.period': 'Période',
        'forecast.categories.title': 'Prévisions par Catégorie',
        'forecast.budget': 'Budget',
        'forecast.difference': 'Différence',
        'forecast.recommendations.title': 'Actions Recommandées',

        // Recommendations Page
        'recommendations.title': 'Recommandations',
        'recommendations.subtitle': 'Actions concrètes pour réduire votre empreinte carbone',
        'recommendations.summary.title': 'Potentiel de réduction',
        'recommendations.summary.unit': 'économisables',
        'recommendations.action': 'Obtenir des recommandations',
        'recommendations.loading': 'Génération des recommandations...',
        'recommendations.impact.high': 'Impact élevé',
        'recommendations.impact.medium': 'Impact moyen',
        'recommendations.impact.low': 'Impact faible',

        // Categories
        'category.voyages_aeriens': 'Voyages aériens',
        'category.transport_routier': 'Transport routier',
        'category.energie': 'Énergie',
        'category.materiaux': 'Matériaux',
        'category.services': 'Services',
        'category.equipements': 'Équipements',
        'category.achat': 'Achats',
        'category.approvisionnement': 'Approvisionnement',
        'category.article': 'Articles',
        'category.autres': 'Autres',

        // Filters
        'filters.title': 'Filtres',
        'filters.period.label': 'Période',
        'filters.period.all': 'Tout',
        'filters.period.month': 'Ce mois',
        'filters.period.quarter': 'Ce trimestre',
        'filters.period.year': 'Cette année',
        'filters.period.custom': 'Plage personnalisée',
        'filters.date.start': 'Date de début',
        'filters.date.end': 'Date de fin',
        'filters.date.range': 'Plage de dates personnalisée',
        'filters.date.from': 'Du',
        'filters.date.to': 'Au',
        'filters.type.label': 'Catégorie',
        'filters.type.all': 'Toutes les catégories',
        'filters.sector.label': 'Secteur',
        'filters.sector.all': 'Tous les secteurs',
        'filters.sector.transport': 'Transport',
        'filters.sector.energy': 'Énergie',
        'filters.sector.construction': 'Construction',
        'filters.sector.technology': 'Technologie',
        'filters.sector.services': 'Services',
        'filters.sector.retail': 'Commerce',
        'filters.sector.manufacturing': 'Fabrication',
        'filters.sector.other': 'Autre',
        'filters.apply': 'Appliquer',
        'filters.reset': 'Réinitialiser',

        // Supplier Chart
        'charts.supplier.title': 'Principaux fournisseurs par émissions',
        'charts.supplier.subtitle': 'Identifiez les fournisseurs à fort impact',

        // Export
        'export.pdf': 'Exporter PDF',
        'export.excel': 'Exporter Excel',

        // ESG Report
        'report.generate': 'Générer Rapport ESG',
        'report.modal.title': 'Générer un Rapport ESG/RSE',
        'report.modal.description': 'Générez un rapport carbone professionnel conforme aux standards ADEME et GHG Protocol.',
        'report.modal.language': 'Langue',
        'report.modal.format': 'Format',
        'report.modal.commitments': 'Engagements Climat',
        'report.modal.includes': 'Le rapport inclut :',
        'report.modal.feature1': 'Résumé exécutif avec indicateurs clés',
        'report.modal.feature2': 'Répartition des émissions par scope et catégorie',
        'report.modal.feature3': 'Graphiques d\'évolution mensuelle',
        'report.modal.feature4': 'Benchmarks réglementaires (BEGES, SBT)',
        'report.modal.feature5': 'Recommandations actionnables',
        'report.modal.cancel': 'Annuler',
        'report.modal.generate': 'Générer le Rapport',

        // Action Plan
        'actionplan.title': 'Plan d\'Action Climat',
        'actionplan.subtitle': 'Votre feuille de route personnalisée pour réduire vos émissions',
        'actionplan.summary.totalActions': 'Actions Totales',
        'actionplan.summary.potentialReduction': 'Réduction Potentielle',
        'actionplan.summary.highPriority': 'Priorité Haute',
        'actionplan.summary.completed': 'Complétées',
        'actionplan.filter.all': 'Toutes les Actions',
        'actionplan.filter.high': 'Priorité Haute',
        'actionplan.filter.medium': 'Priorité Moyenne',
        'actionplan.filter.low': 'Priorité Basse',
        'actionplan.export.google': 'Google Agenda',
        'actionplan.export.outlook': 'Outlook',
        'actionplan.export.ics': 'Télécharger .ics',
        'actionplan.empty.title': 'Générez Votre Plan d\'Action',
        'actionplan.empty.desc': 'Créez un plan d\'action climat personnalisé basé sur vos données d\'émissions',
        'actionplan.empty.action': 'Générer le Plan d\'Action',
        'actionplan.loading': 'Génération de votre plan d\'action...',
        'actionplan.action.priority': 'Priorité',
        'actionplan.action.impact': 'Impact',
        'actionplan.action.feasibility': 'Faisabilité',
        'actionplan.action.reduction': 'Réduction potentielle',
        'actionplan.action.markComplete': 'Marquer comme Complété',
        'actionplan.action.addToCalendar': 'Ajouter au Calendrier',
        'actionplan.action.addNote': 'Ajouter une Note',
        'actionplan.action.completed': 'Complété',
        'actionplan.impact.high': 'Élevé',
        'actionplan.impact.medium': 'Moyen',
        'actionplan.impact.low': 'Faible',
        'actionplan.feasibility.easy': 'Facile',
        'actionplan.feasibility.medium': 'Moyen',
        'actionplan.feasibility.hard': 'Difficile',

        // Table Headers
        'table.header.date': 'Date',
        'table.header.supplier': 'Fournisseur',
        'table.header.category': 'Catégorie',
        'table.header.amount': 'Montant',
        'table.header.emissions': 'Émissions',

        // Footer
        'footer.copyright': '© 2025 Green App - Carbon Analytics Platform',
        'footer.tagline': 'Mesurez, analysez, réduisez votre empreinte carbone',

        // Units
        'unit.kgco2e': 'kg CO₂e',
        'unit.invoice': 'facture',
        'unit.invoices': 'factures',

        // Demo section
        'demo.title': 'Démonstration de Conversion',
        'demo.subtitle': 'Changez de langue pour voir la conversion automatique',
        'demo.emissions': 'Émissions',
        'demo.distance': 'Distance',
        'demo.weight': 'Poids',

        // Actions
        'action.download': 'Télécharger',
        'action.delete': 'Supprimer',
        'action.cancel': 'Annuler',
        'action.confirm': 'Confirmer',

        // Messages
        'message.deleteConfirm': 'Êtes-vous sûr de vouloir supprimer ce fichier ? Cette action est irréversible.',
        'message.error': 'Erreur',
        'message.success': 'Succès',
        'message.loading': 'Chargement...'
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
 * @param {number} value - Weight value (always stored in kg)
 * @param {string} targetLang - Target language ('en' or 'fr')
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
 * @param {number} value - Distance value (always stored in km)
 * @param {string} targetLang - Target language ('en' or 'fr')
 * @returns {number} Converted distance
 */
function convertDistance(value, targetLang = currentLang) {
    if (targetLang === 'en') {
        return kmToMi(value);
    }
    return value; // Keep as km for French
}

/**
 * Format number with appropriate decimal places
 * @param {number} value - Number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number
 */
function formatNumber(value, decimals = 2) {
    return new Intl.NumberFormat(currentLang === 'fr' ? 'fr-FR' : 'en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

/**
 * Format weight value with unit
 * @param {number} kg - Weight in kilograms (base unit)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted weight with unit (e.g., "120 kg CO₂e" or "264.55 lbs CO₂e")
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
 * @returns {string} Formatted distance with unit (e.g., "100 km" or "62.14 mi")
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
 * @returns {string} Formatted currency (e.g., "€1,234.56" or "$1,234.56")
 */
function formatCurrency(amount, decimals = 2) {
    const formatted = formatNumber(amount, decimals);
    const symbol = UNIT_SYMBOLS[currentLang].currencySymbol;
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
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);

        // Update text content (for most elements)
        if (element.tagName === 'INPUT' && element.type === 'button') {
            element.value = translation;
        } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.placeholder = translation;
        } else {
            element.textContent = translation;
        }
    });

    // Update elements with data-i18n-placeholder attribute (for inputs)
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });

    // Update elements with data-i18n-title attribute (for tooltips)
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        element.title = t(key);
    });

    // Update elements with unit conversion
    updateUnitsOnPage();

    // Update the language toggle button text
    const langBtn = document.getElementById('langToggle');
    if (langBtn) {
        langBtn.textContent = currentLang === 'en' ? 'FR' : 'EN';
    }

    // Store language preference in localStorage
    localStorage.setItem('greenapp-lang', currentLang);

    // Dispatch custom event to notify other scripts that language has changed
    document.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { language: currentLang }
    }));
}

/**
 * Update all units on the page based on current language
 * Elements with data-value and data-unit attributes will be converted
 */
function updateUnitsOnPage() {
    // Update elements with data-value and data-unit attributes
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
            default:
                formattedValue = formatNumber(value);
        }

        element.textContent = formattedValue;
    });

    // Update elements with data-unit-symbol attribute (just the unit symbol)
    document.querySelectorAll('[data-unit-symbol]').forEach(element => {
        const unitType = element.getAttribute('data-unit-symbol');
        const symbol = getUnitSymbol(unitType);
        element.textContent = symbol;
    });
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
 * Initialize language from localStorage or default to English
 */
function initLanguage() {
    // Check if there's a saved language preference
    const savedLang = localStorage.getItem('greenapp-lang');

    if (savedLang && translations[savedLang]) {
        currentLang = savedLang;
    } else {
        // Default to English
        currentLang = 'en';
    }

    // Apply language to page
    updatePageLanguage();
}

// Initialize language when DOM is ready
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

// Export functions for use in other scripts
window.i18n = {
    // Translation
    t,
    switchLanguage,
    toggleLanguage,
    getCurrentLang: () => currentLang,

    // Unit conversion
    kgToLbs,
    lbsToKg,
    kmToMi,
    miToKm,
    convertWeight,
    convertDistance,

    // Formatting
    formatNumber,
    formatWeight,
    formatDistance,
    formatCurrency,
    getUnitSymbol,

    // Update functions
    updateUnitsOnPage,

    // Constants
    CONVERSION_FACTORS,
    UNIT_SYMBOLS
};
