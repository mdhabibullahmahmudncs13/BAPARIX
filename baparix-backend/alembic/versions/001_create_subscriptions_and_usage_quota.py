"""Create subscriptions and usage_quota tables

Revision ID: 001
Revises: 
Create Date: 2024-01-15 10:00:00.000000

Requirements:
- 3.4: Track API call usage per User per billing period
- 3.5: Track blueprint generation count per User per billing period
- 20.1: Maintain subscription records for Free, Pro, and Enterprise tiers
- 20.2: Track subscription status as active, cancelled, or expired
- 20.3: Track current billing period start and end dates
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create subscriptions and usage_quota tables."""
    
    # Create subscriptions table
    op.create_table(
        'subscriptions',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tier', sa.String(length=20), nullable=False, server_default='free'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('current_period_start', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('current_period_end', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('cancel_at_period_end', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('cancelled_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for subscriptions
    op.create_index('idx_subscriptions_user_id', 'subscriptions', ['user_id'], unique=True)
    op.create_index('idx_subscriptions_status', 'subscriptions', ['status'], unique=False)
    
    # Create usage_quota table
    op.create_table(
        'usage_quota',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('subscription_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('period_start', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('period_end', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('blueprints_generated', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('blueprints_limit', sa.Integer(), nullable=False),
        sa.Column('api_calls_used', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('api_calls_limit', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for usage_quota
    op.create_index('idx_usage_quota_user_id', 'usage_quota', ['user_id'], unique=False)
    op.create_index('idx_usage_quota_period_start', 'usage_quota', ['period_start'], unique=False)
    op.create_index('idx_usage_quota_period_end', 'usage_quota', ['period_end'], unique=False)
    
    # Create trigger to update updated_at timestamp
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    """)
    
    op.execute("""
        CREATE TRIGGER update_subscriptions_updated_at
        BEFORE UPDATE ON subscriptions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    """)
    
    op.execute("""
        CREATE TRIGGER update_usage_quota_updated_at
        BEFORE UPDATE ON usage_quota
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    """)


def downgrade() -> None:
    """Drop subscriptions and usage_quota tables."""
    
    # Drop triggers
    op.execute("DROP TRIGGER IF EXISTS update_usage_quota_updated_at ON usage_quota;")
    op.execute("DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;")
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column();")
    
    # Drop indexes
    op.drop_index('idx_usage_quota_period_end', table_name='usage_quota')
    op.drop_index('idx_usage_quota_period_start', table_name='usage_quota')
    op.drop_index('idx_usage_quota_user_id', table_name='usage_quota')
    op.drop_index('idx_subscriptions_status', table_name='subscriptions')
    op.drop_index('idx_subscriptions_user_id', table_name='subscriptions')
    
    # Drop tables
    op.drop_table('usage_quota')
    op.drop_table('subscriptions')
