import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

type SolicitudEncuesta = {
  email?: unknown;
  suscriptor?: unknown;
};

const corsHeaders = {
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
};

function texto(value: unknown, maximo: number) {
  return typeof value === "string" ? value.trim().slice(0, maximo) : "";
}

function tokenValido(recibido: string, esperado: string) {
  const recibidoBuffer = Buffer.from(recibido);
  const esperadoBuffer = Buffer.from(esperado);

  return (
    recibidoBuffer.length === esperadoBuffer.length &&
    timingSafeEqual(recibidoBuffer, esperadoBuffer)
  );
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const claveExtension = process.env.ENCUESTA_EXTENSION_KEY;
  const autorizacion = request.headers.get("authorization") || "";
  const token = autorizacion.startsWith("Bearer ")
    ? autorizacion.slice("Bearer ".length).trim()
    : "";

  if (!apiKey || !claveExtension) {
    console.error("Falta configurar RESEND_API_KEY o ENCUESTA_EXTENSION_KEY.");
    return NextResponse.json(
      { error: "El servicio aún no está configurado." },
      { status: 503, headers: corsHeaders },
    );
  }

  if (!token || !tokenValido(token, claveExtension)) {
    return NextResponse.json(
      { error: "Acceso no autorizado." },
      { status: 401, headers: corsHeaders },
    );
  }

  let body: SolicitudEncuesta;

  try {
    body = (await request.json()) as SolicitudEncuesta;
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida." },
      { status: 400, headers: corsHeaders },
    );
  }

  const email = texto(body.email, 254).toLowerCase();
  const suscriptor = texto(body.suscriptor, 20);
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const suscriptorValido = /^\d{5,15}$/.test(suscriptor);

  if (!emailValido || !suscriptorValido) {
    return NextResponse.json(
      { error: "No fue posible validar el suscriptor o el correo." },
      { status: 400, headers: corsHeaders },
    );
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#111827;line-height:1.6">
      <div style="background:#087fb9;color:#fff;padding:24px;border-radius:12px 12px 0 0">
        <h1 style="margin:0;font-size:23px">Tu opinión sobre la visita técnica es importante</h1>
      </div>
      <div style="border:1px solid #dbe3ef;border-top:0;padding:26px;border-radius:0 0 12px 12px">
        <p>Hola:</p>
        <p>Esperamos que la visita realizada por nuestro técnico haya resuelto satisfactoriamente tu requerimiento.</p>
        <p>Durante los próximos días podrías recibir una llamada de DIRECTV para responder una breve encuesta sobre la atención recibida. Esta encuesta evalúa directamente el trabajo realizado por el técnico durante su visita.</p>
        <p>Si quedaste conforme con su puntualidad, disposición, explicación y solución entregada, te invitamos a reflejar esa buena experiencia mediante una evaluación positiva. Tu opinión es muy importante y nos ayuda a reconocer el trabajo bien realizado y a continuar mejorando nuestro servicio.</p>
        <p>Además, cuentas con el respaldo de TSDS. Si necesitas asistencia relacionada con la visita técnica o presentas algún inconveniente posterior, puedes comunicarte con nosotros ingresando a:</p>
        <p style="text-align:center;margin:24px 0">
          <a href="https://tsds.cl" style="display:inline-block;background:#087fb9;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px">Ingresar a tsds.cl</a>
        </p>
        <p>Selecciona “Problemas con mi servicio” y nuestro equipo revisará tu solicitud.</p>
        <p>Muchas gracias por tu tiempo y por confiar en nuestro equipo técnico.</p>
        <p style="margin-bottom:0">Saludos cordiales,<br><strong>Equipo TSDS</strong><br>Soporte técnico autorizado DIRECTV</p>
      </div>
    </div>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "TSDS Soporte <soporte@tsds.cl>",
      to: [email],
      subject: "Tu opinión sobre la visita técnica es importante",
      html,
    }),
  });

  if (!response.ok) {
    console.error("Resend rechazó el correo de encuesta:", response.status);
    return NextResponse.json(
      { error: "No fue posible enviar el correo." },
      { status: 502, headers: corsHeaders },
    );
  }

  return NextResponse.json(
    { ok: true },
    { headers: corsHeaders },
  );
}
