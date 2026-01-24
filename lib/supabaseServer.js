/**
 * Server-side Supabase client with Service Role Key
 * This client bypasses RLS for server-side operations
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

/**
 * Create a Supabase client with service role key (bypasses RLS)
 * Only use this for server-side operations!
 */
export function createServerSupabaseClient() {
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('[SERVER] Missing Supabase URL or Service Role Key');
        console.error('[SERVER] SUPABASE_URL:', !!supabaseUrl);
        console.error('[SERVER] SERVICE_KEY:', !!supabaseServiceKey);
        return null;
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}

// Export a singleton instance for convenience
export const supabaseServer = createServerSupabaseClient();
