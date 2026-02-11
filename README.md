# 🍔 Momoy's Burger - Sistema de Pedidos

Sistema completo de gestión de pedidos para restaurante con menú digital, panel de administración y actualizaciones en tiempo real.

## 🚀 Características

- **Menú Digital**: Interfaz para clientes con selección de productos y personalización
- **Panel de Administración**: Gestión completa con roles (Admin, Cajero, Cocinero)
- **Estados de Pedidos**: Flujo completo desde pago hasta entrega
- **Tiempo Real**: Actualizaciones instantáneas con Socket.io
- **Gestión de Inventario**: Control de stock con descuento automático
- **Autenticación**: Sistema seguro con JWT y bcrypt
- **Métricas**: Reportes de ventas y productos más vendidos

## 📋 Requisitos

- Node.js 16+
- MongoDB 4.4+
- npm o yarn

## 🔧 Instalación

```bash
# 1. Clonar repositorio
git clone <tu-repo>
cd prueba_wifi

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env

# 4. Iniciar MongoDB
sudo systemctl start mongod

# 5. Crear usuario administrador
node scripts/create_admin.js

# 6. Iniciar servidor
node server.js
```

## 🌐 Acceso

- **Portal Cliente**: http://localhost:3000
- **Panel Staff**: http://localhost:3000/staff.html

## 🔑 Credenciales por Defecto

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | 1234 | Administrador |
| cajero | 1234 | Cajero |
| cocina | 1234 | Cocinero |

## 📱 Flujo de Uso

### Cliente:
1. Ingresar nombre
2. Seleccionar tipo de servicio (Comer aquí / Para llevar)
3. Agregar productos al carrito
4. Confirmar pedido
5. Ver estado en tiempo real

### Staff:
1. Login con credenciales
2. Ver pedidos activos
3. Cambiar estados: COBRAR → PREPARAR → LISTO → ENTREGAR
4. Gestionar menú e inventario

## 🛠️ Tecnologías

- **Backend**: Node.js + Express
- **Base de Datos**: MongoDB + Mongoose
- **Tiempo Real**: Socket.io
- **Autenticación**: JWT + bcrypt
- **Frontend**: Vanilla JS + Bootstrap 5
- **Seguridad**: Helmet + CORS

## 📂 Estructura

```
/models         → Esquemas de MongoDB
/routes         → Endpoints de API
/middleware     → Autenticación y validación
/public         → Frontend (HTML/CSS/JS)
/scripts        → Utilidades de setup
server.js       → Punto de entrada
```

## 🔒 Seguridad

- Autenticación JWT
- Contraseñas hasheadas con bcrypt
- Validación de entrada
- Roles y permisos
- Protección CORS
- Helmet (CSP desactivado en desarrollo)

## 📝 Scripts Disponibles

```bash
npm start                        # Iniciar servidor
node scripts/create_admin.js     # Crear usuarios
node scripts/seed_inventory.js   # Cargar datos de prueba
./check-env.sh                   # Verificar entorno
```

## 🐛 Solución de Problemas

Ver documentación detallada:
- `README_LOCAL.md` - Guía completa de instalación
- `TESTING_CHECKLIST.md` - Pruebas paso a paso
- `INICIO_RAPIDO.md` - Inicio rápido

## 📄 Licencia

MIT

## 👤 Autor

Emmanuel

---

**Estado**: ✅ Funcional y listo para desarrollo local
