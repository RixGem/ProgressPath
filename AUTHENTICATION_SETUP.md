# Authentication Setup Guide

This guide will help you set up authentication for ProgressPath using Supabase.

## Features Implemented

✅ **Email/Password Authentication**
- Sign up with email verification
- Sign in/Sign out functionality
- Persistent sessions

✅ **Protected Routes**
- All main routes (/, /books, /french) require authentication
- Automatic redirect to login page for unauthenticated users
- Loading states during authentication checks

✅ **User-Specific Data**
- Each user can only see and manage their own data
- Row Level Security (RLS) policies enforce data isolation

✅ **Session Management**
- Automatic session refresh
- Auth state changes handled globally
- Logout functionality in navigation

## File Structure

```
ProgressPath/
├── contexts/
│   └── AuthContext.js          # Global auth state management
├── components/
│   ├── Navigation.js           # Updated with logout button
│   └── ProtectedRoute.js       # Route protection wrapper
├── app/
│   ├── layout.js               # Wrapped with AuthProvider
│   ├── page.js                 # Protected home page
│   ├── login/
│   │   └── page.js             # Login/Signup page
│   ├── books/
│   │   └── page.js             # Protected, user-filtered
│   └── french/
│       └── page.js             # Protected, user-filtered
└── lib/
    └── supabase.js             # Supabase client
```

## Database Setup

### 1. Add user_id Column to Tables

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Add user_id to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add user_id to french_learning table
ALTER TABLE french_learning ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS books_user_id_idx ON books(user_id);
CREATE INDEX IF NOT EXISTS french_learning_user_id_idx ON french_learning(user_id);
```

### 2. Enable Row Level Security (RLS)

```sql
-- Enable RLS on books table
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Enable RLS on french_learning table
ALTER TABLE french_learning ENABLE ROW LEVEL SECURITY;
```

### 3. Create RLS Policies

#### Books Table Policies

```sql
-- Policy: Users can view only their own books
CREATE POLICY "Users can view own books"
ON books FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own books
CREATE POLICY "Users can insert own books"
ON books FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update only their own books
CREATE POLICY "Users can update own books"
ON books FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete only their own books
CREATE POLICY "Users can delete own books"
ON books FOR DELETE
USING (auth.uid() = user_id);
```

#### French Learning Table Policies

```sql
-- Policy: Users can view only their own activities
CREATE POLICY "Users can view own activities"
ON french_learning FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own activities
CREATE POLICY "Users can insert own activities"
ON french_learning FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update only their own activities
CREATE POLICY "Users can update own activities"
ON french_learning FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete only their own activities
CREATE POLICY "Users can delete own activities"
ON french_learning FOR DELETE
USING (auth.uid() = user_id);
```

### 4. Configure Supabase Authentication

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Settings**
3. Configure the following:

#### Email Settings
- **Enable Email Confirmations**: ON (recommended)
- **Enable Email Change Confirmations**: ON
- **Secure Email Change**: ON

#### Email Templates (Optional)
Customize the email templates for:
- Confirmation emails
- Password reset emails
- Magic link emails

#### Site URL
- Development: `http://localhost:3000`
- Production: Your deployed URL (e.g., `https://progresspath.vercel.app`)

#### Redirect URLs
Add these allowed redirect URLs:
- `http://localhost:3000/**`
- `https://your-production-url.com/**`

## Usage

### Using the Auth Hook

```javascript
import { useAuth } from '../contexts/AuthContext'

function MyComponent() {
  const { user, loading, signIn, signOut, signUp } = useAuth()

  // Access current user
  console.log(user?.email)

  // Check if authenticated
  if (user) {
    // User is logged in
  }

  return ...
}
```

### Protecting a Route

```javascript
import ProtectedRoute from '../components/ProtectedRoute'

export default function MyPage() {
  return (
    <ProtectedRoute>
      {/* Your protected content */}
    </ProtectedRoute>
  )
}
```

