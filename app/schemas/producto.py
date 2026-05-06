from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProductoCreate(BaseModel):
    restaurante_id: str
    categoria_id: Optional[str] = None
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    disponible: bool = True


class ProductoOut(BaseModel):
    id: str
    restaurante_id: str
    categoria_id: Optional[str]
    nombre: str
    descripcion: Optional[str]
    precio: float
    imagen_url: Optional[str]
    disponible: bool
    created_at: datetime
    model_config = {"from_attributes": True}
