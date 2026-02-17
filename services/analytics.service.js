/**
 * SERVICIO DE ANALÍTICA AVANZADA
 * Genera métricas, análisis y sugerencias inteligentes
 */

const Sale = require('../models/Sale');
const Pedido = require('../models/Pedido');
const Product = require('../models/Product');

/**
 * Obtiene los productos más vendidos (Top 10)
 * @param {Date} startDate - Fecha inicio
 * @param {Date} endDate - Fecha fin
 * @returns {Promise<Array>} Top 10 productos
 */
async function getTopProducts(startDate, endDate) {
    try {
        const topProducts = await Sale.aggregate([
            {
                $match: {
                    fecha: { $gte: startDate, $lte: endDate }
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.nombre',
                    categoria: { $first: '$items.categoria' },
                    totalVendido: { $sum: '$items.cantidad' },
                    ingresoTotal: { 
                        $sum: { 
                            $multiply: ['$items.cantidad', '$items.precioUnitario'] 
                        } 
                    },
                    costoTotal: { 
                        $sum: { 
                            $multiply: ['$items.cantidad', '$items.costoUnitario'] 
                        } 
                    },
                    gananciaNeta: {
                        $sum: {
                            $multiply: [
                                '$items.cantidad',
                                { $subtract: ['$items.precioUnitario', '$items.costoUnitario'] }
                            ]
                        }
                    },
                    precioPromedio: { $avg: '$items.precioUnitario' }
                }
            },
            {
                $project: {
                    nombre: '$_id',
                    categoria: 1,
                    totalVendido: 1,
                    ingresoTotal: { $round: ['$ingresoTotal', 2] },
                    costoTotal: { $round: ['$costoTotal', 2] },
                    gananciaNeta: { $round: ['$gananciaNeta', 2] },
                    precioPromedio: { $round: ['$precioPromedio', 2] },
                    margenGanancia: {
                        $round: [
                            {
                                $multiply: [
                                    { $divide: ['$gananciaNeta', '$ingresoTotal'] },
                                    100
                                ]
                            },
                            1
                        ]
                    }
                }
            },
            { $sort: { totalVendido: -1 } },
            { $limit: 10 }
        ]);

        return topProducts;
    } catch (error) {
        console.error('Error obteniendo top products:', error);
        throw error;
    }
}

/**
 * Analiza horarios pico de ventas
 * @param {Date} startDate - Fecha inicio
 * @param {Date} endDate - Fecha fin
 * @returns {Promise<Object>} Análisis de horarios
 */
async function getPeakHours(startDate, endDate) {
    try {
        // Ventas por hora del día
        const hourlyData = await Sale.aggregate([
            {
                $match: {
                    fecha: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $hour: '$fecha' },
                    totalVentas: { $sum: '$totalVenta' },
                    numeroTransacciones: { $sum: 1 },
                    ticketPromedio: { $avg: '$totalVenta' }
                }
            },
            {
                $project: {
                    hora: '$_id',
                    totalVentas: { $round: ['$totalVentas', 2] },
                    numeroTransacciones: 1,
                    ticketPromedio: { $round: ['$ticketPromedio', 2] }
                }
            },
            { $sort: { hora: 1 } }
        ]);

        // Crear array de 24 horas (inicializado en 0)
        const horasPorDia = Array.from({ length: 24 }, (_, i) => ({
            hora: i,
            horaFormato: `${i.toString().padStart(2, '0')}:00`,
            totalVentas: 0,
            numeroTransacciones: 0,
            ticketPromedio: 0
        }));

        // Llenar con datos reales
        hourlyData.forEach(item => {
            horasPorDia[item.hora] = {
                hora: item.hora,
                horaFormato: `${item.hora.toString().padStart(2, '0')}:00`,
                totalVentas: item.totalVentas,
                numeroTransacciones: item.numeroTransacciones,
                ticketPromedio: item.ticketPromedio
            };
        });

        // Identificar horas pico (top 3)
        const horasPico = [...horasPorDia]
            .sort((a, b) => b.totalVentas - a.totalVentas)
            .slice(0, 3)
            .map(h => ({
                hora: h.horaFormato,
                ventas: h.totalVentas,
                transacciones: h.numeroTransacciones
            }));

        // Identificar horas valle (bottom 3, excluyendo horas sin ventas)
        const horasValle = [...horasPorDia]
            .filter(h => h.totalVentas > 0)
            .sort((a, b) => a.totalVentas - b.totalVentas)
            .slice(0, 3)
            .map(h => ({
                hora: h.horaFormato,
                ventas: h.totalVentas,
                transacciones: h.numeroTransacciones
            }));

        return {
            horasPorDia,
            horasPico,
            horasValle,
            resumen: {
                horaMasVentas: horasPico[0]?.hora || 'N/A',
                horaMenosVentas: horasValle[0]?.hora || 'N/A'
            }
        };
    } catch (error) {
        console.error('Error analizando horarios pico:', error);
        throw error;
    }
}

