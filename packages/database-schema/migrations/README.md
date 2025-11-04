# Database Migrations

Manual SQL migrations for the marketplace database.

## How to Apply Migrations

### Development (Local Docker PostgreSQL)

```bash
PGPASSWORD=marketplace_pass psql \
  -h localhost \
  -U marketplace_user \
  -d marketplace \
  -f packages/database-schema/migrations/0001_add_missing_user_columns.sql
```

### Production (Neon PostgreSQL)

```bash
psql $DATABASE_URL -f packages/database-schema/migrations/0001_add_missing_user_columns.sql
```

## Migration History

### 0001_add_missing_user_columns.sql

**Date**: 2025-11-04
**Purpose**: Add missing columns to users table to match database-schema definition

**Changes**:
- Added user profile columns: `first_name`, `last_name`, `telegram_username`, `avatar`
- Added verification columns: `is_verified`, `verification_status`
- Added customer tracking: `is_client`, `has_rented_before`
- Added preferences: `language`, `timezone`, `preferred_platform`
- Added communication tracking: `last_login_at`, `first_contact_date`, `last_contact_date`
- Added CRM fields: `notes`, `manager_communication_info`, `metadata`
- Created enums: `verification_status`, `communication_platform`, `language`
- Added indexes for performance
- Updated phone column length to support international format
- Added unique constraints for `telegram_id` and `phone`

**Status**: ✅ Applied

## Future Migrations

For new migrations:

1. Use `drizzle-kit generate` to create migrations from schema changes
2. Or manually create SQL files with sequential numbering
3. Test locally first
4. Apply to production with caution
5. Update this README with migration details
