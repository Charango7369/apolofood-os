from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.pedido import EstadoPedido


class DetallePedidoCreate(BaseModel):
    producto_id: str
    producto_nombre: str
    cantidad: int = Field(ge=1)
    precio_unitario: float = Field(ge=0)


class DetallePedidoOut(BaseModel):
    id: str
    producto_id: str
    producto_nombre: str
    cantidad: int
    precio_unitario: float
    subtotal: float
    model_config = {"from_attributes": True}


class PedidoCreate(BaseModel):
    restaurante_id: str
    cliente_nombre: str
    cliente_telefono: Optional[str] = None
    mesa: Optional[str] = None
    notas: Optional[str] = None
    offline_id: Optional[str] = None
    detalles: List[DetallePedidoCreate]


class PedidoOut(BaseModel):
    id: str
    restaurante_id: str
    cliente_nombre: str
    cliente_telefono: Optional[str]
    mesa: Optional[str]
    notas: Optional[str]
    estado: EstadoPedido
    total: float
    offline_id: Optional[str]
    created_at: datetime
    detalles: List[DetallePedidoOut]
    model_config = {"from_attributes": True}


class PedidoEstadoUpdate(BaseModel):
    estado: EstadoPedido
