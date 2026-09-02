"use client";

import { useRef, useState } from "react";

type ArchivoInfo = { nombre: string; tamano: string };
type ClienteFila = { cliente: string; correo: string; seleccionado: boolean };
type XLSXApi = {
  read: (data: ArrayBuffer, options?: Record<string, unknown>) => { SheetNames: string[]; Sheets: Record<string, unknown> };
  utils: { sheet_to_json: (sheet: unknown, options?: Record<string, unknown>) => unknown[][] };
};

declare global { interface Window { XLSX?: XLSXApi } }

function formatearTamano(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizar(value: unknown) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function esColumnaCliente(value: unknown) {
  const texto = normalizar(value);
  return ["ndecliente", "numerodecliente", "nrodecliente", "numdecliente", "numerocliente", "nrocliente", "numcliente", "cliente", "suscriptor", "numerosuscriptor", "nrosuscriptor", "numsuscriptor", "idsuscriptor", "subscriber", "subscriberid"].includes(texto);
}

function correoValido(correo: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());
}

function cargarXlsx() {
  return new Promise<XLSXApi>((resolve, reject) => {
    if (window.XLSX) return resolve(window.XLSX);
    const existente = document.querySelector<HTMLScriptElement>("script[data-tsds-xlsx]");
    if (existente) {
      existente.addEventListener("load", () => window.XLSX ? resolve(window.XLSX) : reject(new Error("No se pudo iniciar el lector de Excel.")));
      existente.addEventListener("error", () => reject(new Error("No se pudo cargar el lector de Excel.")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    script.async = true;
    script.dataset.tsdsXlsx = "true";
    script.onload = () => window.XLSX ? resolve(window.XLSX) : reject(new Error("No se pudo iniciar el lector de Excel."));
    script.onerror = () => reject(new Error("No se pudo cargar el lector de Excel."));
    document.head.appendChild(script);
  });
}

export default function PostVisitaUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<ArchivoInfo | null>(null);
  const [clientes, setClientes] = useState<ClienteFila[]>([]);
  const [leyendo, setLeyendo] = useState(false);
  const [error, setError] = useState("");
  const [revisando, setRevisando] = useState(false);
  const [confirmandoFinal, setConfirmandoFinal] = useState(false);
  const [confirmacionMarcada, setConfirmacionMarcada] = useState(false);
  const [enviandoPrueba, setEnviandoPrueba] = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState("");
  const [enviandoMasivo, setEnviandoMasivo] = useState(false);
  const [resultadoMasivo, setResultadoMasivo] = useState("");

  async function seleccionarArchivo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError(""); setClientes([]); setRevisando(false); setConfirmandoFinal(false); setConfirmacionMarcada(false); setResultadoPrueba(""); setResultadoMasivo("");
    if (!file) return;
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension || !["xlsx", "xls", "csv"].includes(extension)) {
      setArchivo(null); setError("Seleccione un archivo Excel (.xlsx, .xls) o CSV."); event.target.value = ""; return;
    }
    setArchivo({ nombre: file.name, tamano: formatearTamano(file.size) }); setLeyendo(true);
    try {
      const XLSX = await cargarXlsx();
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const primeraHoja = workbook.SheetNames[0];
      if (!primeraHoja) throw new Error("El archivo no contiene hojas.");
      const filas = XLSX.utils.sheet_to_json(workbook.Sheets[primeraHoja], { header: 1, defval: "", raw: false });
      let filaCabecera = -1; let columnaCliente = -1;
      for (let i = 0; i < Math.min(filas.length, 25); i += 1) {
        const fila = Array.isArray(filas[i]) ? filas[i] : [];
        const indice = fila.findIndex(esColumnaCliente);
        if (indice >= 0) { filaCabecera = i; columnaCliente = indice; break; }
      }
      if (filaCabecera < 0 || columnaCliente < 0) throw new Error("No encontré la columna Nº de cliente en el archivo.");
      const encontrados: ClienteFila[] = []; const repetidos = new Set<string>();
      for (let i = filaCabecera + 1; i < filas.length; i += 1) {
        const fila = Array.isArray(filas[i]) ? filas[i] : [];
        const valor = String(fila[columnaCliente] ?? "").trim();
        if (!valor) continue;
        const limpio = valor.replace(/\.0$/, "").replace(/\s+/g, "");
        if (!limpio || repetidos.has(limpio)) continue;
        repetidos.add(limpio); encontrados.push({ cliente: limpio, correo: "", seleccionado: false });
      }
      if (!encontrados.length) throw new Error("Encontré la columna Nº de cliente, pero no contiene datos.");
      setClientes(encontrados);
    } catch (err) {
      setClientes([]); setError(err instanceof Error ? err.message : "No fue posible leer el archivo.");
    } finally { setLeyendo(false); }
  }

  function actualizarCorreo(index: number, correo: string) {
    setClientes(actuales => actuales.map((fila, i) => i === index ? { ...fila, correo, seleccionado: correoValido(correo) ? fila.seleccionado : false } : fila));
    setResultadoPrueba(""); setResultadoMasivo(""); setConfirmacionMarcada(false);
  }

  function alternarSeleccion(index: number) {
    setClientes(actuales => actuales.map((fila, i) => i === index && correoValido(fila.correo) ? { ...fila, seleccionado: !fila.seleccionado } : fila));
    setResultadoPrueba(""); setResultadoMasivo(""); setConfirmacionMarcada(false);
  }

  function seleccionarValidos() {
    const validos = clientes.filter(f => correoValido(f.correo));
    const todosSeleccionados = validos.length > 0 && validos.every(f => f.seleccionado);
    setClientes(actuales => actuales.map(fila => correoValido(fila.correo) ? { ...fila, seleccionado: !todosSeleccionados } : { ...fila, seleccionado: false }));
    setResultadoPrueba(""); setResultadoMasivo(""); setConfirmacionMarcada(false);
  }

  async function enviarPrueba() {
    const fila = clientes.find(f => f.seleccionado && correoValido(f.correo));
    if (!fila || enviandoPrueba) return;
    setEnviandoPrueba(true); setResultadoPrueba("");
    try {
      const response = await fetch("/api/postvisita/prueba", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: fila.correo.trim(), cliente: fila.cliente }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "No fue posible enviar la prueba.");
      setResultadoPrueba(`✅ Correo de prueba enviado a ${fila.correo.trim()}`);
    } catch (err) {
      setResultadoPrueba(`❌ ${err instanceof Error ? err.message : "No fue posible enviar la prueba."}`);
    } finally { setEnviandoPrueba(false); }
  }

  function abrirConfirmacionFinal() {
    setConfirmacionMarcada(false); setResultadoMasivo(""); setRevisando(false); setConfirmandoFinal(true);
  }

  async function enviarMasivo() {
    const destinatarios = clientes.filter(f => f.seleccionado && correoValido(f.correo)).map(f => ({ email: f.correo.trim(), cliente: f.cliente }));
    if (!confirmacionMarcada || destinatarios.length === 0 || enviandoMasivo) return;
    setEnviandoMasivo(true); setResultadoMasivo("");
    try {
      const response = await fetch("/api/postvisita/enviar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destinatarios }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "No fue posible enviar el lote.");
      const enviados = typeof data.enviados === "number" ? data.enviados : destinatarios.length;
      setResultadoMasivo(`✅ Envío completado: ${enviados} correos enviados correctamente.`);
      setConfirmacionMarcada(false);
      setClientes(actuales => actuales.map(f => f.seleccionado ? { ...f, seleccionado: false } : f));
    } catch (err) {
      setResultadoMasivo(`❌ ${err instanceof Error ? err.message : "No fue posible enviar el lote."}`);
    } finally { setEnviandoMasivo(false); }
  }

  function limpiar() {
    setArchivo(null); setClientes([]); setLeyendo(false); setError(""); setRevisando(false); setConfirmandoFinal(false); setConfirmacionMarcada(false); setResultadoPrueba(""); setResultadoMasivo("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const correosCompletos = clientes.filter(f => correoValido(f.correo)).length;
  const seleccionados = clientes.filter(f => f.seleccionado && correoValido(f.correo)).length;
  const todosValidosSeleccionados = correosCompletos > 0 && seleccionados === correosCompletos;
  const primerSeleccionado = clientes.find(f => f.seleccionado && correoValido(f.correo));
  const seleccionadosFilas = clientes.filter(f => f.seleccionado && correoValido(f.correo));

  return <div className="space-y-6">
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <div className="text-4xl">📂</div><h2 className="mt-3 text-xl font-black text-slate-800">Carga de clientes</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">Selecciona el archivo con las visitas finalizadas. Buscaremos automáticamente la columna Nº de cliente.</p>
      <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" onChange={seleccionarArchivo} className="hidden" />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={leyendo} className="mt-6 rounded-xl bg-blue-700 px-7 py-3 font-bold text-white transition hover:bg-blue-800 disabled:bg-slate-400">{leyendo ? "LEYENDO EXCEL…" : "📂 CARGAR EXCEL"}</button>
      {archivo && <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-emerald-700">Archivo cargado</p><p className="mt-1 break-all font-bold text-slate-800">{archivo.nombre}</p><p className="mt-1 text-sm text-slate-500">{archivo.tamano}</p></div><button type="button" onClick={limpiar} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">Quitar</button></div></div>}
      {error && <p className="mx-auto mt-5 max-w-xl rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
    </div>

    {clientes.length > 0 && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs font-black uppercase tracking-wider text-blue-700">Lectura correcta</p><h3 className="text-lg font-black text-slate-800">{clientes.length} clientes detectados</h3><p className="mt-1 text-sm text-slate-500">{correosCompletos} correos válidos · {seleccionados} seleccionados</p></div>
        <div className="flex flex-col gap-2 sm:flex-row"><button type="button" onClick={seleccionarValidos} disabled={correosCompletos === 0} className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-50 disabled:border-slate-200 disabled:text-slate-400">{todosValidosSeleccionados ? "DESMARCAR TODOS" : "SELECCIONAR CORREOS VÁLIDOS"}</button><button type="button" onClick={() => setRevisando(true)} disabled={seleccionados === 0} className="rounded-xl bg-blue-700 px-5 py-2 text-sm font-black text-white hover:bg-blue-800 disabled:bg-slate-300">REVISAR ENVÍO ({seleccionados})</button></div>
      </div>
      <div className="max-h-[520px] overflow-auto"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-white text-xs uppercase text-slate-500 shadow-sm"><tr><th className="px-5 py-3 text-center">Enviar</th><th className="px-5 py-3">#</th><th className="px-5 py-3">Nº de cliente</th><th className="px-5 py-3">Correo</th></tr></thead><tbody className="divide-y divide-slate-100">{clientes.map((fila, index) => { const tieneCorreo = fila.correo.trim().length > 0; const esValido = correoValido(fila.correo); return <tr key={`${fila.cliente}-${index}`} className={fila.seleccionado ? "bg-blue-50/60" : ""}><td className="px-5 py-3 text-center"><input type="checkbox" checked={fila.seleccionado} disabled={!esValido} onChange={() => alternarSeleccion(index)} className="h-4 w-4 accent-blue-700 disabled:opacity-30" /></td><td className="px-5 py-3 text-slate-400">{index + 1}</td><td className="px-5 py-3 font-bold text-slate-800">{fila.cliente}</td><td className="px-5 py-3"><div className="flex items-center gap-2"><input type="email" value={fila.correo} onChange={(e) => actualizarCorreo(index, e.target.value)} placeholder="cliente@correo.cl" className={`w-full min-w-[260px] rounded-lg border px-3 py-2 outline-none transition ${!tieneCorreo ? "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" : esValido ? "border-emerald-400 bg-emerald-50" : "border-red-400 bg-red-50"}`} />{tieneCorreo && <span className={`text-base ${esValido ? "text-emerald-600" : "text-red-600"}`}>{esValido ? "✓" : "✕"}</span>}</div></td></tr> })}</tbody></table></div>
    </section>}

    {revisando && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onClick={() => setRevisando(false)}><div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="border-b border-slate-200 bg-slate-50 px-6 py-5 sm:px-8"><p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Confirmación previa</p><h2 className="mt-1 text-2xl font-black text-slate-900">Revisar envío post visita</h2><p className="mt-2 text-sm text-slate-500">Revisa el contenido antes de pasar a la confirmación final de {seleccionados} correos.</p></div><div className="space-y-5 p-6 sm:p-8"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Prueba disponible:</strong> puedes seguir enviando solo 1 correo real a <strong>{primerSeleccionado?.correo}</strong> antes de continuar.</div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-black uppercase tracking-wider text-slate-500">Asunto</p><p className="mt-1 font-bold text-slate-900">DIRECTV · Tu visita técnica ha finalizado – Soporte TSDS</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 text-[15px] leading-7 text-slate-700"><p>Hola:</p><p className="mt-4">Te informamos que la visita técnica de DIRECTV realizada en tu domicilio ha sido finalizada correctamente.</p><p className="mt-3">TSDS es <strong className="text-slate-900">Agente Autorizado de DIRECTV</strong> y queremos seguir acompañándote después de la atención realizada.</p><p className="mt-5 font-black text-slate-900">📞 Es posible que te llamen para evaluar la atención</p><p className="mt-2">Durante las próximas 48 horas podrías recibir una llamada para conocer tu experiencia con la visita técnica.</p><p className="mt-3">Al momento de evaluar, te invitamos a considerar especialmente la atención, disposición y trabajo realizado por el técnico que te visitó.</p><p className="mt-3">En algunas ocasiones pueden existir inconvenientes relacionados con sistemas, plataformas o condiciones externas que no dependen directamente del técnico. Si ese fue tu caso, te agradecemos considerar esta diferencia al momento de responder la evaluación.</p><p className="mt-5 font-black text-slate-900">🛡️ Tienes 30 días de soporte TSDS</p><p className="mt-2">Queremos seguir acompañándote después de la visita.</p><p className="mt-3">Si durante los próximos 30 días presentas algún inconveniente relacionado con tu servicio de televisión o internet, cuentas con nuestro canal de soporte TSDS.</p><p className="mt-3">Antes de solicitar una nueva visita técnica, ingresa a:</p><p className="mt-2 font-black text-blue-700">www.tsds.cl</p><p className="mt-2">Selecciona “PROBLEMAS CON MI SERVICIO” y cuéntanos qué ocurre. Nuestro equipo revisará tu caso e intentará ayudarte lo antes posible.</p><p className="mt-3">Este canal está disponible para entregarte una atención más rápida ante inconvenientes posteriores a tu visita.</p><p className="mt-5">Gracias por tu tiempo y por confiar en nuestro equipo.</p><p className="mt-4 font-bold text-slate-900">Equipo TSDS<br/>Agente Autorizado de DIRECTV<br/>Soporte post visita técnica<br/>www.tsds.cl</p></div>{resultadoPrueba && <div className={`rounded-xl p-4 text-sm font-bold ${resultadoPrueba.startsWith("✅") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{resultadoPrueba}</div>}<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setRevisando(false)} disabled={enviandoPrueba} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">VOLVER</button><button type="button" onClick={enviarPrueba} disabled={!primerSeleccionado || enviandoPrueba} className="rounded-xl bg-amber-500 px-5 py-3 font-black text-white hover:bg-amber-600 disabled:bg-slate-300">{enviandoPrueba ? "ENVIANDO PRUEBA…" : "ENVIAR 1 CORREO DE PRUEBA"}</button><button type="button" onClick={abrirConfirmacionFinal} disabled={seleccionados === 0 || enviandoPrueba} className="rounded-xl bg-blue-700 px-5 py-3 font-black text-white hover:bg-blue-800 disabled:bg-slate-300">CONTINUAR A CONFIRMACIÓN FINAL</button></div></div></div></div>}

    {confirmandoFinal && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4" onClick={() => !enviandoMasivo && setConfirmandoFinal(false)}><div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="rounded-t-3xl bg-red-600 px-6 py-5 text-white sm:px-8"><p className="text-xs font-black uppercase tracking-[0.18em] text-red-100">Última confirmación</p><h2 className="mt-1 text-2xl font-black">Envío masivo post visita</h2></div><div className="space-y-5 p-6 sm:p-8"><div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900"><p className="text-lg font-black">Se enviarán {seleccionados} correos reales.</p><p className="mt-2 text-sm">Esta acción enviará un correo independiente a cada cliente seleccionado.</p></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><p className="text-xs font-black uppercase tracking-wider text-slate-500">Resumen</p><p className="mt-2 text-sm text-slate-700"><strong>Asunto:</strong> DIRECTV · Tu visita técnica ha finalizado – Soporte TSDS</p><p className="mt-1 text-sm text-slate-700"><strong>Remitente:</strong> TSDS Soporte &lt;soporte@tsds.cl&gt;</p><p className="mt-1 text-sm text-slate-700"><strong>Destinatarios:</strong> {seleccionados}</p></div><div className="max-h-44 overflow-auto rounded-2xl border border-slate-200"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Nº cliente</th><th className="px-4 py-3">Correo</th></tr></thead><tbody className="divide-y divide-slate-100">{seleccionadosFilas.map((fila) => <tr key={fila.cliente}><td className="px-4 py-3 font-bold text-slate-800">{fila.cliente}</td><td className="px-4 py-3 text-slate-600">{fila.correo}</td></tr>)}</tbody></table></div><label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4"><input type="checkbox" checked={confirmacionMarcada} disabled={enviandoMasivo || resultadoMasivo.startsWith("✅")} onChange={(e) => setConfirmacionMarcada(e.target.checked)} className="mt-1 h-5 w-5 accent-red-600" /><span className="text-sm leading-6 text-slate-700">Confirmo que revisé los destinatarios y que deseo enviar <strong>{seleccionados} correos reales</strong>.</span></label>{resultadoMasivo && <div className={`rounded-xl p-4 text-sm font-bold ${resultadoMasivo.startsWith("✅") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{resultadoMasivo}</div>}<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => { setConfirmandoFinal(false); setRevisando(true); }} disabled={enviandoMasivo || resultadoMasivo.startsWith("✅")} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">VOLVER A REVISAR</button>{resultadoMasivo.startsWith("✅") ? <button type="button" onClick={limpiar} className="rounded-xl bg-blue-700 px-5 py-3 font-black text-white hover:bg-blue-800">LIMPIAR LOTE Y CONTINUAR</button> : <button type="button" onClick={enviarMasivo} disabled={!confirmacionMarcada || seleccionados === 0 || enviandoMasivo} className="rounded-xl bg-red-600 px-5 py-3 font-black text-white hover:bg-red-700 disabled:bg-slate-300">{enviandoMasivo ? "ENVIANDO CORREOS…" : `ENVIAR ${seleccionados} CORREOS AHORA`}</button>}</div></div></div></div>}
  </div>;
}
