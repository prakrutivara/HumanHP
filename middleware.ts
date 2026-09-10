import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export const runtime = "nodejs";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!api/health-assistant|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};