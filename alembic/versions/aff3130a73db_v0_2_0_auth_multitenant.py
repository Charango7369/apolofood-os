"""v0_2_0_auth_multitenant

Revision ID: aff3130a73db
Revises: cd589ae6e55e
Create Date: 2026-05-08 23:28:24.280961

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'aff3130a73db'
down_revision: Union[str, None] = 'cd589ae6e55e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('usuarios',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('restaurante_id', sa.String(length=36), nullable=True),
        sa.Column('telefono', sa.String(length=20), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('nombre', sa.String(length=120), nullable=False),
        sa.Column('rol', sa.Enum('SUPERADMIN', 'ADMIN', 'CAJERO', 'COCINA', name='rolusuario'), nullable=False),
        sa.Column('activo', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['restaurante_id'], ['restaurantes.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_usuarios_telefono'), 'usuarios', ['telefono'], unique=True)

    op.create_table('tokens_revocados',
        sa.Column('jti', sa.String(length=36), nullable=False),
        sa.Column('usuario_id', sa.String(length=36), nullable=False),
        sa.Column('revocado_en', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('jti')
    )

    op.add_column('restaurantes', sa.Column('slug', sa.String(length=80), nullable=True))
    op.execute("UPDATE restaurantes SET slug = 'rest-' || substr(id, 1, 8) WHERE slug IS NULL")
    with op.batch_alter_table('restaurantes') as batch_op:
        batch_op.alter_column('slug', existing_type=sa.String(length=80), nullable=False)
        batch_op.create_index('ix_restaurantes_slug', ['slug'], unique=True)


def downgrade() -> None:
    with op.batch_alter_table('restaurantes') as batch_op:
        batch_op.drop_index('ix_restaurantes_slug')
    op.drop_column('restaurantes', 'slug')
    op.drop_table('tokens_revocados')
    op.drop_index(op.f('ix_usuarios_telefono'), table_name='usuarios')
    op.drop_table('usuarios')