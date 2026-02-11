const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const { isAdmin, verificarToken } = require('../src/middlewares/auth.middleware');

router.use(verificarToken);
router.use(isAdmin);

// GET: Listar todos los usuarios (sin contraseña)
router.get('/', async (req, res, next) => {
  try {
    const users = await Usuario.find({}, '-password').sort({ role: 1 });
    res.json(users);
  } catch (error) { next(error); }
});

// POST: Crear nuevo usuario
router.post('/', async (req, res, next) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) return res.status(400).json({ message: 'Faltan datos' });
    
    const hash = await bcrypt.hash(password, 10);
    const nuevoUsuario = new Usuario({ username, password: hash, role });
    await nuevoUsuario.save();
    res.json({ success: true, message: 'Usuario creado' });
  } catch (error) { next(error); }
});

// DELETE: Eliminar usuario
router.delete('/:id', async (req, res, next) => {
  try {
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Usuario eliminado' });
  } catch (error) { next(error); }
});

module.exports = router;