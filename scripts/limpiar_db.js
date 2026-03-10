require('dotenv').config();
const mongoose = require('mongoose');
const Pedido = require('../models/Pedido');
const Merma = require('../models/Merma');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/prueba_wifi';

async function limpiar() {
  try {
    // Ajusta la cadena de conexión si es necesario
    await mongoose.connect(MONGO_URI);
    console.log('🟢 Conectado a BD');

    // 1. Eliminar todas las órdenes (limpieza total de ventas)
    const pedidos = await Pedido.deleteMany({});
    console.log(`🧹 Se eliminaron ${pedidos.deletedCount} órdenes (historial de ventas).`);

    // 2. Opcional: Eliminar mermas
    const mermas = await Merma.deleteMany({});
    console.log(`🧹 Se eliminaron ${mermas.deletedCount} registros de merma.`);

    console.log('✅ Base de datos depurada correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('🔴 Error:', error);
    process.exit(1);
  }
}

limpiar();