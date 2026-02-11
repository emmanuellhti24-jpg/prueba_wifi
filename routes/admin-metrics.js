const express = require('express');
const router = express.Router();
const { verificarToken, permitirRoles } = require('../middleware/auth');
const metricsController = require('../controllers/metrics.controller');

router.use(verificarToken);
router.use(permitirRoles('admin'));

router.get('/financial', metricsController.getFinancialMetrics);
router.get('/top-products', metricsController.getTopProducts);
router.get('/hourly', metricsController.getHourlySales);
router.get('/category', metricsController.getCategoryDistribution);
router.get('/inventory-alerts', metricsController.getInventoryAlerts);

module.exports = router;
