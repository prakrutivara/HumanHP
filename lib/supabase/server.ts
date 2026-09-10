import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "@/lib/env";
import { proxyFetch } from "@/lib/supabase/proxy-fetch";

export async function createServerSupabaseClient() {
  const { url, publishableKey } = getSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    global: {
      fetch: proxyFetch,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component where cookies cannot be set.
          // Middleware is responsible for refreshing the session.
        }
      },
    },
  });
}