import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { validSession, ventaCookieName } from "@/lib/venta-auth";

function fechaChileHoy() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const mapa = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${mapa.year}-${mapa.month}-${mapa.day}`;
}

export async function GET() {
  const cookieStore = await cookies();
  const authenticated = validSession(cookieStore.get(ventaCookieName())?.value);

  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Falta configurar la conexión de Supabase en el servidor." },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const fecha = fechaChileHoy();
  const { data, error } = await supabase
    .from("postvisita_enviados")
    .select("cliente")
    .eq("fecha_envio", fecha);

  if (error) {
    return NextResponse.json({ error: "No fue posible consultar los clientes enviados hoy." }, { status: 500 });
  }

  const clientes = Array.from(
    new Set((data ?? []).map((fila) => String(fila.cliente ?? "").trim()).filter(Boolean)),
  );

  return NextResponse.json({ ok: true, fecha, clientes });
}
