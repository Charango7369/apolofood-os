from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Date
from app.database import get_db
from app.models.pedido import Pedido, EstadoPedido
from app.models.usuario import Usuario, RolUsuario
from app.config import settings
from app.auth import require_role
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/api/reportes", tags=["reportes"])

# Zona horaria Bolivia: UTC-4 (sin DST)
BOLIVIA_TZ = timezone(timedelta(hours=-4))


@router.get("/resumen")
async def resumen_diario(
    admin: Usuario = Depends(require_role(RolUsuario.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Resumen del día en hora Bolivia. Solo ADMIN. Tenant del JWT."""
    # "Hoy" según Bolivia, no según UTC del servidor Railway
    ahora_bolivia = datetime.now(BOLIVIA_TZ)
    hoy_bolivia = ahora_bolivia.date()

    # Rango UTC equivalente al día completo en Bolivia:
    #   00:00:00 Bolivia → 04:00:00 UTC
    #   24:00:00 Bolivia → 04:00:00 UTC del día siguiente
    inicio_dia_bolivia = datetime.combine(hoy_bolivia, datetime.min.time(), tzinfo=BOLIVIA_TZ)
    fin_dia_bolivia = inicio_dia_bolivia + timedelta(days=1)

    # Convertir a UTC para comparar con created_at (que está en UTC en la DB)
    inicio_utc = inicio_dia_bolivia.astimezone(timezone.utc)
    fin_utc = fin_dia_bolivia.astimezone(timezone.utc)

    # Si los timestamps en DB son naive (sin tzinfo), quitamos tzinfo para comparar
    if settings.is_sqlite:
        # SQLite a veces guarda sin tz info
        inicio_utc = inicio_utc.replace(tzinfo=None)
        fin_utc = fin_utc.replace(tzinfo=None)

    result = await db.execute(
        select(
            func.count(Pedido.id).label("total_pedidos"),
            func.sum(Pedido.total).label("ingresos"),
        ).where(
            Pedido.restaurante_id == admin.restaurante_id,
            Pedido.created_at >= inicio_utc,
            Pedido.created_at < fin_utc,
            Pedido.estado != EstadoPedido.CANCELADO,
        )
    )
    row = result.one()
    return {
        "fecha": str(hoy_bolivia),
        "restaurante_id": admin.restaurante_id,
        "total_pedidos": row.total_pedidos or 0,
        "ingresos": float(row.ingresos or 0),
    }