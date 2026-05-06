from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.producto import Producto, Categoria
from app.schemas.producto import ProductoCreate, ProductoOut
import uuid

router = APIRouter(prefix="/api/menu", tags=["menu"])


@router.get("/{restaurante_id}", response_model=list[ProductoOut])
async def obtener_menu(restaurante_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Producto)
        .where(Producto.restaurante_id == restaurante_id, Producto.disponible == True)
        .order_by(Producto.nombre)
    )
    return result.scalars().all()


@router.post("/productos", response_model=ProductoOut, status_code=201)
async def crear_producto(payload: ProductoCreate, db: AsyncSession = Depends(get_db)):
    producto = Producto(id=str(uuid.uuid4()), **payload.model_dump())
    db.add(producto)
    await db.commit()
    await db.refresh(producto)
    return producto
