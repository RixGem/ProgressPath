# User Synchronization Testing Guide

## Overview

This guide provides comprehensive testing instructions for the user synchronization functionality.

## Prerequisites

- Development environment set up
- Database migration completed
- Test users created in Supabase

## Manual Testing

### Test 1: New User Registration

**Objective**: Verify profile is created automatically for new users

**Steps**:
1. Clear browser cache and localStorage
2. Navigate to `/login`
3. Click "Sign Up"
4. Enter email: `test-user-${Date.now()}@example.com`
5. Enter password: `TestPassword123!`
6. Submit form
7. Open browser console
8. Check for log: "Auth state change: SIGNED_IN"
9. Verify no errors in console

**Expected Result**:
- User is created in Supabase Auth
- Profile record created in `user_profiles` table
- User is redirected to home page
- Profile data is available via `useUserProfile()`

**SQL Verification**:
```sql
SELECT * FROM user_profiles WHERE id = '<new-user-id>';
```

---

### Test 2: Session Refresh

**Objective**: Verify sessions are refreshed automatically

**Steps**:
1. Sign in with a test user
2. Open browser console
3. Wait 5-10 minutes
4. Look for console log: "Auth state change: TOKEN_REFRESHED"
5. Verify page doesn't log out

**Expected Result**:
- Session refreshed within 10 minutes
- No logout occurs
- User data remains available

**To Speed Up Testing**:
Modify `contexts/AuthContext.js` temporarily:
```javascript
// Change from 5 minutes to 30 seconds for testing
const SESSION_CHECK_INTERVAL = 30 * 1000
```

---

### Test 3: Cross-Tab Synchronization

**Objective**: Verify auth state syncs across browser tabs

**Steps**:
1. Open app in Tab 1 (signed out)
2. Open app in Tab 2 (signed out)
3. Sign in on Tab 1
4. Watch Tab 2 (should sync within 2 seconds)
5. Update profile on Tab 1
6. Verify Tab 2 shows updated profile
7. Sign out on Tab 1
8. Verify Tab 2 signs out

**Expected Result**:
- Tab 2 syncs sign in automatically
- Tab 2 receives profile updates
- Tab 2 signs out when Tab 1 signs out

---

### Test 4: Profile Update

**Objective**: Verify profile updates work correctly

**Steps**:
1. Sign in as test user
2. Navigate to profile settings
3. Update display name
4. Update bio
5. Click "Save Changes"
6. Look for success message
7. Refresh page
8. Verify changes persisted

**Expected Result**:
- Save button shows "Saving..." state
- Success message appears
- Changes are saved to database
- Changes persist after refresh

---

### Test 5: Error Recovery

**Objective**: Verify retry logic works for failed operations

**Steps**:
1. Open browser DevTools
2. Go to Network tab
3. Enable "Offline" mode
4. Try to sign in
5. Wait 2 seconds
6. Disable "Offline" mode
7. Watch console for retry attempts
8. Verify sign in completes

**Expected Result**:
- Initial request fails
- Retry logic kicks in
- Subsequent request succeeds
- Sign in completes successfully

---

### Test 6: Sync Status Indicator

**Objective**: Verify sync status is displayed correctly

**Steps**:
1. Add `<SyncStatusIndicator />` to a page
2. Sign in (should show "Syncing...")
3. Wait for sync to complete (indicator disappears)
4. Simulate error (disconnect network)
5. Try to update profile
6. Verify error indicator appears
7. Click "Retry" button
8. Reconnect network
9. Verify sync completes

**Expected Result**:
- Loading state shown during initial load
- Syncing state shown during operations
- Error state shown on failure
- Retry button works
- Dismiss button clears error

---

### Test 7: Concurrent Updates

**Objective**: Verify concurrent updates are handled correctly

**Steps**:
1. Open app in two tabs (Tab 1 and Tab 2)
2. Sign in with same user
3. Update profile in Tab 1
4. Immediately update profile in Tab 2 (different field)
5. Verify both updates are saved
6. Check that last update wins for same field

**Expected Result**:
- Both updates are processed
- No data loss
- `updated_at` timestamp is latest
- Real-time sync shows changes in both tabs

---

## Automated Testing

### Running Tests

