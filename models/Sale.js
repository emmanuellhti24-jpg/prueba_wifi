const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  fecha: { type: Date, default: Date.now },
  totalVenta: { type: Number, required: true }, // Ingreso Bruto
  totalCosto: { type: Number, required: true }, // Costo de lo vendido (COGS)
  gananciaNeta: { type: Number, required: true }, // Venta - Costo
  metodoPago: { type: String, enum: ['efectivo', 'tarjeta'], default: 'efectivo' },
  usuario: { type: String }, // Quién realizó la venta (Cajero)
  
  // Desglose detallado para analítica
  items: [{
    productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Referencia opcional si no se borra
    nombre: String,
    categoria: String,
    cantidad: Number,
    precioUnitario: Number, // Precio al momento de la venta
    costoUnitario: Number   // Costo al momento de la venta
  }]
});

// Índices para acelerar reportes por fecha y categoría
SaleSchema.index({ fecha: 1 });
SaleSchema.index({ "items.categoria": 1 });

module.exports = mongoose.model('Sale', SaleSchema);