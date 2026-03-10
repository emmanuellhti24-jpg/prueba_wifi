const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // ID legible (ej. "h_hawaiana")
  nombre: { type: String, required: true },
  categoria: { type: String, required: true, enum: ['hamburguesas', 'hotdogs', 'bebidas', 'snacks', 'extras'] }, 
  precios: { type: Object, default: {} }, // Ej: { "1": 70, "2": 120, "3": 160 }
  precioUnitario: { type: Number, default: 0 }, // Para items sin promo volumen
  costoProduccion: { type: Number, default: 0 }, // Costo calculado de insumos (Costo Real)
  imagen: { type: String }, // URL de la imagen para el menú digital
  ingredientes: [String], // ["Cebolla", "Tomate", "Lechuga"] (Ingredientes base quitables)
  adicionales: [{ nombre: String, precio: Number }], // [{"nombre": "Queso Extra", "precio": 10}]
  
  // Receta técnica: Vincula el producto con el inventario real
  receta: [{
    insumo: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    cantidad: Number // Cuánto se gasta por unidad (ej. 0.150 kg de carne)
  }],
  costoEstimado: { type: Number, default: 0 } // Se calcula sumando (insumo.costo * cantidad)
});

module.exports = mongoose.model('Product', ProductSchema);