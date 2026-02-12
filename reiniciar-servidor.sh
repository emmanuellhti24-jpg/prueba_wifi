#!/bin/bash

echo "🔄 REINICIANDO SERVIDOR"
echo "=========================================="

# 1. Matar TODAS las instancias
echo "1. Deteniendo servidor anterior..."
pkill -9 -f "node server.js" 2>/dev/null
sleep 2

# 2. Verificar que el puerto esté libre
if lsof -ti:3000 > /dev/null 2>&1; then
  echo "⚠️  Puerto 3000 aún ocupado, forzando liberación..."
  lsof -ti:3000 | xargs kill -9 2>/dev/null
  sleep 1
fi

# 3. Iniciar servidor
echo "2. Iniciando servidor..."
cd /home/emmanuel/prueba_wifi
node server.js > server.log 2>&1 &
SERVER_PID=$!
echo "   Servidor iniciado (PID: $SERVER_PID)"

sleep 3

# 3. Verificar que esté corriendo
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Servidor corriendo en http://localhost:3000"
else
    echo "❌ Error: Servidor no responde"
    exit 1
fi

echo ""
echo "=========================================="
echo "📋 PASOS PARA VER LOS CAMBIOS:"
echo ""
echo "1. Abrir navegador en modo incógnito (Ctrl+Shift+N)"
echo "   O limpiar caché:"
echo "   - Chrome/Edge: Ctrl+Shift+Delete"
echo "   - Firefox: Ctrl+Shift+Delete"
echo ""
echo "2. Abrir: http://localhost:3000"
echo ""
echo "3. Deberías ver:"
echo "   ✅ Fondo beige claro (#F9F7F2)"
echo "   ✅ Botones naranjas (#D35400)"
echo "   ✅ Wizard progress (después de ingresar nombre)"
echo "   ✅ Carrito flotante (en el menú)"
echo ""
echo "Si no ves cambios:"
echo "- Presiona Ctrl+F5 (recarga forzada)"
echo "- O usa modo incógnito"
