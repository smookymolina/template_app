"""Add active time tracking fields to user_session

Revision ID: 002_active_time
Revises: 001_initial_migration
Create Date: 2026-01-30

Esta migración agrega los campos necesarios para rastrear el tiempo de uso
ACTIVO real de la aplicación (cuando el usuario interactúa: clicks, scroll, etc.)
en lugar del tiempo que la sesión está abierta.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_active_time'
down_revision = '001_initial_migration'
branch_labels = None
depends_on = None


def upgrade():
    """
    Agrega campos para tracking de tiempo activo:
    - active_time_seconds: Tiempo acumulado de uso activo en segundos
    - last_heartbeat: Timestamp del último heartbeat de actividad
    """
    # Agregar columna active_time_seconds con valor default 0
    op.add_column(
        'user_session',
        sa.Column('active_time_seconds', sa.Integer(), nullable=True, default=0)
    )

    # Agregar columna last_heartbeat
    op.add_column(
        'user_session',
        sa.Column('last_heartbeat', sa.DateTime(), nullable=True)
    )

    # Actualizar registros existentes con valor 0 para active_time_seconds
    op.execute("UPDATE user_session SET active_time_seconds = 0 WHERE active_time_seconds IS NULL")


def downgrade():
    """
    Remueve los campos de tracking de tiempo activo
    """
    op.drop_column('user_session', 'last_heartbeat')
    op.drop_column('user_session', 'active_time_seconds')
