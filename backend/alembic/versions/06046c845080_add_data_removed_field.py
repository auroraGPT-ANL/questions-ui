"""add data removed field

Revision ID: 06046c845080
Revises: 622411ddf926
Create Date: 2025-03-20 11:37:32.818412

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '06046c845080'
down_revision: Union[str, None] = '622411ddf926'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('experiment_turn', sa.Column('data_removed', sa.Boolean(), server_default='0', nullable=False))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('experiment_turn', 'data_removed')
    # ### end Alembic commands ###
