from sqlalchemy import String, Boolean, DateTime, Float, ForeignKey, Integer, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid
import enum


class EstadoPedido(str, enum.Enum):
    PENDIENTE = "pendiente"
    CONFIRMADO = "confirmado"
    EN_PREPARACION = "en_preparacion"
    LISTO = "listo"
    ENTREGADO = "entregado"
    CANCELADO = "cancelado"


class Pedido(Base):
    __tablename__ = "pedidos"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    restaurante_id: Mapped[str] = mapped_column(String(36), ForeignKey("restaurantes.id"), nullable=False)
    cliente_nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    cliente_telefono: Mapped[str] = mapped_column(String(20), nullable=True)
    mesa: Mapped[str] = mapped_column(String(20), nullable=True)
    notas: Mapped[str] = mapped_column(Text, nullable=True)
    estado: Mapped[EstadoPedido] = mapped_column(Enum(EstadoPedido), default=EstadoPedido.PENDIENTE)
    total: Mapped[float] = mapped_column(Float, default=0.0)
    offline_id: Mapped[str] = mapped_column(String(36), nullable=True)  # ID generado offline
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    restaurante: Mapped["Restaurante"] = relationship("Restaurante", back_populates="pedidos")
    detalles: Mapped[list["DetallePedido"]] = relationship("DetallePedido", back_populates="pedido", cascade="all, delete-orphan")


class DetallePedido(Base):
    __tablename__ = "detalles_pedido"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pedido_id: Mapped[str] = mapped_column(String(36), ForeignKey("pedidos.id"), nullable=False)
    producto_id: Mapped[str] = mapped_column(String(36), ForeignKey("productos.id"), nullable=False)
    producto_nombre: Mapped[str] = mapped_column(String(120), nullable=False)  # snapshot
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    precio_unitario: Mapped[float] = mapped_column(Float, nullable=False)
    subtotal: Mapped[float] = mapped_column(Float, nullable=False)

    pedido: Mapped["Pedido"] = relationship("Pedido", back_populates="detalles")
