const fs = require('fs');
const https = require('https');
const path = require('path');

const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        const dir = path.dirname(dest);
        // Crear directorio si no existe
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const file = fs.createWriteStream(dest);
        https.get(url, response => {
            // Manejar redirecciones si las hay
            if (response.statusCode === 302 || response.statusCode === 301) {
                download(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Fallo al descargar '${url}' (Status: ${response.statusCode})`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => file.close(resolve));
        }).on('error', err => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
};

// Lista de librerías para uso offline
const assets = [
    {
        url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
        dest: path.join(__dirname, '../public/css/bootstrap.min.css')
    },
    {
        url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
        dest: path.join(__dirname, '../public/js/bootstrap.bundle.min.js')
    },
    {
        url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
        dest: path.join(__dirname, '../public/css/all.min.css')
    },
    {
        url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
        dest: path.join(__dirname, '../public/webfonts/fa-solid-900.woff2')
    },
    {
        url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2',
        dest: path.join(__dirname, '../public/webfonts/fa-regular-400.woff2')
    },
    {
        url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-brands-400.woff2',
        dest: path.join(__dirname, '../public/webfonts/fa-brands-400.woff2')
    },
    {
        url: 'https://cdn.jsdelivr.net/npm/chart.js',
        dest: path.join(__dirname, '../public/js/chart.min.js')
    }
];

console.log('⬇️  Descargando recursos para uso 100% offline...');

Promise.all(assets.map(asset => {
    console.log(`⏳ Descargando: ${path.basename(asset.dest)}`);
    return download(asset.url, asset.dest);
})).then(() => {
    console.log('\n✅ ¡Todos los recursos se han descargado con éxito!');
    console.log('\n⚠️  ACCIÓN REQUERIDA: Asegúrate de que todos tus archivos HTML apunten a estas rutas locales:');
    console.log('   - <link rel="stylesheet" href="/css/bootstrap.min.css">');
    console.log('   - <link rel="stylesheet" href="/css/all.min.css">');
    console.log('   - <script src="/js/bootstrap.bundle.min.js"></script>');
    console.log('   - <script src="/js/chart.min.js"></script>');
}).catch(err => {
    console.error('\n❌ Error descargando recursos:', err);
});