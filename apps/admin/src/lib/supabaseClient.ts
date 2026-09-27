import { createBrowserClient as createClient } from '@supabase/ssr';
import type { Database } from '@duebro/shared-types';

export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  return createClient<Database>(supabaseUrl, anonKey);
}
