"""Initial migration - todas las tablas del sistema

Revision ID: 001_initial
Revises:
Create Date: 2026-01-19

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Crear tabla usuario
    op.create_table('usuario',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('password_hash', sa.String(length=128), nullable=False),
        sa.Column('nombre', sa.String(length=100), nullable=True),
        sa.Column('telefono', sa.String(length=20), nullable=True),
        sa.Column('foto_url', sa.String(length=255), nullable=True),
        sa.Column('rol', sa.String(length=20), nullable=False, server_default='asesor'),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.Column('gerente_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['gerente_id'], ['usuario.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    # Crear tabla recluta
    op.create_table('recluta',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('telefono', sa.String(length=20), nullable=False),
        sa.Column('estado', sa.String(length=20), nullable=False),
        sa.Column('puesto', sa.String(length=100), nullable=True),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('folio', sa.String(length=20), nullable=False),
        sa.Column('foto_url', sa.String(length=255), nullable=True),
        sa.Column('fecha_registro', sa.DateTime(), nullable=True),
        sa.Column('ultima_actualizacion', sa.DateTime(), nullable=True),
        sa.Column('asesor_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['asesor_id'], ['usuario.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('folio')
    )

    # Crear tabla entrevista
    op.create_table('entrevista',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('recluta_id', sa.Integer(), nullable=False),
        sa.Column('fecha', sa.Date(), nullable=False),
        sa.Column('hora', sa.String(length=10), nullable=False),
        sa.Column('duracion', sa.Integer(), nullable=True, server_default='60'),
        sa.Column('tipo', sa.String(length=20), nullable=True, server_default='presencial'),
        sa.Column('ubicacion', sa.String(length=200), nullable=True),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('estado', sa.String(length=20), nullable=True, server_default='pendiente'),
        sa.Column('fecha_creacion', sa.DateTime(), nullable=True),
        sa.Column('ultima_actualizacion', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['recluta_id'], ['recluta.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Crear tabla evento_recluta (timeline)
    op.create_table('evento_recluta',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('recluta_id', sa.Integer(), nullable=False),
        sa.Column('fecha', sa.Date(), nullable=False),
        sa.Column('estado', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('titulo', sa.String(length=200), nullable=False),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('fecha_creacion', sa.DateTime(), nullable=True),
        sa.Column('ultima_actualizacion', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['recluta_id'], ['recluta.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_evento_recluta_recluta_id', 'evento_recluta', ['recluta_id'], unique=False)

    # Crear tabla documento
    op.create_table('documento',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('recluta_id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(length=255), nullable=False),
        sa.Column('url', sa.String(length=512), nullable=False),
        sa.Column('tipo', sa.String(length=50), nullable=True),
        sa.Column('tamano', sa.Integer(), nullable=True),
        sa.Column('fecha_subida', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['recluta_id'], ['recluta.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_documento_recluta_id', 'documento', ['recluta_id'], unique=False)

    # Crear tabla user_session
    op.create_table('user_session',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=False),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('session_token', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('is_valid', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('last_activity', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuario.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_token')
    )

    # Crear tabla user_settings
    op.create_table('user_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(length=50), nullable=False),
        sa.Column('value', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuario.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('usuario_id', 'key', name='_user_setting_key_unique')
    )

    # Crear tabla notification
    op.create_table('notification',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('titulo', sa.String(length=200), nullable=False),
        sa.Column('mensaje', sa.Text(), nullable=False),
        sa.Column('tipo', sa.String(length=50), nullable=True, server_default='entrevista'),
        sa.Column('accion', sa.String(length=50), nullable=False),
        sa.Column('usuario_origen_id', sa.Integer(), nullable=False),
        sa.Column('usuario_destino_id', sa.Integer(), nullable=False),
        sa.Column('recurso_id', sa.Integer(), nullable=True),
        sa.Column('recurso_tipo', sa.String(length=50), nullable=True),
        sa.Column('leida', sa.Boolean(), nullable=True, server_default='0'),
        sa.Column('fecha_creacion', sa.DateTime(), nullable=True),
        sa.Column('fecha_lectura', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['usuario_destino_id'], ['usuario.id'], ),
        sa.ForeignKeyConstraint(['usuario_origen_id'], ['usuario.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Crear tabla ficha_deposito
    op.create_table('ficha_deposito',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('fecha', sa.DateTime(), nullable=False),
        sa.Column('nombre_depositante', sa.String(length=150), nullable=False),
        sa.Column('banco', sa.String(length=100), nullable=False),
        sa.Column('monto', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('gerente_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['gerente_id'], ['usuario.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Crear tabla tutorial_analytics
    op.create_table('tutorial_analytics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('device_fingerprint', sa.String(length=100), nullable=False),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('step_number', sa.Integer(), nullable=True),
        sa.Column('time_spent', sa.Integer(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('tutorial_analytics')
    op.drop_table('ficha_deposito')
    op.drop_table('notification')
    op.drop_table('user_settings')
    op.drop_table('user_session')
    op.drop_index('ix_documento_recluta_id', table_name='documento')
    op.drop_table('documento')
    op.drop_index('ix_evento_recluta_recluta_id', table_name='evento_recluta')
    op.drop_table('evento_recluta')
    op.drop_table('entrevista')
    op.drop_table('recluta')
    op.drop_table('usuario')
