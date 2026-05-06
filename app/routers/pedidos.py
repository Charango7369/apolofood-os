from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.pedido import Pedido, DetallePedido, EstadoPedido
from app.schemas.pedido import PedidoCreate, PedidoOut, PedidoEstadoUpdate
import uuid

router = APIRouter(prefix="/api/pedidos", tags=["pedidos"])

# selectinload carga detalles en la misma sesión async — evita MissingGreenlet
_pedido_query = select(Pedido).options(selectinload(Pedido.detalles))


@router.post("/", response_model=PedidoOut, status_code=status.HTTP_201_CREATED)
async def crear_pedido(payload: PedidoCreate, db: AsyncSession = Depends(get_db)):
    # Deduplicar pedidos offline
    if payload.offline_id:
        result = await db.execute(
            _pedido_query.where(Pedido.offline_id == payload.offline_id)
        )
        existente = result.scalar_one_or_none()
        if existente:
            return existente

    total = sum(d.cantidad * d.precio_unitario for d in payload.detalles)

    pedido = Pedido(
        id=str(uuid.uuid4()),
        restaurante_id=payload.restaurante_id,
        cliente_nombre=payload.cliente_nombre,
        cliente_telefono=payload.cliente_telefono,
        mesa=payload.mesa,
        notas=payload.notas,
        offline_id=payload.offline_id,
        total=total,
    )
    db.add(pedido)
    await db.flush()

    for d in payload.detalles:
        db.add(DetallePedido(
            id=str(uuid.uuid4()),
            pedido_id=pedido.id,
            producto_id=d.producto_id,
            producto_nombre=d.producto_nombre,
            cantidad=d.cantidad,
            precio_unitario=d.precio_unitario,
            subtotal=d.cantidad * d.precio_unitario,
        ))

    await db.commit()

    # Re-fetch con detalles cargados explícitamente
    result = await db.execute(_pedido_query.where(Pedido.id == pedido.id))
    return result.scalar_one()


@router.get("/", response_model=list[PedidoOut])
async def listar_pedidos(restaurante_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        _pedido_query
        .where(Pedido.restaurante_id == restaurante_id)
        .order_by(Pedido.created_at.desc())
        .limit(100)
    )
    return result.scalars().all()


@router.get("/{pedido_id}", response_model=PedidoOut)
async def obtener_pedido(pedido_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(_pedido_query.where(Pedido.id == pedido_id))
    pedido = result.scalar_one_or_none()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return pedido


@router.patch("/{pedido_id}/estado", response_model=PedidoOut)
async def cambiar_estado(pedido_id: str, body: PedidoEstadoUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(_pedido_query.where(Pedido.id == pedido_id))
    pedido = result.scalar_one_or_none()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    pedido.estado = body.estado
    await db.commit()
    await db.refresh(pedido)
    return pedido
