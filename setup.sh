#!/bin/bash
set -e

echo ""
echo "🍽️  ApoloFoodOS — Setup"
echo "=========================="
echo ""

# 1. Crear .env
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ .env creado desde .env.example"
    echo "   ⚠️  Edita .env con tus credenciales reales antes de producción"
else
    echo "ℹ️  .env ya existe, no se sobreescribe"
fi

# 2. Entorno virtual Python
if [ ! -d "venv" ]; then
    echo ""
    echo "📦 Creando entorno virtual Python..."
    python3 -m venv venv
fi

echo "⚡ Activando venv..."
source venv/bin/activate

echo "📦 Instalando dependencias backend..."
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo "✅ Backend listo"

# 3. Frontend
echo ""
echo "📦 Instalando dependencias frontend..."
cd frontend
npm install --silent
echo "✅ Frontend instalado"
cd ..

# 4. Seed de base de datos
echo ""
echo "🗄️  Inicializando base de datos y datos de prueba..."
python scripts/init_db.py

echo ""
echo "============================================"
echo "✅ Setup completado. Para iniciar el sistema:"
echo ""
echo "  BACKEND (terminal 1):"
echo "  source venv/bin/activate"
echo "  uvicorn app.main:app --reload --port 8000"
echo ""
echo "  FRONTEND (terminal 2):"
echo "  cd frontend && npm run dev"
echo ""
echo "  Docs API: http://localhost:8000/api/docs"
echo "  App:      http://localhost:5173"
echo "============================================"
