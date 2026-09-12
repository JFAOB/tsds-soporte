import { NextResponse } from "next/server";

type SolicitudSoporte = {
  nombre?: unknown;
  rut?: unknown;
  comuna?: unknown;
  telefono?: unknown;
  problema?: unknown;
  comentarios?: unknown;
  empresa?: unknown;
};

const problemasPermitidos = new Set([
  "Sin servicio de Internet",
  "Sin servicio de Televisión",
]);

function texto(value: unknown, maximo: number) {
  return typeof value === "string" ? value.trim().slice(0, maximo) : "";
}

function escaparHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function rutChilenoValido(value: string) {
  const rut = value.replace(/[^0-9kK]/g, "").toUpperCase();

  if (!/^\d{7,8}[0-9K]$/.test(rut)) {
    return false;
  }

  const cuerpo = rut.slice(0, -1);
  const digitoVerificador = rut.slice(-1);
  let suma = 0;
  let multiplicador = 2;

  for (let indice = cuerpo.length - 1; indice >= 0; indice -= 1) {
    suma += Number(cuerpo[indice]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resultado = 11 - (suma % 11);
  const esperado = resultado === 11 ? "0" : resultado === 10 ? "K" : String(resultado);

  return digitoVerificador === esperado;
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const destinatario = process.env.SOPORTE_DESTINATARIO;

  if (!apiKey || !destinatario) {
    console.error("Falta configurar RESEND_API_KEY o SOPORTE_DESTINATARIO.");
    return NextResponse.json(
      { error: "El servicio de correo aún no está configurado." },
      { status: 503 },
    );
  }

  let body: SolicitudSoporte;

  try {
    body = (await request.json()) as SolicitudSoporte;
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  // Campo invisible: los robots suelen completarlo, las personas no.
  if (texto(body.empresa, 100)) {
    return NextResponse.json({ ok: true });
  }

  const nombre = texto(body.nombre, 120);
  const rut = texto(body.rut, 20);
  const comuna = texto(body.comuna, 100);
  const telefono = texto(body.telefono, 30).replace(/\D/g, "");
  const problema = texto(body.problema, 100);
  const comentarios = texto(body.comentarios, 1000);

  if (!nombre || !comuna || !problema) {
    return NextResponse.json(
      { error: "Complete correctamente todos los campos." },
      { status: 400 },
    );
  }

  if (!rutChilenoValido(rut)) {
    return NextResponse.json(
      { error: "El RUT ingresado no es válido." },
      { status: 400 },
    );
  }

  if (!/^\d{7,15}$/.test(telefono)) {
    return NextResponse.json(
      { error: "El teléfono debe contener solamente números." },
      { status: 400 },
    );
  }

  if (!problemasPermitidos.has(problema)) {
    return NextResponse.json(
      { error: "Seleccione un problema válido." },
      { status: 400 },
    );
  }

  const filas = [
    ["Nombre del titular", nombre],
    ["RUT del titular", rut],
    ["Comuna", comuna],
    ["Teléfono", telefono],
    ["Problemática", problema],
    ["Comentarios", comentarios || "Sin comentarios"],
  ];

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#111827">
      <div style="background:#1d4ed8;color:white;padding:24px;border-radius:12px 12px 0 0">
        <h1 style="margin:0;font-size:24px">Nueva solicitud de soporte TSDS</h1>
      </div>
      <div style="border:1px solid #dbe3ef;border-top:0;padding:24px;border-radius:0 0 12px 12px">
        ${filas
          .map(
            ([etiqueta, valor]) => `
              <p style="margin:0 0 16px">
                <strong>${etiqueta}:</strong><br><span style="white-space:pre-wrap">${escaparHtml(valor)}</span>
              </p>`,
          )
          .join("")}
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
      to: [destinatario],
      subject: `Solicitud de soporte: ${problema} - ${comuna}`,
      html,
    }),
  });

  if (!response.ok) {
    console.error("Resend rechazó el correo:", await response.text());
    return NextResponse.json(
      { error: "No fue posible enviar la solicitud." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
