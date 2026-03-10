require('dotenv').config();
const http = require('http');
const https = require('https'); // Módulo para servidor seguro
const fs = require('fs');       // Para leer certificados
const os = require('os');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');
const morgan = require('morgan');
const ordersRouter = require('./routes/orders');


// Importaciones locales
const connectDB = require('./config/db');
const { verificarToken, permitirRoles } = require('./middleware/auth.js');
const { initCronJobs } = require('./services/cron.service');
const WorkflowService = require('./services/workflow.service');

// Modelos y Lógica de Negocio
const Pedido = require('./models/Pedido');
const StockManager = require('./services/stock.service');

// --- 1. CONFIGURACIÓN INICIAL ---
const app = express();

// Configuración de Certificados SSL (Autofirmados)
let server;
const certPath = path.join(__dirname, 'certs');
const keyFile = path.join(certPath, 'key.pem');
const certFile = path.join(certPath, 'cert.pem');

if (fs.existsSync(keyFile) && fs.existsSync(certFile)) {
    // Si existen certificados, iniciamos HTTPS
    const httpsOptions = {
        key: fs.readFileSync(keyFile),
        cert: fs.readFileSync(certFile)
    };
    server = https.createServer(httpsOptions, app);
    console.log('🔒 Modo Seguro (HTTPS) habilitado');
} else {
    // Fallback a HTTP si no hay certificados
    server = http.createServer(app);
    console.log('⚠️  Certificados no encontrados. Iniciando en modo HTTP (No seguro).');
}

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

// Middleware para adjuntar `io` a cada request, para que esté disponible en las rutas
app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- 3. RUTAS MODULARES ---
app.use('/api', require('./routes/auth.js')); // Rutas de autenticación (/api/login)
app.use('/api/products', require('./routes/products.js'));
app.use('/api/orders', ordersRouter);
app.use('/api/pedido', ordersRouter); // COMPATIBILIDAD: Permite que el frontend siga usando /api/pedido
app.use('/api/inventory', require('./routes/inventory.js'));
app.use('/api/admin/metrics', require('./routes/admin-metrics.js')); // Métricas avanzadas
app.use('/api/metrics', require('./routes/admin-metrics.js')); // COMPATIBILIDAD: Rutas antiguas para el panel
app.use('/api/users', require('./routes/users.js'));
app.use('/api/promotions', require('./routes/promotions.js')); // Sistema de promociones 3x2

// --- 4. RUTAS ESPECIALES (Lógica de negocio principal) ---
// La lógica de creación y actualización de pedidos se ha movido a /api/orders

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

// La lógica para obtener transiciones se ha movido a /api/orders/:id/transiciones

// --- 5. SOCKET.IO y ARRANQUE DEL SERVIDOR ---
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado a Socket.io:', socket.id);
  socket.on('disconnect', () => {
    // console.log('❌ Cliente desconectado:', socket.id);
  });
});

// Evitar que archivos estáticos faltantes devuelvan index.html (Error MIME type)
app.get(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$/, (req, res) => {
  res.status(404).send('Archivo no encontrado');
});

// Fallback: para cualquier otra ruta, servir el index.html (ideal para SPAs)
app.get(/.*/, (req, res) => {
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
  const protocol = server instanceof https.Server ? 'https' : 'http';
  console.log(`🚀 Servidor corriendo en ${protocol}://localhost:${PORT}`);
  console.log(`🔗 LINK PARA EL PORTAL CAUTIVO: ${protocol}://${getNetworkIp()}:${PORT}`);
});
