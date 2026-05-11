from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.producto import Producto
from app.models.usuario import Usuario, RolUsuario
from app.schemas.producto import ProductoOut
from app.auth import get_current_user, require_role
from pydantic import BaseModel
from typing import Optional
import uuid

router = APIRouter(prefix="/api/menu", tags=["menu"])


class ProductoCreate(BaseModel):
    categoria_id: Optional[str] = None
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    disponible: bool = True


class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    disponible: Optional[bool] = None


@router.get("/", response_model=list[ProductoOut])
async def obtener_menu(
    usuario: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Devuelve el menú del restaurante. Admin ve todos, otros roles solo disponibles."""
    query = select(Producto).where(Producto.restaurante_id == usuario.restaurante_id)

    # Cajero/cocina solo ven disponibles. Admin ve todos para gestionar.
    if usuario.rol != RolUsuario.ADMIN and usuario.rol != RolUsuario.SUPERADMIN:
        query = query.where(Producto.disponible == True)

    query = query.order_by(Producto.nombre)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/productos", response_model=ProductoOut, status_code=201)
async def crear_producto(
    payload: ProductoCreate,
    admin: Usuario = Depends(require_role(RolUsuario.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    producto = Producto(
        id=str(uuid.uuid4()),
        restaurante_id=admin.restaurante_id,
        categoria_id=payload.categoria_id,
        nombre=payload.nombre,
        descripcion=payload.descripcion,
        precio=payload.precio,
        disponible=payload.disponible,
    )
    db.add(producto)
    await db.commit()
    await db.refresh(producto)
    return producto


@router.patch("/productos/{producto_id}", response_model=ProductoOut)
async def actualizar_producto(
    producto_id: str,
    payload: ProductoUpdate,
    admin: Usuario = Depends(require_role(RolUsuario.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Actualiza producto. Multi-tenant: solo del restaurante del admin."""
    result = await db.execute(
        select(Producto).where(
            Producto.id == producto_id,
            Producto.restaurante_id == admin.restaurante_id,  # aislamiento
        )
    )
    producto = result.scalar_one_or_none()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Solo actualizar campos que vienen
    update_data = payload.model_dump(exclude_unset=True)
    for campo, valor in update_data.items():
        setattr(producto, campo, valor)

    await db.commit()
    await db.refresh(producto)
    return producto