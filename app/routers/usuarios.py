from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from app.database import get_db
from app.models.usuario import Usuario, RolUsuario
from app.auth import hash_password, normalize_telefono, require_role
import uuid

router = APIRouter(prefix="/api/usuarios", tags=["usuarios"])


class UsuarioCreate(BaseModel):
    telefono: str
    password: str = Field(min_length=6)
    nombre: str
    rol: RolUsuario


class UsuarioOut(BaseModel):
    id: str
    telefono: str
    nombre: str
    rol: RolUsuario
    activo: bool
    model_config = {"from_attributes": True}


@router.post("/", response_model=UsuarioOut, status_code=201)
async def crear_usuario(
    payload: UsuarioCreate,
    admin: Usuario = Depends(require_role(RolUsuario.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """ADMIN crea CAJERO o COCINA en SU restaurante. No puede crear otros ADMIN ni SUPERADMIN."""
    if payload.rol not in (RolUsuario.CAJERO, RolUsuario.COCINA):
        raise HTTPException(status_code=403, detail="Solo puedes crear CAJERO o COCINA")

    telefono = normalize_telefono(payload.telefono)
    existe = await db.execute(select(Usuario).where(Usuario.telefono == telefono))
    if existe.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Ya existe un usuario con ese teléfono")

    nuevo = Usuario(
        id=str(uuid.uuid4()),
        restaurante_id=admin.restaurante_id,  # mismo tenant que el ADMIN
        telefono=telefono,
        password_hash=hash_password(payload.password),
        nombre=payload.nombre,
        rol=payload.rol,
    )
    db.add(nuevo)
    await db.commit()
    await db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=list[UsuarioOut])
async def listar_usuarios(
    admin: Usuario = Depends(require_role(RolUsuario.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Lista usuarios del MISMO restaurante que el ADMIN. Aislamiento garantizado."""
    result = await db.execute(
        select(Usuario).where(Usuario.restaurante_id == admin.restaurante_id)
    )
    return result.scalars().all()


@router.patch("/{usuario_id}/desactivar")
async def desactivar(
    usuario_id: str,
    admin: Usuario = Depends(require_role(RolUsuario.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Usuario).where(
            Usuario.id == usuario_id,
            Usuario.restaurante_id == admin.restaurante_id,  # aislamiento
        )
    )
    u = result.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    u.activo = False
    await db.commit()
    return {"status": "desactivado"}
