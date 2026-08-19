import { NextResponse } from "next/server";
import { ventaCookieName } from "@/lib/venta-auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/ingresoventa", request.url));
  response.cookies.set(ventaCookieName(), "", { maxAge: 0, path: "/" });
  return response;
}
