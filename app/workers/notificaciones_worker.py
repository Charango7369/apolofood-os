import asyncio
import logging
from app.services.notificaciones import notificar_pedido_whatsapp

logger = logging.getLogger(__name__)

# Cola simple en memoria (reemplazar con Redis/Celery en prod)
_queue: asyncio.Queue = asyncio.Queue()


async def encolar_notificacion(telefono: str, pedido_id: str, total: float):
    await _queue.put({"telefono": telefono, "pedido_id": pedido_id, "total": total})


async def worker_notificaciones():
    """Worker que procesa la cola de notificaciones en background."""
    logger.info("🚀 Worker de notificaciones iniciado")
    while True:
        try:
            task = await asyncio.wait_for(_queue.get(), timeout=5.0)
            await notificar_pedido_whatsapp(**task)
            _queue.task_done()
        except asyncio.TimeoutError:
            pass
        except Exception as e:
            logger.error(f"Error en worker: {e}")
