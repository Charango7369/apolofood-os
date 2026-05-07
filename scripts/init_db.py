#!/usr/bin/env python3
"""Crea tablas e inserta datos de prueba."""
import asyncio
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import init_db, AsyncSessionLocal
from app.models.restaurante import Restaurante
from app.models.producto import Producto, Categoria
import uuid

RESTAURANTE_ID = "rest-demo-001"

async def seed():
    await init_db()
    async with AsyncSessionLocal() as db:
        rest = Restaurante(
            id=RESTAURANTE_ID,
            nombre="Restaurant El Rincón de Apolo",
            telefono="+591 71234567",
            whatsapp="+59171234567",
            direccion="Plaza Principal, Apolo, La Paz",
        )
        db.add(rest)
        await db.flush()  # ← AGREGAR ESTA LÍNEA
        cat1 = Categoria(id=str(uuid.uuid4()), restaurante_id=RESTAURANTE_ID, nombre="Platos del día", orden=1)
        cat2 = Categoria(id=str(uuid.uuid4()), restaurante_id=RESTAURANTE_ID, nombre="Bebidas", orden=2)
        db.add_all([cat1, cat2])
        await db.flush()

        productos = [
            Producto(id=str(uuid.uuid4()), restaurante_id=RESTAURANTE_ID, categoria_id=cat1.id,
                     nombre="Sopa de maní", precio=15.0, descripcion="Sopa tradicional boliviana"),
            Producto(id=str(uuid.uuid4()), restaurante_id=RESTAURANTE_ID, categoria_id=cat1.id,
                     nombre="Silpancho", precio=20.0, descripcion="Con arroz, papa y huevo frito"),
            Producto(id=str(uuid.uuid4()), restaurante_id=RESTAURANTE_ID, categoria_id=cat1.id,
                     nombre="Sopa de quinua", precio=12.0),
            Producto(id=str(uuid.uuid4()), restaurante_id=RESTAURANTE_ID, categoria_id=cat2.id,
                     nombre="Refresco de mocochinchi", precio=5.0),
            Producto(id=str(uuid.uuid4()), restaurante_id=RESTAURANTE_ID, categoria_id=cat2.id,
                     nombre="Chicha morada", precio=5.0),
        ]
        db.add_all(productos)
        await db.commit()

    print(f"✅ Seed OK — Restaurante ID: {RESTAURANTE_ID}")
    print(f"   GET /api/menu/{RESTAURANTE_ID}")


if __name__ == "__main__":
    asyncio.run(seed())
