const express = require('express');
const router = express.Router();
const StockManager = require('../models/StockManager');
const Sale = require('../models/Sale'); // Nuevo modelo de ventas
const { verificarToken, permitirRoles } = require('../src/middlewares/auth.middleware');

// Endpoint existente (Dashboard General)
router.get('/dashboard', verificarToken, permitirRoles('admin'), async (req, res) => {
    const { start, end } = req.query;
    const startDate = start ? new Date(start) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = end ? new Date(end) : new Date();

    try {
        const metrics = await StockManager.obtenerMetricasAvanzadas(startDate, endDate);
        res.json(metrics);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- NUEVOS ENDPOINTS DE INTELIGENCIA DE NEGOCIOS ---

// 1. Reporte Financiero (Ganancias vs Costos)
router.get('/financials', verificarToken, permitirRoles('admin'), async (req, res) => {
    try {
        const { start, end } = req.query;
        const startDate = start ? new Date(start) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const endDate = end ? new Date(end) : new Date();

        const financials = await Sale.aggregate([
            { $match: { fecha: { $gte: startDate, $lte: endDate } } },
            {
                $group: {
                    _id: null,
                    ingresoTotal: { $sum: "$totalVenta" },
                    costoTotal: { $sum: "$totalCosto" },
                    gananciaNeta: { $sum: "$gananciaNeta" },
                    ticketPromedio: { $avg: "$totalVenta" },
                    totalTransacciones: { $sum: 1 }
                }
            }
        ]);

        res.json(financials[0] || { ingresoTotal: 0, costoTotal: 0, gananciaNeta: 0 });
    } catch (error) {
        res.status(500).json({ error: 'Error calculando finanzas' });
    }
});

// 2. Ventas por Categoría (Hamburguesas vs HotDogs)
router.get('/categories', verificarToken, permitirRoles('admin'), async (req, res) => {
    try {
        const categoryStats = await Sale.aggregate([
            { $unwind: "$items" }, // Desglosar cada venta en sus productos individuales
            {
                $group: {
                    _id: "$items.categoria", // Agrupar por categoría (ej. 'hamburguesas')
                    cantidadVendida: { $sum: "$items.cantidad" },
                    dineroGenerado: { $sum: { $multiply: ["$items.cantidad", "$items.precioUnitario"] } }
                }
            },
            { $sort: { cantidadVendida: -1 } } // Ordenar de mayor a menor
        ]);
        res.json(categoryStats);
    } catch (error) {
        res.status(500).json({ error: 'Error en reporte de categorías' });
    }
});

// 3. Top Productos (Ranking de Popularidad)
router.get('/top-products', verificarToken, permitirRoles('admin'), async (req, res) => {
    try {
        const topProducts = await Sale.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.nombre", // Agrupar por nombre del producto
                    unidades: { $sum: "$items.cantidad" },
                    gananciaGenerada: { 
                        $sum: { 
                            $multiply: [
                                "$items.cantidad", 
                                { $subtract: ["$items.precioUnitario", "$items.costoUnitario"] } 
                            ] 
                        } 
                    }
                }
            },
            { $sort: { unidades: -1 } }, // Los más vendidos primero
            { $limit: 5 } // Solo el Top 5
        ]);
        res.json(topProducts);
    } catch (error) {
        res.status(500).json({ error: 'Error en ranking de productos' });
    }
});

module.exports = router;