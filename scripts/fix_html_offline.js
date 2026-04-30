const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

console.log('🛠️  Buscando y corrigiendo enlaces de internet en archivos HTML...');

const replacements = [
    { from: /https:\/\/cdn\.jsdelivr\.net\/npm\/bootstrap@5\.3\.0\/dist\/css\/bootstrap\.min\.css/g, to: '/css/bootstrap.min.css' },
    { from: /https:\/\/cdn\.jsdelivr\.net\/npm\/bootstrap@5\.3\.0\/dist\/js\/bootstrap\.bundle\.min\.js/g, to: '/js/bootstrap.bundle.min.js' },
    { from: /https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome\/6\.4\.0\/css\/all\.min\.css/g, to: '/css/all.min.css' },
    { from: /https:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js/g, to: '/js/chart.min.js' }
];

let archivosModificados = 0;

if (fs.existsSync(publicDir)) {
    fs.readdirSync(publicDir).forEach(file => {
        if (file.endsWith('.html')) {
            const filePath = path.join(publicDir, file);
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;

            replacements.forEach(rep => {
                if (content.match(rep.from)) {
                    content = content.replace(rep.from, rep.to);
                    modified = true;
                }
            });

            if (modified) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`✅ Archivo corregido: ${file} (Ahora es 100% offline)`);
                archivosModificados++;
            }
        }
    });
}

if (archivosModificados === 0) {
    console.log('👍 Todos los archivos HTML ya están configurados para uso local.');
} else {
    console.log('\n🎉 ¡Listo! La lentitud extrema y pérdida de estilos deberían desaparecer.');
}