import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Ejecuta el Proxy en las páginas de la aplicación, pero no en:
     * - Archivos internos de Next.js.
     * - Optimización de imágenes.
     * - favicon.
     * - Archivos estáticos habituales.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};