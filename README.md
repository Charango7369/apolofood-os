# 🍽️ ApoloFoodOS

Sistema de gestión de pedidos para pequeños restaurantes en Apolo, La Paz (Bolivia).  
**Offline-first · WhatsApp · PWA**

---

## Arquitectura de producción

```
┌─────────────────────────────────────────────────────────┐
│  Cliente (navegador / Android instalado como PWA)        │
│  Service Worker cachea menú offline en IndexedDB         │
└──────────────┬──────────────────────────────────────────┘
               │ HTTPS
┌──────────────▼──────────────────────────────────────────┐
│  Cloudflare Pages (frontend)                            │
│  React + Vite + PWA   •   CDN global   •   Gratis       │
│  apolofood.pages.dev  →  panel.apolofood.lat (futuro)   │
└──────────────┬──────────────────────────────────────────┘
               │ HTTPS  /api/*
┌──────────────▼──────────────────────────────────────────┐
│  Railway (backend)                                      │
│  FastAPI + Uvicorn   •   Docker   •   $5/mes aprox.     │
│  apolofood-production.up.railway.app                    │
└──────────────┬──────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────┐
│  Railway PostgreSQL   ó   Neon.tech (recomendado)       │
│  Plan free: 1GB / 0.5GB   •   SSL incluido              │
└─────────────────────────────────────────────────────────┘
```

---

## Inicio rápido en desarrollo

### Opción A: Docker Compose (replica producción con PostgreSQL)

```bash
cp .env.example .env
docker compose up --build
# Backend en: http://localhost:8000/api/docs
# Luego en otra terminal:
cd frontend && cp .env.example .env.local && npm install && npm run dev
# Frontend en: http://localhost:5173
```

### Opción B: Procesos separados (más rápido para desarrollo)

```bash
# 1. Variables de entorno
cp .env.example .env
# Editar .env — dejar DATABASE_URL con SQLite para arranque rápido

# 2. Backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python scripts/init_db.py          # crea tablas + datos demo
uvicorn app.main:app --reload --port 8000

# 3. Frontend (otra terminal)
cd frontend
cp .env.example .env.local         # VITE_API_URL vacío = proxy automático
npm install
npm run dev
```

---

## Variables de entorno

### Backend (.env en Railway)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL de Railway o Neon | `postgresql+asyncpg://...` |
| `CORS_ORIGINS` | URLs del frontend separadas por coma | `https://apolofood.pages.dev` |
| `SECRET_KEY` | Clave secreta (32 bytes hex) | `openssl rand -hex 32` |
| `TWILIO_ACCOUNT_SID` | Vacío = mock en consola | opcional |
| `TWILIO_AUTH_TOKEN` | Vacío = mock en consola | opcional |

### Frontend (.env en Cloudflare Pages)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL del backend Railway | `https://apolofood-production.up.railway.app` |
| `VITE_RESTAURANTE_ID` | ID del restaurante activo | `rest-demo-001` |

---

## Deploy a producción

### 1. Backend → Railway

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login y deploy
railway login
railway init          # crear proyecto nuevo
railway up            # sube el código y hace deploy con Dockerfile

# Agregar PostgreSQL
railway add --plugin postgresql
# Railway inyecta DATABASE_URL automáticamente

# Configurar variables de entorno en Railway dashboard:
# SECRET_KEY, CORS_ORIGINS, TWILIO_* (si aplica)
```

**Nota:** El `CMD` del Dockerfile corre `alembic upgrade head` antes de arrancar Uvicorn.  
Las migraciones se aplican automáticamente en cada deploy.

### 2. Frontend → Cloudflare Pages

**Opción A: GitHub Actions (automático)**
1. Subir el repo a GitHub
2. En GitHub → Settings → Secrets:
   - `CF_API_TOKEN` (Cloudflare API token con permisos Pages)
   - `CF_ACCOUNT_ID` (tu account ID de Cloudflare)
   - `VITE_API_URL` (URL de Railway del paso anterior)
   - `VITE_RESTAURANTE_ID`
3. Cada push a `main` que toque `frontend/` hace deploy automático.

**Opción B: Cloudflare Pages dashboard (manual)**
- Framework preset: **Vite**
- Build command: `npm run build`
- Build output: `dist`
- Root directory: `frontend`
- Variables de entorno: `VITE_API_URL`, `VITE_RESTAURANTE_ID`

### 3. Conectar los dos

En Railway, agregar a `CORS_ORIGINS`:
```
https://apolofood.pages.dev,https://TU-DOMINIO-CUSTOM.com
```

---

## Generar primera migración Alembic

```bash
# Activar venv
source venv/bin/activate

# Generar migración inicial desde los modelos
alembic revision --autogenerate -m "initial_schema"

# Aplicar
alembic upgrade head

# Ver historial
alembic history
```

---

## Estructura del proyecto

```
ApoloFoodOS/
├── app/                          ← Backend FastAPI (Railway)
│   ├── main.py                   ← App, CORS, lifespan
│   ├── config.py                 ← Settings desde env vars
│   ├── database.py               ← Engine async + pool PostgreSQL
│   ├── models/                   ← SQLAlchemy ORM
│   ├── schemas/                  ← Pydantic I/O
│   ├── routers/                  ← /api/pedidos /menu /whatsapp /reportes
│   ├── services/                 ← WhatsApp (real/mock)
│   └── workers/                  ← Cola asyncio de notificaciones
├── frontend/                     ← PWA React (Cloudflare Pages)
│   ├── public/
│   │   ├── _redirects            ← SPA routing en Cloudflare
│   │   └── _headers              ← Cache headers optimizados
│   ├── src/
│   │   ├── hooks/useOfflineQueue.js  ← IndexedDB + sync automático
│   │   ├── lib/api.js            ← VITE_API_URL en prod, proxy en dev
│   │   └── pages/                ← Menu, Panel, Reportes
│   └── .env.example              ← Variables del frontend
├── alembic/
│   └── env.py                    ← Lee DATABASE_URL del entorno
├── .github/workflows/
│   └── deploy-frontend.yml       ← Auto-deploy a Cloudflare Pages
├── Dockerfile                    ← Solo backend, sin frontend
├── railway.toml                  ← Config declarativa Railway
├── docker-compose.yml            ← Dev local con PostgreSQL
└── .env.example                  ← Variables del backend
```

---

## Decisiones de arquitectura

| Decisión | Razón |
|----------|-------|
| Frontend en Cloudflare Pages | CDN gratuito, caché edge, experiencia previa con el stack |
| Backend en Railway | Deploy con Dockerfile, PostgreSQL integrado, $5/mes |
| `alembic upgrade head` en CMD | Migraciones automáticas en cada deploy, cero intervención manual |
| Pool PostgreSQL limitado (5+10) | Railway plan free tiene límite de conexiones simultáneas |
| `pool_pre_ping=True` | Detecta conexiones caídas tras inactividad (Railway duerme el servicio) |
| `postgres://` → normalización | Railway entrega la URL sin `+asyncpg`, env.py lo corrige automáticamente |
| `NetworkOnly` para /api/pedidos | Los pedidos no se cachean — se guardan en IndexedDB si hay offline |
| `NetworkFirst` para /api/menu | Menú sirve desde caché si el backend tarda más de 5s |

---

Desarrollado para **ApoloDigital** — Apolo, Franz Tamayo, La Paz, Bolivia 🇧🇴
