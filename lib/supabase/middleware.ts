import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { proxyFetch } from "@/lib/supabase/proxy-fetch";

const AUTH_ROUTES = new Set(["/login", "/signup"]);
const PROTECTED_PREFIXES = ["/dashboard"];

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!isSupabaseConfigured()) {
    if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("config", "missing");
      return NextResponse.redirect(url);
    }

    return NextResponse.next({ request });
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: {
        fetch: proxyFetch,
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = AUTH_ROUTES.has(pathname);
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (isAuthRoute || pathname === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}