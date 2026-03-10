const cron = require('node-cron');
const Inventory = require('../models/Inventory');

const initCronJobs = () => {
  cron.schedule('0 8 * * *', async () => {
    try {
      console.log('🕐 [CRON] Revisando inventario bajo...');
      
      const lowStock = await Inventory.find({
        $expr: { $lte: ['$cantidad', '$minimo'] }
      });

      if (lowStock.length > 0) {
        console.warn(`⚠️  [ALERTA] ${lowStock.length} insumos con stock bajo:`);
        lowStock.forEach(item => {
          console.warn(`   - ${item.nombre}: ${item.cantidad} ${item.unidad} (mínimo: ${item.minimo})`);
        });
      } else {
        console.log('✅ [CRON] Todos los insumos tienen stock suficiente');
      }
    } catch (error) {
      console.error('❌ [CRON] Error revisando inventario:', error);
    }
  });

  console.log('⏰ Cron jobs iniciados: Alertas de inventario (8:00 AM diario)');
};

module.exports = { initCronJobs };
