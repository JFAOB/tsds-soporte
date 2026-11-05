"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

type RawRow = Record<string, unknown>;
type Estado = "Agendada" | "Despachada" | "Sin Agendar";

type Orden = {
  wo: string;
  cliente: string;
  comuna: string;
  estado: Estado;
  inicio: Date | null;
  region: string;
  tecnico: string;
};

type TecnicoResumen = {
  id: string;
  nombre: string;
  wo: number;
  clientes: number;
  ruta: string;
};

type RegionReporte = {
  region: string;
  comunas: Array<{ comuna: string; agendada: number; despachada: number; sinAgendar: number; total: number }>;
  tecnicos: TecnicoResumen[];
  totales: { agendada: number; despachada: number; sinAgendar: number; total: number };
};

const REGIONES: Record<string, string> = {
  "R8 - BIO BIO": "R8 · Biobío",
  "R9 - LA ARAUCANIA": "R9 · La Araucanía",
  "R10 - LOS LAGOS": "R10 · Los Lagos",
  "R11 - AISEN DEL GENERAL CARLOS IBANEZ DEL CAMPO": "R11 · Aysén",
  "R12 - MAGALLANES Y DE LA ANTARTICA CHILENA": "R12 · Magallanes",
  "R14 - LOS RIOS": "R14 · Los Ríos",
};

const TECNICOS_BASE: Record<string, string[]> = {
  "R8 - BIO BIO": ["A. Maldonado", "F. Fuentes", "I. Monares", "E. Torres", "L. Rojas", "M. Guzmán", "J. Méndez", "L. Suárez"],
  "R9 - LA ARAUCANIA": ["Rain Lagos", "Reyes Soto", "Soto Torres", "Vargas Bravo", "Vidal Salinas"],
  "R10 - LOS LAGOS": ["A. Mansilla", "C. Colipán", "C. Caiguán", "J. Casanova", "M. Saldivia"],
  "R11 - AISEN DEL GENERAL CARLOS IBANEZ DEL CAMPO": ["C. Haro", "P. Mansilla", "G. Águila"],
  "R12 - MAGALLANES Y DE LA ANTARTICA CHILENA": ["Gómez Velásquez", "Robledo Bruna"],
  "R14 - LOS RIOS": [],
};

function normalizar(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
}

function encontrar(row: RawRow, nombre: string) {
  const objetivo = normalizar(nombre);
  const key = Object.keys(row).find((item) => normalizar(item) === objetivo);
  return key ? String(row[key] ?? "").trim() : "";
}

