import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

type Estado = "bueno" | "malo";
const etiquetas: Record<string, string> = {
  productividad: "PRODUCTIVIDAD", sin30: "SIN30", tres: "Encuesta 3/3",
  adherencia: "Adherencia GO", funcionamiento: "Funcionamiento correcto",
  plazo: "Satisfacción con el plazo", go: "DIRECTV GO", encuestas: "N.º de encuestas",
};
const principales = ["productividad", "sin30", "tres", "adherencia"];
const detalle = ["funcionamiento", "plazo", "go", "encuestas"];
const paleta = (estado?: Estado) => ({
  fondo: estado === "bueno" ? "#dcfce7" : estado === "malo" ? "#fee2e2" : "#ffffff",
  tinta: estado === "bueno" ? "#166534" : estado === "malo" ? "#991b1b" : "#10243f",
});

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const nombre = String(data.nombre ?? "").slice(0, 120);
    if (!nombre) return new Response("Falta el técnico", { status: 400 });
    const periodo = String(data.periodo ?? "").slice(0, 100);
    const valores = (data.valores ?? {}) as Record<string, string>;
    const estados = (data.estados ?? {}) as Record<string, Estado>;
    const valor = (key: string) => String(valores[key] ?? "Sin datos").slice(0, 90);
    return new ImageResponse(
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#f3f6fb", padding: "8px", fontFamily: "Arial, sans-serif", color: "#10243f" }}>
        {periodo ? <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 37, marginBottom: 8, fontSize: 20, fontWeight: 700, color: "#102c50" }}>{periodo}</div> : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
          {principales.map((key) => {
            const colores = paleta(estados[key]);
            return <div key={key} style={{ display: "flex", flexDirection: "column", width: 268, height: 84, borderRadius: 12, padding: "12px 15px", background: colores.fondo }}>
              <div style={{ fontSize: 13, color: "#667b93" }}>{etiquetas[key]}</div>
              <div style={{ fontSize: valor(key).length > 16 ? 21 : 29, fontWeight: 500, marginTop: 7, color: colores.tinta }}>{valor(key)}</div>
            </div>;
          })}
        </div>
        <div style={{ display: "flex", marginTop: 17, marginBottom: 10, fontSize: 12, fontWeight: 500, color: "#274765" }}>PRODUCTIVIDAD = MAIN + MIRROR + ADDITIONAL + AT</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {detalle.map((key) => {
            const colores = paleta(estados[key]);
            return <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 42, padding: "0 13px", background: colores.fondo, borderRadius: 8 }}>
              <div style={{ fontSize: 14 }}>{etiquetas[key]}</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: colores.tinta }}>{valor(key)}</div>
            </div>;
          })}
        </div>
      </div>,
      { width: 570, height: periodo ? 453 : 408 }
    );
  } catch {
    return new Response("No se pudo generar la imagen", { status: 500 });
  }
}
