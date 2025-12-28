# AI Programming Guide & PR Checklist

## 📋 Basic PR Information

**PR Description:**

**Related Issues:**

**Branch Information:**

- Source Branch:
- Target Branch:

---

## 🔗 Code Dependency Checklist

- [ ]  **New dependencies check**: Verified compatibility with Next.js 14 and React 18.
- [ ]  **Dependency version conflict check**: Ensure no conflicts with `jose`, `@supabase/supabase-js`, or `lucide-react`.
- [ ]  **package.json updates**: `jsonwebtoken` should be removed; `jose` should be present.
- [ ]  **Lock file changes**: Verified `package-lock.json` or `yarn.lock` consistency.
- [ ]  **Security vulnerability scan**: Checked `npm audit` results.

---

## 🌍 Environment Variables Check

- [ ]  **New environment variables documented**: Added to `.env.example` and `ENV_CONFIG_GUIDE.md`.
- [ ]  **Production environment ready**: Variables added to Vercel Project Settings.
- [ ]  **Security check**: Confirmed NO secrets use `NEXT_PUBLIC_` prefix (especially JWT secrets).
- [ ]  **Fallback hierarchy**: Verified `JWT_EMBED_SECRET` → `JWT_SECRET` logic is implemented correctly.

---

## 🚀 Deployment Impact Assessment

- [ ]  **Database migration required**: Checked `DATABASE.md` for schema changes (e.g., `french_learning` new fields, `daily_quotes`).
- [ ]  **Breaking changes identified**: Any API or Schema changes that break existing clients?
- [ ]  **Rollback plan prepared**: Steps to revert database or code changes.
- [ ]  **Deployment timing**: Coordinated with cron job schedules (UTC midnight).

---

## 🔒 Security Review

- [ ]  **Authentication/Authorization**: Verified JWT verification using `jose` (Edge compatible).
- [ ]  **Data Validation**: Implemented input sanitization (UUID, Email) in database operations.
- [ ]  **API Security**: Rate limiting, CORS headers, and `CRON_SECRET` checks for API routes.
- [ ]  **Sensitive Data**: Ensured `JWT_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` are never exposed to the client.

---

## 🧪 Testing Plan

- [ ]  **Unit Test Coverage**: `tests/` folder updated (e.g., `userSync.test.js`).
- [ ]  **Integration Tests**: Verified Embed API and User Sync flows.
- [ ]  **Manual Testing**:
    - [ ]  Checked French Learning Dashboard (Vocab/Mood/Stats).
    - [ ]  Checked Daily Quotes (Display & Cron generation).
    - [ ]  Checked Dark Mode toggling.
- [ ]  **Performance Testing**: Verified API response times and database query efficiency.

---

## 📝 Deployment Notes

**Deployment Date:**

**Environment:**

**Known Issues:**

**Monitoring Metrics:**

---

## 📦 Project Dependencies Reference

### Core Dependencies:

- **@supabase/supabase-js**: `^2.39.0` - Database and authentication client.
- **jose**: `^5.2.0` - JWT verification library. **Replaces `jsonwebtoken`** for better Next.js/Edge runtime compatibility.
- **lucide-react**: `^0.294.0` - Icon library.
- **next**: `14.0.4` - React framework.
- **react**: `^18.2.0` - UI library.
- **react-dom**: `^18.2.0` - React DOM renderer.

### Dev Dependencies:

- **autoprefixer**: `^10.4.16` - CSS vendor prefixing.
- **eslint**: `^8.56.0` - Code linting.
- **eslint-config-next**: `14.0.4` - Next.js ESLint rules.
- **postcss**: `^8.4.32` - CSS processing.
- **tailwindcss**: `^3.4.0` - CSS framework.

### Dependency Checklist:

- [ ]  Is the new dependency compatible with `@supabase/supabase-js`?
- [ ]  Is the new dependency compatible with Next.js 14.0.4?
- [ ]  Is the new dependency compatible with React 18?
- [ ]  Does `jose` version support the required algorithms (HS256)?
- [ ]  Does the change affect TailwindCSS styling?
- [ ]  Does the change affect Lucide icon rendering?

---

## 🔐 Project Environment Variables Reference

### Supabase Configuration:

- **NEXT_PUBLIC_SUPABASE_URL** (Required) - Supabase Project URL.
    - Used in: `lib/supabase.js` (with error handling).
