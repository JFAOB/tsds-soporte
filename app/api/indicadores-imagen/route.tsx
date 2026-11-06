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
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#f3f6fb", padding: 30, fontFamily: "Arial, sans-serif", color: "#10243f" }}>
        <div style={{ display: "flex", flexDirection: "column", background: "#102c50", color: "#ffffff", borderRadius: 22, padding: "32px", height: 235 }}>
          <div style={{ fontSize: 27, fontWeight: 700 }}>TSDS | DIRECTV</div>
          <div style={{ fontSize: 20, color: "#bed1e8", marginTop: 6 }}>INDICADORES TÉCNICOS</div>
          <div style={{ fontSize: nombre.length > 32 ? 28 : 39, fontWeight: 700, marginTop: 27 }}>{nombre}</div>
          <div style={{ fontSize: 22, color: "#d0e1f1", marginTop: 12 }}>{periodo ? `Período: ${periodo}` : "Ficha individual de desempeño"}</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 22 }}>
          {principales.map((key) => {
            const colores = paleta(estados[key]);
            return <div key={key} style={{ display: "flex", flexDirection: "column", width: 423, height: 132, borderRadius: 16, padding: "20px 23px", background: colores.fondo }}>
              <div style={{ fontSize: 21, color: "#667b93" }}>{etiquetas[key]}</div>
              <div style={{ fontSize: valor(key).length > 16 ? 28 : 45, fontWeight: 700, marginTop: 13, color: colores.tinta }}>{valor(key)}</div>
            </div>;
          })}
        </div>
        <div style={{ display: "flex", marginTop: 28, marginBottom: 15, fontSize: 19, fontWeight: 700, color: "#274765" }}>PRODUCTIVIDAD = MAIN + MIRROR + ADDITIONAL + AT</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {detalle.map((key) => {
            const colores = paleta(estados[key]);
            return <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, padding: "0 20px", background: colores.fondo, borderRadius: 9 }}>
              <div style={{ fontSize: 22 }}>{etiquetas[key]}</div>
              <div style={{ fontSize: 25, fontWeight: 700, color: colores.tinta }}>{valor(key)}</div>
            </div>;
          })}
        </div>
        <div style={{ display: "flex", marginTop: "auto", fontSize: 17, color: "#7890a9" }}>TSDS · Informe de desempeño técnico</div>
      </div>,
      { width: 920, height: 1050 }
    );
  } catch {
    return new Response("No se pudo generar la imagen", { status: 500 });
  }
}
