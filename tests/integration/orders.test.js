// tests/integration/orders.test.js

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Aquí importamos tu aplicación de Express (¡Asegúrate de que la ruta sea correcta!)
const app = require('../../server'); 

let mongoServer;

// 1. Antes de todas las pruebas: Levantar la base de datos en memoria
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Si tu app ya está conectada a la BD real, cerramos esa conexión primero
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    
    await mongoose.connect(uri);
});

// 2. Después de todas las pruebas: Apagar y limpiar la base de datos
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Orders API - Integración', () => {

    test('POST /api/orders - Debe crear un pedido nuevo y guardarlo en la BD', async () => {
        // Simulamos la carga útil (payload) que enviaría el frontend
        const nuevoPedido = {
            cliente: "Cliente de Prueba",
            tipo: "llevar",
            items: [
                { nombre: "Hamburguesa Sencilla", cantidad: 1, precio: 50 }
            ],
            total: 50
        };

        // Hacemos la petición HTTP simulada
        const response = await request(app)
            .post('/api/orders') // <-- Cambia esto si tu ruta es diferente
            .send(nuevoPedido);

        // Verificamos que el servidor responda que todo salió bien
        expect(response.status).toBe(201);
        
        // Verificamos que MongoDB nos devuelva el ID o el número de orden generado
        expect(response.body).toHaveProperty('_id');
        expect(response.body.cliente).toBe("Cliente de Prueba");
    });

});