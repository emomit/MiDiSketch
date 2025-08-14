import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (typeof window === 'undefined') {
    const thrower = () => { throw new Error('Supabase client unavailable during SSR/build. Provide env at runtime.'); };
    return {
      from: thrower as unknown as SupabaseClient['from'],
      auth: { getUser: thrower, onAuthStateChange: thrower } as unknown as SupabaseClient['auth'],
    } as SupabaseClient;
  }

  if (!url || !anonKey) {
    // Fallback: return a minimal mock client so the app can run without Supabase
    const mockClient = {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onAuthStateChange: (_cb: unknown) => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      from: (_table: string) => ({
        select: () => Promise.resolve({ data: [], error: null }),
      }),
    } as unknown as SupabaseClient;
    cachedClient = mockClient;
    return cachedClient;
  }

  cachedClient = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return cachedClient;
};

