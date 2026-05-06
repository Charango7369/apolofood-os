from fastapi import APIRouter, Request, Form
from app.config import settings
import logging

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])
logger = logging.getLogger(__name__)


@router.post("/webhook")
async def webhook_twilio(
    From: str = Form(...),
    Body: str = Form(...),
):
    """Webhook de Twilio para mensajes WhatsApp entrantes."""
    logger.info(f"WhatsApp de {From}: {Body}")
    # TODO: Parsear pedidos por WhatsApp con NLP simple
    return {"status": "recibido"}


@router.post("/enviar-mock")
async def enviar_mock(telefono: str, mensaje: str):
    """Mock para pruebas locales sin Twilio real."""
    logger.info(f"[MOCK WhatsApp] → {telefono}: {mensaje}")
    return {"enviado": True, "mock": True, "telefono": telefono, "mensaje": mensaje}
