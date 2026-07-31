import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

function markPrivate(response: NextResponse): NextResponse {
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate, max-age=0",
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

function redirectWithAuthState(
  request: NextRequest,
  pathname: string,
  authResponse: NextResponse,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  const response = NextResponse.redirect(url);

  authResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  authResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") {
      response.headers.set(key, value);
    }
  });

  return markPrivate(response);
}

export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  const isLoginRoute = request.nextUrl.pathname === "/admin/login";
  const config = getSupabasePublicConfig();

  let supabaseResponse = markPrivate(NextResponse.next({ request }));

  if (!config) {
    return isLoginRoute
      ? supabaseResponse
      : redirectWithAuthState(request, "/admin/login", supabaseResponse);
  }

  const supabase = createServerClient<Database>(
    config.url,
    config.publishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });

          markPrivate(supabaseResponse);
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();
  const hasVerifiedIdentity = !error && typeof data?.claims.sub === "string";

  if (!isLoginRoute && !hasVerifiedIdentity) {
    return redirectWithAuthState(request, "/admin/login", supabaseResponse);
  }

  return markPrivate(supabaseResponse);
}