```bash
# Install test dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Run all tests
npm test

# Run specific test file
npm test tests/userSync.test.js

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Test Coverage Goals

- **Unit Tests**: >80% coverage
- **Integration Tests**: All critical flows
- **E2E Tests**: Main user journeys

---

## Performance Testing

### Test 1: Sync Speed

**Test**:
```javascript
const start = performance.now()
await syncUserData(userId)
const duration = performance.now() - start
console.log(`Sync took ${duration}ms`)
```

**Acceptable**: <1000ms
**Target**: <500ms

### Test 2: Batch Sync Performance

**Test**:
```javascript
const userIds = Array.from({ length: 100 }, (_, i) => `user-${i}`)
const start = performance.now()
await batchSyncUsers(userIds)
const duration = performance.now() - start
console.log(`Batch sync of 100 users took ${duration}ms`)
```

**Acceptable**: <5000ms
**Target**: <3000ms

---

## Load Testing

### Simulate Multiple Users

```javascript
// Create 100 concurrent users
const promises = []
for (let i = 0; i < 100; i++) {
  promises.push(
    signUp(`test${i}@example.com`, 'password123')
  )
}

const results = await Promise.allSettled(promises)
const successful = results.filter(r => r.status === 'fulfilled').length
const failed = results.filter(r => r.status === 'rejected').length

console.log(`Successful: ${successful}, Failed: ${failed}`)
```

**Expected**:
- At least 95% success rate
- No database deadlocks
- No rate limiting errors (unless expected)

---

## Edge Case Testing

### Test 1: Rapid Sign In/Out

**Steps**:
1. Sign in
2. Immediately sign out
3. Immediately sign in again
4. Repeat 10 times rapidly
5. Check for race conditions

**Expected**:
- No errors
- Final state is correct
- No orphaned subscriptions

### Test 2: Expired Session

**Steps**:
1. Sign in
2. Manually expire session in database
3. Try to use the app
4. Verify automatic sign out

### Test 3: Network Interruption

**Steps**:
1. Sign in
2. Start profile update
3. Disconnect network mid-request
4. Wait 5 seconds
5. Reconnect network
6. Verify retry completes

### Test 4: Browser Storage Cleared

**Steps**:
1. Sign in
2. Clear localStorage and sessionStorage via DevTools
3. Refresh page
4. Verify user is signed out
5. Sign in again
6. Verify everything works

---

## Security Testing

### Test 1: RLS Policies

**Test accessing another user's profile**:
```javascript
// Try to access user A's profile while signed in as user B
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', 'user-a-id')
  .single()

// Should return error
expect(error).toBeTruthy()
expect(data).toBeNull()
```

### Test 2: Token Validation

**Test expired token rejection**:
```javascript
// Use expired token
const expiredToken = '<expired-jwt>'
const response = await fetch('/api/protected', {
  headers: {
    Authorization: `Bearer ${expiredToken}`
  }
})

expect(response.status).toBe(401)
```

---

## Monitoring During Testing

### Supabase Dashboard

1. **Database**:
   - Watch active queries
   - Monitor slow queries
   - Check connection count

2. **Auth**:
   - Monitor sign ups
   - Check failed attempts
   - Watch for rate limiting

3. **Storage**:
   - Monitor API calls
   - Check error rates
   - Watch bandwidth usage

### Browser DevTools

1. **Console**:
   - Check for errors
   - Monitor sync logs
   - Watch network requests

2. **Network**:
   - Monitor request timing
   - Check for failed requests
   - Watch payload sizes

3. **Performance**:
   - Record performance profile
   - Check for memory leaks
   - Monitor CPU usage

---

## Common Issues and Solutions

### Issue: "Permission denied" errors

**Cause**: RLS policies not set up correctly

**Solution**:
```sql
-- Verify policies exist
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';

-- Re-run migration if needed
```

### Issue: Infinite sync loop

**Cause**: Circular dependency in useEffect

**Solution**:
- Check useEffect dependencies
- Verify sync attempts counter is working
- Add defensive guards

### Issue: Profile not created

**Cause**: Trigger not working

**Solution**:
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Test trigger manually
INSERT INTO auth.users (id, email) VALUES (uuid_generate_v4(), 'test@example.com');
SELECT * FROM user_profiles WHERE email = 'test@example.com';
```

---

## Regression Testing Checklist

Before deploying:

- [ ] All manual tests pass
- [ ] Automated tests pass
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] Security tests pass
- [ ] Edge cases handled
- [ ] Database queries optimized
- [ ] Real-time subscriptions work
- [ ] Cross-tab sync works
- [ ] Error recovery works

---

## Reporting Issues

When reporting issues, include:

1. **Environment**: Dev/Staging/Production
2. **Browser**: Chrome 120, Safari 17, etc.
3. **Steps to reproduce**
4. **Expected behavior**
5. **Actual behavior**
6. **Console logs**
7. **Network logs**
8. **Screenshots/videos**

---

## Next Steps

1. Complete manual testing
2. Run automated tests
3. Perform load testing
4. Review test results
5. Fix any issues
6. Re-test
7. Deploy to staging
8. Final verification
9. Deploy to production
