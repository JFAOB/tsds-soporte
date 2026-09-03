import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { validSession, ventaCookieName } from "@/lib/venta-auth";

function fechasChileHoyYAyer() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const mapa = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  const hoy = `${mapa.year}-${mapa.month}-${mapa.day}`;
  const base = new Date(Date.UTC(Number(mapa.year), Number(mapa.month) - 1, Number(mapa.day)));
  base.setUTCDate(base.getUTCDate() - 1);
  const ayer = base.toISOString().slice(0, 10);
  return { hoy, ayer };
}

export async function GET() {
  const cookieStore = await cookies();
  const authenticated = validSession(cookieStore.get(ventaCookieName())?.value);

  if (!authenticated) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Falta configurar la conexión de Supabase en el servidor." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { hoy, ayer } = fechasChileHoyYAyer();
  const { data, error } = await supabase
    .from("postvisita_enviados")
    .select("cliente,fecha_envio")
    .in("fecha_envio", [hoy, ayer]);

  if (error) return NextResponse.json({ error: "No fue posible consultar los clientes enviados." }, { status: 500 });

  const enviados = (data ?? [])
    .map((fila) => ({ cliente: String(fila.cliente ?? "").trim(), fechaVisita: String(fila.fecha_envio ?? "").trim() }))
    .filter((fila) => fila.cliente && fila.fechaVisita);

  return NextResponse.json({ ok: true, hoy, ayer, enviados });
}
