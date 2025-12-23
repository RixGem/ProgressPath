# Database Migration Guide

## Adding total_time Field to french_learning Table

If you have an existing `french_learning` table without the `total_time` field, follow these steps to update your database structure.

### Step 1: Add the total_time Column

Run this SQL command in your Supabase SQL Editor:

```sql
-- Add total_time column to existing table
ALTER TABLE french_learning 
ADD COLUMN IF NOT EXISTS total_time INTEGER;
```

### Step 2: Migrate Existing Data

Populate the `total_time` field with existing `duration_minutes` data:

```sql
-- Copy duration_minutes values to total_time for existing records
UPDATE french_learning 
SET total_time = duration_minutes 
WHERE total_time IS NULL;
```

### Step 3: Set Default Value (Optional)

If you want to ensure all new records have a total_time value:

```sql
-- Set default value for total_time
ALTER TABLE french_learning 
ALTER COLUMN total_time SET DEFAULT 0;
```

### Step 4: Make total_time NOT NULL (Optional but Recommended)

After migrating existing data, you can make the field required:

```sql
-- Make total_time required (do this AFTER migrating data)
ALTER TABLE french_learning 
ALTER COLUMN total_time SET NOT NULL;
```

### Verification

Check that all records have been updated:

```sql
-- Verify all records have total_time values
SELECT 
  COUNT(*) as total_records,
  COUNT(total_time) as records_with_total_time,
  SUM(total_time) as total_minutes,
  ROUND(SUM(total_time)::numeric / 60, 1) as total_hours
FROM french_learning;
```

Expected output: `total_records` should equal `records_with_total_time`.

### Check for Discrepancies

Verify that total_time matches duration_minutes for migrated records:

```sql
-- Find any records where total_time doesn't match duration_minutes
SELECT 
  id, 
  activity_type, 
  date, 
  duration_minutes, 
  total_time
FROM french_learning 
WHERE duration_minutes != total_time;
```

This should return no results if migration was successful.

### Complete Migration Script

Run all commands together:

```sql
-- Complete migration script for french_learning table
BEGIN;

-- 1. Add the column
ALTER TABLE french_learning 
ADD COLUMN IF NOT EXISTS total_time INTEGER;

-- 2. Migrate existing data
UPDATE french_learning 
SET total_time = duration_minutes 
WHERE total_time IS NULL;

-- 3. Set default value
ALTER TABLE french_learning 
ALTER COLUMN total_time SET DEFAULT 0;

-- 4. Make it required (optional)
-- ALTER TABLE french_learning 
-- ALTER COLUMN total_time SET NOT NULL;

-- 5. Verify migration
SELECT 
  'Migration Complete' as status,
  COUNT(*) as total_records,
  COUNT(total_time) as records_with_total_time,
  SUM(total_time) as total_minutes,
  ROUND(SUM(total_time)::numeric / 60, 1) as total_hours
FROM french_learning;

COMMIT;
```

## Field Mapping Reference

### french_learning Table Schema

| Field | Type | Description | Required | Usage |
|-------|------|-------------|----------|-------|
| id | UUID | Primary key | Yes | Auto-generated |
| activity_type | TEXT | Type of activity | Yes | Form input |
| duration_minutes | INTEGER | Session duration | Yes | Form input (backward compatibility) |
| **total_time** | INTEGER | Total time in minutes | Yes | **Primary field for calculations** |
| notes | TEXT | Optional notes | No | Form input |
| date | DATE | Activity date | Yes | Form input |
| created_at | TIMESTAMP | Record creation time | Yes | Auto-generated |

### Important Notes

1. **total_time** is the primary field used for:
   - Total Hours display on the dashboard
   - Automation scripts and calculations
   - Any time-based analytics

2. **duration_minutes** is maintained for:
   - Backward compatibility
   - Historical data preservation
   - Individual session tracking

3. When logging new activities:
   - Both fields are set to the same value
   - Frontend uses `duration_minutes` for input
   - Database calculations use `total_time`

## Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution**: The column already exists. Skip to Step 2 (data migration).

### Issue: NULL values remain after migration
**Solution**: Run the UPDATE command again:
```sql
UPDATE french_learning 
SET total_time = duration_minutes 
WHERE total_time IS NULL;
```

### Issue: Total Hours not updating on dashboard
**Solution**: 
1. Verify total_time field exists and has data
2. Check browser console for errors
3. Refresh the page to fetch latest data
4. Verify Supabase connection in .env.local

## Next Steps

After completing the migration:
1. ✅ Verify Total Hours displays correctly on the French learning dashboard
2. ✅ Test logging new activities to ensure both fields are populated
3. ✅ Check that automation scripts use the total_time field
4. ✅ Update any custom queries or reports to use total_time

---

For questions or issues, please open an issue on the GitHub repository.
