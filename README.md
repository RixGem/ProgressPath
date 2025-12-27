# ProgressPath - Learning Tracker

A modern Next.js application to track your learning progress across books and languages with comprehensive analytics, streak tracking, dark mode, and daily inspirational quotes.

## ✨ Latest Features

### 🌙 Dark Mode
- **One-Click Toggle**: Switch between light and dark themes with the sun/moon button in the navigation bar
- **Persistent Preference**: Your theme choice is saved in localStorage
- **Full Coverage**: All pages (Home, Books, French Learning) support dark mode
- **Eye-Friendly**: Carefully selected color palette with excellent contrast ratios for comfortable nighttime reading

### 💬 Daily Inspirational Quotes
- **Rotating Quotes**: 18 curated inspirational quotes that change daily
- **Categories**: Personal Growth, Learning, and Philosophy
- **Elegant Design**: Italic styling with author attribution
- **Motivation**: Start each day with a fresh dose of inspiration on the homepage

## Features

### 📚 Books Dashboard
- Add and manage your book collection
- Track reading progress with visual progress bars
- Categorize books by status (To Read, Reading, Completed)
- Add genres, ratings (1-5 stars), and reading dates
- Language analysis and personal notes
- Edit and update book information
- Monitor reading statistics
- **Dark mode support** for comfortable reading

### 🇫🇷 French Learning Dashboard
- **Activity Tracking**: Log daily learning activities with detailed information
- **Multiple Activity Types**: vocabulary, grammar, reading, listening, speaking, writing, exercises
- **Vocabulary Tracking**: Record new words learned with each session
- **Sentence Practice**: Log practice sentences you worked on
- **Mood Indicators**: Track how each session went (good 😊, neutral 😐, difficult 😓)
- **Streak Tracking**: Automatic calculation of consecutive learning days
- **Time Management**: Automatic total hours calculation (proper minute-to-hour conversion)
- **Visual Analytics**: 
  - Total Hours studied
  - Current learning streak with flame icon 🔥
  - Total sessions completed
  - Total vocabulary words learned
  - 7-day activity calendar showing daily minutes
- **Comprehensive Activity Log**: View all past activities with vocabulary badges and sentence lists
- **Session Notes**: Add detailed notes for each learning session
- **Dark mode support** for late-night study sessions

### 🏠 Homepage Experience
- Personalized greeting: "Hey Chris! Ready to Level Up?"
- **Daily rotating inspirational quote** (changes every day)
- Quick access cards to Books and French Learning
- Chris's Learning Principles section
- **Dark mode** for a comfortable viewing experience

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS with dark mode support
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Deployment**: Vercel
- **State Management**: React Hooks
- **Storage**: localStorage for theme preference
- **AI Integration**: OpenRouter API for daily quote generation

## 🔒 Security & Authentication

ProgressPath implements a robust **two-stage authentication system** for embedded dashboards that combines JWT token authentication with Supabase session management. This architecture ensures that your learning data remains secure and properly scoped to authenticated users.

### Architecture Overview

The security system consists of two primary stages:

1. **JWT Token Authentication** - Validates the embedded dashboard access token
2. **Supabase Session Conversion** - Converts JWT tokens into authenticated Supabase sessions

### JWT Token Authentication for Embedded Dashboards

When embedding dashboards in external applications (such as Notion, personal websites, or other platforms), ProgressPath uses **JWT (JSON Web Tokens)** to authenticate embed requests:

- **Token Generation**: Secure tokens are generated server-side using the `JWT_EMBED_SECRET` environment variable
- **Token Structure**: Each token contains:
  - User identifier (such as email or user ID)
  - Expiration timestamp (configurable, default 7 days)
  - Signature to prevent tampering
- **Token Validation**: All embed requests validate the JWT signature before granting access
- **URL-Based Authentication**: Tokens are passed as query parameters (e.g., `?token=eyJhbGc...`) for seamless embedding

