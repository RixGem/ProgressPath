# User Synchronization Setup Guide

## Overview

This guide will help you set up and configure the comprehensive user synchronization system for the ProgressPath application.

## Prerequisites

- Supabase project set up and configured
- Environment variables properly configured
- Admin access to Supabase dashboard

## Installation Steps

### Step 1: Run Database Migration

1. Open your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `database/user_profiles_migration.sql`
4. Execute the SQL script
5. Verify the table was created:
   ```sql
   SELECT * FROM public.user_profiles LIMIT 1;
   ```

### Step 2: Verify Row Level Security

Check that RLS policies are active:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'user_profiles';

-- List all policies
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
```

You should see 4 policies:
- Users can view own profile
- Users can update own profile  
- Users can insert own profile
- Users can delete own profile

### Step 3: Test Profile Creation Trigger

The trigger should automatically create profiles for new users. Test it:

1. Create a test user through Supabase Auth
2. Check if profile was created:
   ```sql
   SELECT * FROM public.user_profiles WHERE id = '<user-id>';
   ```

If the profile exists, the trigger is working correctly.

### Step 4: Update Environment Variables

Ensure your `.env.local` file has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 5: Install Dependencies

No new dependencies are required. The sync system uses existing packages:
- `@supabase/supabase-js`
- `react`
- `next`

### Step 6: Update Existing Components (Optional)

Update your components to use the new sync features:

#### Before:
```javascript
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user } = useAuth()
  // ...
}
```

#### After:
```javascript
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/hooks/useUserProfile'

function MyComponent() {
  const { user, syncing, error } = useAuth()
  const { profile, updateProfile } = useUserProfile()
  // ...
}
```

## Configuration Options

### Session Refresh Interval

By default, sessions are checked every 5 minutes. To change this, modify `contexts/AuthContext.js`:

```javascript
// Current: 5 minutes
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000

// Change to 10 minutes
const SESSION_CHECK_INTERVAL = 10 * 60 * 1000
```

### Sync Retry Attempts

By default, sync operations retry 3 times. To change this, modify `contexts/AuthContext.js`:

```javascript
// Current: 3 attempts
const MAX_SYNC_ATTEMPTS = 3

// Change to 5 attempts
const MAX_SYNC_ATTEMPTS = 5
```

### Exponential Backoff

Retry delays use exponential backoff: 1s, 2s, 4s, 8s, etc.

To change the backoff formula, modify `lib/userSync.js`:

```javascript
// Current formula: 2^attempt * 1000ms
await new Promise(resolve => 
  setTimeout(resolve, Math.pow(2, attempt) * 1000)
)

// Linear backoff: attempt * 2000ms
await new Promise(resolve => 
  setTimeout(resolve, attempt * 2000)
)
```

## Verification

### Test User Registration Flow

1. Sign up a new user:
   ```javascript
   const { signUp } = useAuth()
   await signUp('test@example.com', 'password123', {
     display_name: 'Test User'
   })
   ```

2. Check that profile was created:
   ```javascript
   const { profile } = useUserProfile()
   console.log(profile) // Should contain user data
   ```

### Test Session Refresh

1. Sign in and open browser console
2. Look for log message: "Auth state change: TOKEN_REFRESHED"
3. This should appear automatically within 5-10 minutes

### Test Cross-Tab Sync

1. Open the app in two browser tabs
2. Sign in on tab 1
3. Tab 2 should automatically sync and show the user as logged in

### Test Error Recovery

1. Open browser DevTools
2. Go to Network tab
3. Enable "Offline" mode
4. Try to sign in
5. Disable "Offline" mode
6. The retry logic should kick in and complete the sign in

## Troubleshooting

### Issue: Profile Not Created Automatically

**Symptoms**: New users sign up but no profile record exists

**Solution**:
1. Check if trigger is installed:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
2. Check trigger function:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
   ```
3. Re-run the migration script if trigger is missing

### Issue: "Permission Denied" Errors

**Symptoms**: Users get permission errors when accessing profiles

