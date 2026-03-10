const fs = require('fs');
const https = require('https');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const webfontsDir = path.join(publicDir, 'webfonts');

// Asegurar que existan directorios
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
if (!fs.existsSync(webfontsDir)) fs.mkdirSync(webfontsDir);

const files = [
    { 
        url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css', 
        name: 'bootstrap.min.css' 
    },
    { 
        url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css.map', 
        name: 'bootstrap.min.css.map' 
    },
    { 
        url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js', 
        name: 'bootstrap.bundle.min.js' 
    },
    { 
        url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js.map', 
        name: 'bootstrap.bundle.min.js.map' 
    },
    // --- FONT AWESOME 6.5.1 (Versión más reciente que corrige el error de Glyph bbox) ---
    {
        url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
        name: 'fontawesome.css'
    },
    {
        url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.woff2',
        name: 'webfonts/fa-solid-900.woff2',
        isFont: true
    },
    {
        url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.ttf',
        name: 'webfonts/fa-solid-900.ttf',
        isFont: true
    }
];

console.log("⬇️  Descargando dependencias para modo offline...");

files.forEach(file => {
    // Determinar ruta correcta (si es fuente va a /webfonts)
    const filePath = path.join(publicDir, file.name);
    const fileStream = fs.createWriteStream(filePath);

    https.get(file.url, (response) => {
        // Validación: Asegurar que la descarga fue exitosa (Status 200)
        if (response.statusCode !== 200) {
            console.error(`❌ Error descargando ${file.name}: Status ${response.statusCode}`);
            response.resume(); // Liberar memoria
            fileStream.close();
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // Borrar archivo corrupto
            return;
        }

        response.pipe(fileStream);
        fileStream.on('finish', () => {
            fileStream.close();
            console.log(`✅ ${file.name} descargado correctamente.`);
        });
    }).on('error', (err) => {
        console.error(`❌ Error descargando ${file.name}:`, err.message);
    });
});