#!/bin/bash

echo "🔍 Verificando entorno de desarrollo..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi
echo "✅ npm $(npm -v)"

# Verificar MongoDB
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB no está instalado o no está en PATH"
    echo "   Instalar: sudo apt install mongodb (Ubuntu/Debian)"
else
    echo "✅ MongoDB instalado"
fi

# Verificar si MongoDB está corriendo
if pgrep -x "mongod" > /dev/null; then
    echo "✅ MongoDB está corriendo"
else
    echo "⚠️  MongoDB NO está corriendo"
    echo "   Iniciar: sudo systemctl start mongod"
    echo "   O: mongod --dbpath ~/data/db"
fi

# Verificar node_modules
if [ ! -d "node_modules" ]; then
    echo "⚠️  Dependencias no instaladas"
    echo "   Ejecutar: npm install"
else
    echo "✅ Dependencias instaladas"
fi

# Verificar archivo .env
if [ ! -f ".env" ]; then
    echo "⚠️  Archivo .env no existe"
    echo "   Copiar: cp .env.example .env"
else
    echo "✅ Archivo .env existe"
fi

# Verificar carpeta uploads
if [ ! -d "public/uploads" ]; then
    echo "⚠️  Carpeta uploads no existe, creando..."
    mkdir -p public/uploads
    echo "✅ Carpeta uploads creada"
else
    echo "✅ Carpeta uploads existe"
fi

echo ""
echo "🎯 Verificación completa. Si hay advertencias, corrígelas antes de iniciar."
