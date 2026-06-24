"""Initial schema: users, documents, summaries, model_metadata

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-24

"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── users ──────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("full_name", sa.String(), nullable=True, index=True),
        sa.Column("email", sa.String(), nullable=False, unique=True, index=True),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column("is_superuser", sa.Boolean(), nullable=False, default=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ── documents ──────────────────────────────────────────────────────────
    op.create_table(
        "documents",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("title", sa.String(), nullable=True, index=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("file_type", sa.String(), nullable=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
    )

    # ── summaries ──────────────────────────────────────────────────────────
    op.create_table(
        "summaries",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("document_id", sa.Integer(), sa.ForeignKey("documents.id"), nullable=True),
        sa.Column("model_name", sa.String(), nullable=False),
        sa.Column("generated_summary", sa.Text(), nullable=False),
        sa.Column("inference_time_ms", sa.Float(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
    )

    # ── model_metadata ─────────────────────────────────────────────────────
    op.create_table(
        "model_metadata",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(), nullable=True, unique=True, index=True),
        sa.Column("version", sa.String(), nullable=True),
        sa.Column("framework", sa.String(), nullable=True),
        sa.Column("rouge_score", sa.Float(), nullable=True),
        sa.Column("bert_score", sa.Float(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_table("model_metadata")
    op.drop_table("summaries")
    op.drop_table("documents")
    op.drop_table("users")