function parseFecha(value: string) {
  if (!value) return null;
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (match) {
    return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), Number(match[4] || 0), Number(match[5] || 0), Number(match[6] || 0));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function soloFecha(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function siguienteDia(value: Date) {
  const result = soloFecha(value);
  result.setDate(result.getDate() + 1);
  return result;
}

function mismoDia(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function nombreTecnico(row: RawRow) {
  const nombre = encontrar(row, "Nombre Cuadrilla/Técnico");
  const apellido = encontrar(row, "Apellido Cuadrilla/Técnico");
  if (normalizar(nombre) === "SIEBEL" && normalizar(apellido) === "ADMINISTRATOR") return "Pendiente de asignación";
  return [nombre, apellido].filter(Boolean).join(" ").toLowerCase().replace(/\b\p{L}/gu, (letter) => letter.toUpperCase()) || "Pendiente de asignación";
}

function convertirOrden(row: RawRow): Orden | null {
  const estadoRaw = normalizar(encontrar(row, "Estado de la visita"));
  const estado: Estado | null = estadoRaw === "AGENDADA" ? "Agendada" : estadoRaw === "DESPACHADA" ? "Despachada" : estadoRaw === "SIN AGENDAR" ? "Sin Agendar" : null;
  const region = encontrar(row, "Región");
  if (!estado || !region) return null;
  return {
    wo: encontrar(row, "N° de WO de IBS"),
    cliente: encontrar(row, "Nº de cliente"),
    comuna: encontrar(row, "Comuna") || "SIN COMUNA",
    estado,
    inicio: parseFecha(encontrar(row, "Inicio agendado")),
    region,
    tecnico: nombreTecnico(row),
  };
}

function coincidenTecnicos(base: string, detectado: string) {
  const a = normalizar(base).replace(/\./g, "").split(/\s+/);
  const b = normalizar(detectado).split(/\s+/);
  const apellido = a[a.length - 1];
  return b.includes(apellido) && (!a[0] || b[0]?.startsWith(a[0][0]));
}

function armarReportes(ordenes: Orden[], fechaCarga: Date): RegionReporte[] {
  const hoy = soloFecha(fechaCarga);
  const manana = siguienteDia(hoy);
  const backlog = ordenes.filter((orden) => !orden.inicio || soloFecha(orden.inicio) > hoy);
  const regiones = Array.from(new Set(backlog.map((orden) => orden.region))).sort((a, b) => Number(a.match(/R(\d+)/)?.[1] || 99) - Number(b.match(/R(\d+)/)?.[1] || 99));

  return regiones.map((region) => {
    const regionBacklog = backlog.filter((orden) => orden.region === region);
    const porComuna = new Map<string, { agendada: number; despachada: number; sinAgendar: number }>();
    regionBacklog.forEach((orden) => {
      const comuna = normalizar(orden.comuna);
      const actual = porComuna.get(comuna) || { agendada: 0, despachada: 0, sinAgendar: 0 };
      if (orden.estado === "Agendada") actual.agendada += 1;
      if (orden.estado === "Despachada") actual.despachada += 1;
      if (orden.estado === "Sin Agendar") actual.sinAgendar += 1;
      porComuna.set(comuna, actual);
    });
    const comunas = Array.from(porComuna.entries()).map(([comuna, values]) => ({ comuna, ...values, total: values.agendada + values.despachada + values.sinAgendar })).sort((a, b) => a.comuna.localeCompare(b.comuna, "es"));

    const agenda = ordenes.filter((orden) => orden.region === region && orden.inicio && mismoDia(orden.inicio, manana));
    const detectados = Array.from(new Set(agenda.map((orden) => orden.tecnico).filter((nombre) => nombre !== "Pendiente de asignación")));
    const nombres = [...(TECNICOS_BASE[region] || [])];
    detectados.forEach((nombre) => {
      if (!nombres.some((base) => coincidenTecnicos(base, nombre))) nombres.push(nombre);
    });
    if (agenda.some((orden) => orden.tecnico === "Pendiente de asignación")) nombres.push("Pendiente de asignación");

    const tecnicos = nombres.map((nombre, index) => {
      const items = agenda.filter((orden) => orden.tecnico === nombre || coincidenTecnicos(nombre, orden.tecnico));
      const clientes = new Set(items.map((orden) => orden.cliente).filter(Boolean));
      const comunasTecnico = Array.from(new Set(items.map((orden) => normalizar(orden.comuna)))).sort((a, b) => a.localeCompare(b, "es"));
      return { id: `${region}-${index}-${normalizar(nombre)}`, nombre, wo: items.length, clientes: clientes.size, ruta: comunasTecnico.join(" / ") || "SIN RUTA" };
    });

    const totales = comunas.reduce((acc, comuna) => ({ agendada: acc.agendada + comuna.agendada, despachada: acc.despachada + comuna.despachada, sinAgendar: acc.sinAgendar + comuna.sinAgendar, total: acc.total + comuna.total }), { agendada: 0, despachada: 0, sinAgendar: 0, total: 0 });
    return { region, comunas, tecnicos, totales };
  });
}

function descargarCanvas(reporte: RegionReporte, fecha: Date) {
  const scale = 2;
  const width = 1100;
  const row = 38;
  const height = 190 + (reporte.comunas.length + 2) * row + 105 + (reporte.tecnicos.length + 2) * row + 80;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(scale, scale);
  ctx.fillStyle = "#f4f7fa";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#08284a";
  ctx.fillRect(35, 28, width - 70, 102);
  ctx.fillStyle = "white";
  ctx.font = "700 31px Arial";
  ctx.fillText("REPORTE AGENDA TSDS", 60, 72);
  ctx.font = "18px Arial";
  const fechaTexto = siguienteDia(fecha).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  ctx.fillText(`${REGIONES[reporte.region] || reporte.region} · ${fechaTexto}`, 60, 106);

  let y = 170;
  const drawTable = (title: string, headers: string[], rows: string[][], widths: number[]) => {
    ctx.fillStyle = "#12324f";
    ctx.font = "700 22px Arial";
    ctx.fillText(title, 35, y);
    y += 18;
    ctx.fillStyle = "#bfd8ee";
    ctx.fillRect(35, y, width - 70, row);
    let x = 35;
    ctx.fillStyle = "#102e4a";
    ctx.font = "700 15px Arial";
    headers.forEach((header, i) => { ctx.fillText(header, x + 9, y + 25); x += widths[i]; });
    y += row;
    rows.forEach((values, index) => {
      ctx.fillStyle = index % 2 ? "#eaf1f7" : "#ffffff";
      ctx.fillRect(35, y, width - 70, row);
      x = 35;
      ctx.fillStyle = "#203c57";
      ctx.font = "15px Arial";
      values.forEach((value, i) => { ctx.fillText(value, x + 9, y + 25); x += widths[i]; });
      y += row;
    });
  };

  drawTable("BACKLOG POR COMUNA", ["Comuna", "Agendada", "Despachada", "Sin agendar", "Total"], [
    ...reporte.comunas.map((c) => [c.comuna, String(c.agendada || ""), String(c.despachada || ""), String(c.sinAgendar || ""), String(c.total)]),
    ["TOTAL", String(reporte.totales.agendada), String(reporte.totales.despachada), String(reporte.totales.sinAgendar), String(reporte.totales.total)],
  ], [500, 130, 140, 145, 85]);
  y += 55;
  const totalWo = reporte.tecnicos.reduce((sum, tecnico) => sum + tecnico.wo, 0);
  const totalClientes = reporte.tecnicos.reduce((sum, tecnico) => sum + tecnico.clientes, 0);
  drawTable("TÉCNICOS · DÍA SIGUIENTE", ["Técnico", "WO", "Clientes", "Comuna / ruta"], [
    ...reporte.tecnicos.map((t) => [t.nombre.toUpperCase(), String(t.wo), String(t.clientes), t.ruta]),
    ["TOTAL", String(totalWo), String(totalClientes), ""],
  ], [360, 90, 110, 440]);
  ctx.fillStyle = "#60758a";
  ctx.font = "14px Arial";
  ctx.fillText("Generado en TSDS · Datos editables antes de descargar", 35, height - 25);
  const link = document.createElement("a");
  link.download = `agenda-${reporte.region.split(" ")[0].toLowerCase()}-${siguienteDia(fecha).toISOString().slice(0, 10)}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export default function AgendaClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fechaCarga, setFechaCarga] = useState(() => new Date());
  const [reportes, setReportes] = useState<RegionReporte[]>([]);
  const [regionActiva, setRegionActiva] = useState("");
  const [archivo, setArchivo] = useState("");
  const [error, setError] = useState("");
  const reporte = useMemo(() => reportes.find((item) => item.region === regionActiva) || reportes[0], [regionActiva, reportes]);

  async function cargarArchivo(file: File) {
    setError("");
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "", raw: false });
      const ordenes = raw.map(convertirOrden).filter((item): item is Orden => Boolean(item));
      if (!ordenes.length) throw new Error("No se encontraron órdenes válidas. Revisa que el archivo tenga las columnas originales del backlog.");
      const nuevos = armarReportes(ordenes, fechaCarga);
      setReportes(nuevos);
      setRegionActiva(nuevos[0]?.region || "");
      setArchivo(file.name);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible procesar el archivo.");
    }
  }

  function editarTecnico(id: string, field: keyof Omit<TecnicoResumen, "id">, value: string) {
    setReportes((actuales) => actuales.map((item) => item.region !== reporte?.region ? item : { ...item, tecnicos: item.tecnicos.map((tecnico) => tecnico.id !== id ? tecnico : { ...tecnico, [field]: field === "wo" || field === "clientes" ? Math.max(0, Number(value) || 0) : value }) }));
  }

  function agregarTecnico() {
    if (!reporte) return;
    setReportes((actuales) => actuales.map((item) => item.region !== reporte.region ? item : { ...item, tecnicos: [...item.tecnicos, { id: `${item.region}-${Date.now()}`, nombre: "Nuevo técnico", wo: 0, clientes: 0, ruta: "SIN RUTA" }] }));
  }

  function eliminarTecnico(id: string) {
    if (!reporte) return;
    setReportes((actuales) => actuales.map((item) => item.region !== reporte.region ? item : { ...item, tecnicos: item.tecnicos.filter((tecnico) => tecnico.id !== id) }));
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" aria-label="Volver al inicio"><Image src="/logo-tsds.png" alt="TSDS" width={154} height={54} className="h-11 w-auto" /></Link>
          <Link href="/" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Volver al inicio</Link>
        </div>
      </header>
      <section className="bg-gradient-to-br from-sky-700 via-sky-600 to-blue-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-100">Operaciones TSDS</p>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">Generador de agenda</h1>
          <p className="mt-4 max-w-3xl text-sky-50 sm:text-lg">Carga el backlog, revisa la agenda del día siguiente, edita rutas y descarga una imagen por región.</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="-mt-14 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-300/30 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[220px_1fr_auto] lg:items-end">
            <label><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Fecha de carga</span><input type="date" value={`${fechaCarga.getFullYear()}-${String(fechaCarga.getMonth()+1).padStart(2,"0")}-${String(fechaCarga.getDate()).padStart(2,"0")}`} onChange={(event) => { const [year, month, day] = event.target.value.split("-").map(Number); setFechaCarga(new Date(year, month - 1, day)); }} className="w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
            <div><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Archivo de backlog</span><button type="button" onClick={() => inputRef.current?.click()} className="w-full rounded-xl border-2 border-dashed border-sky-300 bg-sky-50 px-5 py-3 text-left font-semibold text-sky-800 hover:bg-sky-100">{archivo || "Seleccionar Excel o CSV"}</button><input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void cargarArchivo(file); }} /></div>
            <p className="max-w-xs text-sm leading-6 text-slate-500">El archivo se procesa en tu navegador. No se guarda ni se envía al servidor.</p>
          </div>
          {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        </section>

        {!reporte ? (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center"><h2 className="text-xl font-bold">Carga el archivo para comenzar</h2><p className="mt-2 text-slate-500">Se excluirán las agendas de la fecha de carga y anteriores.</p></section>
        ) : (
          <>
            <nav className="mt-8 flex gap-2 overflow-x-auto pb-2">{reportes.map((item) => <button key={item.region} type="button" onClick={() => setRegionActiva(item.region)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${item.region === reporte.region ? "bg-sky-700 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{REGIONES[item.region] || item.region}</button>)}</nav>
            <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-black">{REGIONES[reporte.region] || reporte.region}</h2><p className="mt-1 text-sm text-slate-500">Agenda del {siguienteDia(fechaCarga).toLocaleDateString("es-CL")}</p></div><button type="button" onClick={() => descargarCanvas(reporte, fechaCarga)} className="rounded-xl bg-sky-700 px-5 py-3 font-bold text-white hover:bg-sky-800">Descargar imagen</button></div>
              <div className="p-5">
                <h3 className="mb-3 text-lg font-black">Backlog por comuna</h3>
                <div className="overflow-x-auto"><table className="w-full min-w-[680px] border-collapse text-sm"><thead className="bg-sky-100 text-sky-950"><tr><th className="p-3 text-left">Comuna</th><th className="p-3 text-center">Agendada</th><th className="p-3 text-center">Despachada</th><th className="p-3 text-center">Sin agendar</th><th className="p-3 text-center">Total</th></tr></thead><tbody>{reporte.comunas.map((comuna) => <tr key={comuna.comuna} className="border-b border-slate-100 even:bg-slate-50"><td className="p-3 font-semibold">{comuna.comuna}</td><td className="p-3 text-center">{comuna.agendada || ""}</td><td className="p-3 text-center">{comuna.despachada || ""}</td><td className="p-3 text-center">{comuna.sinAgendar || ""}</td><td className="p-3 text-center font-black">{comuna.total}</td></tr>)}<tr className="bg-sky-700 font-black text-white"><td className="p-3">TOTAL</td><td className="p-3 text-center">{reporte.totales.agendada}</td><td className="p-3 text-center">{reporte.totales.despachada}</td><td className="p-3 text-center">{reporte.totales.sinAgendar}</td><td className="p-3 text-center">{reporte.totales.total}</td></tr></tbody></table></div>

                <div className="mb-3 mt-8 flex items-center justify-between"><h3 className="text-lg font-black">Técnicos · día siguiente</h3><button type="button" onClick={agregarTecnico} className="rounded-lg border border-sky-200 px-3 py-2 text-sm font-bold text-sky-700 hover:bg-sky-50">+ Agregar técnico</button></div>
                <div className="overflow-x-auto"><table className="w-full min-w-[820px] border-collapse text-sm"><thead className="bg-sky-100 text-sky-950"><tr><th className="p-3 text-left">Técnico</th><th className="p-3 text-center">WO</th><th className="p-3 text-center">Clientes</th><th className="p-3 text-left">Comuna / ruta</th><th className="w-12"></th></tr></thead><tbody>{reporte.tecnicos.map((tecnico) => <tr key={tecnico.id} className="border-b border-slate-100 even:bg-slate-50"><td className="p-2"><input value={tecnico.nombre} onChange={(event) => editarTecnico(tecnico.id, "nombre", event.target.value)} className="w-full rounded-lg border border-transparent bg-transparent px-2 py-2 font-bold focus:border-sky-300 focus:bg-white" /></td><td className="p-2"><input type="number" min="0" value={tecnico.wo} onChange={(event) => editarTecnico(tecnico.id, "wo", event.target.value)} className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-2 text-center" /></td><td className="p-2"><input type="number" min="0" value={tecnico.clientes} onChange={(event) => editarTecnico(tecnico.id, "clientes", event.target.value)} className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-2 text-center" /></td><td className="p-2"><input value={tecnico.ruta} onChange={(event) => editarTecnico(tecnico.id, "ruta", event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2" /></td><td><button type="button" onClick={() => eliminarTecnico(tecnico.id)} className="text-lg font-bold text-red-500" aria-label={`Eliminar ${tecnico.nombre}`}>×</button></td></tr>)}<tr className="bg-sky-700 font-black text-white"><td className="p-3">TOTAL</td><td className="p-3 text-center">{reporte.tecnicos.reduce((sum, item) => sum + item.wo, 0)}</td><td className="p-3 text-center">{reporte.tecnicos.reduce((sum, item) => sum + item.clientes, 0)}</td><td colSpan={2}></td></tr></tbody></table></div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
