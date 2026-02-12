const fs = require('fs');
const https = require('https');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

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
    }
];

console.log("⬇️  Descargando dependencias para modo offline...");

files.forEach(file => {
    const filePath = path.join(publicDir, file.name);
    const fileStream = fs.createWriteStream(filePath);

    https.get(file.url, (response) => {
        response.pipe(fileStream);
        fileStream.on('finish', () => {
            fileStream.close();
            console.log(`✅ ${file.name} descargado en public/`);
        });
    }).on('error', (err) => {
        console.error(`❌ Error descargando ${file.name}:`, err.message);
    });
});