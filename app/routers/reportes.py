from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Date
from app.database import get_db
from app.models.pedido import Pedido, EstadoPedido
from app.models.usuario import Usuario, RolUsuario
from app.config import settings
from app.auth import require_role
from datetime import date

router = APIRouter(prefix="/api/reportes", tags=["reportes"])


@router.get("/resumen")
async def resumen_diario(
    admin: Usuario = Depends(require_role(RolUsuario.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Resumen del día. Solo ADMIN. Tenant del JWT."""
    hoy = date.today()

    if settings.is_sqlite:
        fecha_filter = func.strftime('%Y-%m-%d', Pedido.created_at) == str(hoy)
    else:
        fecha_filter = cast(Pedido.created_at, Date) == hoy

    result = await db.execute(
        select(
            func.count(Pedido.id).label("total_pedidos"),
            func.sum(Pedido.total).label("ingresos"),
        ).where(
            Pedido.restaurante_id == admin.restaurante_id,
            fecha_filter,
            Pedido.estado != EstadoPedido.CANCELADO,
        )
    )
    row = result.one()
    return {
        "fecha": str(hoy),
        "restaurante_id": admin.restaurante_id,
        "total_pedidos": row.total_pedidos or 0,
        "ingresos": float(row.ingresos or 0),
    }