const express = require('express');
const router = express.Router();
const MetricsController = require('../controllers/metrics.controller');
const { verificarToken, permitirRoles } = require('../middlewares/auth.middleware');

router.get('/dashboard', verificarToken, permitirRoles('admin'), MetricsController.getDashboardMetrics);

module.exports = router;