/**
 * Genera sugerencias inteligentes basadas en datos
 * @param {Date} startDate - Fecha inicio
 * @param {Date} endDate - Fecha fin
 * @returns {Promise<Array>} Lista de sugerencias
 */
async function generateSuggestions(startDate, endDate) {
    try {
        const sugerencias = [];

        // 1. Sugerencias de promociones basadas en volumen
        const topProducts = await getTopProducts(startDate, endDate);
        
        topProducts.slice(0, 5).forEach(producto => {
            if (producto.totalVendido >= 100) {
                sugerencias.push({
                    tipo: 'promocion',
                    prioridad: 'alta',
                    icono: '🎁',
                    titulo: `Promoción 3x2 en ${producto.nombre}`,
                    descripcion: `${producto.nombre} ha vendido ${producto.totalVendido} unidades. Una promoción 3x2 podría aumentar ventas un 30%.`,
                    impactoEstimado: {
                        ventasAdicionales: Math.round(producto.totalVendido * 0.3),
                        ingresoEstimado: Math.round(producto.ingresoTotal * 0.25)
                    },
                    accion: 'Activar promoción 3x2',
                    datos: {
                        producto: producto.nombre,
                        ventasActuales: producto.totalVendido,
                        ingresoActual: producto.ingresoTotal
                    }
                });
            }
        });

        // 2. Productos con bajo margen de ganancia
        const productosBajoMargen = topProducts.filter(p => p.margenGanancia < 30);
        
        productosBajoMargen.forEach(producto => {
            sugerencias.push({
                tipo: 'optimizacion',
                prioridad: 'media',
                icono: '⚠️',
                titulo: `Revisar costos de ${producto.nombre}`,
                descripcion: `Margen de ganancia: ${producto.margenGanancia}%. Considera ajustar precio o reducir costos.`,
                impactoEstimado: {
                    margenActual: producto.margenGanancia,
                    margenObjetivo: 40,
                    gananciaAdicional: Math.round((producto.ingresoTotal * 0.4) - producto.gananciaNeta)
                },
                accion: 'Revisar estructura de costos',
                datos: {
                    producto: producto.nombre,
                    costoActual: producto.costoTotal,
                    precioActual: producto.precioPromedio
                }
            });
        });

        // 3. Análisis de horarios pico
        const peakHours = await getPeakHours(startDate, endDate);
        
        if (peakHours.horasPico.length > 0) {
            const horaPico = peakHours.horasPico[0];
            sugerencias.push({
                tipo: 'operacional',
                prioridad: 'alta',
                icono: '⏰',
                titulo: `Reforzar personal en hora pico`,
                descripcion: `${horaPico.hora} es tu hora pico con ${horaPico.transacciones} pedidos. Asegura suficiente personal.`,
                impactoEstimado: {
                    pedidosPromedio: horaPico.transacciones,
                    ventasPromedio: horaPico.ventas
                },
                accion: 'Programar más personal',
                datos: {
                    horaPico: horaPico.hora,
                    transacciones: horaPico.transacciones
                }
            });
        }

        // 4. Productos de baja rotación
        const allProducts = await Product.find({});
        const productosVendidos = new Set(topProducts.map(p => p.nombre));
        const productosSinVentas = allProducts.filter(p => !productosVendidos.has(p.nombre));

        if (productosSinVentas.length > 0) {
            productosSinVentas.slice(0, 3).forEach(producto => {
                sugerencias.push({
                    tipo: 'inventario',
                    prioridad: 'baja',
                    icono: '📦',
                    titulo: `Baja rotación: ${producto.nombre}`,
                    descripcion: `${producto.nombre} no ha tenido ventas en el período. Considera promoción o retiro del menú.`,
                    impactoEstimado: {
                        ventasActuales: 0,
                        accionRecomendada: 'Promoción especial o descontinuar'
                    },
                    accion: 'Revisar producto',
                    datos: {
                        producto: producto.nombre,
                        categoria: producto.categoria
                    }
                });
            });
        }

        // 5. Combos sugeridos (productos que se venden juntos)
        const combosData = await Sale.aggregate([
            {
                $match: {
                    fecha: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $match: {
                    $expr: { $gte: [{ $size: '$items' }, 2] }
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$_id',
                    productos: { $push: '$items.nombre' }
                }
            },
            { $limit: 100 }
        ]);

        // Analizar combinaciones frecuentes
        const combinaciones = {};
        combosData.forEach(venta => {
            const prods = venta.productos.sort();
            for (let i = 0; i < prods.length; i++) {
                for (let j = i + 1; j < prods.length; j++) {
                    const key = `${prods[i]}|${prods[j]}`;
                    combinaciones[key] = (combinaciones[key] || 0) + 1;
                }
            }
        });

        const combosFrecuentes = Object.entries(combinaciones)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2);

        combosFrecuentes.forEach(([combo, frecuencia]) => {
            const [prod1, prod2] = combo.split('|');
            if (frecuencia >= 5) {
                sugerencias.push({
                    tipo: 'combo',
                    prioridad: 'media',
                    icono: '🍔🥤',
                    titulo: `Crear combo: ${prod1} + ${prod2}`,
                    descripcion: `Estos productos se compran juntos ${frecuencia} veces. Un combo con descuento podría aumentar ventas.`,
                    impactoEstimado: {
                        frecuenciaActual: frecuencia,
                        descuentoSugerido: '10%'
                    },
                    accion: 'Crear combo promocional',
                    datos: {
                        producto1: prod1,
                        producto2: prod2,
                        frecuencia: frecuencia
                    }
                });
            }
        });

        // Ordenar por prioridad
        const prioridadOrden = { alta: 1, media: 2, baja: 3 };
        sugerencias.sort((a, b) => prioridadOrden[a.prioridad] - prioridadOrden[b.prioridad]);

        return sugerencias;
    } catch (error) {
        console.error('Error generando sugerencias:', error);
        throw error;
    }
}

