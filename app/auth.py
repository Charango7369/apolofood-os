from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.config import settings
from app.models.usuario import Usuario, TokenRevocado, RolUsuario
import uuid
import re

ALGORITHM = "HS256"
TOKEN_DURATION_DAYS = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
ph = PasswordHasher()


def normalize_telefono(telefono: str) -> str:
    """Quita espacios, guiones, paréntesis, +. Solo deja dígitos."""
    return re.sub(r"\D", "", telefono)


def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        ph.verify(hashed, password)
        return True
    except VerifyMismatchError:
        return False


def create_access_token(usuario: Usuario) -> str:
    jti = str(uuid.uuid4())
    expire = datetime.now(timezone.utc) + timedelta(days=TOKEN_DURATION_DAYS)
    payload = {
        "sub": usuario.id,
        "tenant": usuario.restaurante_id,
        "rol": usuario.rol.value,
        "jti": jti,
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        jti: str = payload.get("jti")
        if not user_id or not jti:
            raise cred_exc
    except JWTError:
        raise cred_exc

    # Verificar si el token fue revocado
    revoked = await db.execute(select(TokenRevocado).where(TokenRevocado.jti == jti))
    if revoked.scalar_one_or_none():
        raise HTTPException(status_code=401, detail="Token revocado")

    result = await db.execute(select(Usuario).where(Usuario.id == user_id, Usuario.activo == True))
    usuario = result.scalar_one_or_none()
    if not usuario:
        raise cred_exc

    # Guardamos el jti en el objeto para que logout lo use
    usuario._token_jti = jti
    return usuario


def require_role(*roles_permitidos: RolUsuario):
    """Dependency factory que valida que el usuario tenga uno de los roles permitidos."""
    async def _checker(usuario: Usuario = Depends(get_current_user)) -> Usuario:
        if usuario.rol not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Rol no autorizado. Requerido: {[r.value for r in roles_permitidos]}",
            )
        return usuario
    return _checker
