import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "./infra/auth/session";
import { getEnv } from "./lib/env";

/**
 * Next.js 16 Proxy convention (renombrado desde middleware).
 * Protege todas las rutas de /admin salvo /admin/login y asegura cabecera X-Robots-Tag: noindex, nofollow (BR-08, BR-25, BR-37).
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Solo aplica a rutas bajo /admin
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Prevenir indexación de todo el backoffice (BR-25, backoffice.md)
  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");

  const token = req.cookies.get("aura_admin_token")?.value;
  const env = getEnv();

  const isAuth = token
    ? (await verifySessionToken(token, env.SESSION_SECRET)).valid
    : false;

  const isPublicAuthRoute =
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/recuperar") ||
    pathname.startsWith("/admin/restablecer");

  // Si intenta ir a login o recuperación estando ya autenticada, redirigir al panel principal
  if (isPublicAuthRoute) {
    if (isAuth && pathname === "/admin/login") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return response;
  }

  // Si intenta acceder a cualquier pantalla de administración sin estar autenticada
  if (!isAuth) {
    const loginUrl = new URL("/admin/login", req.url);
    const redirectResponse = NextResponse.redirect(loginUrl);
    redirectResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