### Filtering User Data

```javascript
// Fetch only current user's data
const { data, error } = await supabase
  .from('books')
  .select('*')
  .eq('user_id', user.id)

// Insert with user_id
const { error } = await supabase
  .from('books')
  .insert([{ ...bookData, user_id: user.id }])
```

## Testing the Authentication

### 1. Sign Up Flow
1. Navigate to `/login`
2. Click "Don't have an account? Sign up"
3. Enter email and password (minimum 6 characters)
4. Check your email for verification link
5. Click the verification link
6. Return to login page and sign in

### 2. Sign In Flow
1. Navigate to `/login` (or you'll be redirected if not authenticated)
2. Enter your email and password
3. Click "Sign In"
4. You'll be redirected to the home page

### 3. Test Protected Routes
1. Try accessing `/`, `/books`, or `/french` without being logged in
2. You should be redirected to `/login`
3. After logging in, you can access all protected routes

### 4. Test Data Isolation
1. Create some books and French learning activities
2. Log out
3. Sign up with a different email
4. Verify you don't see the first user's data
5. Each user sees only their own data

### 5. Test Logout
1. Click the "Logout" button in the navigation
2. You should be redirected to the login page
3. Try accessing protected routes - you should be redirected to login

## Security Considerations

✅ **Implemented**:
- Row Level Security (RLS) policies on all tables
- User-specific data filtering in queries
- Protected routes with authentication checks
- Secure session management
- Email verification (optional but recommended)

⚠️ **Additional Recommendations**:
1. **Enable Email Verification**: Ensure users verify their email before accessing the app
2. **Password Requirements**: Consider adding stronger password requirements
3. **Rate Limiting**: Configure rate limiting in Supabase dashboard
4. **2FA**: Consider adding two-factor authentication for extra security
5. **Session Timeout**: Configure session timeout in Supabase settings

## Troubleshooting

### "Missing Supabase environment variables" Error
- Ensure `.env.local` contains:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
  ```
- Restart your development server after adding env variables

### Users Can't Sign Up
- Check if email confirmations are enabled
- Verify SMTP settings in Supabase dashboard
- Check spam folder for verification emails

### RLS Policies Not Working
- Ensure RLS is enabled on tables: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- Verify policies are created correctly
- Check that `user_id` column exists and has proper foreign key

### "Invalid JWT" or Session Errors
- Clear browser cookies/local storage
- Sign out and sign in again
- Check that Supabase URL and keys are correct

### Users See Each Other's Data
- Verify RLS policies are enabled and correct
- Ensure `user_id` is being set in INSERT operations
- Check that queries include `.eq('user_id', user.id)`

## Migration for Existing Data

If you have existing data without `user_id`, you need to:

### Option 1: Assign to a Specific User
```sql
-- Update existing records to belong to a specific user
UPDATE books SET user_id = 'your-user-uuid' WHERE user_id IS NULL;
UPDATE french_learning SET user_id = 'your-user-uuid' WHERE user_id IS NULL;
```

### Option 2: Delete Existing Data
```sql
-- Clear existing data (be careful!)
DELETE FROM books WHERE user_id IS NULL;
DELETE FROM french_learning WHERE user_id IS NULL;
```

### Option 3: Make user_id Nullable (Not Recommended)
If you want to keep anonymous data, you can leave `user_id` nullable, but update your RLS policies:

```sql
-- Allow viewing records without user_id (for legacy data)
CREATE POLICY "View legacy data"
ON books FOR SELECT
USING (user_id IS NULL OR auth.uid() = user_id);
```

## Next Steps

1. **Email Customization**: Customize email templates in Supabase dashboard
2. **Password Reset**: Add password reset functionality
3. **Profile Page**: Create a user profile page
4. **Social Authentication**: Add Google/GitHub OAuth
5. **User Preferences**: Add user settings and preferences
6. **Export Data**: Allow users to export their data

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Authentication](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
