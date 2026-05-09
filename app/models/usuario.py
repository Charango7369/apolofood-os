from sqlalchemy import String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid
import enum


class RolUsuario(str, enum.Enum):
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    CAJERO = "cajero"
    COCINA = "cocina"


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    restaurante_id: Mapped[str] = mapped_column(String(36), ForeignKey("restaurantes.id"), nullable=True)
    telefono: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    rol: Mapped[RolUsuario] = mapped_column(Enum(RolUsuario), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TokenRevocado(Base):
    __tablename__ = "tokens_revocados"

    jti: Mapped[str] = mapped_column(String(36), primary_key=True)
    usuario_id: Mapped[str] = mapped_column(String(36), ForeignKey("usuarios.id"), nullable=False)
    revocado_en: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())