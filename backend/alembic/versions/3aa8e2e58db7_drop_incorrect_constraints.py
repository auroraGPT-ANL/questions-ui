"""drop incorrect constraints

Revision ID: 3aa8e2e58db7
Revises: 540ca9430553
Create Date: 2024-09-22 15:00:13.760728

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3aa8e2e58db7'
down_revision: Union[str, None] = '540ca9430553'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('skips',
    sa.Column('author_id', sa.Integer(), nullable=False),
    sa.Column('question_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['author_id'], ['author.id'], ),
    sa.ForeignKeyConstraint(['question_id'], ['question.id'], ),
    sa.PrimaryKeyConstraint('author_id', 'question_id'),
    sa.UniqueConstraint('question_id', 'author_id')
    )
    # ### end Alembic commands ###

    op.create_table("new_author",
                    sa.Column("id", sa.Integer, primary_key=True),
                    sa.Column("name", sa.String, nullable=False),
                    sa.Column("orcid", sa.String, nullable=True),
                    sa.Column("affiliation_id", sa.Integer, sa.ForeignKey("affiliation.id", name="fk_author_affiliation")),
                    sa.Column("position_id", sa.Integer, sa.ForeignKey("position.id", name="fk_author_position")),
                    sa.UniqueConstraint('orcid', name="ct_author_orcid_unique"),
                    sa.UniqueConstraint('name', 'affiliation_id', 'position_id', name="ct_author_info_unique")
                    )
    op.execute("insert into new_author(id, name, orcid, affiliation_id, position_id) select id, name, orcid, affiliation_id, position_id from author")
    op.drop_table("author")
    op.rename_table("new_author", "author")

def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('skips')
    # ### end Alembic commands ###
