const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  contacto: String,
  telefono: String,
  diasEntrega: [String], // Ej: ['Lunes', 'Jueves']
  categoria: String // 'Carniceria', 'Abarrotes'
});

module.exports = mongoose.model('Supplier', SupplierSchema);