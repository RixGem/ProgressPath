# Environment Variables Configuration Guide

This guide outlines the required environment variables for the ProgressPath application, specifically focusing on the standardized naming conventions and security requirements for JWT authentication and Supabase integration.

## Core Configuration

### Supabase
Required for database connection and authentication.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### JWT Authentication
Used for verifying embed tokens and secure sessions.
The system uses a hierarchical lookup for the JWT secret. It is recommended to use `JWT_EMBED_SECRET` for specific embed token control, or `JWT_SECRET` as a general secret.

**Priority Order:**
1. `JWT_EMBED_SECRET` (Recommended for Embeds)
2. `JWT_SECRET` (General Purpose)
3. `SUPABASE_SERVICE_ROLE_KEY` (Fallback - Not Recommended for Production JWTs)

```bash
# Recommended
JWT_EMBED_SECRET=your-secure-random-string

# Alternative
JWT_SECRET=your-secure-random-string
```

**Security Note:** 
- Never prefix these secrets with `NEXT_PUBLIC_`. They must remain server-side only.
- `SUPABASE_SERVICE_ROLE_KEY` is used as a fallback but using a dedicated `JWT_EMBED_SECRET` allows for independent rotation of secrets.

## Deployment Checklist (Vercel)

When deploying to Vercel, ensure the following variables are set in the Project Settings:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `JWT_EMBED_SECRET` (or `JWT_SECRET`)

## Variable Descriptions

| Variable | Description | Location |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Client & Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key for client-side requests | Client & Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key for server-side operations (Bypass RLS) | Server Only |
| `JWT_EMBED_SECRET` | Secret key for signing and verifying embed tokens | Server Only |
| `JWT_SECRET` | Alternative secret key for JWTs | Server Only |

## Legacy/Deprecated Variables

The following variables might be found in older configuration files but should be migrated:

- `NEXT_PUBLIC_JWT_SECRET` -> **REMOVE** (Security Risk: Exposes secret to client)
