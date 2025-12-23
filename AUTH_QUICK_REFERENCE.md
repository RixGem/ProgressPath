# Authentication Quick Reference

## 🚀 Quick Setup (5 Steps)

### 1. Run SQL Script
```sql
-- Copy AUTHENTICATION_SQL.sql into Supabase SQL Editor and run
```

### 2. Configure Supabase Dashboard
```
Authentication > Settings:
✅ Enable Email Confirmations
✅ Site URL: http://localhost:3000
✅ Redirect URLs: http://localhost:3000/**
```

### 3. Verify Environment Variables
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Test
- Navigate to http://localhost:3000
- Sign up with email/password
- Verify email
- Sign in and start using!

---

## 💻 Code Patterns

### Use Authentication in Components

```javascript
import { useAuth } from '../contexts/AuthContext'

function MyComponent() {
  const { user, loading, signIn, signOut, signUp } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not authenticated</div>

  return <div>Hello {user.email}</div>
}
```

### Protect a Page

```javascript
import ProtectedRoute from '../components/ProtectedRoute'

export default function MyPage() {
  return (
    <ProtectedRoute>
      <div>Protected content here</div>
    </ProtectedRoute>
  )
}
```

### Fetch User-Specific Data

```javascript
// SELECT - Get only current user's data
const { data, error } = await supabase
  .from('books')
  .select('*')
  .eq('user_id', user.id)

// INSERT - Create with user_id
const { error } = await supabase
  .from('books')
  .insert([{ 
    title: 'My Book',
    user_id: user.id  // Always include!
  }])

// UPDATE - Update only user's data
const { error } = await supabase
  .from('books')
  .update({ title: 'Updated' })
  .eq('id', bookId)
  .eq('user_id', user.id)  // Security check

// DELETE - Delete only user's data
const { error } = await supabase
  .from('books')
  .delete()
  .eq('id', bookId)
  .eq('user_id', user.id)  // Security check
```

### Sign In/Out Programmatically

```javascript
// Sign In
try {
  const { data, error } = await signIn(email, password)
  if (error) throw error
  // Redirect or update UI
} catch (error) {
  console.error('Login failed:', error.message)
}

// Sign Out
try {
  await signOut()
  router.push('/login')
} catch (error) {
  console.error('Logout failed:', error.message)
}

// Sign Up
try {
  const { data, error } = await signUp(email, password)
  if (error) throw error
  alert('Check your email to verify your account')
} catch (error) {
  console.error('Sign up failed:', error.message)
}
```

---

## 🔒 Security Checklist

### Database Level (RLS)
- [x] RLS enabled on all tables
- [x] SELECT policy: users see only their data
- [x] INSERT policy: users can only create with their user_id
- [x] UPDATE policy: users can only update their data
- [x] DELETE policy: users can only delete their data

### Application Level
- [x] All routes protected with ProtectedRoute
- [x] All queries filter by user.id
- [x] All inserts include user_id
- [x] Session management configured
- [x] Logout functionality working

---

## 🐛 Common Issues & Solutions

### Issue: "Missing Supabase environment variables"
**Solution:** 
```bash
# Check .env.local exists and contains:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# Restart dev server after adding
```

### Issue: Users can't sign up
**Solution:**
- Check email settings in Supabase dashboard
- Verify SMTP configuration
- Check spam folder for verification email
- Ensure Site URL and Redirect URLs are correct

### Issue: "Invalid JWT" or session errors
**Solution:**
```javascript
// Clear browser storage
localStorage.clear()
// Sign out and sign in again
// Verify Supabase URL/keys are correct
```

### Issue: Users see each other's data
**Solution:**
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('books', 'french_learning');

-- Check policies exist
SELECT * FROM pg_policies 
WHERE tablename IN ('books', 'french_learning');

