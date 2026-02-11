const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');
const { verificarToken, permitirRoles } = require('../middleware/auth');

// --- CONFIGURACIÓN DE SUBIDA DE IMÁGENES ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/'); // Carpeta destino
    },
    filename: function (req, file, cb) {
        // Nombre único: timestamp + extensión original
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// GET: Obtener menú
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().populate('receta.insumo');
        const menu = { hamburguesas: [], hotdogs: [], bebidas: [], extras: [] };
        
        products.forEach(p => {
            if (!menu[p.categoria]) menu[p.categoria] = [];
            menu[p.categoria].push(p);
        });
        
        res.json(menu);
    } catch (error) {
        res.status(500).json({ error: 'Error cargando productos' });
    }
});

// POST: Crear/Editar (Soporta Imagen) - SOLO ADMIN
router.post('/', verificarToken, permitirRoles('admin'), upload.single('imagen'), async (req, res) => {
    try {
        // Multer pone la info del archivo en req.file y el texto en req.body
        const datos = req.body;
        let imagenUrl = datos.imagenActual; // Mantener imagen anterior si no suben nueva

        if (req.file) {
            imagenUrl = '/uploads/' + req.file.filename;
        }

        // Parsear JSONs que vienen como string desde FormData
        const precios = JSON.parse(datos.precios || '{}');
        const ingredientes = datos.ingredientes ? datos.ingredientes.split(',') : [];
        const adicionales = datos.adicionales ? JSON.parse(datos.adicionales) : [];
        const receta = datos.receta ? JSON.parse(datos.receta) : [];

        const product = await Product.findOneAndUpdate(
            { id: datos.id }, 
            { 
                nombre: datos.nombre, 
                categoria: datos.categoria, 
                precios: precios,
                precioUnitario: datos.precioUnitario, 
                ingredientes: ingredientes,
                adicionales: adicionales,
                receta: receta,
                imagen: imagenUrl // Nuevo campo
            },
            { new: true, upsert: true }
        );

        res.json({ success: true, product });
    } catch (error) {
        console.error("Error al guardar:", error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE - SOLO ADMIN
router.delete('/:id', verificarToken, permitirRoles('admin'), async (req, res) => {
    await Product.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
});

module.exports = router;
