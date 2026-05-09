from fastapi import APIRouter, Depends
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


@router.get("/", response_model=list[ProductoOut])
async def obtener_menu(
    usuario: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Devuelve el menú del restaurante del usuario logueado. Sin pasar restaurante_id."""
    result = await db.execute(
        select(Producto)
        .where(
            Producto.restaurante_id == usuario.restaurante_id,
            Producto.disponible == True,
        )
        .order_by(Producto.nombre)
    )
    return result.scalars().all()


@router.post("/productos", response_model=ProductoOut, status_code=201)
async def crear_producto(
    payload: ProductoCreate,
    admin: Usuario = Depends(require_role(RolUsuario.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Solo ADMIN puede crear productos en SU restaurante."""
    producto = Producto(
        id=str(uuid.uuid4()),
        restaurante_id=admin.restaurante_id,  # forzado del JWT, no del body
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
