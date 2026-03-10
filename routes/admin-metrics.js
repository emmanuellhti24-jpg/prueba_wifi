const express = require('express');
const router = express.Router();
const { verificarToken, permitirRoles } = require('../middleware/auth');
const metricsController = require('../controllers/metrics.controller');
// const analyticsService = require('../services/analytics.service'); // Opcional si existe

router.use(verificarToken);
router.use(permitirRoles('admin'));

// Endpoints existentes (mantener compatibilidad)
router.get('/financial', metricsController.getFinancialMetrics);
router.get('/financials', metricsController.getFinancialMetrics); // Alias plural para compatibilidad
router.get('/top-products', metricsController.getTopProducts);
router.get('/hourly', metricsController.getHourlySales);
router.get('/category', metricsController.getCategoryDistribution);
router.get('/categories', metricsController.getCategoryDistribution); // Alias plural para compatibilidad
router.get('/inventory-alerts', metricsController.getInventoryAlerts);

// Dashboard avanzado (migrado de metrics.js)
router.get('/dashboard', metricsController.getAdvancedDashboard);

module.exports = router;
