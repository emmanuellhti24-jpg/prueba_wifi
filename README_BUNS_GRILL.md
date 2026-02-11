# 🍔 Buns & Grill System

Sistema POS completo para restaurantes pequeños con gestión de inventario, pedidos en tiempo real y métricas de negocio.

![Status](https://img.shields.io/badge/status-active-success.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![MongoDB](https://img.shields.io/badge/mongodb-%3E%3D4.4-green.svg)

---

## 📋 Características Principales

### 🛒 Sistema de Pedidos
- Flujo wizard para clientes (Nombre → Servicio → Menú → Confirmación)
- Estados de pedido: PENDIENTE → PAGADO → COCINA → LISTO → ENTREGADO
- Actualizaciones en tiempo real con Socket.io
- Carrito persistente en navegador

### 📦 Gestión de Inventario
- Control de stock con alertas automáticas
- Semáforo visual (Verde/Amarillo/Rojo)
- Descuento automático al procesar pedidos
- Alertas diarias de stock bajo (8:00 AM)

### 🍽️ Catálogo de Productos
- Productos con recetas dinámicas
- Cálculo automático de costos
- Precios por volumen (1x, 2x, 3x)
- Personalización de ingredientes

### 📊 Dashboard de Métricas
- Ventas totales y ganancia real
- Top 5 productos más vendidos
- Distribución por categoría
- Ventas por hora del día
- Margen de ganancia

### 👥 Control de Acceso
- Roles: Admin, Cajero, Cocinero
- Autenticación JWT
- Permisos por endpoint

---

## 🛠️ Stack Tecnológico

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- Socket.io (tiempo real)
- JWT + bcrypt (autenticación)
- node-cron (tareas programadas)
- Morgan (logging)

**Frontend:**
- Vanilla JavaScript
- Bootstrap 5
- Chart.js (gráficas)
- Socket.io Client

**Seguridad:**
- Helmet
- CORS
- Validación de entrada
- Roles y permisos

---

## 📐 Arquitectura de Datos

### Inventory (Inventario)
```javascript
{
  nombre: String,
  cantidad: Number,
  unidad: String,        // pza, g, ml
  minimo: Number,        // Stock mínimo
  costoUnitario: Number
}
```

### Product (Productos)
```javascript
{
  nombre: String,
  categoria: String,     // hamburguesas, hotdogs
  precioUnitario: Number,
  receta: [{
    insumo: ObjectId,    // ref: Inventory
    cantidad: Number
  }],
  costoEstimado: Number  // Calculado automáticamente
}
```

### Order (Pedidos)
```javascript
{
  numeroOrden: Number,
  cliente: String,
  tipo: String,          // Aqui, Llevar
  items: Array,
  total: Number,
  status: String,        // PENDIENTE, PAGADO, COCINA, LISTO, ENTREGADO
  fecha: Date
}
```

### Sale (Ventas)
```javascript
{
  totalVenta: Number,
  totalCosto: Number,
  gananciaNeta: Number,
  items: Array,
  fecha: Date
}
```

---

## 🎨 Diseño Visual

### Paleta de Colores

**Cliente:**
- Fondo: `#F9F7F2` (Beige claro)
- Primario: `#D35400` (Naranja)
- Secundario: `#E67E22`

**Admin:**
- Fondo: `#2C3E50` (Azul oscuro)
- Texto: `#ECF0F1` (Claro)
- Acentos: `#3498DB`

**Estados:**
- Verde: `#2ECC71` (OK)
- Amarillo: `#F39C12` (Advertencia)
- Rojo: `#E74C3C` (Crítico)

---

## 🚀 Instalación

### Requisitos
- Node.js 16+
- MongoDB 4.4+
- npm o yarn

### Pasos

```bash
# 1. Clonar repositorio
git clone https://github.com/emmanuellhti24-jpg/prueba_wifi.git
cd prueba_wifi

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# 4. Iniciar MongoDB
sudo systemctl start mongod

# 5. Cargar datos iniciales
node scripts/seed_buns_grill.js

# 6. Crear usuarios
node scripts/create_admin.js

# 7. Iniciar servidor
npm start
```

---

## 🔧 Variables de Entorno

Crear archivo `.env`:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de Datos
MONGO_URI=mongodb://127.0.0.1:27017/prueba_wifi

# Seguridad
JWT_SECRET=tu_secreto_super_seguro_cambiar_en_produccion
```

---

## 📱 Uso del Sistema

### Portal Cliente
**URL:** `http://localhost:3000`

1. Ingresar nombre
2. Seleccionar servicio (Comer aquí / Para llevar)
3. Agregar productos al carrito
4. Confirmar pedido
5. Ver estado en tiempo real

### Panel Staff
**URL:** `http://localhost:3000/staff.html`

**Credenciales por defecto:**
- Admin: `admin` / `1234`
- Cajero: `cajero` / `1234`
- Cocina: `cocina` / `1234`

**Funciones por rol:**

**Admin:**
- Gestión completa de pedidos
- CRUD de productos
- CRUD de inventario
- CRUD de usuarios
- Dashboard de métricas

**Cajero:**
- Ver pedidos
- Cambiar estado: PENDIENTE → PAGADO
- Cambiar estado: LISTO → ENTREGADO

**Cocinero:**
- Ver pedidos
- Cambiar estado: PAGADO → COCINA
- Cambiar estado: COCINA → LISTO

---

## 📊 Endpoints de API

### Autenticación
```
POST /api/login
```

### Pedidos
```
POST /api/pedido
GET  /api/pedidos (protegido)
POST /api/pedido/:id/status (protegido)
```

### Productos
```
GET    /api/products
POST   /api/products (admin)
DELETE /api/products/:id (admin)
```

### Inventario
```
GET    /api/inventory (protegido)
POST   /api/inventory (protegido)
PUT    /api/inventory/:id (protegido)
DELETE /api/inventory/:id (protegido)
```

### Métricas (Admin)
```
GET /api/admin/metrics/financial
GET /api/admin/metrics/top-products
GET /api/admin/metrics/hourly
GET /api/admin/metrics/category
GET /api/admin/metrics/inventory-alerts
```

---

## 🍔 Productos Preconfigurados

### Hamburguesas
1. **Sencilla** - $45
   - Pan, 90g carne, lechuga, jitomate, cebolla, jalapeños

2. **Hawaiana** - $55
   - Base sencilla + jamón + piña

3. **Con Tocino** - $60
   - Base sencilla + queso + tocino

### Hot Dogs
1. **Sencillo** - $35
   - Pan media noche, salchicha, jitomate, cebolla

2. **Momia** - $45
   - Base sencillo + tocino envuelto

---

## 🔄 Flujo de Negocio

### Cuando un pedido pasa a PAGADO:
1. Se descuenta inventario según receta
2. Se calcula costo real del pedido
3. Se crea registro de venta (Sale)
4. Se notifica a cocina vía Socket.io

### Alertas Automáticas:
- Cron job diario (8:00 AM)
- Revisa insumos con stock ≤ mínimo
- Registra en consola

---

## 📈 Métricas Disponibles

### Financieras
- Total de ventas
- Total de costos
- Ganancia real
- Margen de ganancia (%)

### Productos
- Top 5 más vendidos
- Unidades vendidas por producto
- Ingresos por producto

### Operativas
- Ventas por hora del día
- Distribución por categoría
- Alertas de inventario bajo

---

## 🐛 Solución de Problemas

### MongoDB no conecta
```bash
sudo systemctl status mongod
sudo systemctl start mongod
```

### Puerto ocupado
```bash
lsof -ti:3000 | xargs kill -9
```

### Dependencias faltantes
```bash
npm install
```

### Datos de prueba
```bash
node scripts/seed_buns_grill.js
```

---

## 📝 Scripts Disponibles

```bash
npm start                           # Iniciar servidor
node scripts/seed_buns_grill.js     # Cargar productos e inventario
node scripts/create_admin.js        # Crear usuarios
./check-env.sh                      # Verificar entorno
```

---

## 🔒 Seguridad

- ✅ Autenticación JWT
- ✅ Contraseñas hasheadas (bcrypt)
- ✅ Validación de entrada
- ✅ Roles y permisos
- ✅ Protección CORS
- ✅ Helmet (CSP desactivado en dev)

**Nota:** Para producción, activar CSP y usar HTTPS.

---

## 📄 Licencia

MIT

---

## 👤 Autor

Emmanuel

---

## 🎯 Roadmap

- [ ] Reportes PDF
- [ ] Notificaciones por email
- [ ] Integración con impresora térmica
- [ ] App móvil
- [ ] Multi-sucursal

---

**Estado:** ✅ Funcional y listo para producción local

**Versión:** 2.0.0 - Buns & Grill System
