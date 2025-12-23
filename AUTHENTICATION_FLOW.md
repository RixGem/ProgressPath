# ProgressPath Authentication Flow

## 🔄 Complete Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER VISITS APPLICATION                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AuthContext (layout.js)                       │
│  • Checks for existing session                                   │
│  • Sets loading = true                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
         ┌──────────────────┐  ┌──────────────────┐
         │  Session Found   │  │  No Session      │
         │  user = valid    │  │  user = null     │
         └──────────────────┘  └──────────────────┘
                    │                   │
                    │                   ▼
                    │          ┌──────────────────┐
                    │          │ Redirect to      │
                    │          │ /login           │
                    │          └──────────────────┘
                    │                   │
                    ▼                   ▼
         ┌──────────────────────────────────────┐
         │       LOGIN/SIGNUP PAGE              │
         │  • Email/password form               │
         │  • Toggle between login/signup       │
         └──────────────────────────────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
         ▼                     ▼
┌─────────────────┐   ┌─────────────────┐
│   SIGN UP       │   │   SIGN IN       │
│  • Create user  │   │  • Verify creds │
│  • Send email   │   │  • Get session  │
└─────────────────┘   └─────────────────┘
         │                     │
         ▼                     │
┌─────────────────┐            │
│ Email Verify    │            │
│  • User clicks  │            │
│  • Account      │            │
│    activated    │            │
└─────────────────┘            │
         │                     │
         └──────────┬──────────┘
                    ▼
         ┌──────────────────────┐
         │  Session Created     │
         │  • JWT token stored  │
         │  • User object set   │
         └──────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Redirect to Home    │
         │  AuthContext updates │
         └──────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PROTECTED ROUTES                              │
│  ProtectedRoute wrapper checks authentication                    │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│              USER ACCESSES PROTECTED PAGES                       │
│  • Home (/)                                                      │
│  • Books (/books)                                               │
│  • French (/french)                                             │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATA OPERATIONS                                │
│  All queries automatically filtered by user_id                   │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│              ROW LEVEL SECURITY (Database)                       │
│  • SELECT: WHERE user_id = auth.uid()                           │
│  • INSERT: CHECK user_id = auth.uid()                           │
│  • UPDATE: WHERE user_id = auth.uid()                           │
│  • DELETE: WHERE user_id = auth.uid()                           │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER CLICKS LOGOUT                            │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  • Clear session                                                 │
│  • Update AuthContext (user = null)                             │
│  • Redirect to /login                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Component Hierarchy

```
RootLayout (app/layout.js)
└── AuthProvider (contexts/AuthContext.js)
    │
    ├── Navigation (components/Navigation.js)
    │   ├── Home Link
    │   ├── Books Link
    │   ├── French Link
    │   └── Logout Button (if authenticated)
    │
    └── Main Content
        │
        ├── Login Page (app/login/page.js)
        │   • No protection (public route)
        │   • Redirects if already logged in
        │
        └── Protected Pages
            │
            ├── ProtectedRoute (components/ProtectedRoute.js)
            │   │
            │   ├── Home (app/page.js)
            │   │   └── Shows welcome message
            │   │
            │   ├── Books (app/books/page.js)
            │   │   └── Filtered by user_id
            │   │
            │   └── French (app/french/page.js)
            │       └── Filtered by user_id
            │
            └── Loading State / Redirect
```

---

## 🔐 Security Layers

### Layer 1: Client-Side Route Protection
```javascript
ProtectedRoute Component
└── Check if user exists
    ├── Yes → Render content
    └── No → Redirect to /login
```

### Layer 2: Client-Side Query Filtering
```javascript
Data Queries
└── Always include .eq('user_id', user.id)
    └── Filters data before sending to UI
```

### Layer 3: Database Row Level Security
```sql
RLS Policies
└── auth.uid() = user_id
    └── Database enforces even if client filter missed
```

**Result**: Triple protection against unauthorized access! 🛡️

---

## 📱 State Management Flow

```
AuthContext State
├── user: null | User Object
│   └── {
│       id: "uuid",
│       email: "user@example.com",
│       created_at: "timestamp",
│       ...
│     }
│
├── loading: boolean
│   └── true during auth check
│   └── false after auth resolved
│
└── Methods:
    ├── signIn(email, password)
    ├── signUp(email, password)
    └── signOut()
```

### State Updates
```
Initial Load
└── loading: true, user: null

Session Found
└── loading: false, user: { ... }

No Session
└── loading: false, user: null

Sign In Success
└── loading: false, user: { ... }

Sign Out
└── loading: false, user: null
```

---

## 🔄 Data Flow Example: Creating a Book

```
1. User fills form in Books page
   └── title, author, progress, etc.

2. User clicks "Add Book"
   └── handleSubmit() called

3. Include user_id in data
   └── dataToSave = { ...formData, user_id: user.id }

4. Send to Supabase
   └── supabase.from('books').insert([dataToSave])

5. Request reaches Supabase
   └── Database receives INSERT request

6. RLS Policy Check
   └── "Users can insert own books" policy
   └── WITH CHECK (auth.uid() = user_id)
   └── ✅ PASSES (user_id matches auth.uid())

7. Insert Successful
   └── Book saved to database

8. Fetch updated data
   └── supabase.from('books').select('*').eq('user_id', user.id)

9. RLS Policy Check (again!)
   └── "Users can view own books" policy
   └── USING (auth.uid() = user_id)
   └── ✅ PASSES (only returns this user's books)

10. Update UI
    └── setBooks(data)
    └── User sees their new book
```

