/* 
   GUARDAR EN: tests/sanity.js
   EJECUTAR CON: node tests/sanity.js
*/
require('dotenv').config();
const http = require('http');

// Configuración
const PORT = process.env.PORT || 3000; // Asegúrate que coincida con tu puerto
const HOST = 'localhost';

// Función auxiliar para hacer peticiones HTTP sin dependencias externas
function request(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: HOST,
            port: PORT,
            path: path,
            method: method,
            headers: { 'Content-Type': 'application/json' },
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function runTest() {
    console.log('🧪 INICIANDO PRUEBA DE SANIDAD DEL SISTEMA\n');

    try {
        // 1. Probar Conexión Básica (Obtener Productos)
        console.log('1️⃣  Probando GET /api/products...');
        const productsRes = await request('GET', '/api/products');
        
        if (productsRes.status !== 200) {
            throw new Error(`Fallo al obtener productos. Status: ${productsRes.status}`);
        }
        
        // Aplanar el menú para encontrar un producto válido
        const menu = productsRes.data;
        let validProduct = null;
        // Buscar el primer producto disponible en cualquier categoría
        for (const cat in menu) {
            if (menu[cat].length > 0) {
                validProduct = menu[cat][0];
                break;
            }
        }

        if (!validProduct) {
            console.log('⚠️  Conexión exitosa, pero no hay productos en la BD para probar pedidos.');
            return;
        }
        console.log(`✅  Productos obtenidos. Usaremos "${validProduct.nombre}" (ID: ${validProduct.id}) para la prueba.\n`);

        // 2. Probar Creación de Pedido
        console.log('2️⃣  Probando POST /api/orders (Crear Pedido)...');
        const orderPayload = {
            cliente: "Test Automático",
            tipo: "llevar",
            items: [{
                id: validProduct.id,
                nombre: validProduct.nombre,
                qty: 1,
                precioUnitario: validProduct.precioUnitario || 100,
                mods: [] 
            }],
            total: validProduct.precioUnitario || 100
        };

        const orderRes = await request('POST', '/api/orders', orderPayload);
        
        if (orderRes.status !== 201) {
            console.error('❌ Error creando pedido:', orderRes.data);
            throw new Error(`Fallo al crear pedido. Status: ${orderRes.status}`);
        }

        const numeroOrden = orderRes.data.numeroOrden;
        console.log(`✅  Pedido creado exitosamente. Orden #${numeroOrden}\n`);

        // 3. Verificar Estado del Pedido (Ruta pública)
        console.log(`3️⃣  Verificando estado en GET /api/pedido/${numeroOrden}/status...`);
        const statusRes = await request('GET', `/api/pedido/${numeroOrden}/status`);

        if (statusRes.status === 200) {
            console.log(`✅  Estado recuperado: ${statusRes.data.estadoLegible} (${statusRes.data.estado})`);
            console.log('\n🎉  ¡PRUEBA EXITOSA! El flujo básico (Menú -> Pedir -> Confirmar) funciona correctamente.');
        } else {
            throw new Error(`No se pudo verificar el estado. Status: ${statusRes.status}`);
        }

    } catch (error) {
        console.error('\n❌  LA PRUEBA FALLÓ:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('   (Asegúrate de que el servidor esté corriendo en el puerto 3000)');
        }
    }
}

runTest();
