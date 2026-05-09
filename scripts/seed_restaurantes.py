"""
Crea los 6 restaurantes iniciales con su ADMIN.
Imprime las credenciales en una tabla — copiar y mandar por WhatsApp.

Uso:
    LOCAL:    python scripts/seed_restaurantes.py
    RAILWAY:  railway ssh → python scripts/seed_restaurantes.py
"""
import asyncio
import secrets
import string
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.usuario import Usuario, RolUsuario
from app.models.restaurante import Restaurante
from app.auth import hash_password, normalize_telefono
import uuid


# Datos de los 6 restaurantes — completar teléfonos reales antes de correr en producción
RESTAURANTES = [
    {
        "slug": "club-la-negrita",
        "nombre": "Club La Negrita",
        "telefono_negocio": "+591 70000001",
        "admin_nombre": "Admin La Negrita",
        "admin_telefono": "70000001",  # cambiar al teléfono real del dueño
    },
    {
        "slug": "santa-ana",
        "nombre": "Restaurant Santa Ana",
        "telefono_negocio": "+591 70000002",
        "admin_nombre": "Admin Santa Ana",
        "admin_telefono": "70000002",
    },
    {
        "slug": "madidi",
        "nombre": "Complejo Turístico Madidi",
        "telefono_negocio": "+591 70000003",
        "admin_nombre": "Admin Madidi",
        "admin_telefono": "70000003",
    },
    {
        "slug": "oasis",
        "nombre": "Restaurant Oasis",
        "telefono_negocio": "+591 70000004",
        "admin_nombre": "Admin Oasis",
        "admin_telefono": "70000004",
    },
    {
        "slug": "pollos-ricos",
        "nombre": "Pollos Ricos",
        "telefono_negocio": "+591 70000005",
        "admin_nombre": "Admin Pollos Ricos",
        "admin_telefono": "70000005",
    },
    {
        "slug": "sabroso-sabroson",
        "nombre": "Restaurant Sabroso Sabrosón",
        "telefono_negocio": "+591 70000006",
        "admin_nombre": "Admin Sabroso Sabrosón",
        "admin_telefono": "70000006",
    },
]


def generar_password() -> str:
    """Password de 8 caracteres legibles (sin 0/O/1/l/I)"""
    chars = string.ascii_letters.replace("l", "").replace("I", "").replace("O", "")
    chars += "23456789"
    return "".join(secrets.choice(chars) for _ in range(8))


async def main():
    credenciales = []

    async with AsyncSessionLocal() as db:
        for r in RESTAURANTES:
            # Verificar si ya existe (idempotente)
            existe = await db.execute(
                select(Restaurante).where(Restaurante.slug == r["slug"])
            )
            if existe.scalar_one_or_none():
                print(f"⏩ {r['nombre']} ya existe — omitido")
                continue

            tel_admin = normalize_telefono(r["admin_telefono"])
            existe_admin = await db.execute(
                select(Usuario).where(Usuario.telefono == tel_admin)
            )
            if existe_admin.scalar_one_or_none():
                print(f"⚠️  Teléfono {tel_admin} ya tiene usuario — saltando {r['nombre']}")
                continue

            password = generar_password()

            rest_id = str(uuid.uuid4())
            db.add(Restaurante(
                id=rest_id,
                slug=r["slug"],
                nombre=r["nombre"],
                telefono=r["telefono_negocio"],
            ))
            await db.flush()

            db.add(Usuario(
                id=str(uuid.uuid4()),
                restaurante_id=rest_id,
                telefono=tel_admin,
                password_hash=hash_password(password),
                nombre=r["admin_nombre"],
                rol=RolUsuario.ADMIN,
            ))

            credenciales.append({
                "restaurante": r["nombre"],
                "telefono": tel_admin,
                "password": password,
            })

        await db.commit()

    if not credenciales:
        print("\nNo se crearon usuarios nuevos.")
        return

    print("\n" + "=" * 70)
    print("CREDENCIALES — copiar y enviar por WhatsApp a cada dueño")
    print("=" * 70)
    print(f"{'Restaurante':<35} {'Teléfono':<15} {'Password':<10}")
    print("-" * 70)
    for c in credenciales:
        print(f"{c['restaurante']:<35} {c['telefono']:<15} {c['password']:<10}")
    print("=" * 70)
    print(f"\n✅ {len(credenciales)} restaurante(s) creado(s)")
    print("⚠️  Guarda esta tabla: las contraseñas no se mostrarán de nuevo.\n")


if __name__ == "__main__":
    asyncio.run(main())