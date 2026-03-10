const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_cambiar_en_produccion';

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Acceso denegado. No se proporcionó token.' });
  }

  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token inválido o expirado.' });
    }
    
    // Verificar que el usuario aún existe
    try {
      const usuarioExiste = await Usuario.findById(user.id);
      if (!usuarioExiste) {
        return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });
      }
      req.user = { ...user, username: usuarioExiste.username };
      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error verificando usuario.' });
    }
  });
};

const permitirRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'No tienes los permisos necesarios para esta acción.' });
    }
    next();
  };
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: '⛔ Acceso denegado: Se requieren privilegios de administrador.' 
    });
  }
};

module.exports = { verificarToken, permitirRoles, isAdmin, JWT_SECRET };