// tests/integration/sockets.test.js

const { Server } = require('socket.io');
const Client = require('socket.io-client');
const { createServer } = require('http');

describe('Pruebas de WebSockets (Tiempo Real)', () => {
    let io, serverSocket, clientSocket;

    // ANTES DE LA PRUEBA: Levantamos un servidor en un puerto aleatorio y conectamos un cliente falso
    beforeAll((done) => {
        const httpServer = createServer();
        io = new Server(httpServer);
        
        httpServer.listen(() => {
            const port = httpServer.address().port; // Toma un puerto libre automáticamente
            clientSocket = new Client(`http://localhost:${port}`);
            
            io.on('connection', (socket) => {
                serverSocket = socket;
            });
            
            clientSocket.on('connect', done); // Avisa a Jest que ya estamos conectados
        });
    });

    // DESPUÉS DE LA PRUEBA: Apagamos todo para no dejar procesos colgados
    afterAll(() => {
        io.close();
        clientSocket.close();
    });

    test('El cliente debe recibir el evento "actualizacion-pedido" instantáneamente', (done) => {
        // Este es el paquete de datos que simula un cambio de PENDING a PREPARING
        const payloadPrueba = {
            numeroOrden: 'ORD-777',
            estado: 'PREPARING',
            cliente: 'Emmanuel'
        };

        // 1. El Cliente Falso se pone a "escuchar"
        clientSocket.on('actualizacion-pedido', (data) => {
            // 3. Cuando llega el evento, verificamos que la información esté intacta
            expect(data.numeroOrden).toBe('ORD-777');
            expect(data.estado).toBe('PREPARING');
            expect(data.cliente).toBe('Emmanuel');
            
            done(); // ¡El "done()" le dice a Jest que la prueba terminó con éxito!
        });

        // 2. El Servidor emite el evento (simulando que el cocinero le dio clic a un botón)
        serverSocket.emit('actualizacion-pedido', payloadPrueba);
    });
});