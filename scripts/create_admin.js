require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/prueba_wifi');
    console.log('✅ Conectado a MongoDB');
  } catch (err) {
    console.error('❌ Error conectando a MongoDB:', err.message);
    process.exit(1);
  }
};

const createAdmin = async () => {
  try {
    // Verificar si ya existe un admin
    const existingAdmin = await Usuario.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('⚠️  El usuario "admin" ya existe');
      console.log('   Si olvidaste la contraseña, bórralo manualmente de la BD');
      process.exit(0);
    }

    // Crear nuevo admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = new Usuario({
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();
    
    console.log('✅ Usuario administrador creado exitosamente');
    console.log('');
    console.log('📋 Credenciales:');
    console.log('   Usuario: admin');
    console.log('   Contraseña: admin123');
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambia esta contraseña después del primer login');
    
  } catch (error) {
    console.error('❌ Error creando admin:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Ejecutar
connectDB().then(createAdmin);