**Example**: When generating an embed link for your French Learning dashboard:
```javascript
// Server-side token generation
const token = jwt.sign(
  { email: 'chris@example.com', exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) },
  process.env.JWT_EMBED_SECRET
);
const embedUrl = `${process.env.NEXT_PUBLIC_APP_URL}/embed/french?token=${token}`;
```

### JWT to Supabase Session Conversion Process

Once a JWT token is validated, ProgressPath converts it into a **Supabase authenticated session**. This conversion is critical for ensuring database queries are properly authenticated and scoped:

1. **Token Verification**: The JWT token is decoded and verified using the `JWT_EMBED_SECRET`
2. **User Lookup**: The user identifier from the token is used to retrieve the corresponding Supabase user account
3. **Session Creation**: A temporary Supabase session is established with appropriate access permissions
4. **Request Context**: All subsequent database queries are executed within this authenticated session context

This two-stage process ensures that:
- External embeddings cannot be accessed without a valid token
- Database access is always authenticated through Supabase
- User data remains isolated and secure

### Security Benefits of the Two-Stage Authentication

The combination of JWT and Supabase authentication provides multiple layers of security:

#### 🛡️ **Token Expiration & Rotation**
- JWT tokens have configurable expiration times (default: 7 days)
- Expired tokens are automatically rejected
- Token rotation can be implemented for enhanced security

#### 🔐 **Signature-Based Validation**
- JWT tokens are cryptographically signed using `JWT_EMBED_SECRET`
- Tampered tokens are immediately detected and rejected
- Only the server with the secret key can generate valid tokens

#### 👤 **User-Specific Data Access**
- Each token is tied to a specific user account
- Supabase Row Level Security (RLS) policies ensure users can only access their own data
- No cross-user data leakage possible

#### 🚫 **Protection Against Common Attacks**
- **Token Replay Attacks**: Mitigated by expiration timestamps
- **Man-in-the-Middle Attacks**: Tokens should be transmitted over HTTPS only
- **SQL Injection**: Prevented by Supabase's parameterized queries and RLS policies
- **Unauthorized Access**: Invalid or missing tokens result in access denial

#### 📊 **Data Scoping**
- All database queries are automatically scoped to the authenticated user
- Books and French Learning activities are filtered by user identity
- No manual user ID filtering required in application code

### How Data Access is Properly Scoped to Authenticated Users

ProgressPath ensures that all data access is properly isolated between users through a combination of:

#### **Supabase Row Level Security (RLS) Policies**

When you set up the database, RLS policies should be configured to restrict access:

```sql
-- Example: Secure RLS policy for books table
CREATE POLICY "Users can only access their own books" ON books
  FOR ALL 
  USING (auth.uid() = user_id);

-- Example: Secure RLS policy for french_learning table
CREATE POLICY "Users can only access their own learning data" ON french_learning
  FOR ALL 
  USING (auth.uid() = user_id);
```

**Note**: The example SQL in the Getting Started section uses permissive policies (`USING (true)`) for quick setup. For production deployments, replace these with user-scoped policies.

#### **Server-Side Session Management**

Embed API routes handle session creation and validation:

```javascript
// Example: Embed route validates token and creates Supabase session
const { data: { user } } = await supabase.auth.getUser(token);
if (!user) {
  return new Response('Unauthorized', { status: 401 });
}
// All subsequent queries are now scoped to this user
```

#### **Client-Side Authentication State**

The embedded dashboard components automatically inherit the authenticated session:
- No additional authentication logic needed in components
- Supabase client automatically includes authentication headers
- All queries respect RLS policies

### Environment Variables Required for Secure Operation

For the security system to function properly, the following environment variables **must** be configured:

#### **Required for JWT Token Authentication**

| Variable | Purpose | Example | Generation |
|----------|---------|---------|------------|
| `JWT_EMBED_SECRET` | Secret key for signing and verifying JWT tokens | `your_secure_jwt_secret_here` | `openssl rand -base64 32` |
| `JWT_SECRET` | Alternative/legacy name for JWT secret | `your_secure_jwt_secret_here` | `openssl rand -base64 32` |

