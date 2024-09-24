"""add date fields

Revision ID: 47c2ad9d74df
Revises: 3aa8e2e58db7
Create Date: 2024-09-23 14:18:01.420134

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '47c2ad9d74df'
down_revision: Union[str, None] = '3aa8e2e58db7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("INSERT OR IGNORE INTO affiliation(name) VALUES ('unknown')")
    op.execute("INSERT OR IGNORE INTO position(name) VALUES ('unknown')")
    op.execute("UPDATE author set affiliation_id = (SELECT id FROM affiliation where name = 'unknown') WHERE affiliation_id = NULL")
    op.execute("UPDATE author set position_id = (SELECT id FROM position where name = 'unknown') WHERE position_id = NULL")

    with op.batch_alter_table('author') as b:
        b.alter_column('affiliation_id',
                   existing_type=sa.INTEGER(),
                   nullable=False)
        b.alter_column('position_id',
                   existing_type=sa.INTEGER(),
                   nullable=False)
    with op.batch_alter_table('question') as b:
        b.add_column(sa.Column('modified', sa.DateTime(), nullable=True))
    with op.batch_alter_table('skips') as b:
        b.add_column(sa.Column('modified', sa.DateTime(), nullable=True))

    op.execute("UPDATE question SET modified = datetime('now')")
    op.execute("UPDATE skips SET modified = datetime('now')")

    with op.batch_alter_table('question') as b:
        b.alter_column('modified', nullable=False)
    with op.batch_alter_table('skips') as b:
        b.alter_column('modified', nullable=False)

def downgrade() -> None:
    with op.batch_alter_table('skips') as b:
        b.drop_column('modified')
    with op.batch_alter_table('question') as b:
        b.drop_column('modified')
    with op.batch_alter_table('author') as b:
        b.alter_column('position_id',
                   existing_type=sa.INTEGER(),
                   nullable=True)
        b.alter_column('affiliation_id',
                   existing_type=sa.INTEGER(),
                   nullable=True)
