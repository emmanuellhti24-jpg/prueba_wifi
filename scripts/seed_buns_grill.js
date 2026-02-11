require('dotenv').config();
const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/prueba_wifi';

const seedBunsGrill = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🔌 Conectado a MongoDB');

    // Limpiar datos anteriores
    await Inventory.deleteMany({});
    await Product.deleteMany({});
    console.log('🗑️  Datos anteriores eliminados');

    // ========================================
    // 1. CREAR INVENTARIO BASE
    // ========================================
    const inventario = await Inventory.insertMany([
      // Panes
      { nombre: 'Pan Hamburguesa', cantidad: 100, unidad: 'pza', minimo: 20, costoUnitario: 3 },
      { nombre: 'Pan Media Noche', cantidad: 80, unidad: 'pza', minimo: 15, costoUnitario: 2.5 },
      
      // Proteínas
      { nombre: 'Carne Molida', cantidad: 5000, unidad: 'g', minimo: 1000, costoUnitario: 0.12 }, // $0.12 por gramo
      { nombre: 'Salchicha', cantidad: 50, unidad: 'pza', minimo: 10, costoUnitario: 8 },
      { nombre: 'Jamón', cantidad: 40, unidad: 'pza', minimo: 10, costoUnitario: 5 },
      { nombre: 'Tocino', cantidad: 60, unidad: 'pza', minimo: 15, costoUnitario: 6 },
      
      // Vegetales
      { nombre: 'Lechuga', cantidad: 80, unidad: 'pza', minimo: 20, costoUnitario: 1 },
      { nombre: 'Jitomate', cantidad: 100, unidad: 'pza', minimo: 20, costoUnitario: 0.5 },
      { nombre: 'Cebolla', cantidad: 100, unidad: 'pza', minimo: 20, costoUnitario: 0.3 },
      { nombre: 'Jalapeños', cantidad: 150, unidad: 'pza', minimo: 30, costoUnitario: 0.2 },
      { nombre: 'Piña', cantidad: 50, unidad: 'pza', minimo: 10, costoUnitario: 2 },
      
      // Quesos
      { nombre: 'Queso Amarillo', cantidad: 80, unidad: 'pza', minimo: 20, costoUnitario: 3 },
      
      // Aderezos
      { nombre: 'Aderezos Mix', cantidad: 500, unidad: 'ml', minimo: 100, costoUnitario: 0.05 }
    ]);

    console.log('✅ Inventario creado:', inventario.length, 'items');

    // Crear mapa de IDs para fácil referencia
    const inv = {};
    inventario.forEach(item => {
      inv[item.nombre] = item._id;
    });

    // ========================================
    // 2. CREAR PRODUCTOS CON RECETAS
    // ========================================
    
    const productos = [
      // HAMBURGUESA SENCILLA
      {
        id: 'h_sencilla',
        nombre: 'Hamburguesa Sencilla',
        categoria: 'hamburguesas',
        precioUnitario: 45,
        precios: { '1': 45, '2': 80, '3': 110 },
        ingredientes: ['Lechuga', 'Jitomate', 'Cebolla', 'Jalapeños'],
        adicionales: [
          { nombre: 'Queso Extra', precio: 8 },
          { nombre: 'Tocino Extra', precio: 10 }
        ],
        receta: [
          { insumo: inv['Pan Hamburguesa'], cantidad: 1 },
          { insumo: inv['Carne Molida'], cantidad: 90 },
          { insumo: inv['Lechuga'], cantidad: 1 },
          { insumo: inv['Jitomate'], cantidad: 2 },
          { insumo: inv['Cebolla'], cantidad: 2 },
          { insumo: inv['Jalapeños'], cantidad: 3 },
          { insumo: inv['Aderezos Mix'], cantidad: 20 }
        ]
      },

      // HAMBURGUESA HAWAIANA
      {
        id: 'h_hawaiana',
        nombre: 'Hamburguesa Hawaiana',
        categoria: 'hamburguesas',
        precioUnitario: 55,
        precios: { '1': 55, '2': 100, '3': 140 },
        ingredientes: ['Lechuga', 'Jitomate', 'Cebolla', 'Jalapeños', 'Jamón', 'Piña'],
        adicionales: [
          { nombre: 'Queso Extra', precio: 8 },
          { nombre: 'Piña Extra', precio: 5 }
        ],
        receta: [
          { insumo: inv['Pan Hamburguesa'], cantidad: 1 },
          { insumo: inv['Carne Molida'], cantidad: 90 },
          { insumo: inv['Lechuga'], cantidad: 1 },
          { insumo: inv['Jitomate'], cantidad: 2 },
          { insumo: inv['Cebolla'], cantidad: 2 },
          { insumo: inv['Jalapeños'], cantidad: 3 },
          { insumo: inv['Jamón'], cantidad: 1 },
          { insumo: inv['Piña'], cantidad: 1 },
          { insumo: inv['Aderezos Mix'], cantidad: 20 }
        ]
      },

      // HAMBURGUESA CON TOCINO
      {
        id: 'h_tocino',
        nombre: 'Hamburguesa con Tocino',
        categoria: 'hamburguesas',
        precioUnitario: 60,
        precios: { '1': 60, '2': 110, '3': 150 },
        ingredientes: ['Lechuga', 'Jitomate', 'Cebolla', 'Jalapeños', 'Queso', 'Tocino'],
        adicionales: [
          { nombre: 'Tocino Extra', precio: 10 },
          { nombre: 'Queso Extra', precio: 8 }
        ],
        receta: [
          { insumo: inv['Pan Hamburguesa'], cantidad: 1 },
          { insumo: inv['Carne Molida'], cantidad: 90 },
          { insumo: inv['Lechuga'], cantidad: 1 },
          { insumo: inv['Jitomate'], cantidad: 2 },
          { insumo: inv['Cebolla'], cantidad: 2 },
          { insumo: inv['Jalapeños'], cantidad: 3 },
          { insumo: inv['Queso Amarillo'], cantidad: 1 },
          { insumo: inv['Tocino'], cantidad: 2 },
          { insumo: inv['Aderezos Mix'], cantidad: 20 }
        ]
      },

      // HOT DOG SENCILLO
      {
        id: 'hd_sencillo',
        nombre: 'Hot Dog Sencillo',
        categoria: 'hotdogs',
        precioUnitario: 35,
        precios: { '1': 35, '2': 65, '3': 90 },
        ingredientes: ['Jitomate', 'Cebolla'],
        adicionales: [
          { nombre: 'Queso Extra', precio: 8 },
          { nombre: 'Tocino', precio: 10 }
        ],
        receta: [
          { insumo: inv['Pan Media Noche'], cantidad: 1 },
          { insumo: inv['Salchicha'], cantidad: 1 },
          { insumo: inv['Jitomate'], cantidad: 2 },
          { insumo: inv['Cebolla'], cantidad: 2 },
          { insumo: inv['Aderezos Mix'], cantidad: 15 }
        ]
      },

      // HOT DOG MOMIA
      {
        id: 'hd_momia',
        nombre: 'Hot Dog Momia',
        categoria: 'hotdogs',
        precioUnitario: 45,
        precios: { '1': 45, '2': 85, '3': 115 },
        ingredientes: ['Jitomate', 'Cebolla', 'Tocino'],
        adicionales: [
          { nombre: 'Queso Extra', precio: 8 },
          { nombre: 'Tocino Extra', precio: 10 }
        ],
        receta: [
          { insumo: inv['Pan Media Noche'], cantidad: 1 },
          { insumo: inv['Salchicha'], cantidad: 1 },
          { insumo: inv['Jitomate'], cantidad: 2 },
          { insumo: inv['Cebolla'], cantidad: 2 },
          { insumo: inv['Tocino'], cantidad: 1 },
          { insumo: inv['Aderezos Mix'], cantidad: 15 }
        ]
      }
    ];

    // Calcular costo estimado para cada producto
    for (const producto of productos) {
      let costoEstimado = 0;
      for (const item of producto.receta) {
        const insumo = inventario.find(i => i._id.equals(item.insumo));
        if (insumo) {
          costoEstimado += insumo.costoUnitario * item.cantidad;
        }
      }
      producto.costoEstimado = Math.round(costoEstimado * 100) / 100;
    }

    await Product.insertMany(productos);
    console.log('✅ Productos creados:', productos.length);

    // Mostrar resumen
    console.log('\n📊 RESUMEN DE PRODUCTOS:');
    console.table(productos.map(p => ({
      Nombre: p.nombre,
      Precio: `$${p.precioUnitario}`,
      Costo: `$${p.costoEstimado.toFixed(2)}`,
      Ganancia: `$${(p.precioUnitario - p.costoEstimado).toFixed(2)}`,
      Margen: `${(((p.precioUnitario - p.costoEstimado) / p.precioUnitario) * 100).toFixed(1)}%`
    })));

    console.log('\n✅ Seed completado exitosamente');
    console.log('🍔 Buns & Grill System listo para operar');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
};

seedBunsGrill();