**⚠️ Security Requirements**:
- Must be a strong, randomly generated string (minimum 32 characters)
- Never commit this value to version control
- Use different secrets for development, staging, and production
- Rotate periodically for enhanced security

#### **Required for Supabase Authentication**

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API endpoint | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key for client-side access | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for server-side operations | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

**⚠️ Security Requirements**:
- Obtain these from your Supabase project dashboard (Settings → API)
- `SUPABASE_SERVICE_ROLE_KEY` has elevated privileges - never expose on client-side
- Use environment-specific Supabase projects for development and production

#### **Required for Application Configuration**

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_APP_URL` | Base URL for generating embed links | `https://your-app.vercel.app` |

### Best Practices for Secure Embedded Dashboards

1. **Always Use HTTPS**: Ensure your application is served over HTTPS to prevent token interception
2. **Implement Token Expiration**: Use reasonable expiration times (7-30 days recommended)
3. **Validate on Every Request**: Never cache authentication results - validate tokens on each request
4. **Use Environment-Specific Secrets**: Different secrets for development, staging, and production
5. **Monitor Access Logs**: Track embed access patterns for suspicious activity
6. **Implement Rate Limiting**: Prevent abuse by limiting embed requests per user/token
7. **Regular Secret Rotation**: Periodically rotate JWT secrets and regenerate embed tokens
8. **Audit RLS Policies**: Regularly review Supabase RLS policies to ensure proper data isolation

### Troubleshooting Security Issues

#### Token Validation Failures
- **Symptom**: "Invalid token" or "Unauthorized" errors
- **Causes**: Expired token, incorrect `JWT_EMBED_SECRET`, or tampered token
- **Solution**: Regenerate the embed token with correct secret

#### Data Access Errors
- **Symptom**: Empty results or "Permission denied" errors
- **Causes**: RLS policies too restrictive or user not properly authenticated
- **Solution**: Verify RLS policies and check Supabase session creation

#### Environment Variable Issues
- **Symptom**: "Missing JWT secret" or configuration errors
- **Causes**: Environment variables not set or incorrectly named
- **Solution**: Verify all required variables are set in `.env.local` or Vercel Environment Variables

