const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const StockManager = require('../models/StockManager');
const { verificarToken, permitirRoles } = require('../middleware/auth');

// Aplicar autenticación a todas las rutas
router.use(verificarToken);

// GET: Listar todo
router.get('/', async (req, res) => {
    try {
        const items = await Inventory.find().sort({ nombre: 1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Error de servidor' });
    }
});

// POST: Crear nuevo insumo
router.post('/', async (req, res) => {
    try {
        const newItem = new Inventory(req.body);
        await newItem.save();
        res.json(newItem);
    } catch (error) {
        res.status(400).json({ error: 'Datos inválidos' });
    }
});

// PUT: Actualizar insumo (stock, precio)
router.put('/:id', async (req, res) => {
    try {
        const updated = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ error: 'Error actualizando' });
    }
});

// POST: Registrar Merma
router.post('/merma', async (req, res) => {
    try {
        const { insumoId, cantidad, motivo, usuario } = req.body;
        await StockManager.registrarMerma(insumoId, cantidad, motivo, usuario);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE: Borrar insumo
router.delete('/:id', async (req, res) => {
    try {
        await Inventory.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error eliminando' });
    }
});

module.exports = router;