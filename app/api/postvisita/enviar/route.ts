import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validSession, ventaCookieName } from "@/lib/venta-auth";

type Destinatario = { email?: unknown; cliente?: unknown };
type Solicitud = { destinatarios?: unknown };

function texto(value: unknown, maximo: number) {
  return typeof value === "string" ? value.trim().slice(0, maximo) : "";
}

function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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

function htmlCorreo(cliente: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#334155;line-height:1.65"><div style="background:#087fb9;color:#fff;padding:24px;border-radius:12px 12px 0 0"><div style="font-size:12px;font-weight:bold;letter-spacing:2px">TSDS · AGENTE AUTORIZADO DE DIRECTV</div><h1 style="margin:6px 0 0;font-size:23px">Tu visita técnica ha finalizado</h1></div><div style="border:1px solid #dbe3ef;border-top:0;padding:26px;border-radius:0 0 12px 12px"><p>Hola:</p><p>Te informamos que la visita técnica de <strong>DIRECTV</strong> realizada en tu domicilio ha sido finalizada correctamente.</p><p>TSDS es <strong>Agente Autorizado de DIRECTV</strong> y queremos seguir acompañándote después de la atención realizada.</p><h3 style="color:#0f172a;margin-top:24px">📞 Es posible que te llamen para evaluar la atención</h3><p>Durante las próximas 48 horas podrías recibir una llamada para conocer tu experiencia con la visita técnica.</p><p>Al momento de evaluar, te invitamos a considerar especialmente la atención, disposición y trabajo realizado por el técnico que te visitó.</p><p>En algunas ocasiones pueden existir inconvenientes relacionados con sistemas, plataformas o condiciones externas que no dependen directamente del técnico. Si ese fue tu caso, te agradecemos considerar esta diferencia al momento de responder la evaluación.</p><h3 style="color:#0f172a;margin-top:24px">🛡️ Tienes 30 días de soporte TSDS</h3><p>Queremos seguir acompañándote después de la visita.</p><p>Si durante los próximos 30 días presentas algún inconveniente relacionado con tu servicio de televisión o internet, cuentas con nuestro canal de soporte TSDS.</p><p>Antes de solicitar una nueva visita técnica, ingresa a:</p><p style="text-align:center;margin:22px 0"><a href="https://tsds.cl" style="display:inline-block;background:#087fb9;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px">Ingresar a www.tsds.cl</a></p><p>Selecciona <strong>“PROBLEMAS CON MI SERVICIO”</strong> y cuéntanos qué ocurre. Nuestro equipo revisará tu caso e intentará ayudarte lo antes posible.</p><p>Este canal está disponible para entregarte una atención más rápida ante inconvenientes posteriores a tu visita.</p><p>Gracias por tu tiempo y por confiar en nuestro equipo.</p><p style="margin-bottom:0"><strong>Equipo TSDS</strong><br>Agente Autorizado de DIRECTV<br>Soporte post visita técnica<br>www.tsds.cl</p><div style="margin-top:20px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8">Referencia de atención: ${cliente}</div></div></div>`;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!validSession(cookieStore.get(ventaCookieName())?.value)) return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });

  const apiKey = process.env.RESEND_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey) return NextResponse.json({ error: "El servicio de correo no está configurado." }, { status: 503 });
  if (!supabaseUrl || !serviceRoleKey) return NextResponse.json({ error: "Supabase no está configurado para POST VISITA." }, { status: 503 });

  let body: Solicitud;
  try { body = (await request.json()) as Solicitud; } catch { return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 }); }
  if (!Array.isArray(body.destinatarios)) return NextResponse.json({ error: "No se recibieron destinatarios." }, { status: 400 });
  if (body.destinatarios.length < 1 || body.destinatarios.length > 100) return NextResponse.json({ error: "El envío debe contener entre 1 y 100 destinatarios." }, { status: 400 });

  const vistos = new Set<string>();
  const destinatarios = (body.destinatarios as Destinatario[]).map((item) => ({ email: texto(item.email, 254).toLowerCase(), cliente: texto(item.cliente, 20) }));
  for (const item of destinatarios) {
    if (!emailValido(item.email) || !/^\d{5,15}$/.test(item.cliente)) return NextResponse.json({ error: "Hay un cliente o correo inválido." }, { status: 400 });
    if (vistos.has(item.cliente)) return NextResponse.json({ error: `El cliente ${item.cliente} está repetido en el lote.` }, { status: 400 });
    vistos.add(item.cliente);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const fecha = fechaChileHoy();
  const { data: yaEnviados, error: errorConsulta } = await supabase
    .from("postvisita_enviados")
    .select("cliente")
    .eq("fecha_envio", fecha)
    .in("cliente", destinatarios.map((item) => item.cliente));

  if (errorConsulta) return NextResponse.json({ error: "No fue posible verificar los envíos anteriores." }, { status: 500 });
  if ((yaEnviados ?? []).length > 0) return NextResponse.json({ error: "Uno o más clientes ya recibieron el correo post visita hoy. Recarga el archivo para actualizar la lista." }, { status: 409 });

  const correos = destinatarios.map((item) => ({ from: "TSDS Soporte <soporte@tsds.cl>", to: [item.email], subject: "DIRECTV · Tu visita técnica ha finalizado – Soporte TSDS", html: htmlCorreo(item.cliente) }));
  const response = await fetch("https://api.resend.com/emails/batch", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(correos) });
  if (!response.ok) {
    const detalle = await response.text().catch(() => "");
    console.error("Resend rechazó lote post visita:", response.status, detalle.slice(0, 500));
    return NextResponse.json({ error: "No fue posible enviar el lote de correos." }, { status: 502 });
  }

  const { error: errorRegistro } = await supabase.from("postvisita_enviados").insert(
    destinatarios.map((item) => ({ cliente: item.cliente, fecha_envio: fecha })),
  );

  if (errorRegistro) {
    console.error("Correos enviados pero no se pudo registrar POST VISITA:", errorRegistro.message);
    return NextResponse.json({ error: "Los correos fueron enviados, pero no fue posible registrar los clientes. No repitas el envío y revisa Supabase." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, enviados: destinatarios.length });
}
