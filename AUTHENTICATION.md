# Authentication System Documentation

This document describes the authentication system implemented in ProgressPath using Supabase Auth.

## Features

✅ User registration with email/password
✅ User login with email/password
✅ User logout
✅ Protected routes (Books, French sections)
✅ Session management
✅ Auth state persistence
✅ User menu with profile info
✅ Automatic redirects for authenticated/unauthenticated users

## Setup Instructions

### 1. Supabase Configuration

Make sure you have the following environment variables in your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Enable Email Authentication in Supabase

1. Go to your Supabase Dashboard
2. Navigate to Authentication > Providers
3. Enable Email provider
4. Configure email templates (optional)
5. Set up email confirmation settings

### 3. Install Dependencies

The required packages are already in package.json:

```bash
npm install
```

## Architecture

### File Structure

```
├── lib/
│   ├── auth.js           # Authentication utility functions
│   └── supabase.js       # Supabase client configuration
├── components/
│   ├── AuthProvider.js   # Auth context and route protection
│   └── UserMenu.js       # User authentication menu
├── app/
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.js   # Login page
│   │   └── signup/
│   │       └── page.js   # Signup page
│   └── layout.js         # Root layout with AuthProvider
└── middleware.js         # Middleware for route protection
```

### Key Components

#### 1. Auth Utility Functions (`lib/auth.js`)

Provides helper functions for authentication:
- `signUp(email, password, metadata)` - Register new user
- `signIn(email, password)` - Sign in existing user
- `signOut()` - Sign out current user
- `getSession()` - Get current session
- `getUser()` - Get current user
- `onAuthStateChange(callback)` - Listen for auth changes
- `resetPassword(email)` - Request password reset
- `updatePassword(newPassword)` - Update user password

#### 2. AuthProvider (`components/AuthProvider.js`)

React Context provider that:
- Manages global authentication state
- Listens for auth state changes
- Handles automatic redirects
- Protects routes client-side

Protected routes:
- `/books` - Requires authentication
- `/french` - Requires authentication

Auth routes (redirect to home if authenticated):
- `/auth/login`
- `/auth/signup`

#### 3. UserMenu (`components/UserMenu.js`)

Displays:
- Login/Signup buttons for unauthenticated users
- User profile dropdown for authenticated users
- Sign out functionality

#### 4. Login Page (`app/auth/login/page.js`)

Features:
- Email and password fields
- Error handling
- Loading states
- Link to signup page
- Automatic redirect after successful login

#### 5. Signup Page (`app/auth/signup/page.js`)

Features:
- Full name, email, password, and confirm password fields
- Client-side validation
- Success message
- Link to login page
- Automatic redirect after successful signup

## Usage

### Accessing User Information

Use the `useAuth` hook in any component:

```javascript
'use client'

import { useAuth } from '@/components/AuthProvider'

export default function MyComponent() {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not authenticated</div>

  return <div>Welcome, {user.email}!</div>
}
```

### Protecting Routes

Routes in the `protectedRoutes` array in `AuthProvider.js` are automatically protected. Users will be redirected to `/auth/login` if they try to access these routes without authentication.

To add more protected routes, edit `components/AuthProvider.js`:

```javascript
const protectedRoutes = ['/books', '/french', '/your-new-route']
```

### Manual Authentication

You can use auth functions anywhere:

```javascript
import { signIn, signOut } from '@/lib/auth'

// Sign in
try {
  const { user, session } = await signIn('user@example.com', 'password123')
  console.log('Signed in:', user)
} catch (error) {
  console.error('Sign in error:', error.message)
}

// Sign out
try {
  await signOut()
  console.log('Signed out')
} catch (error) {
  console.error('Sign out error:', error.message)
}
```

## Security Best Practices

1. **Never expose Supabase service role key** - Only use the anon key in client-side code
2. **Use Row Level Security (RLS)** - Configure RLS policies in Supabase for database tables
3. **Validate user input** - Always validate email and password formats
4. **Use HTTPS** - Ensure your app is served over HTTPS in production
5. **Set up email confirmation** - Enable email confirmation in Supabase for added security

## Setting Up Row Level Security (RLS)

If you're storing user-specific data, set up RLS policies in Supabase:

```sql
-- Example: Books table with RLS
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own books
CREATE POLICY "Users can view their own books"
  ON books FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own books
CREATE POLICY "Users can insert their own books"
  ON books FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own books
CREATE POLICY "Users can update their own books"
  ON books FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own books
CREATE POLICY "Users can delete their own books"
  ON books FOR DELETE
  USING (auth.uid() = user_id);
```

## Troubleshooting

### Issue: "Invalid authentication credentials"

- Check that your Supabase URL and anon key are correct in `.env.local`
- Restart your development server after changing environment variables

### Issue: "Email not confirmed"

- Check your Supabase email settings
- Disable email confirmation for development (not recommended for production)

### Issue: Routes not protected

- Ensure `AuthProvider` wraps your entire app in `layout.js`
- Check that routes are listed in `protectedRoutes` array
- Clear browser cache and cookies

### Issue: Infinite redirect loop

- Check that auth routes (`/auth/login`, `/auth/signup`) are not in `protectedRoutes`
- Ensure `authRoutes` array is correctly configured

## Future Enhancements

Potential additions to the authentication system:

- [ ] Social authentication (Google, GitHub, etc.)
- [ ] Password reset flow
- [ ] Email verification flow
- [ ] Two-factor authentication
- [ ] Remember me functionality
- [ ] Session timeout handling
- [ ] User profile editing
- [ ] Avatar uploads
- [ ] Account deletion

## Support

For issues related to Supabase Auth, check:
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Auth API Reference](https://supabase.com/docs/reference/javascript/auth-api)
- [Next.js App Router Guide](https://nextjs.org/docs/app)