/**
 * Calcula métricas financieras detalladas
 * @param {Date} startDate - Fecha inicio
 * @param {Date} endDate - Fecha fin
 * @returns {Promise<Object>} Métricas financieras
 */
async function getFinancialMetrics(startDate, endDate) {
    try {
        const result = await Sale.aggregate([
            {
                $match: {
                    fecha: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalVentas: { $sum: '$totalVenta' },
                    totalCostos: { $sum: '$totalCosto' },
                    gananciaNeta: { $sum: '$gananciaNeta' },
                    numeroVentas: { $sum: 1 },
                    ticketPromedio: { $avg: '$totalVenta' }
                }
            }
        ]);

        const data = result[0] || {
            totalVentas: 0,
            totalCostos: 0,
            gananciaNeta: 0,
            numeroVentas: 0,
            ticketPromedio: 0
        };

        return {
            ingresoTotal: Math.round(data.totalVentas * 100) / 100,
            costoTotal: Math.round(data.totalCostos * 100) / 100,
            gananciaNeta: Math.round(data.gananciaNeta * 100) / 100,
            margenGanancia: data.totalVentas > 0 
                ? Math.round((data.gananciaNeta / data.totalVentas) * 100 * 10) / 10
                : 0,
            numeroVentas: data.numeroVentas,
            ticketPromedio: Math.round(data.ticketPromedio * 100) / 100,
            roi: data.totalCostos > 0
                ? Math.round((data.gananciaNeta / data.totalCostos) * 100 * 10) / 10
                : 0
        };
    } catch (error) {
        console.error('Error calculando métricas financieras:', error);
        throw error;
    }
}

/**
 * Obtiene resumen completo de métricas
 * @param {Date} startDate - Fecha inicio
 * @param {Date} endDate - Fecha fin
 * @returns {Promise<Object>} Resumen completo
 */
async function getCompleteDashboard(startDate, endDate) {
    try {
        const [
            financials,
            topProducts,
            peakHours,
            suggestions
        ] = await Promise.all([
            getFinancialMetrics(startDate, endDate),
            getTopProducts(startDate, endDate),
            getPeakHours(startDate, endDate),
            generateSuggestions(startDate, endDate)
        ]);

        return {
            periodo: {
                inicio: startDate,
                fin: endDate,
                dias: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
            },
            financiero: financials,
            topProductos: topProducts,
            horarios: peakHours,
            sugerencias: suggestions,
            generadoEn: new Date()
        };
    } catch (error) {
        console.error('Error generando dashboard completo:', error);
        throw error;
    }
}

module.exports = {
    getTopProducts,
    getPeakHours,
    generateSuggestions,
    getFinancialMetrics,
    getCompleteDashboard
};
