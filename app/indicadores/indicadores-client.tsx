"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { read, utils } from "xlsx";

type Fila = Record<string, unknown>;
type Tecnico = { nombre: string; indicadores: Record<string, string> };

const CAMPOS = [
  { key: "main", label: "Main", aliases: ["Main"], pct: false },
  { key: "mirror", label: "Mirror to GA", aliases: ["Mirror to GA"], pct: false },
  { key: "additional", label: "Additional", aliases: ["Additional"], pct: false },
  { key: "at", label: "AT", aliases: ["AT"], pct: false },
  { key: "sin30", label: "SIN FW < 30 Días", aliases: ["SIN FW < 30 Dias", "SIN FW < 30 Días"], pct: true },
  { key: "funcionamiento", label: "Funcionamiento correcto", aliases: ["% Funcionamiento Correcto"], pct: true },
  { key: "plazo", label: "Satisfacción con el plazo", aliases: ["% Satisfacción con el Plazo"], pct: true },
  { key: "tres", label: "Encuesta 3/3", aliases: ["% 3 / 3", "% 3/3"], pct: true },
  { key: "go", label: "DIRECTV GO", aliases: ["% DIRECTV GO"], pct: true },
  { key: "encuestas", label: "N.º de encuestas", aliases: ["N° Encuestas", "Nº Encuestas"], pct: false },
  { key: "adherencia", label: "Adherencia GO", aliases: ["Adherencia GO"], pct: true },
] as const;

