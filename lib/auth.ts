import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Extracts and verifies the authenticated user ID from the request.
 * Supports:
 * 1. X-User-Id header (set by middleware for secure embeds)
 * 2. Authorization: Bearer <token> header (standard API calls)
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<string | null> {
  // 1. Check header set by middleware (for embeds)
  const mwUserId = request.headers.get('X-User-Id');
  if (mwUserId) {
    return mwUserId;
  }

  // 2. Check Auth header (Bearer token)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    // Create a temporary client to verify the token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
      return user.id;
    }
  }

  return null;
}
