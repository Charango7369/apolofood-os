import logging
from app.config import settings

logger = logging.getLogger(__name__)


async def notificar_pedido_whatsapp(telefono: str, pedido_id: str, total: float) -> bool:
    """Envía notificación WhatsApp. Mock si no hay credenciales Twilio."""
    mensaje = f"✅ Pedido #{pedido_id[:8]} recibido. Total: Bs {total:.2f}. ¡Pronto estará listo!"

    if not settings.TWILIO_ACCOUNT_SID:
        logger.info(f"[MOCK WhatsApp] → {telefono}: {mensaje}")
        return True

    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(
            from_=settings.TWILIO_WHATSAPP_FROM,
            to=f"whatsapp:{telefono}",
            body=mensaje,
        )
        return True
    except Exception as e:
        logger.error(f"Error WhatsApp: {e}")
        return False
