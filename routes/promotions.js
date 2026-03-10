const express = require('express');
const router = express.Router();

/**
 * API de Promociones 3x2
 * Valida y calcula descuentos automáticamente
 */

// Validar promoción 3x2 en el carrito
router.post('/validate', async (req, res) => {
    try {
        const { items } = req.body;
        
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Items inválidos' });
        }

        // Agrupar items por nombre (mismo producto)
        const grupos = {};
        items.forEach(item => {
            const key = item.nombre;
            if (!grupos[key]) {
                grupos[key] = {
                    items: [],
                    totalQty: 0,
                    categoria: item.categoria || 'general'
                };
            }
            grupos[key].items.push(item);
            grupos[key].totalQty += item.qty;
        });

        // Detectar promociones aplicables
        const promocionesDisponibles = [];
        let descuentoTotal = 0;

        for (const [nombre, data] of Object.entries(grupos)) {
            // Si tiene 3 o más items del mismo tipo, aplica 3x2
            if (data.totalQty >= 3) {
                const precios = data.items.map(i => i.precioUnitario + (i.extraPrice || 0));
                const precioMasBarato = Math.min(...precios);
                
                promocionesDisponibles.push({
                    tipo: '3x2',
                    producto: nombre,
                    cantidad: data.totalQty,
                    descuento: precioMasBarato,
                    mensaje: `3x2 en ${nombre}: ¡El más barato GRATIS!`
                });
                
                descuentoTotal += precioMasBarato;
            }
            // Si tiene 2 items, sugerir agregar 1 más
            else if (data.totalQty === 2) {
                const precios = data.items.map(i => i.precioUnitario + (i.extraPrice || 0));
                const precioMasBarato = Math.min(...precios);
                
                promocionesDisponibles.push({
                    tipo: 'sugerencia_3x2',
                    producto: nombre,
                    cantidad: data.totalQty,
                    ahorrosPotenciales: precioMasBarato,
                    mensaje: `¡Agrega 1 ${nombre} más y ahorra $${precioMasBarato}!`
                });
            }
        }

        // Calcular total original y con descuento
        const totalOriginal = items.reduce((sum, i) => 
            sum + ((i.precioUnitario + (i.extraPrice || 0)) * i.qty), 0
        );
        const totalConDescuento = totalOriginal - descuentoTotal;

        res.json({
            success: true,
            promociones: promocionesDisponibles,
            totalOriginal,
            descuentoTotal,
            totalFinal: totalConDescuento,
            porcentajeAhorro: totalOriginal > 0 
                ? ((descuentoTotal / totalOriginal) * 100).toFixed(1) 
                : 0
        });

    } catch (error) {
        console.error('Error validando promociones:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener promociones activas (para futuras expansiones)
router.get('/active', async (req, res) => {
    try {
        // Por ahora solo retornamos la promoción 3x2 hardcodeada
        const promocionesActivas = [
            {
                id: 'promo_3x2_general',
                tipo: '3x2',
                nombre: 'Promoción 3x2',
                descripcion: 'Lleva 3 productos del mismo tipo y paga solo 2',
                categorias: ['hamburguesas', 'hotdogs', 'bebidas', 'snacks'],
                activa: true,
                fechaInicio: new Date('2026-01-01'),
                fechaFin: new Date('2026-12-31')
            }
        ];

        res.json({
            success: true,
            promociones: promocionesActivas
        });
    } catch (error) {
        console.error('Error obteniendo promociones:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Aplicar promoción a un pedido (llamado desde el backend al confirmar)
router.post('/apply', async (req, res) => {
    try {
        const { items, promociones } = req.body;
        
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Items inválidos' });
        }

        // Validar que las promociones aplicadas sean legítimas
        const validacion = await validarPromociones(items, promociones || []);
        
        if (!validacion.valido) {
            return res.status(400).json({ 
                error: 'Promoción inválida',
                detalle: validacion.mensaje 
            });
        }

        res.json({
            success: true,
            descuentoAplicado: validacion.descuento,
            totalFinal: validacion.totalFinal
        });

    } catch (error) {
        console.error('Error aplicando promoción:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Función auxiliar para validar promociones
async function validarPromociones(items, promociones) {
    // Agrupar items
    const grupos = {};
    items.forEach(item => {
        if (!grupos[item.nombre]) {
            grupos[item.nombre] = [];
        }
        grupos[item.nombre].push(item);
    });

    let descuentoTotal = 0;
    
    // Validar cada promoción aplicada
    for (const promo of promociones) {
        if (promo === '3x2') {
            // Verificar que realmente haya 3 o más items del mismo tipo
            for (const [nombre, items] of Object.entries(grupos)) {
                const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
                if (totalQty >= 3) {
                    const precios = items.map(i => i.precioUnitario + (i.extraPrice || 0));
                    descuentoTotal += Math.min(...precios);
                }
            }
        }
    }

    const totalOriginal = items.reduce((sum, i) => 
        sum + ((i.precioUnitario + (i.extraPrice || 0)) * i.qty), 0
    );

    return {
        valido: true,
        descuento: descuentoTotal,
        totalFinal: totalOriginal - descuentoTotal
    };
}

module.exports = router;
