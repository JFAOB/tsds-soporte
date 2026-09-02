import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { validSession, ventaCookieName } from "@/lib/venta-auth";

type SolicitudPrueba = {
  email?: unknown;
  cliente?: unknown;
};

function texto(value: unknown, maximo: number) {
  return typeof value === "string" ? value.trim().slice(0, maximo) : "";
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const autenticado = validSession(cookieStore.get(ventaCookieName())?.value);

  if (!autenticado) {
    return NextResponse.json({ error: "Sesión no autorizada." }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Falta configurar RESEND_API_KEY.");
    return NextResponse.json({ error: "El servicio de correo no está configurado." }, { status: 503 });
  }

  let body: SolicitudPrueba;
  try {
    body = (await request.json()) as SolicitudPrueba;
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const email = texto(body.email, 254).toLowerCase();
  const cliente = texto(body.cliente, 30);
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!emailValido || !cliente) {
    return NextResponse.json({ error: "No fue posible validar el cliente o el correo." }, { status: 400 });
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#334155;line-height:1.65">
      <div style="background:#0b69a3;color:#fff;padding:24px;border-radius:14px 14px 0 0">
        <div style="font-size:12px;font-weight:bold;letter-spacing:.12em;text-transform:uppercase;opacity:.9">TSDS · Agente Autorizado de DIRECTV</div>
        <h1 style="margin:6px 0 0;font-size:23px">Tu visita técnica ha finalizado</h1>
      </div>
      <div style="border:1px solid #dbe3ef;border-top:0;padding:26px;border-radius:0 0 14px 14px">
        <p>Hola:</p>
        <p>Te informamos que la visita técnica de <strong>DIRECTV</strong> realizada en tu domicilio ha sido finalizada correctamente.</p>
        <p>TSDS es <strong>Agente Autorizado de DIRECTV</strong> y queremos seguir acompañándote después de la atención realizada.</p>

        <h2 style="font-size:17px;color:#0f172a;margin:26px 0 8px">📞 Es posible que te llamen para evaluar la atención</h2>
        <p>Durante las próximas 48 horas podrías recibir una llamada para conocer tu experiencia con la visita técnica.</p>
        <p>Al momento de evaluar, te invitamos a considerar especialmente la atención, disposición y trabajo realizado por el técnico que te visitó.</p>
        <p>En algunas ocasiones pueden existir inconvenientes relacionados con sistemas, plataformas o condiciones externas que no dependen directamente del técnico. Si ese fue tu caso, te agradecemos considerar esta diferencia al momento de responder la evaluación.</p>

        <h2 style="font-size:17px;color:#0f172a;margin:26px 0 8px">🛡️ Tienes 30 días de soporte TSDS</h2>
        <p>Queremos seguir acompañándote después de la visita.</p>
        <p>Si durante los próximos 30 días presentas algún inconveniente relacionado con tu servicio de televisión o internet, cuentas con nuestro canal de soporte TSDS.</p>
        <p>Antes de solicitar una nueva visita técnica, ingresa a:</p>
        <p style="text-align:center;margin:22px 0">
          <a href="https://www.tsds.cl" style="display:inline-block;background:#0b69a3;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:9px">Ingresar a www.tsds.cl</a>
        </p>
        <p>Selecciona “PROBLEMAS CON MI SERVICIO” y cuéntanos qué ocurre. Nuestro equipo revisará tu caso e intentará ayudarte lo antes posible.</p>
        <p>Este canal está disponible para entregarte una atención más rápida ante inconvenientes posteriores a tu visita.</p>
        <p>Gracias por tu tiempo y por confiar en nuestro equipo.</p>
        <p style="margin:24px 0 0;color:#0f172a"><strong>Equipo TSDS</strong><br>Agente Autorizado de DIRECTV<br>Soporte post visita técnica<br>www.tsds.cl</p>
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
      subject: "DIRECTV · Tu visita técnica ha finalizado – Soporte TSDS",
      html,
    }),
  });

  if (!response.ok) {
    console.error("Resend rechazó la prueba post visita:", response.status, await response.text());
    return NextResponse.json({ error: "No fue posible enviar el correo de prueba." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, email, cliente });
}
