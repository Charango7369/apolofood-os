from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings
import logging

logger = logging.getLogger(__name__)


def _normalize_url(url: str) -> str:
    """Railway entrega postgresql:// — SQLAlchemy async necesita postgresql+asyncpg://"""
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://") and "+asyncpg" not in url:
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def _build_engine():
    url = _normalize_url(settings.DATABASE_URL)
    kwargs = {"echo": settings.DEBUG}

    if "sqlite" in url:
        kwargs["connect_args"] = {"check_same_thread": False}
        logger.warning("⚠️  Usando SQLite — solo válido para desarrollo local")
    else:
        kwargs["pool_size"] = 5
        kwargs["max_overflow"] = 10
        kwargs["pool_pre_ping"] = True
        kwargs["pool_recycle"] = 300
        logger.info("✅ Usando PostgreSQL")

    return create_async_engine(url, **kwargs)


engine = _build_engine()

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Solo para SQLite en desarrollo. En producción usa Alembic."""
    if "postgresql" in str(engine.url):
        logger.info("PostgreSQL detectado — omitiendo create_all. Usar Alembic.")
        return
    async with engine.begin() as conn:
        from app.models import restaurante, producto, pedido  # noqa
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ SQLite inicializado")