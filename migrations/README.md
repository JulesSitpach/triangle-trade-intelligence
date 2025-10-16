# Database Migrations

**Single Source of Truth**: All migrations are in this folder only.

## Migration Order

Migrations are numbered sequentially and should be run in order:

### Core Tables
- `001_create_users_table.sql` - User authentication table
- `003_create_workflow_sessions_table.sql` - Workflow session tracking
- `004_create_subscriptions_table.sql` - Stripe subscriptions
- `005_create_invoices_table.sql` - Payment invoices
- `006_create_user_preferences_table.sql` - User settings

### Enhancements
- `007_add_trial_tracking_to_user_profiles.sql` - Trial period tracking
- `008_add_terms_acceptance_to_user_profiles.sql` - Legal consent tracking
- `009_performance_indexes.sql` - Database performance optimization
- `010_add_referral_tracking_to_user_profiles.sql` - Referral system

### Features
- `011_create_rss_monitoring_tables.sql` - RSS feed monitoring (crisis alerts)
- `012_seed_rss_feeds.sql` - Initial RSS feed data
- `013_add_industry_sector_column.sql` - Industry classification
- `014_create_tariff_policy_updates_table.sql` - Government policy tracking
- `015_add_financial_times_rss_feed.sql` - Financial Times RSS
- `016_fix_policy_source_urls.sql` - URL fixes

### October 2025 Consolidation
- `017_create_hts_tariff_rates_2025.sql` - HTS tariff rates (USITC data)
- `018_add_free_trial_tier.sql` - 7-day free trial support
- `019_create_service_requests_table.sql` - **TODO: Create this migration**

### Utility Migrations
- `add_password_reset_tokens.sql` - Password reset functionality
- `add_subscriber_data_to_service_requests.sql` - Subscriber workflow data

## Running Migrations

```bash
# Run all migrations in order
npm run db:migrate

# Or manually in Supabase SQL Editor
# Copy and paste each file in order
```

## Migration History

**October 15, 2025**: Consolidated migrations from `/database/migrations/` into this folder.
- Archived: `/database/migrations.ARCHIVE.20250115/`
- Added: 017_create_hts_tariff_rates_2025.sql
- Added: 018_add_free_trial_tier.sql

## Notes

- Always create numbered migrations for schema changes
- Never edit existing migrations that have been run in production
- Test migrations on development database first
- Document breaking changes in this README
