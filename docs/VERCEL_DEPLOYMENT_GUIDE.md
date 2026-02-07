# ProgressPath Vercel Deployment Guide

This comprehensive guide will walk you through deploying ProgressPath to Vercel, including all necessary environment configurations, JWT authentication setup, security best practices, and testing procedures for the embed functionality.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables Configuration](#environment-variables-configuration)
3. [Vercel Deployment Steps](#vercel-deployment-steps)
4. [Security Configuration](#security-configuration)
5. [Embed Functionality Testing](#embed-functionality-testing)
6. [Cron Jobs Setup](#cron-jobs-setup)
7. [Troubleshooting](#troubleshooting)
8. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Prerequisites

Before deploying to Vercel, ensure you have:

- ✅ A [Vercel account](https://vercel.com/signup)
- ✅ A [Supabase project](https://supabase.com) set up
- ✅ An [OpenRouter API key](https://openrouter.ai/keys) (for AI-generated quotes)
- ✅ Git repository access (GitHub, GitLab, or Bitbucket)
- ✅ Node.js 18+ installed locally for testing

---

## Environment Variables Configuration

### Required Environment Variables

You'll need to configure the following environment variables in Vercel. These are the same variables defined in your `.env.example` file.

#### 1. Supabase Configuration

```env
# Supabase Public URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Anonymous Key (Safe to expose to clients)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Supabase Service Role Key (Keep secret - never expose to clients)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

**Where to find these:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the values from:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Project API keys → `anon` `public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Project API keys → `service_role` `secret` → `SUPABASE_SERVICE_ROLE_KEY`

#### 2. OpenRouter API Configuration

```env
# OpenRouter API Key for AI-generated quotes
OPENROUTER_API_KEY=your_openrouter_api_key_here

# AI Model Selection (Default: Meta Llama 3.1 8B - Free tier)
OPENROUTER_MODEL_ID=meta-llama/llama-3.1-8b-instruct:free
```

**How to get OpenRouter API Key:**
1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up/Log in
3. Go to [API Keys](https://openrouter.ai/keys)
4. Create a new API key

**Recommended Free Models:**
- `meta-llama/llama-3.1-8b-instruct:free` (Default)
- `mistralai/mistral-7b-instruct:free`
- `google/gemma-7b-it:free`

View all available models at: https://openrouter.ai/models

#### 3. Application Configuration

```env
# Your Vercel deployment URL (update after first deployment)
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
```

**Note:** After your first deployment, update this to your actual Vercel URL.

#### 4. Security Secrets

**CRITICAL:** These must be strong, random, cryptographically secure secrets.

```env
# Cron Job Authentication Secret
CRON_SECRET=your_secure_cron_secret_here

# JWT Embed Token Signing Secret
JWT_EMBED_SECRET=your_secure_jwt_embed_secret_here

# Optional: Test Endpoint Security (falls back to CRON_SECRET if not set)
TEST_SECRET=your_secure_test_secret_here
```

**Generate secure secrets using OpenSSL:**

```bash
# Generate CRON_SECRET
openssl rand -base64 32

# Generate JWT_EMBED_SECRET
openssl rand -base64 32

# Generate TEST_SECRET (optional)
openssl rand -base64 32
```

**Alternative methods:**
- Node.js: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- Online: [RandomKeygen](https://randomkeygen.com/) (use "Fort Knox Passwords" section)
- Password Manager: Generate a 256-bit random password

---

## Vercel Deployment Steps

### Method 1: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Import Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository:
   - Connect your GitHub/GitLab/Bitbucket account
   - Select the `ProgressPath` repository
   - Click **"Import"**

#### Step 2: Configure Build Settings

Vercel should auto-detect Next.js settings. Verify:

- **Framework Preset:** Next.js
- **Build Command:** `next build`
- **Output Directory:** `.next` (automatically set)
- **Install Command:** `npm install`
- **Development Command:** `next dev`

These settings should match your `vercel.json` configuration.

#### Step 3: Add Environment Variables

1. In the project configuration, scroll to **"Environment Variables"**
2. Add each variable from the [Environment Variables Configuration](#environment-variables-configuration) section:
   - Click **"Add"**
   - Enter **Key** (variable name)
   - Enter **Value** (secret value)
   - Select environments: **Production**, **Preview**, **Development** (recommended)
   - Click **"Add"**

**Variable List Checklist:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `OPENROUTER_API_KEY`
- [ ] `OPENROUTER_MODEL_ID`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `CRON_SECRET`
- [ ] `JWT_EMBED_SECRET`
- [ ] `TEST_SECRET` (optional)

#### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (typically 2-5 minutes)
3. Once deployed, you'll receive a deployment URL like: `https://your-app-name.vercel.app`

#### Step 5: Update App URL

1. Copy your deployment URL
2. Go to **Settings** → **Environment Variables**
3. Update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL
4. Click **"Save"**
5. Redeploy (Vercel will ask or you can trigger manually)

### Method 2: Deploy via Vercel CLI

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

#### Step 3: Deploy from Project Root

```bash
# Navigate to your project directory
cd /path/to/ProgressPath

# Deploy to production
vercel --prod
```

#### Step 4: Add Environment Variables via CLI

```bash
# Add each variable
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add OPENROUTER_API_KEY production
vercel env add OPENROUTER_MODEL_ID production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add CRON_SECRET production
vercel env add JWT_EMBED_SECRET production
vercel env add TEST_SECRET production
```

#### Step 5: Redeploy

```bash
vercel --prod
```

### Method 3: Deploy via GitHub Integration (Automated)

#### Step 1: Connect Repository

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click **"Add New..."** → **"Project"**
4. Import your GitHub repository

#### Step 2: Enable Automatic Deployments

Vercel automatically deploys:
- **Production:** When you push to `main` or `master` branch
- **Preview:** When you create a pull request

#### Step 3: Configure Environment Variables

Follow the same steps as Method 1, Step 3.

---

## Security Configuration

### 1. JWT Embed Token Security

The embed token system uses JWT (JSON Web Tokens) for secure, stateless authentication.

#### Security Best Practices

**🔒 Secret Management:**
- Never commit `JWT_EMBED_SECRET` to version control
- Use strong, randomly generated secrets (minimum 256 bits)
- Rotate secrets periodically (recommended: every 90 days)
- Use different secrets for production and preview environments

**🔐 Token Configuration:**
```javascript
// Recommended token durations by use case
{
  "testing": "1h",           // Testing and development
  "short-term": "1d",        // Temporary embeds
  "standard": "7d",          // Default recommendation
  "long-term": "30d",        // Trusted integrations
  "maximum": "90d"           // Only for highly trusted scenarios
}
```

**⚠️ Never use:**
- Default or example secrets
- Secrets shorter than 32 characters
- Same secret across multiple environments
- Tokens without expiration

### 2. Cron Job Security

The daily quotes cron job is protected by `CRON_SECRET`.

**Endpoint:** `/api/cron/daily-quotes`

**Security Implementation:**
```bash
# The cron job can only be triggered with the correct secret
curl -X POST https://your-app.vercel.app/api/cron/daily-quotes \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Protection Against:**
- ✅ Unauthorized cron job execution
- ✅ API abuse and spam
- ✅ Resource exhaustion attacks

### 3. Supabase Row Level Security (RLS)

Ensure your Supabase tables have proper RLS policies:

```sql
-- Example: Users can only read their own data
CREATE POLICY "Users can read own data"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Example: Embed tokens have read-only access
CREATE POLICY "Embed tokens read-only"
ON public.progress
FOR SELECT
TO authenticated
USING (true);
```

**Apply RLS to all tables:**
1. Go to Supabase Dashboard → **Authentication** → **Policies**
2. Enable RLS for each table
3. Create policies for appropriate access levels

### 4. CORS Configuration

Vercel automatically handles CORS, but you can customize it in `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 5. Rate Limiting

Consider implementing rate limiting for sensitive endpoints:

**Vercel Pro/Enterprise:**
Use Vercel's built-in rate limiting:

```json
// vercel.json
{
  "limits": {
    "maxDuration": 10,
    "maxConcurrentExecutions": 10
  }
}
```

**Custom Middleware:**
Implement in `middleware.js`:

```javascript
import { NextResponse } from 'next/server';

const rateLimit = new Map();

export function middleware(request) {
  const ip = request.ip ?? '127.0.0.1';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const max = 100; // max requests per window

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, []);
  }

  const requests = rateLimit.get(ip).filter(time => now - time < windowMs);
  requests.push(now);
  rateLimit.set(ip, requests);

  if (requests.length > max) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

### 6. Environment-Specific Security

**Production:**
- ✅ HTTPS only (enforced by Vercel)
- ✅ Secure secrets (generated with OpenSSL)
- ✅ RLS enabled on all Supabase tables
- ✅ Rate limiting active
- ✅ Error messages sanitized

**Preview/Development:**
- ✅ Use separate Supabase project or database
- ✅ Different secrets from production
- ✅ More verbose error logging allowed

---

## Embed Functionality Testing

### 1. Test Embed Token Generation

#### Option A: Using cURL

```bash
# 1. Get your Supabase auth token
# Login to your app and get the token from browser developer console:
# localStorage.getItem('supabase.auth.token')

# 2. Generate embed token
curl -X POST https://your-app.vercel.app/api/auth/generate-embed-token \
  -H "Authorization: Bearer YOUR_SUPABASE_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"duration": "7d"}'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "embedUrl": "https://your-app.vercel.app/embed?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-01-02T16:08:53.000Z",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "fullName": "John Doe"
  },
  "permissions": ["read"],
  "type": "embed"
}
```

#### Option B: Using Browser Developer Console

```javascript
// 1. Login to your app
// 2. Open browser developer console (F12)
// 3. Run this code:

async function testEmbedToken() {
  try {
    const response = await fetch('/api/auth/generate-embed-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ duration: '7d' }),
    });
    
    const data = await response.json();
    console.log('Embed URL:', data.embedUrl);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

testEmbedToken();
```

#### Option C: Using Postman

1. Create a new POST request
2. URL: `https://your-app.vercel.app/api/auth/generate-embed-token`
3. Headers:
   - `Authorization`: `Bearer YOUR_SUPABASE_AUTH_TOKEN`
   - `Content-Type`: `application/json`
4. Body (raw JSON):
   ```json
   {
     "duration": "7d"
   }
   ```
5. Click **Send**

### 2. Test Embed Display

#### Step 1: Copy Embed URL

From the API response, copy the `embedUrl` value.

#### Step 2: Test in Browser

1. Open a new browser tab
2. Paste the embed URL
3. Verify that the dashboard loads correctly

**What to check:**
- ✅ Dashboard displays without errors
- ✅ User data is visible
- ✅ Progress charts render correctly
- ✅ No authentication prompts appear
- ✅ Read-only mode is enforced (no edit buttons)

#### Step 3: Test Token Expiration

```javascript
// Decode JWT to check expiration
function decodeJWT(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  
  const payload = JSON.parse(jsonPayload);
  const expiresAt = new Date(payload.exp * 1000);
  const now = new Date();
  
  console.log('Token expires at:', expiresAt);
  console.log('Time remaining:', expiresAt - now, 'ms');
  console.log('Is expired:', expiresAt < now);
  
  return payload;
}

// Test with your token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
decodeJWT(token);
```

### 3. Test Notion Integration

#### Step 1: Generate Embed Token

Follow steps in [Test Embed Token Generation](#1-test-embed-token-generation).

#### Step 2: Add to Notion

1. Open your Notion page
2. Type `/embed` and select **Embed**
3. Paste your `embedUrl`
4. Click **Embed link**
5. Resize the embed by dragging corners

#### Step 3: Verify Functionality

**Check the following:**
- ✅ Dashboard displays correctly within Notion
- ✅ All interactive elements work (except editing)
- ✅ Responsive design adapts to frame size
- ✅ No CORS errors (check browser console)
- ✅ Token doesn't expire prematurely

### 4. Test Different Token Durations

```bash
# Test various durations
durations=("1h" "1d" "7d" "30d")

for duration in "${durations[@]}"; do
  echo "Testing duration: $duration"
  curl -X POST https://your-app.vercel.app/api/auth/generate-embed-token \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"duration\": \"$duration\"}" | jq .
  echo "---"
done
```

### 5. Test Error Scenarios

#### Test 1: Missing Authorization
```bash
curl -X POST https://your-app.vercel.app/api/auth/generate-embed-token \
  -H "Content-Type: application/json" \
  -d '{"duration": "7d"}'

# Expected: 401 Unauthorized
```

#### Test 2: Invalid Token
```bash
curl -X POST https://your-app.vercel.app/api/auth/generate-embed-token \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: application/json" \
  -d '{"duration": "7d"}'

# Expected: 401 Unauthorized
```

#### Test 3: Invalid Duration
```bash
curl -X POST https://your-app.vercel.app/api/auth/generate-embed-token \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"duration": "invalid"}'

# Expected: 400 Bad Request
```

#### Test 4: Expired Embed Token
```bash
# Generate a very short-lived token
curl -X POST https://your-app.vercel.app/api/auth/generate-embed-token \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"duration": "1s"}'

# Wait 2 seconds, then try to access the embed URL
# Expected: Redirect to login or error message
```

### 6. Performance Testing

```javascript
// Test token generation performance
async function benchmarkTokenGeneration(iterations = 10) {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    
    await fetch('/api/auth/generate-embed-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${YOUR_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ duration: '7d' }),
    });
    
    const end = Date.now();
    times.push(end - start);
  }
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`Average time: ${avg}ms`);
  console.log(`Min: ${Math.min(...times)}ms`);
  console.log(`Max: ${Math.max(...times)}ms`);
}

benchmarkTokenGeneration();
```

---

## Cron Jobs Setup

ProgressPath includes a daily quotes cron job that runs automatically on Vercel.

### Vercel Cron Configuration

The cron job is defined in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-quotes",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Schedule:** `0 0 * * *` (runs daily at midnight UTC)

### Cron Job Authentication

The cron endpoint is protected by `CRON_SECRET`:

```javascript
// /app/api/cron/daily-quotes/route.js
export async function POST(request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Generate daily quotes...
}
```

### Vercel Cron Features

**On Hobby Plan (Free):**
- ✅ Daily cron jobs
- ✅ Automatic execution
- ✅ No configuration needed
- ⚠️ Limited to 1 cron job

**On Pro/Enterprise:**
- ✅ Multiple cron jobs
- ✅ Minute-level precision
- ✅ Monitoring and logs
- ✅ Manual triggers

### Monitoring Cron Jobs

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **Crons**
3. View execution history and logs

### Manual Cron Trigger

For testing purposes, manually trigger the cron job:

```bash
curl -X POST https://your-app.vercel.app/api/cron/daily-quotes \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Daily quotes generated successfully",
  "generated": 5
}
```

### Cron Job Troubleshooting

**Issue:** Cron job not running

**Solutions:**
1. Verify `CRON_SECRET` is set correctly
2. Check Vercel plan supports cron jobs
3. Review execution logs in Vercel dashboard
4. Ensure cron schedule is valid

**Issue:** Unauthorized error

**Solutions:**
1. Verify `CRON_SECRET` matches in both:
   - Environment variables
   - Cron execution headers
2. Check for typos or extra spaces
3. Regenerate secret if compromised

---

## Troubleshooting

### Common Deployment Issues

#### Issue 1: Build Fails

**Error:** `Build failed: Cannot find module '...'`

**Solutions:**
```bash
# 1. Ensure all dependencies are in package.json
npm install

# 2. Check for typos in imports
# 3. Clear Vercel build cache
vercel --force

# 4. Verify Node.js version compatibility
# package.json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### Issue 2: Environment Variables Not Working

**Symptoms:**
- App shows "undefined" errors
- Database connection fails
- API endpoints return 500 errors

**Solutions:**
1. **Check variable names:**
   - Must exactly match (case-sensitive)
   - No typos or extra spaces
   
2. **Verify values are set:**
   ```bash
   vercel env ls
   ```

3. **Redeploy after adding variables:**
   - Changes require a new deployment
   - Click "Redeploy" in Vercel dashboard

4. **Check environment selection:**
   - Ensure variables are set for Production
   - Preview/Development may need separate values

#### Issue 3: Supabase Connection Fails

**Error:** `Failed to connect to Supabase`

**Solutions:**
1. **Verify Supabase URL and keys:**
   ```bash
   # Test connection
   curl https://YOUR_PROJECT.supabase.co/rest/v1/ \
     -H "apikey: YOUR_ANON_KEY"
   ```

2. **Check Supabase project status:**
   - Go to Supabase Dashboard
   - Ensure project is active (not paused)

3. **Verify RLS policies:**
   - Check if tables have appropriate policies
   - Test queries in Supabase SQL editor

#### Issue 4: JWT Embed Tokens Invalid

**Error:** `Invalid token signature`

**Solutions:**
1. **Verify JWT_EMBED_SECRET is set:**
   ```bash
   vercel env ls | grep JWT_EMBED_SECRET
   ```

2. **Ensure secret matches between:**
   - Token generation (API)
   - Token verification (embed page)

3. **Check token expiration:**
   ```javascript
   // Decode and inspect token
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log('Expires:', new Date(payload.exp * 1000));
   ```

4. **Regenerate tokens after secret change:**
   - Old tokens become invalid
   - Generate new tokens for active embeds

#### Issue 5: Cron Job Not Executing

**Symptoms:**
- Daily quotes not generated
- No cron execution logs

**Solutions:**
1. **Check Vercel plan:**
   - Hobby plan: Limited cron support
   - Upgrade to Pro if needed

2. **Verify cron configuration:**
   ```json
   // vercel.json must be in root
   {
     "crons": [
       {
         "path": "/api/cron/daily-quotes",
         "schedule": "0 0 * * *"
       }
     ]
   }
   ```

3. **Test cron endpoint manually:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/cron/daily-quotes \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

4. **Check execution logs:**
   - Vercel Dashboard → Project → Settings → Crons

#### Issue 6: CORS Errors in Notion

**Error:** `Access to fetch has been blocked by CORS policy`

**Solutions:**
1. **Update next.config.js:**
   ```javascript
   async headers() {
     return [
       {
         source: '/embed',
         headers: [
           { key: 'X-Frame-Options', value: 'ALLOWALL' },
           { key: 'Access-Control-Allow-Origin', value: '*' },
         ],
       },
     ];
   }
   ```

2. **Check Content Security Policy:**
   ```javascript
   // Ensure CSP allows framing
   { key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://*.notion.so" }
   ```

### Getting Help

**Vercel Support:**
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

**Supabase Support:**
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)

**ProgressPath Issues:**
- Check existing documentation: `EMBED_TOKEN_API_GUIDE.md`
- Review implementation details: `EMBED_TOKEN_IMPLEMENTATION_SUMMARY.md`
- Open an issue on GitHub

---

## Post-Deployment Checklist

After successful deployment, verify everything works:

### Essential Checks

- [ ] **Application loads** at your Vercel URL
- [ ] **User authentication works** (sign up/login)
- [ ] **Database operations succeed** (create, read, update, delete)
- [ ] **Dashboard displays correctly** with user data
- [ ] **Embed token generation works** via API
- [ ] **Embed URLs display properly** in browser
- [ ] **Notion integration works** (if applicable)
- [ ] **Cron job executed** (check logs after 24 hours)
- [ ] **Daily quotes appear** in the app
- [ ] **All environment variables set** and verified

### Security Checks

- [ ] **HTTPS enforced** (Vercel does this automatically)
- [ ] **Secrets are strong** (generated with OpenSSL)
- [ ] **Supabase RLS enabled** on all tables
- [ ] **JWT tokens expire correctly**
- [ ] **Cron endpoint protected** with CRON_SECRET
- [ ] **Service role key not exposed** to clients
- [ ] **Error messages sanitized** (no stack traces in production)

### Performance Checks

- [ ] **Page load times acceptable** (< 3 seconds)
- [ ] **API response times good** (< 500ms)
- [ ] **Images optimized** and loading fast
- [ ] **No console errors** in browser developer tools
- [ ] **Mobile responsive** design working

### Monitoring Setup

1. **Enable Vercel Analytics:**
   - Dashboard → Project → Analytics
   - Track page views, performance, and errors

2. **Set up Vercel Speed Insights:**
   ```javascript
   // Add to app/layout.js
   import { SpeedInsights } from '@vercel/speed-insights/next';
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <SpeedInsights />
         </body>
       </html>
     );
   }
   ```

3. **Configure error tracking:**
   - Consider Sentry or similar service
   - Set up error notifications

### Optional Enhancements

- [ ] **Custom domain** configured (if applicable)
- [ ] **Preview deployments** working for PRs
- [ ] **Automatic deployments** on git push
- [ ] **Branch protection rules** set up
- [ ] **Team members** added with appropriate access
- [ ] **Backup strategy** implemented
- [ ] **Monitoring alerts** configured
- [ ] **Documentation** updated with production URLs

---

## Advanced Configuration

### Custom Domain Setup

1. **Purchase domain** (if needed)
2. **Add domain in Vercel:**
   - Dashboard → Project → Settings → Domains
   - Enter your domain name
   - Follow DNS configuration instructions
3. **Update environment variables:**
   ```env
   NEXT_PUBLIC_APP_URL=https://your-custom-domain.com
   ```
4. **Redeploy** application

### Automatic Branch Deployments

**Preview deployments for each branch:**

1. Go to **Settings** → **Git**
2. Enable **"Production Branch"** (usually `main`)
3. Enable **"Preview Branches"** for all branches
4. Each PR gets a unique preview URL

**Example:**
- `main` branch → `https://your-app.vercel.app` (Production)
- `feature-x` branch → `https://your-app-feature-x.vercel.app` (Preview)

### Environment-Specific Configurations

Create different configurations per environment:

```javascript
// lib/config.js
const config = {
  development: {
    apiUrl: 'http://localhost:3000',
    debug: true,
  },
  preview: {
    apiUrl: process.env.NEXT_PUBLIC_APP_URL,
    debug: true,
  },
  production: {
    apiUrl: process.env.NEXT_PUBLIC_APP_URL,
    debug: false,
  },
};

export default config[process.env.VERCEL_ENV || 'development'];
```

### Database Migrations

For production database migrations:

1. **Create migration scripts** in `database/migrations/`
2. **Test locally** with development database
3. **Apply to preview** environment first
4. **Monitor** for issues
5. **Apply to production** during low-traffic period
6. **Verify** data integrity

---

## Useful Commands

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# View deployment logs
vercel logs <deployment-url>

# List environment variables
vercel env ls

# Pull environment variables to local
vercel env pull .env.local

# Remove a deployment
vercel rm <deployment-url>

# View project information
vercel inspect

# Link local project to Vercel project
vercel link

# Run build locally
npm run build

# Test production build locally
npm run build && npm run start
```

---

## Additional Resources

### Official Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenRouter Documentation](https://openrouter.ai/docs)

### ProgressPath Documentation
- [`EMBED_TOKEN_API_GUIDE.md`](./EMBED_TOKEN_API_GUIDE.md) - API usage details
- [`EMBED_TOKEN_IMPLEMENTATION_SUMMARY.md`](./EMBED_TOKEN_IMPLEMENTATION_SUMMARY.md) - Implementation details
- [`EMBED_TOKEN_QUICKSTART.md`](./EMBED_TOKEN_QUICKSTART.md) - Quick start guide
- [`SUPABASE_SETUP_GUIDE.md`](./SUPABASE_SETUP_GUIDE.md) - Database setup
- [`DAILY_QUOTES_CRON.md`](./DAILY_QUOTES_CRON.md) - Cron job details

### Security Resources
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Security Cheat Sheet](https://cheatsheetseries.owasp.org/)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## Support and Contributing

### Need Help?

1. **Check existing documentation** in this repository
2. **Review Vercel logs** for error details
3. **Search GitHub issues** for similar problems
4. **Open a new issue** with:
   - Detailed error description
   - Steps to reproduce
   - Environment details (OS, Node version, etc.)
   - Relevant logs or screenshots

### Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## Changelog

### Version 1.0.0 (December 2025)
- Initial deployment guide
- JWT authentication setup
- Embed functionality documentation
- Security configuration guide
- Testing procedures
- Troubleshooting section

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

**Happy Deploying! 🚀**

If you found this guide helpful, please star the repository and share it with others!
