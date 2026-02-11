const Sale = require('../models/Sale');
const Pedido = require('../models/Pedido');
const Inventory = require('../models/Inventory');

exports.getFinancialMetrics = async (req, res) => {
  try {
    const result = await Sale.aggregate([
      {
        $group: {
          _id: null,
          totalVentas: { $sum: '$totalVenta' },
          totalCostos: { $sum: '$totalCosto' },
          gananciaReal: { $sum: '$gananciaNeta' },
          numeroVentas: { $sum: 1 }
        }
      }
    ]);

    const data = result[0] || { totalVentas: 0, totalCostos: 0, gananciaReal: 0, numeroVentas: 0 };

    res.json({
      totalRevenue: data.totalVentas,
      totalCost: data.totalCostos,
      realProfit: data.gananciaReal,
      salesCount: data.numeroVentas,
      profitMargin: data.totalVentas > 0 ? ((data.gananciaReal / data.totalVentas) * 100).toFixed(2) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTopProducts = async (req, res) => {
  try {
    const result = await Sale.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.nombre',
          totalVendido: { $sum: '$items.cantidad' },
          ingresoTotal: { $sum: { $multiply: ['$items.cantidad', '$items.precioUnitario'] } }
        }
      },
      { $sort: { totalVendido: -1 } },
      { $limit: 5 }
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getHourlySales = async (req, res) => {
  try {
    const result = await Sale.aggregate([
      {
        $group: {
          _id: { $hour: '$fecha' },
          totalVentas: { $sum: '$totalVenta' },
          numeroVentas: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const hourlyData = Array.from({ length: 24 }, (_, i) => ({ hour: i, sales: 0, count: 0 }));
    result.forEach(item => {
      hourlyData[item._id] = { hour: item._id, sales: item.totalVentas, count: item.numeroVentas };
    });

    res.json(hourlyData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCategoryDistribution = async (req, res) => {
  try {
    const result = await Sale.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.categoria',
          totalVendido: { $sum: '$items.cantidad' },
          ingresoTotal: { $sum: { $multiply: ['$items.cantidad', '$items.precioUnitario'] } }
        }
      }
    ]);

    const total = result.reduce((sum, item) => sum + item.totalVendido, 0);
    res.json(result.map(item => ({
      category: item._id,
      units: item.totalVendido,
      percentage: total > 0 ? ((item.totalVendido / total) * 100).toFixed(2) : 0
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getInventoryAlerts = async (req, res) => {
  try {
    const lowStock = await Inventory.find({ $expr: { $lte: ['$cantidad', '$minimo'] } });
    res.json(lowStock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