- **NEXT_PUBLIC_SUPABASE_ANON_KEY** (Required) - Supabase Anonymous Key.
    - Used in: `lib/supabase.js` (with error handling).
- **SUPABASE_SERVICE_ROLE_KEY** (Required) - Supabase Service Role Key.
    - Used in: `app/api/embed/verify/route.js` (fallback), `app/api/auth/create-supabase-session/route.js`, `app/api/auth/generate-embed-token/route.js`.

### JWT Security Configuration:

- **JWT_EMBED_SECRET** (Required) - Primary JWT secret for embed functionality.
    - Used in: `app/api/embed/verify/route.js` (primary).
    - **Security Note**: Use a securely generated random string (min 32 chars).
- **JWT_SECRET** (Required) - Alternative/General JWT secret.
    - Used in: `middleware.js`, `app/api/auth/create-supabase-session/route.js`.
    - **Fallback Hierarchy**: `JWT_EMBED_SECRET` → `JWT_SECRET` → `SUPABASE_SERVICE_ROLE_KEY`.
- **~~NEXT_PUBLIC_JWT_SECRET~~** (REMOVED) - ⚠️ **SECURITY RISK**: Removed from project. Do not use.
    - **Migration Note**: `middleware.js` has been updated to use the secure `JWT_SECRET` (server-side only).

### API Configuration:

- **OPENROUTER_API_KEY** (Required) - API Key for AI quote generation.
- **OPENROUTER_MODEL_ID** (Optional) - Default: `meta-llama/llama-3.1-8b-instruct:free`.

### Application Configuration:

- **NEXT_PUBLIC_APP_URL** (Required) - Application URL (e.g., `http://localhost:3000` or Vercel domain).

### Security Configuration:

- **CRON_SECRET** (Required) - Protection key for Cron jobs (`/api/cron/*`).
- **TEST_SECRET** (Optional) - Protection key for Test endpoints (`/api/test/*`).

### Important Code References:

- ✅ `lib/supabase.js`: Added error handling for missing env vars.
- ✅ `app/api/embed/verify/route.js`: Implements secret fallback hierarchy.
- ✅ `app/api/auth/create-supabase-session/route.js`: Uses `jose` and strict secret handling.
- ✅ `middleware.js`: Uses `JWT_SECRET` (removed unsafe `NEXT_PUBLIC_` reference).

### Environment Variables Checklist:

- [ ]  Are new variables added to `.env.example`?
- [ ]  Are production variables configured in Vercel?
- [ ]  Are sensitive variables (`JWT_EMBED_SECRET`, `JWT_SECRET`) securely generated?
- [ ]  Do `NEXT_PUBLIC_` variables actually require client-side access?
- [ ]  **CRITICAL**: Has `NEXT_PUBLIC_JWT_SECRET` been removed from all environments?
- [ ]  Is the JWT fallback hierarchy correctly configured?
- [ ]  Is the Supabase service role key kept server-side only?

---

## 🚀 ProgressPath-Specific Checks

### Feature Modules:

- [ ]  **Books Dashboard**: Reading progress tracking.
- [ ]  **French Learning Dashboard**: Vocabulary, mood, and practice sentences tracking.
- [ ]  **Daily Quotes System**: Cron job generation and database storage.
- [ ]  **Embed Functionality**: JWT generation and verification for external embeds.
- [ ]  **Dark Mode**: Theme toggle consistency across all pages.

### Database Tables:

- [ ]  **books**: Check for schema changes.
- [ ]  **french_learning**: Check `new_vocabulary`, `practice_sentences`, `mood`, `total_time`.
- [ ]  **daily_quotes**: Check `quote`, `author`, `language`, `day_id`.
- [ ]  **user_profiles**: Check synchronization logic.

### Vercel Deployment Checks:

- [ ]  **Cron Jobs**: Verify configuration for `/api/cron/daily-quotes`.
- [ ]  **Environment Variables**: Verify all secrets are set in Vercel.
- [ ]  **Build Limits**: Monitor daily build count (stay under 100).
- [ ]  **Domains**: Verify SSL and domain configuration.

### Security Checks:

- [ ]  **JWT Handling**: Verify `jose` implementation.
- [ ]  **RLS Policies**: Ensure Row Level Security is enabled and correct on Supabase.
- [ ]  **API Protection**: Verify `CRON_SECRET` protects automation endpoints.
- [ ]  **Client Exposure**: Ensure no sensitive data is logged to the client console.
