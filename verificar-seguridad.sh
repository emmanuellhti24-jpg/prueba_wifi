#!/bin/bash

echo "🔍 Verificando handlers inline en index.html..."
echo ""

# Buscar onclick, onload, onerror, etc. (excluyendo meta viewport)
INLINE_HANDLERS=$(grep -n "on[a-z]*=" public/index.html | grep -v "initial-scale" | grep -v "<!-- " | wc -l)

if [ "$INLINE_HANDLERS" -eq 0 ]; then
    echo "✅ No se encontraron handlers inline (onclick, onload, etc.) en index.html"
else
    echo "❌ Se encontraron $INLINE_HANDLERS handlers inline en index.html:"
    grep -n "on[a-z]*=" public/index.html | grep -v "initial-scale" | grep -v "<!-- "
    exit 1
fi

echo ""
echo "🔍 Verificando que exista attachEventListeners()..."
if grep -q "attachEventListeners" public/index.html; then
    echo "✅ Función attachEventListeners() encontrada"
else
    echo "❌ No se encontró attachEventListeners()"
    exit 1
fi

echo ""
echo "🔍 Verificando configuración de CSP en server.js..."
if grep -q "contentSecurityPolicy" server.js; then
    echo "✅ CSP configurado en server.js"
else
    echo "❌ CSP no configurado"
    exit 1
fi

echo ""
echo "✅ TODAS LAS VERIFICACIONES PASARON"
echo ""
echo "📝 Para probar:"
echo "   Desarrollo: node server.js"
echo "   Producción: NODE_ENV=production node server.js"
