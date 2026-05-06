from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Date
from app.database import get_db
from app.models.pedido import Pedido, EstadoPedido
from app.config import settings
from datetime import date

router = APIRouter(prefix="/api/reportes", tags=["reportes"])


@router.get("/resumen/{restaurante_id}")
async def resumen_diario(restaurante_id: str, db: AsyncSession = Depends(get_db)):
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
            Pedido.restaurante_id == restaurante_id,
            fecha_filter,
            Pedido.estado != EstadoPedido.CANCELADO,
        )
    )
    row = result.one()
    return {
        "fecha": str(hoy),
        "restaurante_id": restaurante_id,
        "total_pedidos": row.total_pedidos or 0,
        "ingresos": float(row.ingresos or 0),
    }