**Solution**:
1. Check RLS policies are enabled:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
   ```
2. Verify user is authenticated:
   ```javascript
   const { user } = useAuth()
   console.log('User ID:', user?.id)
   ```
3. Test policy manually:
   ```sql
   -- Run as the user
   SELECT * FROM public.user_profiles WHERE id = auth.uid();
   ```

### Issue: Infinite Sync Loop

**Symptoms**: Console shows continuous sync attempts

**Solution**:
1. Check for circular dependencies in useEffect hooks
2. Verify sync attempts counter is working:
   ```javascript
   console.log('Sync attempts:', syncAttempts.current)
   ```
3. Check if max attempts limit is being respected

### Issue: Cross-Tab Sync Not Working

**Symptoms**: Changes in one tab don't reflect in other tabs

**Solution**:
1. Verify storage event listener is attached:
   ```javascript
   // Should see in console
   console.log('Storage listener attached')
   ```
2. Check browser localStorage:
   ```javascript
   console.log(localStorage.getItem('supabase.auth.token'))
   ```
3. Test in different browser (some browsers restrict cross-tab communication)

### Issue: Stale User Data

**Symptoms**: User data doesn't update after changes

**Solution**:
1. Force refresh:
   ```javascript
   const { refreshProfile } = useUserProfile()
   refreshProfile()
   ```
2. Check real-time subscriptions:
   ```javascript
   // Should see in Supabase dashboard
   ```
3. Verify updated_at timestamp is changing:
   ```sql
   SELECT id, updated_at FROM user_profiles WHERE id = '<user-id>';
   ```

### Issue: High Database Load

**Symptoms**: Slow queries, high CPU usage in Supabase dashboard

**Solution**:
1. Check if indexes are created:
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'user_profiles';
   ```
2. Increase session check interval (see Configuration Options)
3. Disable real-time subscriptions if not needed:
   ```javascript
   // Comment out subscription in useUserProfile hook
   ```

## Performance Optimization

### Enable Connection Pooling

In Supabase dashboard:
1. Go to Settings → Database
2. Enable connection pooling
3. Use pooled connection string in production

### Add Database Indexes

For better query performance:

```sql
-- Index for email lookups (if searching by email)
CREATE INDEX idx_user_profiles_email ON user_profiles((extra_data->>'email'));

-- Index for display name search
CREATE INDEX idx_user_profiles_display_name ON user_profiles(display_name);

-- Composite index for common queries
CREATE INDEX idx_user_profiles_status_updated ON user_profiles(account_status, updated_at DESC);
```

### Optimize Real-Time Subscriptions

Limit the number of active subscriptions:

```javascript
// Only subscribe when component is visible
useEffect(() => {
  if (!document.hidden && user?.id) {
    const unsubscribe = subscribeToUserProfile(user.id, callback)
    return unsubscribe
  }
}, [user?.id, document.hidden])
```

## Monitoring

### Log Sync Operations

Enable detailed logging:

```javascript
// In AuthContext.js
const DEBUG_SYNC = process.env.NODE_ENV === 'development'

if (DEBUG_SYNC) {
  console.log('Sync operation:', operation, userId)
}
```

### Track Sync Performance

Add performance monitoring:

```javascript
const startTime = performance.now()
// ... sync operation ...
const endTime = performance.now()
console.log(`Sync took ${endTime - startTime}ms`)
```

### Monitor Error Rates

Track sync errors:

```javascript
const [errorCount, setErrorCount] = useState(0)

useEffect(() => {
  if (error) {
    setErrorCount(prev => prev + 1)
    // Alert if error rate is too high
    if (errorCount > 5) {
      console.error('High error rate detected')
    }
  }
}, [error])
```

## Security Best Practices

1. **Never expose sensitive data in profiles**
   - Use separate tables for sensitive information
   - Only store necessary profile data

2. **Validate user input**
   - Sanitize all profile updates
   - Use database constraints

3. **Audit profile changes**
   ```sql
   -- Add audit log table
   CREATE TABLE profile_audit_log (
     id SERIAL PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     action TEXT,
     old_data JSONB,
     new_data JSONB,
     timestamp TIMESTAMPTZ DEFAULT NOW()
   );
   ```

4. **Rate limit profile updates**
   - Implement rate limiting in API routes
   - Use Supabase rate limiting features

5. **Enable audit logging in Supabase**
   - Go to Settings → Database → Audit Logs
   - Enable logging for user_profiles table

## Backup and Recovery

### Backup User Profiles

```sql
-- Create backup table
CREATE TABLE user_profiles_backup AS 
SELECT * FROM user_profiles;

-- Export to CSV
COPY (SELECT * FROM user_profiles) TO '/tmp/user_profiles_backup.csv' CSV HEADER;
```

### Restore User Profiles

```sql
-- Restore from backup table
INSERT INTO user_profiles 
SELECT * FROM user_profiles_backup
ON CONFLICT (id) DO UPDATE SET
  updated_at = EXCLUDED.updated_at,
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio;
```

## Next Steps

1. ✅ Database migration complete
2. ✅ Code integrated
3. ⬜ Test in development
4. ⬜ Deploy to staging
5. ⬜ Monitor for 24 hours
6. ⬜ Deploy to production

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the SYNC_FIXES_CHANGELOG.md
3. Check Supabase logs in dashboard
4. Enable debug logging and share logs

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)
- [React Hooks Best Practices](https://react.dev/reference/react)
