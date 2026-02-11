#!/bin/bash

echo "🔍 VERIFICACIÓN FASE 1 - BUNS & GRILL SYSTEM"
echo "=============================================="
echo ""

# Verificar archivos
echo "📁 Verificando archivos..."
FILES=(
  "controllers/metrics.controller.js"
  "routes/admin-metrics.js"
  "services/cron.service.js"
  "scripts/seed_buns_grill.js"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file - NO EXISTE"
  fi
done

echo ""
echo "📊 Verificando base de datos..."

# Verificar productos
PRODUCTS=$(node -e "
const mongoose = require('mongoose');
const Product = require('./models/Product');
mongoose.connect('mongodb://127.0.0.1:27017/prueba_wifi').then(async () => {
  const count = await Product.countDocuments();
  console.log(count);
  process.exit(0);
});
" 2>/dev/null)

if [ "$PRODUCTS" -eq 5 ]; then
  echo "✅ Productos: $PRODUCTS (esperados: 5)"
else
  echo "⚠️  Productos: $PRODUCTS (esperados: 5)"
  echo "   Ejecutar: node scripts/seed_buns_grill.js"
fi

# Verificar inventario
INVENTORY=$(node -e "
const mongoose = require('mongoose');
const Inventory = require('./models/Inventory');
mongoose.connect('mongodb://127.0.0.1:27017/prueba_wifi').then(async () => {
  const count = await Inventory.countDocuments();
  console.log(count);
  process.exit(0);
});
" 2>/dev/null)

if [ "$INVENTORY" -eq 13 ]; then
  echo "✅ Inventario: $INVENTORY insumos (esperados: 13)"
else
  echo "⚠️  Inventario: $INVENTORY insumos (esperados: 13)"
  echo "   Ejecutar: node scripts/seed_buns_grill.js"
fi

echo ""
echo "🔧 Verificando servidor..."

# Verificar si el servidor está corriendo
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "✅ Servidor corriendo en http://localhost:3000"
  
  echo ""
  echo "🧪 Probando endpoints de métricas..."
  echo "   (Requiere estar autenticado)"
  
  # Intentar obtener token
  TOKEN=$(curl -s -X POST http://localhost:3000/api/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"1234"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
  
  if [ -n "$TOKEN" ]; then
    echo "✅ Token obtenido"
    
    # Probar endpoint de métricas
    RESPONSE=$(curl -s http://localhost:3000/api/admin/metrics/financial \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$RESPONSE" | grep -q "totalRevenue"; then
      echo "✅ Endpoint /api/admin/metrics/financial funciona"
    else
      echo "⚠️  Endpoint /api/admin/metrics/financial no responde correctamente"
    fi
  else
    echo "⚠️  No se pudo obtener token (verificar usuarios)"
  fi
else
  echo "⚠️  Servidor NO está corriendo"
  echo "   Iniciar: node server.js"
fi

echo ""
echo "=============================================="
echo "📋 RESUMEN:"
echo ""
echo "Para usar el sistema:"
echo "1. Iniciar servidor: node server.js"
echo "2. Abrir cliente: http://localhost:3000"
echo "3. Abrir staff: http://localhost:3000/staff.html"
echo "4. Abrir dashboard: http://localhost:3000/dashboard.html"
echo ""
echo "Credenciales: admin / 1234"
