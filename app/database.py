from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings
import logging

logger = logging.getLogger(__name__)


def _build_engine():
    url = settings.DATABASE_URL
    kwargs = {"echo": settings.DEBUG}

    if settings.is_sqlite:
        # SQLite: solo para desarrollo local
        kwargs["connect_args"] = {"check_same_thread": False}
        logger.warning("⚠️  Usando SQLite — solo válido para desarrollo local")
    elif settings.is_postgres:
        # PostgreSQL: pool optimizado para Railway (conexiones limitadas en plan free)
        kwargs["pool_size"] = 5
        kwargs["max_overflow"] = 10
        kwargs["pool_pre_ping"] = True  # detecta conexiones caídas
        kwargs["pool_recycle"] = 300    # recicla conexiones cada 5 min
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
    """Solo para desarrollo con SQLite. En producción usar: alembic upgrade head"""
    if settings.is_postgres:
        logger.info("PostgreSQL detectado — omitiendo create_all. Usar Alembic.")
        return

    async with engine.begin() as conn:
        from app.models import restaurante, producto, pedido  # noqa
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ SQLite inicializado con create_all")
