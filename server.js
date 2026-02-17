require('dotenv').config();
const http = require('http');
const os = require('os');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');
const morgan = require('morgan');

// Importaciones locales
const connectDB = require('./config/db');
const { verificarToken, permitirRoles } = require('./middleware/auth.js');
const { initCronJobs } = require('./services/cron.service');
const WorkflowService = require('./services/workflow.service');

// Modelos y Lógica de Negocio
const Pedido = require('./models/Pedido');
const StockManager = require('./models/StockManager');

// --- 1. CONFIGURACIÓN INICIAL ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Permitir conexiones de cualquier origen
  }
});

const PORT = process.env.PORT || 3000;

// Conectar a la Base de Datos
connectDB();

// Iniciar Cron Jobs
initCronJobs();

// --- 2. MIDDLEWARES GLOBALES ---
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(cors());
// Desactivar CSP para desarrollo local
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(express.json()); // Parsear bodies de JSON
app.use(express.urlencoded({ extended: true })); // Parsear bodies URL-encoded

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// --- 3. RUTAS MODULARES ---
app.use('/api', require('./routes/auth.js')); // Rutas de autenticación (/api/login)
app.use('/api/products', require('./routes/products.js'));
app.use('/api/inventory', require('./routes/inventory.js'));
app.use('/api/metrics', require('./routes/metrics.js'));
app.use('/api/admin/metrics', require('./routes/admin-metrics.js')); // Métricas avanzadas
app.use('/api/users', require('./routes/users.js'));
app.use('/api/promotions', require('./routes/promotions.js')); // Sistema de promociones 3x2

// --- 4. RUTAS ESPECIALES (Lógica de negocio principal) ---
app.post('/api/pedido', async (req, res) => {
  try {
    const { cliente, tipo, items, total } = req.body;
    
    // Validaciones básicas
    if (!cliente || !tipo || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Datos incompletos o inválidos' });
    }
    
    if (typeof total !== 'number' || total <= 0) {
      return res.status(400).json({ error: 'Total inválido' });
    }
    
    const ultimoPedido = await Pedido.findOne().sort({ fecha: -1 });
    let numeroOrden = 1;
    if (ultimoPedido) {
      const hoy = new Date().setHours(0, 0, 0, 0);
      const fechaUltimo = new Date(ultimoPedido.fecha).setHours(0, 0, 0, 0);
      numeroOrden = hoy > fechaUltimo ? 1 : ultimoPedido.numeroOrden + 1;
    }

    const nuevoPedido = new Pedido({ numeroOrden, cliente, tipo, items, total });
    await nuevoPedido.save();

    console.log(`🍔 Pedido #${numeroOrden} recibido de ${cliente}.`);
    io.emit('nuevo-pedido', nuevoPedido);
    res.json({ success: true, numeroOrden });
  } catch (error) {
    console.error('Error guardando pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.post('/api/pedido/:id/status', verificarToken, async (req, res) => {
  try {
    const { status } = req.body;
    const pedido = await Pedido.findById(req.params.id);
    
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const estadoAnterior = pedido.status;
    const rol = req.user.role;

    // Validar transición de estado con el workflow service
    const validacion = WorkflowService.validarTransicion(estadoAnterior, status, rol);
    
    if (!validacion.valido) {
      return res.status(403).json({ 
        error: 'Transición no permitida',
        detalle: validacion.mensaje,
        estadoActual: estadoAnterior,
        estadoSolicitado: status
      });
    }

    // Actualizar estado
    pedido.status = status;
    
    // Agregar entrada al historial de cambios
    if (!pedido.history) pedido.history = [];
    pedido.history.push({
      status: status,
      timestamp: new Date(),
      user: req.user.username || req.user.id,
      role: rol
    });

    await pedido.save();

    // Lógica de negocio al cambiar de estado
    if (status === 'IN_KITCHEN' && estadoAnterior === 'PENDING_PAYMENT') {
      try {
        await StockManager.procesarSalidaDeStock(pedido);
        console.log(`📉 Stock descontado para Pedido #${pedido.numeroOrden}.`);
      } catch (stockError) {
        console.error('Error descontando stock:', stockError);
        // Continuar aunque falle el descuento de stock
      }
    }
    
    if (status === 'COMPLETED' && estadoAnterior !== 'COMPLETED') {
      try {
        await StockManager.registrarVenta(pedido, req.user);
        console.log(`✅ Pedido #${pedido.numeroOrden} completado y registrado.`);
      } catch (ventaError) {
        console.error('Error registrando venta:', ventaError);
        // Continuar aunque falle el registro de venta
      }
    }

    // Emitir actualización en tiempo real a todos los clientes
    io.emit('actualizacion-pedido', {
      ...pedido.toObject(),
      estadoLegible: WorkflowService.ESTADOS_LEGIBLES[status],
      icono: WorkflowService.obtenerIconoEstado(status),
      color: WorkflowService.obtenerColorEstado(status)
    });

    console.log(`🔄 Pedido #${pedido.numeroOrden}: ${WorkflowService.ESTADOS_LEGIBLES[estadoAnterior]} → ${WorkflowService.ESTADOS_LEGIBLES[status]} (${rol})`);

    res.json({ 
      success: true,
      pedido: pedido,
      estadoAnterior: WorkflowService.ESTADOS_LEGIBLES[estadoAnterior],
      estadoNuevo: WorkflowService.ESTADOS_LEGIBLES[status]
    });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ error: 'Error actualizando estado.' });
  }
});

// 5. Listar Pedidos (PROTEGIDO: Solo Staff)
app.get('/api/pedidos', verificarToken, permitirRoles('admin', 'cashier', 'cook'), async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const pedidos = await Pedido.find({ 
      fecha: { $gte: hoy }, 
      status: { $ne: 'COMPLETED' } 
    }).sort({ fecha: -1 });
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

// 6. Verificar Estado (Público - Para sincronizar cliente)
app.get('/api/pedido/:id/status', async (req, res) => {
  try {
    const pedido = await Pedido.findOne({ numeroOrden: req.params.id });
    if (!pedido) return res.status(404).json({ error: 'No encontrado' });
    
    res.json({ 
      estado: pedido.status,
      estadoLegible: WorkflowService.ESTADOS_LEGIBLES[pedido.status],
      icono: WorkflowService.obtenerIconoEstado(pedido.status),
      color: WorkflowService.obtenerColorEstado(pedido.status),
      esFinal: WorkflowService.esFinal(pedido.status),
      numeroOrden: pedido.numeroOrden,
      cliente: pedido.cliente,
      total: pedido.total
    });
  } catch (error) { 
    res.status(500).json({ error: 'Error' }); 
  }
});

// 7. Obtener transiciones disponibles para un pedido (Staff)
app.get('/api/pedido/:id/transiciones', verificarToken, async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    
    const siguientesEstados = WorkflowService.obtenerSiguientesEstados(
      pedido.status, 
      req.user.role
    );
    
    res.json({
      success: true,
      estadoActual: {
        codigo: pedido.status,
        nombre: WorkflowService.ESTADOS_LEGIBLES[pedido.status]
      },
      transicionesDisponibles: siguientesEstados
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo transiciones' });
  }
});

// --- 5. SOCKET.IO y ARRANQUE DEL SERVIDOR ---
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado a Socket.io:', socket.id);
  socket.on('disconnect', () => {
    // console.log('❌ Cliente desconectado:', socket.id);
  });
});

// Fallback: para cualquier otra ruta, servir el index.html (ideal para SPAs)
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function getNetworkIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🔗 LINK PARA EL PORTAL CAUTIVO: http://${getNetworkIp()}:${PORT}`);
});