const normalizar = (texto: string) =>
  texto.replace(/&(?:#x([0-9a-f]+)|#(\d+)|nbsp);/gi, (_m, hex: string, dec: string) =>
    String.fromCodePoint(parseInt(hex || dec, hex ? 16 : 10))
  ).replace(/\u00a0/g, " ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

function leerCampo(row: Fila, nombres: readonly string[]) {
  const entry = Object.entries(row).find(([key]) => nombres.some((nombre) => normalizar(key) === normalizar(nombre)));
  return entry ? limpiar(entry[1]) : "";
}

function limpiar(valor: unknown) {
  const texto = String(valor ?? "").replace(/\u00a0/g, " ").replace(/&#xA0;/gi, " ").trim();
  return texto === "-" || texto === "—" ? "" : texto;
}

function porcentaje(valor: string) {
  if (!valor) return "Sin datos";
  if (valor.includes("%")) return valor;
  const n = Number(valor.replace(",", "."));
  if (!Number.isFinite(n)) return valor;
  return `${n <= 1 ? n * 100 : n}%`;
}

function transformar(filas: Fila[]) {
  return filas.map((fila) => {
    const nombre = leerCampo(fila, ["NOMBRE_TECNICO", "Nombre Técnico", "Nombre Tecnico", "Tecnico"]);
    return { nombre, indicadores: Object.fromEntries(CAMPOS.map((campo) => [campo.key, leerCampo(fila, campo.aliases)])) };
  }).filter((tecnico) => tecnico.nombre && !normalizar(tecnico.nombre).includes("total")) as Tecnico[];
}

function csvTexto(texto: string): Fila[] {
  const lineas = texto.replace(/^\uFEFF/, "").trim().split(/\r?\n/).filter(Boolean);
  if (!lineas.length) return [];
  const separador = ["\t", ";", ","].sort((a, b) => (lineas[0].split(b).length - lineas[0].split(a).length))[0];
  const registros = lineas.map((linea) => {
    const celdas: string[] = [];
    let celda = ""; let comillas = false;
    for (let i = 0; i < linea.length; i++) {
      if (linea[i] === '"') {
        if (comillas && linea[i + 1] === '"') { celda += '"'; i++; } else comillas = !comillas;
      } else if (linea[i] === separador && !comillas) { celdas.push(celda); celda = ""; }
      else celda += linea[i];
    }
    celdas.push(celda);
    return celdas;
  });
  const cabeceras = registros.shift() ?? [];
  return registros.map((registro) => Object.fromEntries(cabeceras.map((c, index) => [c.trim(), registro[index] ?? ""])));
}

function tablaMarkdown(texto: string): Fila[] {
  const lineas = texto.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.startsWith("|") && l.endsWith("|"));
  if (lineas.length < 3) return [];
  const celdas = (l: string) => l.slice(1, -1).split("|").map((s) => s.replace(/\*\*/g, "").replace(/&#xA0;/gi, " ").trim());
  const cabeceras = celdas(lineas[0]);
  return lineas.slice(1).filter((l) => !/^\|[\s:|\-]+\|$/.test(l)).map((l) => {
    const valores = celdas(l);
    return Object.fromEntries(cabeceras.map((c, i) => [c, valores[i] ?? ""]));
  });
}

function productividad(tecnico: Tecnico) {
  const keys = ["main", "mirror", "additional", "at"];
  const valores = keys.map((key) => tecnico.indicadores[key]?.trim() ?? "");
  if (valores.every((valor) => !valor)) return "Sin datos";
  const numeros = valores.map((valor) => valor ? Number(valor.replace(",", ".")) : 0);
  if (numeros.some((numero) => !Number.isFinite(numero))) return "Sin datos";
  return String(numeros.reduce((total, numero) => total + numero, 0));
}

const mostrar = (tecnico: Tecnico, key: string) => {
  if (key === "productividad") return productividad(tecnico);
  const campo = CAMPOS.find((c) => c.key === key);
  const valor = tecnico.indicadores[key] || "";
  return campo?.pct ? porcentaje(valor) : (valor || "Sin datos");
};

function crearCanvas(tecnico: Tecnico, periodo: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 920; canvas.height = 1190;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear la imagen");
  const round = (x: number, y: number, w: number, h: number, r: number, color: string) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  };
  const txt = (texto: string, x: number, y: number, size = 27, weight = 500, color = "#10243f") => {
    ctx.fillStyle = color; ctx.font = `${weight} ${size}px Arial, sans-serif`; ctx.fillText(texto, x, y);
  };
  const encajar = (texto: string, max: number, size: number, weight: number) => {
    ctx.font = `${weight} ${size}px Arial`;
    while (size > 21 && ctx.measureText(texto).width > max) { size--; ctx.font = `${weight} ${size}px Arial`; }
    return size;
  };
  round(0, 0, 920, 1190, 0, "#f3f6fb");
  round(30, 30, 860, 295, 22, "#102c50");
  txt("TSDS  |  DIRECTV", 62, 85, 27, 700, "#ffffff");
  txt("INDICADORES TÉCNICOS", 62, 121, 20, 600, "#bed1e8");
  txt(tecnico.nombre, 62, 195, encajar(tecnico.nombre, 782, 41, 700), 700, "#ffffff");
  txt(periodo ? `Período: ${periodo}` : "Ficha individual de desempeño", 62, 243, 23, 400, "#d0e1f1");
  const kpis = [["PRODUCTIVIDAD", mostrar(tecnico, "productividad")], ["SIN30", mostrar(tecnico, "sin30")], ["Encuesta 3/3", mostrar(tecnico, "tres")], ["Adherencia GO", mostrar(tecnico, "adherencia")]];
  kpis.forEach(([label, value], i) => {
    const x = 30 + (i % 2) * 438; const y = 348 + Math.floor(i / 2) * 151;
    round(x, y, 422, 135, 17, "#ffffff");
    txt(label, x + 23, y + 40, 23, 500, "#667b93");
    txt(value, x + 23, y + 99, encajar(value, 370, 49, 700), 700);
  });
  txt("PRODUCTIVIDAD = MAIN + MIRROR + ADDITIONAL + AT", 40, 695, 21, 700, "#274765");
  const detalle = ["funcionamiento", "plazo", "go", "encuestas"];
  detalle.forEach((key, i) => {
    const y = 880 + i * 63;
    round(30, y - 36, 860, 57, 8, i % 2 ? "#e8eef6" : "#ffffff");
    txt(CAMPOS.find((c) => c.key === key)?.label || key, 48, y, 23);
    const valor = mostrar(tecnico, key);
    ctx.font = "700 25px Arial"; txt(valor, 869 - ctx.measureText(valor).width, y, 25, 700);
  });
  txt("TSDS · Informe de desempeño técnico", 40, 1165, 17, 500, "#7890a9");
  return canvas;
}

export default function IndicadoresClient() {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [indice, setIndice] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [pegado, setPegado] = useState("");
  const [mensaje, setMensaje] = useState("");
  const archivoRef = useRef<HTMLInputElement>(null);
  const elegido = tecnicos[indice];
  const encontrados = useMemo(() => tecnicos.map((t, i) => ({ ...t, i })).filter((t) => normalizar(t.nombre).includes(normalizar(busqueda))), [tecnicos, busqueda]);

  const importar = (filas: Fila[]) => {
    const lista = transformar(filas);
    setTecnicos(lista); setIndice(0); setBusqueda("");
    setMensaje(lista.length ? `Se cargaron ${lista.length} técnicos.` : "No se detectaron técnicos. Verifica los encabezados.");
  };
  const archivo = async (file?: File) => {
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      if (/\.csv$/i.test(file.name)) {
        const bytes = new Uint8Array(buffer);
        const contenido = bytes[0] === 255 && bytes[1] === 254 ? new TextDecoder("utf-16le").decode(bytes) : new TextDecoder("utf-8").decode(bytes);
        importar(csvTexto(contenido));
      } else {
        const libro = read(buffer, { type: "array" });
        const hoja = libro.Sheets[libro.SheetNames[0]];
        importar(utils.sheet_to_json<Fila>(hoja, { defval: "", raw: false }));
      }
    } catch { setMensaje("No se pudo leer el archivo."); }
  };
  const imagenBlob = async () => {
    if (!elegido) throw new Error("Selecciona un técnico");
    const canvas = crearCanvas(elegido, periodo);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No se pudo generar PNG")), "image/png"));
  };
  const copiar = async () => {
    try {
      const blob = await imagenBlob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setMensaje("Imagen copiada. Puedes pegarla en WhatsApp.");
    } catch { setMensaje("El navegador no permitió copiar. Prueba Descargar PNG en una conexión HTTPS."); }
  };
  const descargar = async () => {
    try {
      const blob = await imagenBlob(); const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `TSDS-${elegido.nombre.replace(/[^\p{L}\p{N}]+/gu, "-")}.png`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setMensaje("No se pudo descargar la imagen."); }
  };
  const editar = (key: string, value: string) => setTecnicos((actual) => actual.map((t, i) => i === indice ? { ...t, indicadores: { ...t.indicadores, [key]: value } } : t));

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-7 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex items-center justify-between gap-4 rounded-2xl bg-[#102c50] px-5 py-4 text-white">
          <div className="flex items-center gap-3"><Image src="/logo-tsds-white.png" alt="TSDS" width={86} height={45} className="h-auto max-h-12 w-auto" /><div><h1 className="text-xl font-bold">Indicadores Técnicos</h1><p className="text-xs text-slate-200">Generador de fichas individuales</p></div></div>
          <Link href="/" className="rounded-lg border border-white/40 px-3 py-2 text-sm">Inicio</Link>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">1. Cargar indicadores</h2>
              <input ref={archivoRef} className="hidden" type="file" accept=".xlsx,.xls,.csv" onChange={(e) => void archivo(e.target.files?.[0])} />
              <button onClick={() => archivoRef.current?.click()} className="w-full rounded-xl bg-[#123960] px-4 py-3 font-semibold text-white">Importar Excel o CSV</button>
              <p className="my-3 text-center text-xs text-slate-500">o pega la tabla copiada desde Excel (también admite tabla Markdown)</p>
              <textarea value={pegado} onChange={(e) => setPegado(e.target.value)} rows={5} placeholder="Pega aquí la tabla con NOMBRE_TECNICO, SIN FW < 30 Dias, % 3 / 3..." className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-blue-500" />
              <button onClick={() => importar(pegado.trim().startsWith("|") ? tablaMarkdown(pegado) : csvTexto(pegado))} className="mt-2 w-full rounded-xl border border-[#123960] px-4 py-2 font-semibold text-[#123960]">Procesar tabla pegada</button>
              <label className="mt-4 block text-sm font-semibold">Período del informe (opcional)<input value={periodo} onChange={(e) => setPeriodo(e.target.value)} placeholder="Ej. Noviembre 2026" className="mt-1 w-full rounded-lg border border-slate-300 p-2 font-normal" /></label>
            </div>
            {tecnicos.length > 0 && <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">2. Seleccionar técnico <span className="text-sm font-normal text-slate-500">({tecnicos.length} cargados)</span></h2>
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre" className="my-3 w-full rounded-xl border border-slate-300 p-3" />
              <div className="max-h-52 space-y-1 overflow-y-auto">{encontrados.map((t) => <button key={t.i} onClick={() => setIndice(t.i)} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${indice === t.i ? "bg-blue-100 font-bold text-blue-900" : "hover:bg-slate-100"}`}>{t.nombre}</button>)}</div>
              <h3 className="mt-4 font-semibold">Editar valores</h3>
              <div className="mt-2 grid grid-cols-2 gap-2">{CAMPOS.map((campo) => <label key={campo.key} className="text-xs text-slate-600">{campo.label}<input value={elegido?.indicadores[campo.key] ?? ""} onChange={(e) => editar(campo.key, e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900" /></label>)}</div>
            </div>}
          </section>
          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">3. Vista previa individual</h2>
              {elegido ? <div className="overflow-hidden rounded-xl bg-slate-100 p-3">
                <div className="rounded-xl bg-[#102c50] p-5 text-white"><div className="text-sm font-bold">TSDS | DIRECTV</div><div className="mt-1 text-xs text-blue-100">INDICADORES TÉCNICOS</div><div className="mt-6 text-xl font-bold">{elegido.nombre}</div><div className="mt-1 text-xs text-blue-100">{periodo || "Ficha individual de desempeño"}</div></div>
                <div className="mt-3 grid grid-cols-2 gap-2">{[["PRODUCTIVIDAD","productividad"],["SIN30","sin30"],["Encuesta 3/3","tres"],["Adherencia GO","adherencia"]].map(([label, key]) => <div key={key} className="rounded-xl bg-white p-3"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 text-2xl font-bold">{mostrar(elegido, key)}</div></div>)}</div>
                <div className="mt-3 space-y-1">{["funcionamiento","plazo","go","encuestas"].map((key) => <div key={key} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm"><span>{CAMPOS.find((c) => c.key === key)?.label}</span><strong>{mostrar(elegido, key)}</strong></div>)}</div>
              </div> : <div className="rounded-xl bg-slate-100 p-12 text-center text-slate-500">Carga una tabla para visualizar la ficha del técnico.</div>}
              <div className="mt-4 grid grid-cols-2 gap-2"><button disabled={!elegido} onClick={() => void copiar()} className="rounded-xl bg-[#123960] p-3 font-bold text-white disabled:opacity-40">Copiar imagen</button><button disabled={!elegido} onClick={() => void descargar()} className="rounded-xl border border-[#123960] p-3 font-bold text-[#123960] disabled:opacity-40">Descargar PNG</button></div>
              {mensaje && <p role="status" className="mt-3 text-sm text-slate-600">{mensaje}</p>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
