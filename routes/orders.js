const express = require('express');
const router = express.Router();
const Pedido = require('../models/Pedido');
const StockManager = require('../services/stock.service');
const WorkflowService = require('../services/workflow.service');
const { verificarToken, permitirRoles } = require('../middleware/auth');

// GET: Obtener todas las órdenes (con filtros opcionales)
router.get('/', verificarToken, async (req, res) => {
    try {
        const { status, fecha } = req.query;
        let filtro = {};
        
        if (status) filtro.status = status;
        if (fecha) {
            const start = new Date(fecha);
            const end = new Date(fecha);
            end.setHours(23, 59, 59);
            filtro.fecha = { $gte: start, $lte: end };
        }

        const pedidos = await Pedido.find(filtro).sort({ fecha: -1 });
        res.json(pedidos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener órdenes' });
    }
});

// GET: Obtener una orden por su ID
router.get('/:id', verificarToken, async (req, res) => {
    try {
        const pedido = await Pedido.findById(req.params.id);
        if (!pedido) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        res.json(pedido);
    } catch (error) {
        console.error('Error obteniendo orden por ID:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST: Crear nueva orden
router.post('/', async (req, res) => { // Se quita verificarToken si el cliente que ordena no está logueado
    try {
        const { cliente, tipo, items, total } = req.body;
        const io = req.io;

        // Validaciones básicas
        if (!cliente || !tipo || !items || !Array.isArray(items) || items.length === 0 || typeof total !== 'number' || total <= 0) {
            return res.status(400).json({ error: 'Datos incompletos o inválidos' });
        }

        // Lógica para el número de orden autoincremental por día
        const ultimoPedido = await Pedido.findOne().sort({ fecha: -1 });
        let numeroOrden = 1;
        if (ultimoPedido) {
            const hoy = new Date().setHours(0, 0, 0, 0);
            const fechaUltimo = new Date(ultimoPedido.fecha).setHours(0, 0, 0, 0);
            numeroOrden = hoy > fechaUltimo ? 1 : ultimoPedido.numeroOrden + 1;
        }

        const nuevoPedido = new Pedido({ 
            numeroOrden, 
            cliente, 
            tipo, 
            items, 
            total,
            fecha: new Date(), // IMPORTANTE: Sin esto, no aparece en la lista de hoy del staff
            status: WorkflowService.ESTADOS.PENDING_PAYMENT // CORRECCIÓN: Usar el estado correcto del flujo
        });
        await nuevoPedido.save();

        console.log(`🍔 Pedido #${numeroOrden} recibido de ${cliente}.`);
        io.emit('nuevo-pedido', nuevoPedido); // Notificar a los clientes (cocina, caja)
        res.status(201).json({ success: true, numeroOrden, pedido: nuevoPedido });

    } catch (error) {
        console.error('Error guardando pedido:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// POST: Actualizar estado de la orden (Compatibilidad con frontend existente)
router.post('/:id/status', verificarToken, async (req, res) => {
    try {
        console.log(`🔍 Intentando actualizar pedido ID: ${req.params.id}`);
        const { status } = req.body;
        const pedido = await Pedido.findById(req.params.id);
        const io = req.io;
        
        if (!pedido) {
            console.log(`❌ Pedido ${req.params.id} NO encontrado en BD.`);
            return res.status(404).json({ error: 'Pedido no encontrado en base de datos' });
        }

        const estadoAnterior = pedido.status;
        const rol = req.user.role; // CORRECCIÓN: Usar 'role' en lugar de 'rol'

        // 1. Validar transición usando tu WorkflowService
        const validacion = WorkflowService.validarTransicion(
            estadoAnterior, 
            status, 
            rol
        );

        if (!validacion.valido) {
            console.log(`⚠️ Transición inválida: ${validacion.mensaje}`);
            return res.status(403).json({ error: 'Transición no permitida', detalle: validacion.mensaje });
        }

        // 2. Actualizar estado y registrar en historial
        pedido.status = status;
        if (!pedido.history) pedido.history = [];
        pedido.history.push({
            status: status,
            timestamp: new Date(),
            user: req.user.username || req.user.id,
            role: rol
        });
        await pedido.save();

        // 3. Efectos secundarios (Stock y Ventas) usando StockManager
        if (status === 'IN_KITCHEN' && estadoAnterior !== 'IN_KITCHEN') {
            try {
                await StockManager.procesarSalidaDeStock(pedido);
                console.log(`📉 Stock descontado para Pedido #${pedido.numeroOrden}.`);
            } catch (stockError) {
                console.error('Error descontando stock:', stockError);
            }
        }
        
        if (status === 'COMPLETED' && estadoAnterior !== 'COMPLETED') {
            try {
                await StockManager.registrarVenta(pedido, req.user);
                console.log(`✅ Pedido #${pedido.numeroOrden} completado y registrado.`);
            } catch (ventaError) {
                console.error('Error registrando venta:', ventaError);
            }
        }

        // 4. Emitir evento por Socket.IO para actualización en tiempo real
        const pedidoActualizado = {
            ...pedido.toObject(),
            estadoLegible: WorkflowService.ESTADOS_LEGIBLES[status],
            icono: WorkflowService.obtenerIconoEstado(status),
            color: WorkflowService.obtenerColorEstado(status)
        };
        io.emit('actualizacion-pedido', pedidoActualizado);
        console.log(`🔄 Pedido #${pedido.numeroOrden}: ${WorkflowService.ESTADOS_LEGIBLES[estadoAnterior]} → ${WorkflowService.ESTADOS_LEGIBLES[status]} (${rol})`);

        res.json({ 
            success: true, 
            pedido: pedidoActualizado, 
            mensaje: `Estado actualizado a ${WorkflowService.ESTADOS_LEGIBLES[status]}` 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// GET: Obtener transiciones disponibles para un pedido
router.get('/:id/transiciones', verificarToken, async (req, res) => {
    try {
        const pedido = await Pedido.findById(req.params.id);
        if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
        
        const siguientesEstados = WorkflowService.obtenerSiguientesEstados(
            pedido.status, 
            req.user.role // Usar 'role'
        );
        
        res.json({
            success: true,
            estadoActual: { codigo: pedido.status, nombre: WorkflowService.ESTADOS_LEGIBLES[pedido.status] },
            transicionesDisponibles: siguientesEstados
        });
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo transiciones' });
    }
});

module.exports = router;