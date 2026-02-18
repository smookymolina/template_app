"""Add evento_recluta_documento association table (multi-document per event)

Revision ID: f3a9b2c1d0e4
Revises: e8c6d73817bb
Create Date: 2026-02-18 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f3a9b2c1d0e4'
down_revision = 'e8c6d73817bb'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'evento_recluta_documento',
        sa.Column('evento_id', sa.Integer(), nullable=False),
        sa.Column('documento_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['documento_id'], ['documento.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['evento_id'], ['evento_recluta.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('evento_id', 'documento_id')
    )

    # Migrar relaciones legadas: copiar documento_id existente a la nueva tabla
    conn = op.get_bind()
    conn.execute(sa.text("""
        INSERT INTO evento_recluta_documento (evento_id, documento_id)
        SELECT id, documento_id
        FROM evento_recluta
        WHERE documento_id IS NOT NULL
    """))


def downgrade():
    op.drop_table('evento_recluta_documento')
