# ✅ CHECKLIST DE PRUEBAS - MOMOY'S BURGER

## 🔧 Pre-requisitos

- [ ] MongoDB está corriendo (`pgrep mongod` o `sudo systemctl status mongod`)
- [ ] Dependencias instaladas (`npm install`)
- [ ] Usuario admin creado (`node scripts/create_admin.js`)
- [ ] Carpeta uploads existe (`mkdir -p public/uploads`)

---

## 1️⃣ PRUEBA: Levantar Servidor

```bash
node server.js
```

### ✅ Resultado Esperado:
```
🟢 MongoDB conectado
🚀 Servidor corriendo en http://localhost:3000
🔗 LINK PARA EL PORTAL CAUTIVO: http://192.168.X.X:3000
```

### ❌ Si falla:
- Verificar que MongoDB esté corriendo
- Verificar que puerto 3000 esté libre: `lsof -i:3000`
- Revisar archivo .env

---

## 2️⃣ PRUEBA: Login Staff

1. Abrir: http://localhost:3000
2. Click en "Acceso Staff"
3. Usuario: `admin`
4. Contraseña: `admin123`
5. Click "Entrar"

### ✅ Resultado Esperado:
- Redirección a `/staff.html`
- Se muestra badge "ADMIN" en navbar
- Panel de pedidos visible

### ❌ Si falla:
- Abrir consola (F12) y buscar errores
- Verificar que usuario admin exista en BD
- Verificar que JWT_SECRET esté configurado

---

## 3️⃣ PRUEBA: Crear Producto

1. En panel staff, ir a pestaña "Menú"
2. Click "Nuevo Producto"
3. Llenar formulario:
   - Nombre: "Hamburguesa Clásica"
   - Categoría: Hamburguesa
   - Precio 1: 70
   - Precio 2: 120
   - Precio 3: 160
   - Ingredientes: Cebolla, Tomate, Lechuga
4. Click "Guardar Cambios"

### ✅ Resultado Esperado:
- Modal se cierra
- Producto aparece en tabla
- No hay errores en consola

### ❌ Si falla:
- Verificar que token esté en localStorage
- Verificar permisos de carpeta uploads
- Revisar consola del navegador

---

## 4️⃣ PRUEBA: Crear Pedido (Cliente)

1. Abrir nueva pestaña: http://localhost:3000
2. Ingresar nombre: "Juan Pérez"
3. Click "CONTINUAR"
4. Seleccionar "COMER AQUÍ"
5. Click en producto creado
6. Click "AGREGAR AL PEDIDO"
7. Verificar que total se actualice
8. Click "PEDIR"
9. Confirmar orden

### ✅ Resultado Esperado:
- Muestra pantalla "Tu número de orden #1"
- Estado: "ENVIADO"
- Mensaje: "Pasa a pagar a caja"

### ❌ Si falla:
- Verificar que productos existan en BD
- Revisar consola del navegador
- Verificar que endpoint `/api/pedido` funcione

---

## 5️⃣ PRUEBA: Cambiar Estado de Pedido

1. Volver a pestaña del staff
2. Verificar que aparezca nuevo pedido en panel
3. Click "💰 COBRAR Y ENVIAR"
4. Verificar que botón cambie a "🔥 PREPARAR"
5. Click "🔥 PREPARAR"
6. Click "✅ LISTO"
7. Click "📦 ENTREGAR"

### ✅ Resultado Esperado:
- Cada cambio se refleja inmediatamente
- Pedido desaparece del panel al completarse
- No hay errores en consola del servidor

### ❌ Si falla:
- Verificar que token tenga permisos
- Revisar logs del servidor
- Verificar que endpoint `/api/pedido/:id/status` funcione

---

## 6️⃣ PRUEBA: Actualización en Tiempo Real (Socket.io)

1. Mantener ambas pestañas abiertas (cliente y staff)
2. En staff, cambiar estado de un pedido
3. Observar pestaña del cliente

### ✅ Resultado Esperado:
- Cliente ve cambio de estado SIN recargar página
- Barra de progreso se actualiza
- Mensaje cambia según estado
- Sonido al llegar a "LISTO"

### ❌ Si falla:
- Abrir consola en ambas pestañas
- Verificar que Socket.io esté cargando: `/socket.io/socket.io.js`
- Revisar logs del servidor para conexiones socket
- Verificar que no haya firewall bloqueando

---

## 7️⃣ PRUEBA: Inventario (Opcional)

1. En staff, ir a "Inventario"
2. Click "Nuevo Insumo"
3. Crear insumo:
   - Nombre: "Carne de Res"
   - Cantidad: 10
   - Unidad: kg
   - Costo: 150
   - Mínimo: 2
4. Guardar

### ✅ Resultado Esperado:
- Insumo aparece en tabla
- Badge "OK" (verde) si cantidad > mínimo
- Badge "BAJO" (rojo) si cantidad < mínimo

---

## 8️⃣ PRUEBA: Descuento de Inventario

**Pre-requisito**: Producto debe tener receta configurada

1. Crear pedido con producto que tenga receta
2. En staff, cambiar estado a "IN_KITCHEN" (COBRAR)
3. Ir a pestaña "Inventario"
4. Verificar que cantidad de insumos haya disminuido

### ✅ Resultado Esperado:
- Stock se descuenta automáticamente
- Logs del servidor muestran: "📉 Stock descontado para Pedido #X"

### ❌ Si falla:
- Verificar que producto tenga receta configurada
- Revisar logs del servidor
- Verificar que insumos existan en BD

---

## 🎯 RESUMEN DE PRUEBAS

| # | Prueba | Estado | Notas |
|---|--------|--------|-------|
| 1 | Servidor levanta | ⬜ | |
| 2 | Login funciona | ⬜ | |
| 3 | Crear producto | ⬜ | |
| 4 | Crear pedido | ⬜ | |
| 5 | Cambiar estado | ⬜ | |
| 6 | Socket.io actualiza | ⬜ | |
| 7 | Inventario CRUD | ⬜ | |
| 8 | Descuento stock | ⬜ | |

---

## 🐛 Errores Comunes

### "Cannot connect to MongoDB"
```bash
sudo systemctl start mongod
# O
mongod --dbpath ~/data/db
```

### "Port 3000 already in use"
```bash
lsof -ti:3000 | xargs kill -9
# O cambiar PORT en .env
```

### "Token inválido"
- Borrar localStorage del navegador (F12 → Application → Local Storage → Clear)
- Hacer login nuevamente

### "Socket.io not defined"
- Verificar que `/socket.io/socket.io.js` cargue (Network tab en F12)
- Reiniciar servidor

### "Cannot read property of undefined"
- Verificar que productos existan en BD
- Verificar que usuario admin exista
- Revisar consola para ver qué propiedad falta

---

## 📊 Logs a Monitorear

Durante las pruebas, el servidor debe mostrar:

```
🍔 Pedido #1 recibido de Juan Pérez.
🔌 Cliente conectado a Socket.io: abc123
📉 Stock descontado para Pedido #1.
💰 Venta registrada para Pedido #1. Ganancia: $XX.XX
```

Si ves errores en rojo, revisar el código correspondiente.
