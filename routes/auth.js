const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 1. Buscar usuario
        const user = await Usuario.findOne({ username });
        if (!user) {
            return res.status(401).json({ detail: 'Usuario no encontrado' });
        }

        // 2. Comparar contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ detail: 'Contraseña incorrecta' });
        }

        // 3. Generar Token
        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ access_token: token, role: user.role });

    } catch (error) {
        res.status(500).json({ detail: 'Error en el servidor' });
    }
});

module.exports = router;