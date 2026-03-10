const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  numeroOrden: { type: Number, required: true },
  cliente: { type: String, required: true },
  tipo: { type: String, required: true }, // 'Comer aqui' | 'Para llevar'
  items: [], // Array de productos con sus modificaciones
  total: { type: Number, required: true },
  dispositivo: String,
  fecha: { type: Date, default: Date.now },
  
  // Máquina de Estados
  status: {
    type: String,
    enum: ['PENDING_PAYMENT', 'IN_KITCHEN', 'PREPARING', 'READY', 'COMPLETED'],
    default: 'PENDING_PAYMENT',
    index: true
  },
  
  // Auditoría de tiempos
  history: [
    {
      status: String,
      timestamp: { type: Date, default: Date.now },
      user: String // ID o Rol del usuario que hizo el cambio
    }
  ]
});

module.exports = mongoose.model('Pedido', OrderSchema);