---

## 🎭 Multi-User Scenario

```
User A (id: aaa-111)
├── Books Table
│   ├── Book 1 (user_id: aaa-111) ← User A can see
│   ├── Book 2 (user_id: aaa-111) ← User A can see
│   └── Book 3 (user_id: bbb-222) ← HIDDEN from User A
│
└── French Learning Table
    ├── Activity 1 (user_id: aaa-111) ← User A can see
    ├── Activity 2 (user_id: aaa-111) ← User A can see
    └── Activity 3 (user_id: bbb-222) ← HIDDEN from User A

User B (id: bbb-222)
├── Books Table
│   ├── Book 1 (user_id: aaa-111) ← HIDDEN from User B
│   ├── Book 2 (user_id: aaa-111) ← HIDDEN from User B
│   └── Book 3 (user_id: bbb-222) ← User B can see
│
└── French Learning Table
    ├── Activity 1 (user_id: aaa-111) ← HIDDEN from User B
    ├── Activity 2 (user_id: aaa-111) ← HIDDEN from User B
    └── Activity 3 (user_id: bbb-222) ← User B can see
```

**RLS ensures perfect data isolation automatically!**

---

## 🚦 Route Protection Logic

```javascript
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Still checking authentication
  if (loading) {
    return <LoadingSpinner />
  }

  // Not authenticated
  if (!user) {
    router.push('/login')
    return null
  }

  // Authenticated - show content
  return children
}
```

### Flow Chart
```
Enter Protected Route
        │
        ▼
   Is Loading?
        │
    ┌───┴───┐
    │       │
   Yes     No
    │       │
    ▼       ▼
  Show   Has User?
  Loader    │
         ┌──┴──┐
         │     │
        Yes   No
         │     │
         ▼     ▼
      Show  Redirect
    Content  /login
```

---

## 🎯 Authentication Hook Usage

### In Any Component

```javascript
import { useAuth } from '../contexts/AuthContext'

function MyComponent() {
  const { user, loading, signIn, signOut, signUp } = useAuth()

  // Show loading state
  if (loading) {
    return <div>Loading...</div>
  }

  // Check if logged in
  if (!user) {
    return <div>Please log in</div>
  }

  // Use user data
  return (
    <div>
      <p>Welcome {user.email}!</p>
      <p>User ID: {user.id}</p>
      <button onClick={signOut}>Logout</button>
    </div>
  )
}
```

---

## 📊 Session Lifecycle

```
Session Creation (Login/Signup)
└── JWT Token Generated
    └── Stored in localStorage
        └── Sent with every Supabase request
            └── auth.uid() available in RLS policies

Session Active
└── Token automatically refreshed
    └── User stays logged in
        └── Works across tabs/windows
            └── Persists on page reload

Session Expiration
└── Token expires (configurable in Supabase)
    └── AuthContext detects expiration
        └── User set to null
            └── Redirect to /login

Manual Logout
└── signOut() called
    └── Token cleared from storage
        └── Session deleted in Supabase
            └── User set to null
                └── Redirect to /login
```

---

## 🔍 Debugging Tips

### Check Auth State
```javascript
const { user, loading } = useAuth()
console.log('User:', user)
console.log('Loading:', loading)
console.log('Authenticated:', !!user)
```

### Check Supabase Session
```javascript
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('User:', session?.user)
console.log('Access Token:', session?.access_token)
```

### Test RLS Policies
```sql
-- Run as authenticated user in Supabase SQL Editor
SELECT * FROM books;  -- Should only show your books

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'books';

-- View policies
SELECT * FROM pg_policies 
WHERE tablename = 'books';
```

---

## 📈 Performance Considerations

### Optimizations Implemented

1. **Context Provider at Root**
   - Single instance for entire app
   - Shared state, no prop drilling

2. **Session Persistence**
   - No re-authentication on page reload
   - Fast initial load

3. **Conditional Queries**
   - Only fetch when user exists
   - Prevents unnecessary API calls

4. **Database Indexes**
   - Index on user_id columns
   - Fast query performance

5. **RLS Caching**
   - Database caches policy results
   - Reduced overhead per query

---

## 🎓 Best Practices Followed

✅ **Never trust client-side filtering alone** → Use RLS  
✅ **Always include user_id in queries** → Double protection  
✅ **Use context for auth state** → Consistent access  
✅ **Protect routes at component level** → UX + security  
✅ **Handle loading states** → Better user experience  
✅ **Clear error messages** → Easier debugging  
✅ **Automatic redirects** → Smooth user flow  
✅ **Session persistence** → Stay logged in  

---

**This authentication system provides enterprise-grade security while maintaining a great user experience!** 🚀🔐
