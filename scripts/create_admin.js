require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario'); // Asegúrate que la ruta sea correcta

// Configuración
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/prueba_wifi';

const crearAdmin = async () => {
    try {
        console.log(`⏳ Intentando conectar a: ${MONGO_URI}`);
        await mongoose.connect(MONGO_URI);
        console.log('🔌 Conectado a MongoDB');

        // 1. Borrar usuarios previos para evitar conflictos
        await Usuario.deleteMany({});
        console.log('🗑️ Usuarios anteriores eliminados');

        // 2. Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('1234', salt);

        // 3. Crear Usuarios Base
        const usuarios = [
            { username: 'admin', password: hashedPassword, role: 'admin' },
            { username: 'cajero', password: hashedPassword, role: 'cashier' }, // Cajero también usa 1234
            { username: 'cocina', password: hashedPassword, role: 'cook' }     // Cocina también usa 1234
        ];

        await Usuario.insertMany(usuarios);
        console.log('✅ Usuarios creados con éxito:');
        console.table(usuarios.map(u => ({ Usuario: u.username, Pass: '1234', Rol: u.role })));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

crearAdmin();
