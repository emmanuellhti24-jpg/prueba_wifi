const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');

// Conexión
mongoose.connect('mongodb://127.0.0.1:27017/prueba_wifi')
  .then(() => console.log('Conectado a Mongo'))
  .catch(err => console.error(err));

const seed = async () => {
  // 1. Limpiar todo para empezar fresco
  await Inventory.deleteMany({});
  await Product.deleteMany({});

  console.log('🧹 BD Limpia');

  // 2. Crear Insumos (Lo que compras)
  const insumos = await Inventory.insertMany([
    { nombre: 'Pan de Hamburguesa', cantidad: 50, unidad: 'pza', costoUnitario: 5, minimo: 10 },
    { nombre: 'Carne Molida', cantidad: 5000, unidad: 'g', costoUnitario: 0.15, minimo: 1000 }, // 15 centavos el gramo
    { nombre: 'Queso Amarillo', cantidad: 100, unidad: 'pza', costoUnitario: 3, minimo: 20 },
    { nombre: 'Salchicha', cantidad: 50, unidad: 'pza', costoUnitario: 4, minimo: 10 },
    { nombre: 'Pan de HotDog', cantidad: 50, unidad: 'pza', costoUnitario: 4, minimo: 10 },
    { nombre: 'Coca Cola 600ml', cantidad: 24, unidad: 'pza', costoUnitario: 18, minimo: 5 }
  ]);

  // Mapa rápido para obtener IDs
  const inv = {};
  insumos.forEach(i => inv[i.nombre] = i._id);

  // 3. Crear Productos con Receta (Lo que vendes)
  await Product.create([
    {
      id: 'h_sencilla',
      nombre: 'Hamburguesa Sencilla',
      categoria: 'hamburguesas',
      precios: { "1": 70, "2": 120, "3": 160 },
      precioUnitario: 70,
      ingredientes: ['Cebolla', 'Tomate', 'Lechuga'],
      receta: [
        { insumo: inv['Pan de Hamburguesa'], cantidad: 1 },
        { insumo: inv['Carne Molida'], cantidad: 120 } // 120 gramos de carne
      ]
    },
    {
      id: 'h_queso',
      nombre: 'Hamburguesa con Queso',
      categoria: 'hamburguesas',
      precios: { "1": 80, "2": 140, "3": 190 },
      precioUnitario: 80,
      ingredientes: ['Cebolla', 'Tomate'],
      receta: [
        { insumo: inv['Pan de Hamburguesa'], cantidad: 1 },
        { insumo: inv['Carne Molida'], cantidad: 120 },
        { insumo: inv['Queso Amarillo'], cantidad: 1 }
      ]
    },
    {
      id: 'ref_coca',
      nombre: 'Refresco Coca-Cola',
      categoria: 'extras',
      precioUnitario: 25,
      receta: [
        { insumo: inv['Coca Cola 600ml'], cantidad: 1 }
      ]
    }
  ]);

  console.log('✅ Datos sembrados correctamente');
  process.exit();
};

seed();