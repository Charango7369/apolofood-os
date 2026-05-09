from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database import get_db
from app.models.usuario import Usuario, TokenRevocado
from app.auth import (
    verify_password, create_access_token, get_current_user, normalize_telefono,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: dict


class UsuarioOut(BaseModel):
    id: str
    telefono: str
    nombre: str
    rol: str
    restaurante_id: str | None
    model_config = {"from_attributes": True}


@router.post("/login", response_model=TokenOut)
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """Login con teléfono + password (form fields: username=teléfono, password)."""
    telefono = normalize_telefono(form.username)
    result = await db.execute(
        select(Usuario).where(Usuario.telefono == telefono, Usuario.activo == True)
    )
    usuario = result.scalar_one_or_none()
    if not usuario or not verify_password(form.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Teléfono o contraseña incorrectos")

    token = create_access_token(usuario)
    return TokenOut(
        access_token=token,
        usuario={
            "id": usuario.id,
            "nombre": usuario.nombre,
            "rol": usuario.rol.value,
            "restaurante_id": usuario.restaurante_id,
        },
    )


@router.post("/logout")
async def logout(
    usuario: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoca el token actual."""
    jti = getattr(usuario, "_token_jti", None)
    if jti:
        db.add(TokenRevocado(jti=jti, usuario_id=usuario.id))
        await db.commit()
    return {"status": "logged_out"}


@router.get("/me", response_model=UsuarioOut)
async def me(usuario: Usuario = Depends(get_current_user)):
    return usuario
