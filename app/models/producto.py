from sqlalchemy import String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid


class Categoria(Base):
    __tablename__ = "categorias"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    restaurante_id: Mapped[str] = mapped_column(String(36), ForeignKey("restaurantes.id"), nullable=False)
    nombre: Mapped[str] = mapped_column(String(80), nullable=False)
    orden: Mapped[int] = mapped_column(default=0)

    productos: Mapped[list["Producto"]] = relationship("Producto", back_populates="categoria")


class Producto(Base):
    __tablename__ = "productos"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    restaurante_id: Mapped[str] = mapped_column(String(36), ForeignKey("restaurantes.id"), nullable=False)
    categoria_id: Mapped[str] = mapped_column(String(36), ForeignKey("categorias.id"), nullable=True)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=True)
    precio: Mapped[float] = mapped_column(Float, nullable=False)
    imagen_url: Mapped[str] = mapped_column(String(500), nullable=True)
    disponible: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    restaurante: Mapped["Restaurante"] = relationship("Restaurante", back_populates="productos")
    categoria: Mapped["Categoria"] = relationship("Categoria", back_populates="productos")