For additional security documentation and support, see the [Supabase Security Documentation](https://supabase.com/docs/guides/auth/row-level-security) and [JWT.io](https://jwt.io/) for token debugging.

## Getting Started

### Prerequisites

Make sure you have Node.js 18+ installed.

### Installation

1. Clone the repository:
```bash
git clone https://github.com/RixGem/ProgressPath.git
cd ProgressPath
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory based on `.env.example`:
```bash
cp .env.example .env.local
```

Fill in your credentials:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL_ID=meta-llama/llama-3.1-8b-instruct:free

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# JWT Secret for Embed Token Signing
JWT_SECRET=your_secure_jwt_secret_here

# Cron Job Security
CRON_SECRET=your_secure_cron_secret_here

# Test Endpoint Security (optional)
TEST_SECRET=your_secure_test_secret_here
```

### 🔄 Environment Variable Naming Compatibility

ProgressPath now supports **multiple naming conventions** for environment variables, making it easier to deploy across different platforms and integrate with existing configurations. The application automatically detects and uses the correct variable names based on what's available in your environment.

#### Supported Naming Conventions

The application supports both **standard** (Next.js convention) and **legacy** (deployment platform) variable names:

| Standard Variable Name | Legacy/Alternative Names | Purpose |
|----------------------|--------------------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `NEXTPUBLICSUPABASE_URL`, `SUPABASE_URL` | Supabase项目URL，用于API连接 (Supabase project URL for API connection) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `OPENROUTER_API_KEY` | `OPEN_ROUTER_API_KEY` | OpenRouter API key |
| `OPENROUTER_MODEL_ID` | `OPEN_ROUTER_MODEL_ID` | OpenRouter model identifier |
| `NEXT_PUBLIC_APP_URL` | `APP_URL`, `VERCEL_URL` | 应用部署URL，用于生成嵌入链接 (Application deployment URL for generating embed links) |
| `JWT_EMBED_SECRET` | `JWT_SECRET`, `JWTEMBEDSECRET` | 用于签名嵌入令牌 (For signing embed tokens) |

#### Understanding Variable Purposes (避免混淆)

为了避免配置错误，请了解不同环境变量的具体用途：

To avoid configuration errors, please understand the specific purposes of different environment variables:

##### 🔐 JWT 令牌签名密钥 (JWT Token Signing Key)
- **变量名 (Variable Names)**: `JWT_EMBED_SECRET` / `JWT_SECRET` / `JWTEMBEDSECRET`
- **用途 (Purpose)**: 用于签名和验证嵌入式令牌（embed tokens）  
  **For signing and verifying embed tokens**
- **示例值 (Example Value)**: `your_secure_jwt_secret_here`
- **重要性 (Importance)**: 此密钥用于加密令牌，确保嵌入链接的安全性  
  **This key is used to encrypt tokens and ensure the security of embed links**

##### 🌐 应用部署 URL (Application Deployment URL)
- **变量名 (Variable Names)**: `NEXT_PUBLIC_APP_URL` / `APP_URL` / `VERCEL_URL`
- **用途 (Purpose)**: 应用的部署地址，用于生成嵌入链接和回调 URL  
  **Application deployment URL for generating embed links and callback URLs**
- **示例值 (Example Value)**: `https://your-app.vercel.app` 或 `http://localhost:3000`
- **重要性 (Importance)**: 确保嵌入功能能正确生成访问链接  
  **Ensures embed functionality can correctly generate access links**

##### 🗄️ Supabase 项目 URL (Supabase Project URL)
- **变量名 (Variable Names)**: `NEXT_PUBLIC_SUPABASE_URL` / `NEXTPUBLICSUPABASE_URL` / `SUPABASE_URL`
- **用途 (Purpose)**: Supabase 数据库项目的 API 端点  
  **Supabase database project API endpoint**
- **示例值 (Example Value)**: `https://xxxxx.supabase.co`
- **重要性 (Importance)**: 用于连接数据库，与应用 URL 完全不同  
  **Used for connecting to the database, completely different from the app URL**

**⚠️ 常见错误 (Common Mistakes)**: 不要将 Supabase URL 和 App URL 混淆！  
**Do not confuse Supabase URL with App URL!**
- ❌ 错误 (Wrong): 将 `NEXT_PUBLIC_APP_URL` 设置为 Supabase URL  
  Setting `NEXT_PUBLIC_APP_URL` to Supabase URL
- ✅ 正确 (Correct): `NEXT_PUBLIC_SUPABASE_URL` = Supabase 项目地址 (Supabase project URL), `NEXT_PUBLIC_APP_URL` = 应用部署地址 (Application deployment URL)

#### Fallback Behavior

The application uses an **intelligent fallback system** that checks for variables in order of preference:

1. **First**: Standard Next.js naming convention (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
2. **Second**: Legacy/alternative naming convention (e.g., `SUPABASE_URL`)
3. **Third**: Platform-specific defaults (e.g., `VERCEL_URL` for deployment URL)

This means you can use **either** naming convention, and the application will automatically find and use the correct value.

#### Examples

##### Example 1: Standard Naming (Recommended)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENROUTER_API_KEY=sk-or-v1-xxxxx
OPENROUTER_MODEL_ID=meta-llama/llama-3.1-8b-instruct:free
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
JWT_EMBED_SECRET=your_secure_jwt_secret_here
CRON_SECRET=your_secure_cron_secret_here
```

##### Example 2: Legacy Naming (Still Supported)
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPEN_ROUTER_API_KEY=sk-or-v1-xxxxx
OPEN_ROUTER_MODEL_ID=meta-llama/llama-3.1-8b-instruct:free
APP_URL=https://your-app.vercel.app
JWT_SECRET=your_secure_jwt_secret_here
CRON_SECRET=your_secure_cron_secret_here
```

##### Example 3: Mixed Naming (Works Too!)
```env
# Mix and match - the app will find the right values
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPEN_ROUTER_API_KEY=sk-or-v1-xxxxx
OPENROUTER_MODEL_ID=meta-llama/llama-3.1-8b-instruct:free
VERCEL_URL=your-app.vercel.app  # Automatically used if APP_URL not set
JWTEMBEDSECRET=your_secure_jwt_secret_here
```

#### Migration Notes

- **✅ No Breaking Changes**: Existing configurations continue to work without modification
- **✅ Flexible**: Choose the naming convention that works best for your deployment platform
- **✅ Future-Proof**: Standard Next.js naming is recommended for new projects
- **⚠️ Priority**: If both standard and legacy variables are set, the standard name takes precedence

#### Troubleshooting Variable Issues

If environment variables aren't being detected:

1. **Check variable names**: Ensure they match one of the supported conventions above
2. **Restart development server**: Changes to `.env.local` require a restart (`npm run dev`)
3. **Verify file location**: `.env.local` should be in the project root directory
4. **Check for typos**: Variable names are case-sensitive
5. **Redeploy on Vercel**: After updating environment variables in Vercel dashboard, trigger a new deployment
6. **Verify URL configuration**: Make sure you're not confusing Supabase URL with App URL

**Developer Tip**: You can check which variables are being used by reviewing the console logs during application startup (in development mode).

4. Set up Supabase tables:

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Create books table
CREATE TABLE books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  progress DECIMAL(5,2) DEFAULT 0,
  status TEXT DEFAULT 'reading',
  genre TEXT,
  rating INTEGER,
  language_analysis TEXT,
  notes TEXT,
  date_started DATE,
  date_finished DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  date_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create french_learning table with all enhanced fields
CREATE TABLE french_learning (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  total_time INTEGER NOT NULL,
  notes TEXT,
  date DATE NOT NULL,
  new_vocabulary TEXT[],
  practice_sentences TEXT[],
  mood TEXT DEFAULT 'neutral' CHECK (mood IN ('good', 'neutral', 'difficult')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE french_learning ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now)
CREATE POLICY "Enable all operations for books" ON books
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for french_learning" ON french_learning
  FOR ALL USING (true);
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

This project is optimized for deployment on Vercel with automated daily quote generation via cron jobs.

### 🚀 Step-by-Step Deployment Guide

#### 1. Prepare Your Repository

Ensure your code is pushed to GitHub:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### 2. Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `RixGem/ProgressPath`
4. Vercel will auto-detect Next.js configuration

#### 3. Configure Environment Variables

⚠️ **IMPORTANT**: Never commit sensitive credentials to your repository. Always use Vercel's Environment Variables feature.

In your Vercel project settings:

1. Navigate to **Settings** → **Environment Variables**
2. Add the following variables for **Production**, **Preview**, and **Development** environments:

##### Required Variables

| Variable Name | Description | Where to Get It |
|--------------|-------------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (sensitive) | Supabase Dashboard → Project Settings → API |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI quotes | [OpenRouter Keys](https://openrouter.ai/keys) |
| `OPENROUTER_MODEL_ID` | AI model to use | Default: `meta-llama/llama-3.1-8b-instruct:free` |
| `NEXT_PUBLIC_APP_URL` | Your deployed app URL | `https://your-app.vercel.app` |
| `JWT_EMBED_SECRET` | JWT secret for embed token signing | Generate with: `openssl rand -base64 32` |
| `CRON_SECRET` | Secure secret for cron authentication | Generate with: `openssl rand -base64 32` |
| `TEST_SECRET` | (Optional) Secret for test endpoints | Generate with: `openssl rand -base64 32` |

**💡 Compatibility Note**: You can also use legacy variable names (e.g., `SUPABASE_URL` instead of `NEXT_PUBLIC_SUPABASE_URL`, or `JWT_SECRET` instead of `JWT_EMBED_SECRET`). See the [Environment Variable Naming Compatibility](#-environment-variable-naming-compatibility) section for details.

##### Generate Secure Secrets

```bash
# Generate JWT_EMBED_SECRET (or JWT_SECRET)
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -base64 32

# Generate TEST_SECRET
openssl rand -base64 32
```

#### 4. Deploy

1. Click **"Deploy"** in Vercel
2. Vercel will:
   - Install dependencies (`npm install`)
   - Build your Next.js application (`next build`)
   - Deploy to production
3. Your app will be live at `https://your-app.vercel.app`

#### 5. Configure Cron Job (Automatic)

The `vercel.json` configuration automatically sets up a daily cron job:
- **Endpoint**: `/api/cron/daily-quotes`
- **Schedule**: `0 0 * * *` (runs at midnight UTC daily)
- **Purpose**: Generates a new inspirational quote each day

**Security**: The cron endpoint is protected by `CRON_SECRET`. Vercel automatically includes the `Authorization` header when triggering scheduled functions.

#### 6. Verify Deployment

✅ **Post-Deployment Checklist**:

- [ ] Application loads successfully
- [ ] Database connection works (Books and French Learning pages load)
- [ ] Dark mode toggle functions
- [ ] Daily quote displays on homepage
- [ ] All environment variables are set correctly
- [ ] No sensitive data exposed in source code or logs
- [ ] Cron job scheduled (check Vercel Dashboard → Cron)

#### 7. Monitor and Maintain

- **View Logs**: Vercel Dashboard → Your Project → Deployments → View Function Logs
- **Cron Logs**: Check execution logs to ensure daily quotes are generating
- **Update Environment Variables**: Settings → Environment Variables (changes require redeployment)

### 🔒 Security Best Practices

1. **Never hardcode credentials** in `vercel.json` or any committed files
2. **Use Vercel Environment Variables** for all sensitive data
3. **Rotate secrets regularly**, especially if exposed
4. **Enable Vercel Authentication** for preview deployments if needed
5. **Review `.gitignore`** to ensure `.env.local` and `.env.*.local` are excluded
6. **Use different credentials** for development, preview, and production environments

### 🔄 Continuous Deployment

Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: For every pull request and branch push

To trigger a redeployment:
```bash
git commit --allow-empty -m "chore: trigger redeployment"
git push
```

### 🐛 Troubleshooting Deployment Issues

#### Build Fails
- Check build logs in Vercel Dashboard
- Verify all dependencies in `package.json`
- Ensure Node.js version compatibility (18+)

#### Environment Variables Not Working
- Confirm variables are set for the correct environment (Production/Preview/Development)
- Redeploy after adding/updating environment variables
- Check for typos in variable names
- Try using alternative variable names (see compatibility section)

#### Database Connection Errors
- Verify Supabase credentials are correct
- Check Supabase project is active
- Ensure RLS policies allow operations

#### Cron Job Not Running
- Verify `CRON_SECRET` is set in environment variables
- Check cron logs in Vercel Dashboard
- Ensure cron path matches your API route: `/api/cron/daily-quotes`

### 📚 Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenRouter API Documentation](https://openrouter.ai/docs)

## Usage Guide

### Using Dark Mode
1. Click the **sun/moon icon** in the top-right navigation bar
2. The theme will switch instantly
3. Your preference is automatically saved
4. Works on all pages: Home, Books, French Learning

### Daily Quotes
- A new inspirational quote appears on the homepage each day
- Quotes cover personal growth, learning, and philosophical wisdom
- The same quote displays throughout the day for consistency
- Quotes automatically rotate at midnight (via Vercel Cron)

### Books Dashboard
1. Click "Add Book" to add a new book to your collection
2. Fill in the book details (title, author, progress percentage)
3. Add optional information:
   - Genre/Category
   - Rating (1-5 stars)
   - Start and finish dates
   - Language analysis notes
   - Personal reflections
4. Update your reading progress anytime by editing the book
5. Track your overall reading statistics
6. **Toggle dark mode** for comfortable nighttime reading

### French Learning Dashboard

#### Logging an Activity
1. Click "Log Activity" to open the form
2. Select your activity type (vocabulary, grammar, etc.)
3. Enter duration in minutes
4. Choose the date (defaults to today)
5. Select how the session went (mood):
   - 😊 Good - Felt confident
   - 😐 Neutral - Okay progress
   - 😓 Difficult - Challenging
6. **Optional**: Add new vocabulary words (comma-separated)
   - Example: `bonjour, merci, au revoir`
7. **Optional**: Add practice sentences (comma-separated)
   - Example: `Comment allez-vous?, Je vais bien`
8. **Optional**: Add notes about what you learned
9. Click "Log Activity" to save

#### Viewing Your Progress
- **Total Hours**: See your cumulative learning time (properly converted from minutes)
- **Current Streak**: Track consecutive days of learning with flame icon 🔥
- **Total Sessions**: Count of all learning activities
- **Vocabulary Words**: Total number of unique words learned
- **7-Day Activity**: Visual calendar showing daily learning minutes
- **Recent Activities**: Detailed list showing:
  - Activity type and duration
  - Mood indicator
  - Vocabulary badges (green pills)
  - Practice sentences (bulleted list)
  - Session notes

## Database Migration

If you have an existing database, see these migration guides:
- `DATABASE_MIGRATION.md` - For total_time field
- `DATABASE_MIGRATION_NEW_FIELDS.md` - For vocabulary, sentences, and mood fields

## Theme Customization

### Light Mode Colors
- Background: Gradient from blue-50 via white to purple-50
- Text: Gray-900 (headings), Gray-600 (body)
- Cards: White with subtle shadows
- Primary: Blue (#0284c7)

### Dark Mode Colors
- Background: Gradient from gray-900 via gray-800 to gray-900
- Text: White (headings), Gray-300 (body)
- Cards: Gray-800 with gray-700 borders
- Primary: Blue (#38bdf8)

All colors meet WCAG AA contrast standards for accessibility.

## Quote Collection

The daily quotes feature includes 18 inspirational quotes:
- **7 Personal Growth quotes** from Steve Jobs, Winston Churchill, Theodore Roosevelt, Eleanor Roosevelt, Confucius, George Addair, and Tony Robbins
- **7 Learning quotes** from Nelson Mandela, B.B. King, Mahatma Gandhi, Brian Herbert, Leonardo da Vinci, Benjamin Franklin, and Helen Hayes
- **4 Philosophy quotes** from Socrates, René Descartes, and Friedrich Nietzsche

## Troubleshooting

### Dark Mode Issues
- Clear browser cache if theme doesn't persist
- Check browser console for localStorage errors
- Ensure JavaScript is enabled

### Quotes Not Displaying
- Check browser console for errors
- Verify component is imported correctly
- Ensure the DailyQuote component is rendering
- Check Vercel cron logs for quote generation issues

### Database Issues
- Verify Supabase connection in `.env.local` or Vercel Environment Variables
- Check table schemas match the SQL commands above
- Review Supabase logs for errors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

- **v2.2.0**: Environment variable naming compatibility
  - Added support for multiple naming conventions (standard and legacy)
  - Intelligent fallback system for environment variables
  - Enhanced documentation for deployment flexibility
- **v2.1.0**: Security and deployment improvements
  - Removed hardcoded credentials from vercel.json
  - Added comprehensive Vercel deployment documentation
  - Enhanced security best practices
- **v2.0.0**: Added Dark Mode and Daily Inspirational Quotes
  - See `CHANGELOG_DARK_MODE_AND_QUOTES.md` for details
- **v1.5.0**: Enhanced French Learning features
  - See `CHANGELOG_FRENCH_FIX.md` for details
- **v1.0.0**: Initial release with Books and French Learning tracking

## License

MIT License - feel free to use this project for your own learning tracking needs!

## Author

Chris - [RixGem](https://github.com/RixGem)

---

Built with ❤️ using Next.js and Supabase

**All powered by Poke ~** ✨

*Happy Learning! Keep that streak going! 🔥*

**Pro tip**: Try dark mode for your late-night study sessions! 🌙
