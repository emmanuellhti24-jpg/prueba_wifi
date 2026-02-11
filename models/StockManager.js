const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Pedido = require('../models/Pedido');
const Merma = require('../models/Merma');
const Sale = require('../models/Sale');

// Función auxiliar para normalizar texto (quitar acentos y mayúsculas)
const normalize = (str) => {
  return str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
};

/**
 * SERVICIO DE GESTIÓN DE INVENTARIO Y MÉTRICAS
 */
const StockManager = {

  // 1. VINCULACIÓN AUTOMÁTICA (Descontar stock al vender)
  // Se debe llamar cuando el pedido pasa a 'IN_KITCHEN' o 'COMPLETED'
  procesarSalidaDeStock: async (pedido) => {
    try {
      for (const item of pedido.items) {
        // Buscar el producto real para obtener su receta
        // IMPORTANTE: Usamos populate para traer el nombre del insumo y poder comparar con los "mods"
        const productoDB = await Product.findOne({ id: item.id }).populate('receta.insumo');
        
        if (!productoDB) {
          console.warn(`⚠️ Producto ${item.id} no encontrado en BD, saltando descuento de stock`);
          continue;
        }
        
        if (!productoDB.receta || productoDB.receta.length === 0) {
          console.warn(`⚠️ Producto ${productoDB.nombre} no tiene receta configurada`);
          continue;
        }
        const cantidadVendida = item.qty;
        const mods = item.mods || []; // Array de strings ej: ["Sin Cebolla", "Extra Jitomate"]

        for (const ingrediente of productoDB.receta) {
          if (!ingrediente.insumo) continue; // Si el insumo fue borrado de la BD, saltar

          let cantidadPorUnidad = ingrediente.cantidad;
          const nombreInsumo = normalize(ingrediente.insumo.nombre);

          // --- LÓGICA DE PREFERENCIAS DEL CLIENTE ---
          // Buscamos si alguna modificación afecta a este ingrediente
          const modSin = mods.find(m => {
            const texto = normalize(m);
            return texto.includes(`sin ${nombreInsumo}`) || texto.includes(`no ${nombreInsumo}`) || texto.includes(`0 ${nombreInsumo}`);
          });

          const modExtra = mods.find(m => {
            const texto = normalize(m);
            return texto.includes(`extra ${nombreInsumo}`) || texto.includes(`mas ${nombreInsumo}`) || texto.includes(`con ${nombreInsumo}`);
          });

          if (modSin) {
            cantidadPorUnidad = 0; // No descontar nada
          } else if (modExtra) {
            cantidadPorUnidad = cantidadPorUnidad * 2; // Descontar doble (ajustable según negocio)
          }

          const descuentoTotal = cantidadPorUnidad * cantidadVendida;
          
          // Solo actualizar si hay algo que descontar
          if (descuentoTotal > 0) {
            await Inventory.findByIdAndUpdate(ingrediente.insumo._id, {
              $inc: { cantidad: -descuentoTotal }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error procesando salida de stock:', error);
      throw error;
    }
  },

  // 2. REGISTRAR VENTA Y GANANCIA (se llama cuando el pedido se completa)
  registrarVenta: async (pedido, usuario) => {
    if (!pedido || !pedido.items || pedido.items.length === 0) {
      throw new Error("El pedido es inválido o no tiene items.");
    }

    let totalCostoCalculado = 0;
    const itemsParaVenta = [];

    // Usamos Promise.all para procesar los items en paralelo
    await Promise.all(pedido.items.map(async (item) => {
      const productoDB = await Product.findOne({ id: item.id }).populate('receta.insumo');
      let costoUnitario = 0;

      if (productoDB && productoDB.receta) {
        // Calcula el costo real del producto basado en la receta y el costo actual de los insumos
        costoUnitario = productoDB.receta.reduce((acc, componente) => {
          if (componente.insumo && componente.insumo.costoUnitario) {
            return acc + (componente.cantidad * componente.insumo.costoUnitario);
          }
          return acc;
        }, 0);
      }

      totalCostoCalculado += costoUnitario * item.qty;

      // El precio de venta por item no está guardado en el pedido, usamos el precio base como aproximación.
      const precioVentaAproximado = productoDB ? (productoDB.precios?.['1'] || productoDB.precioUnitario) : 0;

      itemsParaVenta.push({
        productoId: productoDB ? productoDB._id : null,
        nombre: item.nombre,
        categoria: productoDB ? productoDB.categoria : 'desconocido',
        cantidad: item.qty,
        precioUnitario: precioVentaAproximado + (item.extraPrice || 0),
        costoUnitario: costoUnitario
      });
    }));

    const gananciaNeta = pedido.total - totalCostoCalculado;

    await Sale.create({
      totalVenta: pedido.total,
      totalCosto: totalCostoCalculado,
      gananciaNeta: gananciaNeta,
      usuario: usuario ? usuario.username : 'sistema',
      items: itemsParaVenta
    });

    console.log(`💰 Venta registrada para Pedido #${pedido.numeroOrden}. Ganancia: $${gananciaNeta.toFixed(2)}`);
  },

  // 2. REGISTRAR MERMA
  registrarMerma: async (insumoId, cantidad, motivo, usuario) => {
    const insumo = await Inventory.findById(insumoId);
    if (!insumo) throw new Error("Insumo no encontrado");

    const costoPerdido = insumo.costoUnitario * cantidad;

    // Crear registro de merma
    await Merma.create({
      insumo: insumoId,
      cantidad,
      motivo,
      usuario,
      costoPerdido
    });

    // Descontar del inventario
    insumo.cantidad -= cantidad;
    await insumo.save();
  },

  // 3. GENERAR INSIGHTS DE VENTA (Métricas)
  obtenerMetricasAvanzadas: async (fechaInicio, fechaFin) => {
    const pipeline = [
      {
        $match: {
          fecha: { $gte: new Date(fechaInicio), $lte: new Date(fechaFin) },
          status: 'COMPLETED' // Solo ventas reales
        }
      },
      { $unwind: "$items" }, // Desglosar items
      {
        $group: {
          _id: "$items.id", // Agrupar por ID de producto (ej. "h_sencilla")
          nombre: { $first: "$items.nombre" },
          totalVendido: { $sum: "$items.qty" },
          ingresoTotal: { $sum: { $multiply: ["$items.qty", "$items.precioUnitario"] } }, // Nota: Requiere ajustar modelo Pedido para guardar precio snapshot
          horasVenta: { $push: { $hour: "$fecha" } } // Guardar horas para mapa de calor
        }
      },
      { $sort: { totalVendido: -1 } }
    ];

    const reporte = await Pedido.aggregate(pipeline);
    
    // Post-procesamiento para Insights
    return reporte.map(prod => {
      // Calcular hora pico (moda)
      const horasMap = {};
      let maxFrecuencia = 0;
      let horaPico = 0;
      prod.horasVenta.forEach(h => {
        horasMap[h] = (horasMap[h] || 0) + 1;
        if (horasMap[h] > maxFrecuencia) {
          maxFrecuencia = horasMap[h];
          horaPico = h;
        }
      });

      return {
        producto: prod.nombre,
        unidades: prod.totalVendido,
        horaPico: `${horaPico}:00`,
        analisis: StockManager.analizarRendimiento(prod.totalVendido)
      };
    });
  },

  analizarRendimiento: (cantidad) => {
    if (cantidad > 50) return "🔥 ESTRELLA (Alta rotación)";
    if (cantidad > 20) return "✅ CONSTANTE";
    return "⚠️ LENTO (Considerar promoción)";
  }
};

module.exports = StockManager;