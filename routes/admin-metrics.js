const express = require('express');
const router = express.Router();
const { verificarToken, permitirRoles } = require('../middleware/auth');
const metricsController = require('../controllers/metrics.controller');
const analyticsService = require('../services/analytics.service');

router.use(verificarToken);
router.use(permitirRoles('admin'));

// Endpoints existentes (mantener compatibilidad)
router.get('/financial', metricsController.getFinancialMetrics);
router.get('/top-products', metricsController.getTopProducts);
router.get('/hourly', metricsController.getHourlySales);
router.get('/category', metricsController.getCategoryDistribution);
router.get('/inventory-alerts', metricsController.getInventoryAlerts);

// Nuevos endpoints de analítica avanzada
router.get('/dashboard', async (req, res) => {
    try {
        const { start, end } = req.query;
        const startDate = start ? new Date(start) : new Date(new Date().setDate(new Date().getDate() - 30));
        const endDate = end ? new Date(end) : new Date();

        const dashboard = await analyticsService.getCompleteDashboard(startDate, endDate);
        res.json(dashboard);
    } catch (error) {
        console.error('Error generando dashboard:', error);
        res.status(500).json({ error: 'Error generando dashboard' });
    }
});

router.get('/suggestions', async (req, res) => {
    try {
        const { start, end } = req.query;
        const startDate = start ? new Date(start) : new Date(new Date().setDate(new Date().getDate() - 30));
        const endDate = end ? new Date(end) : new Date();

        const suggestions = await analyticsService.generateSuggestions(startDate, endDate);
        res.json({
            success: true,
            total: suggestions.length,
            sugerencias: suggestions
        });
    } catch (error) {
        console.error('Error generando sugerencias:', error);
        res.status(500).json({ error: 'Error generando sugerencias' });
    }
});

router.get('/peak-hours', async (req, res) => {
    try {
        const { start, end } = req.query;
        const startDate = start ? new Date(start) : new Date(new Date().setDate(new Date().getDate() - 30));
        const endDate = end ? new Date(end) : new Date();

        const peakHours = await analyticsService.getPeakHours(startDate, endDate);
        res.json({
            success: true,
            ...peakHours
        });
    } catch (error) {
        console.error('Error analizando horarios:', error);
        res.status(500).json({ error: 'Error analizando horarios' });
    }
});

router.get('/top-10', async (req, res) => {
    try {
        const { start, end } = req.query;
        const startDate = start ? new Date(start) : new Date(new Date().setDate(new Date().getDate() - 30));
        const endDate = end ? new Date(end) : new Date();

        const topProducts = await analyticsService.getTopProducts(startDate, endDate);
        res.json({
            success: true,
            total: topProducts.length,
            productos: topProducts
        });
    } catch (error) {
        console.error('Error obteniendo top 10:', error);
        res.status(500).json({ error: 'Error obteniendo top 10' });
    }
});

module.exports = router;
