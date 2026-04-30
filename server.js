require('dotenv').config();
const http = require('http');
const https = require('https'); // Módulo para servidor seguro
const fs = require('fs');       // Para leer certificados
const os = require('os');
const path = require('path');
const dgram = require('dgram'); // Para el mini servidor DNS
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

// Usar puerto 80 para HTTP o 443 para HTTPS (necesario para el router)
const PORT = process.env.PORT || (server instanceof https.Server ? 443 : 80);

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

// --- MIDDLEWARE PORTAL CAUTIVO ---
app.use((req, res, next) => {
  const myIp = getNetworkIp();
  const host = req.get('host') || '';
  
  // Rutas y dominios que usan iOS, Android y Windows para comprobar si hay internet
  const isCaptiveCheck = req.path.match(/(generate_204|gen_204|hotspot-detect\.html|success\.txt|ncsi\.txt|connecttest\.txt)/i);
  const isExternalDomain = host && !host.includes(myIp) && !host.includes('localhost') && !host.includes('127.0.0.1');

  if (isCaptiveCheck || isExternalDomain) {
    console.log(`📱 Dispositivo detectado, forzando portal: ${host}${req.url}`);
    return res.redirect(302, `http://${myIp}/`);
  }
  next();
});

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

// --- MINI SERVIDOR DNS (PORTAL CAUTIVO OFFLINE) ---
// Resuelve CUALQUIER dominio hacia la IP de esta computadora
const dnsServer = dgram.createSocket('udp4');
dnsServer.on('message', (msg, rinfo) => {
  try {
    const response = Buffer.alloc(msg.length + 16);
    msg.copy(response, 0, 0, msg.length); // Copiar la pregunta

    // Modificar cabeceras para indicar que es una respuesta
    response.writeUInt16BE(msg.readUInt16BE(0), 0); // ID de transacción
    response.writeUInt16BE(0x8180, 2); // Flags: Respuesta estándar sin error
    response.writeUInt16BE(1, 4); // Questions
    response.writeUInt16BE(1, 6); // Answer RRs
    response.writeUInt16BE(0, 8); // Authority RRs
    response.writeUInt16BE(0, 10); // Additional RRs

    // Construir la respuesta apuntando a tu IP
    let offset = msg.length;
    response.writeUInt16BE(0xC00C, offset); offset += 2; // Puntero al dominio consultado
    response.writeUInt16BE(1, offset); offset += 2; // Type A (IPv4)
    response.writeUInt16BE(1, offset); offset += 2; // Class IN
    response.writeUInt32BE(60, offset); offset += 4; // TTL (60 seg)
    response.writeUInt16BE(4, offset); offset += 2; // Longitud de la IP (4 bytes)

    const ipParts = getNetworkIp().split('.');
    ipParts.forEach(part => {
      response.writeUInt8(parseInt(part), offset); offset += 1;
    });

    dnsServer.send(response, 0, offset, rinfo.port, rinfo.address);
  } catch (err) {
    // Ignorar errores de paquetes malformados
  }
});

server.listen(PORT, () => {
  const protocol = server instanceof https.Server ? 'https' : 'http';
  console.log(`🚀 Servidor corriendo internamente en el puerto ${PORT}`);
  console.log(`🔗 IP PARA EL ROUTER (Ingresa solo esto): ${getNetworkIp()}`);
  
  // Iniciar el DNS en el puerto 5300
  dnsServer.bind(5300, () => {
    console.log(`📡 Mini DNS Server escuchando en el puerto 5300`);
  });
});
