import { NextResponse } from "next/server";
import {
  configuredPassword,
  sessionToken,
  ventaCookieName,
} from "@/lib/venta-auth";

export async function POST(request: Request) {
  const { clave } = (await request.json()) as { clave?: string };
  const password = configuredPassword();

  if (!password) {
    return NextResponse.json(
      { error: "La clave de acceso aún no está configurada." },
      { status: 503 },
    );
  }

  if (!clave || clave !== password) {
    return NextResponse.json({ error: "Clave incorrecta." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ventaCookieName(), sessionToken(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return response;
}
