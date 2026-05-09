from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import logging

from app.config import settings
from app.database import init_db
from app.routers import pedidos, menu, whatsapp, reportes, auth, usuarios
from app.workers.notificaciones_worker import worker_notificaciones

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"🚀 Iniciando {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"   DB: {'PostgreSQL' if settings.is_postgres else 'SQLite'}")
    logger.info(f"   CORS: {settings.cors_origins_list}")

    await init_db()

    task = asyncio.create_task(worker_notificaciones())
    yield
    task.cancel()
    logger.info("👋 ApoloFoodOS detenido")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    # En producción Railway, ocultar docs si quieres:
    # docs_url=None if not settings.DEBUG else "/api/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(pedidos.router)
app.include_router(menu.router)
app.include_router(whatsapp.router)
app.include_router(reportes.router)


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "db": "postgresql" if settings.is_postgres else "sqlite",
    }


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "docs": "/api/docs",
        "health": "/api/health",
    }