-- Ensure queries include user_id filter
.eq('user_id', user.id)
```

### Issue: Existing data not visible
**Solution:**
```sql
-- Option 1: Assign to your user
UPDATE books SET user_id = 'YOUR-UUID' WHERE user_id IS NULL;
UPDATE french_learning SET user_id = 'YOUR-UUID' WHERE user_id IS NULL;

-- Get your UUID from Supabase Dashboard > Authentication > Users
```

---

## 📋 Testing Checklist

### Initial Setup
- [ ] SQL script executed successfully
- [ ] RLS enabled on both tables
- [ ] Policies created (8 total: 4 per table)
- [ ] Auth settings configured in Supabase
- [ ] Environment variables set

### Functionality Tests
- [ ] Can access login page
- [ ] Can sign up with new email
- [ ] Receive verification email
- [ ] Can sign in after verification
- [ ] Redirected to home after login
- [ ] Can access all protected routes
- [ ] Can create books and activities
- [ ] Can view only own data

### Multi-User Tests
- [ ] Sign out from first account
- [ ] Sign up with second email
- [ ] Verify second account
- [ ] Sign in with second account
- [ ] Cannot see first user's data
- [ ] Can create own data
- [ ] Switch back to first account
- [ ] Cannot see second user's data

### Security Tests
- [ ] Cannot access protected routes while logged out
- [ ] Logout button works
- [ ] Session persists on page reload
- [ ] Cannot manipulate user_id in queries
- [ ] RLS prevents unauthorized access

---

## 🎯 File Structure

```
ProgressPath/
├── contexts/
│   └── AuthContext.js          # 🔑 Auth state management
├── components/
│   ├── Navigation.js           # 🔝 With logout button
│   └── ProtectedRoute.js       # 🛡️ Route protection
├── app/
│   ├── layout.js               # 🌐 Auth provider wrapper
│   ├── page.js                 # 🏠 Protected home
│   ├── login/
│   │   └── page.js             # 🔐 Login/signup
│   ├── books/
│   │   └── page.js             # 📚 Protected, filtered
│   └── french/
│       └── page.js             # 🇫🇷 Protected, filtered
├── lib/
│   └── supabase.js             # ⚙️ Supabase client
├── AUTHENTICATION_SETUP.md     # 📖 Detailed guide
├── AUTHENTICATION_SQL.sql      # 🗄️ Database script
├── README_AUTHENTICATION.md    # 📘 Quick start
└── AUTH_QUICK_REFERENCE.md     # ⚡ This file
```

---

## 🔗 Useful Links

- **Supabase Dashboard**: https://app.supabase.com
- **Auth Docs**: https://supabase.com/docs/guides/auth
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
- **Next.js + Supabase**: https://supabase.com/docs/guides/auth/auth-helpers/nextjs

---

## 💡 Pro Tips

1. **Always filter by user_id**: Never forget `.eq('user_id', user.id)` in queries
2. **Use the hook**: `useAuth()` everywhere for consistent state
3. **Test with multiple accounts**: Regularly verify data isolation
4. **Check the console**: Authentication errors appear in browser console
5. **Email verification**: Enable in production for security
6. **Backup before migration**: Always backup data before running SQL scripts
7. **Clear storage**: When debugging, clear browser storage first
8. **Check spam**: Verification emails often land in spam

---

## 🎨 UI Components Reference

### Login Page Features
- Email/password inputs with icons
- Toggle between login and signup
- Loading states
- Error messages
- Success messages
- Modern gradient design

### Navigation Features
- Conditional rendering (hidden on login page)
- Logout button with loading state
- Active route highlighting
- Responsive design

### Protected Route Features
- Loading spinner
- Automatic redirect
- Clean user experience

---

## 📞 Need Help?

1. Check `AUTHENTICATION_SETUP.md` for detailed guide
2. Review `AUTHENTICATION_SQL.sql` for database setup
3. Read `README_AUTHENTICATION.md` for quick start
4. Check Supabase documentation
5. Look at existing protected pages for examples

---

**Last Updated**: December 2024  
**Version**: 1.0.0
