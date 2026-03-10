const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  cantidad: { type: Number, default: 0 },
  unidad: { type: String, default: 'unidad' },
  seccion: { type: String, default: 'general' },
  minimo: { type: Number, default: 5 },
  costoUnitario: { type: Number, default: 0 }, // Costo promedio ponderado
  precio: { type: Number, default: 0 }, // Precio de venta (si se vende directo)
  proveedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  ultimaActualizacion: { type: Date, default: Date.now }
});

InventorySchema.statics.obtenerFaltantes = function() {
  return this.find({ $expr: { $lt: ["$cantidad", "$minimo"] } });
};

module.exports = mongoose.model('Inventory', InventorySchema);