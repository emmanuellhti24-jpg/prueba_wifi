# 🍔 Momoy's Burger - Setup Local

## 📋 Requisitos Previos

- Node.js 16+ 
- MongoDB 4.4+
- npm o yarn

## 🚀 Instalación Rápida

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno
```bash
cp .env.example .env
# Editar .env si es necesario (valores por defecto funcionan para local)
```

### 3. Verificar Entorno
```bash
./check-env.sh
```

### 4. Iniciar MongoDB
```bash
# Ubuntu/Debian
sudo systemctl start mongod

# macOS (con Homebrew)
brew services start mongodb-community

# Windows
net start MongoDB

# Manual (cualquier OS)
mongod --dbpath ~/data/db
```

### 5. Crear Usuario Administrador
```bash
node scripts/create_admin.js
```
**Credenciales por defecto**: 
- Usuario: `admin`
- Contraseña: `admin123`

### 6. (Opcional) Cargar Datos de Prueba
```bash
node scripts/seed_inventory.js
```

### 7. Iniciar Servidor
```bash
npm start
# O para desarrollo con auto-reload:
# npm install -g nodemon
# nodemon server.js
```

## 🌐 Acceso

- **Portal Cliente**: http://localhost:3000
- **Panel Staff**: http://localhost:3000/staff.html
- **Panel Admin**: http://localhost:3000/admin.html

## 🔑 Usuarios de Prueba

Después de ejecutar `create_admin.js`:

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | admin123 | Administrador |

## 📱 Flujo de Prueba Completo

### Como Cliente:
1. Abrir http://localhost:3000
2. Ingresar nombre
3. Seleccionar tipo de servicio
4. Agregar productos al carrito
5. Confirmar pedido
6. Ver número de orden

### Como Staff:
1. Abrir http://localhost:3000/staff.html
2. Login con `admin` / `admin123`
3. Ver pedido en panel
4. Cambiar estado: COBRAR → PREPARAR → LISTO → ENTREGAR
5. Verificar que el cliente ve actualizaciones en tiempo real

## 🐛 Solución de Problemas

### MongoDB no conecta
```bash
# Verificar que esté corriendo
pgrep mongod

# Ver logs
sudo journalctl -u mongod -f

# Reiniciar servicio
sudo systemctl restart mongod
```

### Puerto 3000 ocupado
```bash
# Cambiar puerto en .env
PORT=3001

# O matar proceso
lsof -ti:3000 | xargs kill -9
```

### Socket.io no funciona
- Verificar que no haya firewall bloqueando
- Abrir consola del navegador (F12) y buscar errores
- Verificar que `/socket.io/socket.io.js` cargue correctamente

### Imágenes no se suben
```bash
# Crear carpeta si no existe
mkdir -p public/uploads
chmod 755 public/uploads
```

## 📂 Estructura del Proyecto

```
/models         → Esquemas de MongoDB
/routes         → Endpoints de API
/middleware     → Autenticación y validación
/public         → Frontend (HTML/CSS/JS)
/scripts        → Utilidades de setup
server.js       → Punto de entrada principal
```

## 🔧 Scripts Disponibles

```bash
npm start                    # Iniciar servidor
node scripts/create_admin.js # Crear usuario admin
node scripts/seed_inventory.js # Cargar datos de prueba
node scripts/limpiar_db.js   # Limpiar base de datos
./check-env.sh              # Verificar entorno
```

## ⚠️ Notas Importantes

- **NO usar en producción sin cambiar JWT_SECRET**
- La carpeta `/src` NO se usa (es código experimental)
- Los pedidos se reinician cada día (numeroOrden vuelve a 1)
- El stock se descuenta automáticamente al cobrar pedido
- Las ventas se registran al completar pedido

## 📞 Soporte

Si encuentras errores:
1. Revisar consola del navegador (F12)
2. Revisar logs del servidor
3. Verificar que MongoDB esté corriendo
4. Ejecutar `./check-env.sh`
