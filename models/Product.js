const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  categoria: { type: String, required: true, enum: ['hamburguesas', 'hotdogs', 'bebidas', 'snacks', 'extras'] },
  precios: { type: Object, default: {} },
  precioUnitario: { type: Number, default: 0 },
  costoProduccion: { type: Number, default: 0 },
  imagen: { type: String },
  ingredientes: [String],
  adicionales: [{ nombre: String, precio: Number }],
  
  // Receta técnica: Vincula el producto con el inventario real
  receta: [{
    insumo: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    cantidad: Number
  }],
  costoEstimado: { type: Number, default: 0 }
});

module.exports = mongoose.model('Product', ProductSchema);