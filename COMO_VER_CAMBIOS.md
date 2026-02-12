# 🔄 CÓMO VER LOS CAMBIOS

## ⚠️ PROBLEMA COMÚN

Los cambios están en el código pero el navegador muestra la versión antigua en caché.

---

## ✅ SOLUCIÓN RÁPIDA

### Opción 1: Modo Incógnito (Recomendado)
```
Chrome/Edge: Ctrl+Shift+N
Firefox: Ctrl+Shift+P
```
Luego abrir: http://localhost:3000

### Opción 2: Limpiar Caché
```
1. Presionar F12 (abrir DevTools)
2. Click derecho en botón de recargar
3. Seleccionar "Vaciar caché y recargar de forma forzada"
```

### Opción 3: Recarga Forzada
```
Ctrl+F5 (Windows/Linux)
Cmd+Shift+R (Mac)
```

---

## 🚀 PASOS COMPLETOS

### 1. Reiniciar Servidor
```bash
./reiniciar-servidor.sh
```

O manualmente:
```bash
# Detener servidor
pkill -f "node server.js"

# Iniciar servidor
node server.js
```

### 2. Limpiar Caché del Navegador
- Abrir en modo incógnito
- O presionar Ctrl+F5

### 3. Verificar Cambios
Abrir: http://localhost:3000

**Deberías ver:**
- ✅ Fondo beige claro (no rojo)
- ✅ Botones naranjas (no amarillos)
- ✅ Diseño más limpio

---

## 🧪 VERIFICACIÓN VISUAL

### ANTES (versión antigua):
- Fondo rojo oscuro (#8B0000)
- Botones amarillos (#FFC107)
- Sin wizard progress
- Sin carrito flotante

### DESPUÉS (versión nueva):
- ✅ Fondo beige (#F9F7F2)
- ✅ Botones naranjas (#D35400)
- ✅ Wizard progress visible (pasos 1-4)
- ✅ Carrito flotante en menú

---

## 📋 CHECKLIST

- [ ] Servidor reiniciado
- [ ] Navegador en modo incógnito
- [ ] URL: http://localhost:3000
- [ ] Fondo beige visible
- [ ] Botones naranjas visible

Si todos los checks están ✅ pero no ves cambios:

### Verificar archivo index.html
```bash
grep "#F9F7F2" public/index.html
```
Debe mostrar: `body { background: #F9F7F2; }`

Si no aparece, el archivo no se guardó correctamente.

---

## 🔧 TROUBLESHOOTING

### "Sigo viendo fondo rojo"
**Causa**: Caché del navegador
**Solución**: Modo incógnito o Ctrl+Shift+Delete

### "No veo wizard progress"
**Causa**: Debes avanzar al paso 2
**Solución**: Ingresar nombre y continuar

### "No veo carrito flotante"
**Causa**: Solo aparece en el menú (paso 3)
**Solución**: Llegar al menú de productos

### "Servidor no inicia"
```bash
# Ver errores
tail -f server.log

# Verificar puerto
lsof -i:3000
```

---

## 💡 CONSEJO

**Siempre usa modo incógnito** para probar cambios de frontend.

Esto evita problemas de caché.

---

## 📞 COMANDOS ÚTILES

```bash
# Reiniciar servidor
./reiniciar-servidor.sh

# Ver logs del servidor
tail -f server.log

# Verificar que servidor esté corriendo
curl http://localhost:3000

# Ver cambios en git
git log --oneline -5
```

---

## ✅ CONFIRMACIÓN

Si ves el fondo beige y botones naranjas:
**¡Los cambios están funcionando!** 🎉

Continúa probando:
1. Ingresar nombre
2. Ver wizard progress aparecer
3. Seleccionar servicio
4. Ver menú con nuevos productos
5. Ver carrito flotante
6. Agregar productos
7. Abrir carrito y editar
