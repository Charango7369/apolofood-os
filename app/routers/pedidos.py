from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.pedido import Pedido, DetallePedido, EstadoPedido
from app.models.usuario import Usuario, RolUsuario
from app.schemas.pedido import PedidoOut, PedidoEstadoUpdate
from app.auth import get_current_user, require_role
from pydantic import BaseModel, Field
from typing import Optional, List
import uuid

router = APIRouter(prefix="/api/pedidos", tags=["pedidos"])

_pedido_query = select(Pedido).options(selectinload(Pedido.detalles))


class DetallePedidoCreate(BaseModel):
    producto_id: str
    producto_nombre: str
    cantidad: int = Field(ge=1)
    precio_unitario: float = Field(ge=0)


class PedidoCreate(BaseModel):
    cliente_nombre: str
    cliente_telefono: Optional[str] = None
    mesa: Optional[str] = None
    notas: Optional[str] = None
    offline_id: Optional[str] = None
    detalles: List[DetallePedidoCreate]


@router.post("/", response_model=PedidoOut, status_code=status.HTTP_201_CREATED)
async def crear_pedido(
    payload: PedidoCreate,
    usuario: Usuario = Depends(require_role(RolUsuario.ADMIN, RolUsuario.CAJERO)),
    db: AsyncSession = Depends(get_db),
):
    """Crea un pedido. ADMIN o CAJERO. Tenant del JWT."""
    if payload.offline_id:
        result = await db.execute(
            _pedido_query.where(
                Pedido.offline_id == payload.offline_id,
                Pedido.restaurante_id == usuario.restaurante_id,
            )
        )
        existente = result.scalar_one_or_none()
        if existente:
            return existente

    total = sum(d.cantidad * d.precio_unitario for d in payload.detalles)

    pedido = Pedido(
        id=str(uuid.uuid4()),
        restaurante_id=usuario.restaurante_id,  # tenant del JWT
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
    result = await db.execute(_pedido_query.where(Pedido.id == pedido.id))
    return result.scalar_one()


@router.get("/", response_model=list[PedidoOut])
async def listar_pedidos(
    usuario: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """ADMIN, CAJERO y COCINA ven los pedidos de su restaurante."""
    result = await db.execute(
        _pedido_query
        .where(Pedido.restaurante_id == usuario.restaurante_id)
        .order_by(Pedido.created_at.desc())
        .limit(100)
    )
    return result.scalars().all()


@router.get("/{pedido_id}", response_model=PedidoOut)
async def obtener_pedido(
    pedido_id: str,
    usuario: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        _pedido_query.where(
            Pedido.id == pedido_id,
            Pedido.restaurante_id == usuario.restaurante_id,
        )
    )
    pedido = result.scalar_one_or_none()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return pedido


# Estados que cada rol puede asignar
ESTADOS_PERMITIDOS = {
    RolUsuario.ADMIN: set(EstadoPedido),  # todos
    RolUsuario.CAJERO: {EstadoPedido.CONFIRMADO, EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO},
    RolUsuario.COCINA: {EstadoPedido.EN_PREPARACION, EstadoPedido.LISTO},
}


@router.patch("/{pedido_id}/estado", response_model=PedidoOut)
async def cambiar_estado(
    pedido_id: str,
    body: PedidoEstadoUpdate,
    usuario: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    permitidos = ESTADOS_PERMITIDOS.get(usuario.rol, set())
    if body.estado not in permitidos:
        raise HTTPException(
            status_code=403,
            detail=f"Tu rol ({usuario.rol.value}) no puede cambiar a estado '{body.estado.value}'",
        )

    result = await db.execute(
        _pedido_query.where(
            Pedido.id == pedido_id,
            Pedido.restaurante_id == usuario.restaurante_id,
        )
    )
    pedido = result.scalar_one_or_none()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    pedido.estado = body.estado
    await db.commit()
    await db.refresh(pedido)
    return pedido
