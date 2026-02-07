# Quick Reference Guide - French Learning Page

## 🚀 Quick Start

### For New Installations
Use the SQL schema from `README.md` - it includes the `total_time` field.

### For Existing Databases
Run the migration script from `DATABASE_MIGRATION.md`:

```sql
ALTER TABLE french_learning ADD COLUMN IF NOT EXISTS total_time INTEGER;
UPDATE french_learning SET total_time = duration_minutes WHERE total_time IS NULL;
```

---

## 📊 Field Structure

| Field | Type | Purpose |
|-------|------|---------|
| `duration_minutes` | INTEGER | Session duration (input field) |
| `total_time` | INTEGER | **Total time for calculations** ⭐ |

**Key Point**: Both fields store the same value in minutes. The `total_time` field is used for:
- Total Hours display
- Automation scripts
- Analytics and calculations

---

## 🔧 Common SQL Queries

### Check Total Hours
```sql
SELECT ROUND(SUM(total_time)::numeric / 60, 1) as total_hours
FROM french_learning;
```

### View Recent Activities
```sql
SELECT 
  activity_type,
  total_time as minutes,
  date,
  notes
FROM french_learning
ORDER BY date DESC
LIMIT 10;
```

### Weekly Summary
```sql
SELECT 
  DATE_TRUNC('week', date) as week,
  COUNT(*) as sessions,
  SUM(total_time) as total_minutes,
  ROUND(SUM(total_time)::numeric / 60, 1) as total_hours
FROM french_learning
WHERE date >= CURRENT_DATE - INTERVAL '4 weeks'
GROUP BY week
ORDER BY week DESC;
```

### Activity Type Breakdown
```sql
SELECT 
  activity_type,
  COUNT(*) as sessions,
  SUM(total_time) as total_minutes,
  ROUND(SUM(total_time)::numeric / 60, 1) as total_hours,
  ROUND(AVG(total_time), 0) as avg_minutes_per_session
FROM french_learning
GROUP BY activity_type
ORDER BY total_minutes DESC;
```

---

## 🎯 How It Works

### When You Log a New Activity:
1. Fill in duration in minutes (e.g., `30`)
2. Both `duration_minutes` AND `total_time` are set to `30`
3. Database stores both values

### When Dashboard Loads:
1. Queries database for ALL records
2. Sums up `total_time` values
3. Converts to hours: `total_minutes / 60`
4. Displays rounded result

---

## ⚡ Quick Troubleshooting

### Total Hours showing 0?
```sql
-- Check if total_time field exists and has data
SELECT COUNT(*), SUM(total_time) FROM french_learning;
```

**Fix**: Run the migration script to populate `total_time`.

### Numbers don't match?
```sql
-- Compare duration_minutes vs total_time
SELECT 
  SUM(duration_minutes) as sum_duration,
  SUM(total_time) as sum_total_time,
  COUNT(*) as records
FROM french_learning;
```

**Fix**: If different, re-run: `UPDATE french_learning SET total_time = duration_minutes;`

### New activities not saving?
- Check Supabase connection in `.env.local`
- Verify RLS policies allow inserts
- Check browser console for errors

---

## 📝 Logging Activities

### Via Dashboard:
1. Click "Log Activity"
2. Select activity type
3. Enter duration in minutes
4. Add optional notes
5. Select date
6. Click "Log Activity"

### Via SQL (if needed):
```sql
INSERT INTO french_learning (
  activity_type,
  duration_minutes,
  total_time,
  date,
  notes
) VALUES (
  'vocabulary',
  30,
  30,  -- Same as duration_minutes
  CURRENT_DATE,
  'Learned 20 new words'
);
```

---

## 🔍 Verification Checklist

After making changes, verify:

- [ ] `total_time` column exists in database
- [ ] All records have `total_time` values
- [ ] Total Hours displays on dashboard
- [ ] New activities populate both fields
- [ ] Numbers match expected calculations

---

## 📚 Field Mapping Summary

```javascript
// Frontend form input
formData.duration_minutes = 30;  // User enters this

// Database insert (both fields set)
{
  duration_minutes: 30,  // For backward compatibility
  total_time: 30         // ⭐ Used for calculations
}

// Dashboard display
totalTime = SUM(total_time)  // Aggregate from database
totalHours = totalTime / 60  // Convert to hours
```

---

## 🆘 Need Help?

1. **Check** `DATABASE_MIGRATION.md` for detailed migration steps
2. **Review** `CHANGELOG_FRENCH_FIX.md` for complete change details
3. **Read** `README.md` for full database schema
4. **Open** an issue on GitHub if problems persist

---

## 🎓 Best Practices

1. ✅ Always set both `duration_minutes` and `total_time` to the same value
2. ✅ Use `total_time` for any calculations or aggregations
3. ✅ Keep `duration_minutes` for backward compatibility
4. ✅ Test changes in development before production
5. ✅ Run verification queries after migrations

---

**Last Updated**: December 23, 2025  
**Version**: 1.0 (Post total_time field addition)
