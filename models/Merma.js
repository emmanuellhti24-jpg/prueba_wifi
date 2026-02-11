const mongoose = require('mongoose');

const MermaSchema = new mongoose.Schema({
  insumo: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  cantidad: { type: Number, required: true },
  motivo: { 
    type: String, 
    enum: ['CADUCIDAD', 'ERROR_COCINA', 'ACCIDENTE', 'ROBO', 'DEGUSTACION', 'OTRO'], 
    required: true 
  },
  usuario: { type: String }, // Quién reportó
  fecha: { type: Date, default: Date.now },
  costoPerdido: { type: Number } // Snapshot del costo en ese momento
});

module.exports = mongoose.model('Merma', MermaSchema);