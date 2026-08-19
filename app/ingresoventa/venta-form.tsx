"use client";

import { useRef, useState } from "react";

const zonas = ["CONCEPCIÓN", "TEMUCO", "VALDIVIA", "OSORNO", "PUERTO MONTT", "COYHAIQUE", "PUNTA ARENAS"];
const vias = ["CALLE", "PASAJE", "AVENIDA", "CAMINO A", "RUTA", "CALLEJÓN"];
const urbanas = ["SECTOR", "VILLA", "POBLACIÓN", "CONDOMINIO"];
const rurales = ["SECTOR", "PARCELA", "HIJUELA"];
const flexibles = ["DISNEY+", "HBO MAX", "VIX", "UNIVERSAL+", "MEGAGO", "PARAMOUNT+", "TNT SPORTS HD FLEX"];
const adicionales = ["DISNEY+", "CANAL NHK", "CANAL PLAYBOY", "CANAL TV GLOBO", "CANAL VENUS", "HOT PACK", "MEGAGO", "PACK FOX SPORTS", "PACK HBO MAX", "PACK MUNDO", "PARAMOUNT+", "PRIME VIDEO", "TNT SPORTS HD", "VIX"];

type Category = "TV SATELITAL" | "SOLO INTERNET" | "DÚO INTERNET + TV SATELITAL" | "DGO FLEX";

type Venta = {
  vendedor: string; zona: string; tipoVenta: string; reemplaza: string;
  cliente: string; rut: string; correo: string; telefonos: string[];
  comuna: string; via: string; direccion: string; complemento: string; complementoDato: string; referencias: string;
  costo: string; pago: string; tarjeta: string;
  categoria: Category | ""; plan: string; velocidad: string; modalidad: string;
  cantidadEquipo: string; premiumFlex: string[]; premiumAdicional: string[];
};

const initial: Venta = {
  vendedor: "", zona: "", tipoVenta: "", reemplaza: "", cliente: "", rut: "", correo: "", telefonos: [""],
  comuna: "", via: "", direccion: "", complemento: "", complementoDato: "", referencias: "", costo: "", pago: "", tarjeta: "",
  categoria: "", plan: "", velocidad: "", modalidad: "", cantidadEquipo: "", premiumFlex: [], premiumAdicional: [],
};

const plans: Record<Category, string[]> = {
  "TV SATELITAL": ["TV LITE", "TV ESENCIAL", "TV FLEX", "TV FULL"],
  "SOLO INTERNET": ["ONLYNET 500", "ONLYNET 800", "ONLYNET 940", "CUPO CLUSTER ONLYNET 600"],
  "DÚO INTERNET + TV SATELITAL": ["DÚO TV ESENCIAL", "DÚO TV FLEX", "DÚO TV FULL"],
  "DGO FLEX": ["DGO FLEX 500", "DGO FLEX 800", "DGO FLEX 940", "CUPO DÚO DGO FULL 800"],
};

function formatRut(value: string) {
  const clean = value.replace(/[^0-9kK]/g, "").toUpperCase().slice(0, 9);
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return `${Number(body).toLocaleString("es-CL")}-${dv}`;
}

function validRut(rut: string) {
  const clean = rut.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 8) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  let sum = 0, factor = 2;
  for (let i = body.length - 1; i >= 0; i--) { sum += Number(body[i]) * factor; factor = factor === 7 ? 2 : factor + 1; }
  const result = 11 - (sum % 11);
  const expected = result === 11 ? "0" : result === 10 ? "K" : String(result);
  return dv === expected;
}

function upper(value: string) { return value.toLocaleUpperCase("es-CL"); }

export default function IngresoVentaForm() {
  const [data, setData] = useState<Venta>(initial);
  const [vista, setVista] = useState<"form" | "preview">("form");
  const [mensaje, setMensaje] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function set<K extends keyof Venta>(key: K, value: Venta[K]) { setData((old) => ({ ...old, [key]: value })); }

  const urban = ["CALLE", "PASAJE", "AVENIDA"].includes(data.via);
  const hasMode = data.categoria === "TV SATELITAL"
    ? ["TV ESENCIAL", "TV FLEX", "TV FULL"].includes(data.plan)
    : data.categoria === "SOLO INTERNET"
      ? ["ONLYNET 500", "ONLYNET 800", "ONLYNET 940"].includes(data.plan)
      : data.categoria === "DÚO INTERNET + TV SATELITAL"
        ? Boolean(data.plan)
        : ["DGO FLEX 500", "DGO FLEX 800", "DGO FLEX 940"].includes(data.plan);
  const hasFlex = ["TV FLEX", "TV FULL", "DGO FLEX 500", "DGO FLEX 800", "DGO FLEX 940", "DÚO TV FLEX", "DÚO TV FULL"].includes(data.plan);
  const equipment = data.categoria === "DGO FLEX" ? "GOBOX" : ["TV SATELITAL", "DÚO INTERNET + TV SATELITAL"].includes(data.categoria) ? "DECOS" : "";

  function toggleFlex(item: string) {
    const selected = data.premiumFlex.includes(item);
    if (!selected && data.premiumFlex.length >= 2) return;
    set("premiumFlex", selected ? data.premiumFlex.filter((x) => x !== item) : [...data.premiumFlex, item]);
  }

  function duplicateAdditional(item: string) {
    return data.premiumFlex.some((flex) =>
      flex === item || (flex === "HBO MAX" && item === "PACK HBO MAX") || (flex === "TNT SPORTS HD FLEX" && item === "TNT SPORTS HD"),
    );
  }

  function validate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validRut(data.rut)) { setMensaje("Ingrese un RUT chileno válido."); return; }
    if (hasFlex && data.premiumFlex.length !== 2) { setMensaje("Debe seleccionar exactamente 2 Premium Flexibles."); return; }
    setMensaje("");
    setVista("preview");
    setTimeout(drawCanvas, 50);
  }

  function drawCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rows = [
      ["VENDEDOR", data.vendedor], ["ZONA", data.zona], ["TIPO DE VENTA", data.tipoVenta],
      ...(data.tipoVenta === "REEMPLAZO" ? [["REEMPLAZA A", data.reemplaza] as [string, string]] : []),
      ["CLIENTE", data.cliente], ["RUT", data.rut], ["CORREO", data.correo], ["TELÉFONOS", data.telefonos.filter(Boolean).join(" / ")],
      ["DIRECCIÓN", `${data.via} ${data.direccion}`], [data.complemento, data.complementoDato], ["COMUNA", data.comuna], ["REFERENCIAS", data.referencias || "SIN REFERENCIAS"],
      ["PLAN", `${data.categoria} · ${data.plan}`], ...(data.velocidad ? [["VELOCIDAD", `${data.velocidad} MBPS`] as [string, string]] : []),
      ...(data.modalidad ? [["MODALIDAD", data.modalidad] as [string, string]] : []), ...(equipment ? [["EQUIPAMIENTO", `${data.cantidadEquipo} ${equipment}`] as [string, string]] : []),
      ...(hasFlex ? [["PREMIUM FLEXIBLES", data.premiumFlex.join(" · ")] as [string, string]] : []),
      ...(data.categoria !== "SOLO INTERNET" ? [["PREMIUM ADICIONALES", data.premiumAdicional.length ? data.premiumAdicional.join(" · ") : "NINGUNO"] as [string, string]] : []),
      ["COSTO INSTALACIÓN", `$${Number(data.costo).toLocaleString("es-CL")}`], ["MEDIO DE PAGO", data.pago === "TARJETA" ? `TARJETA · ${data.tarjeta}` : data.pago],
    ] as [string, string][];

    const width = 1080, padding = 72, rowGap = 54;
    const height = 300 + rows.length * rowGap + 115;
    canvas.width = width; canvas.height = height;
    ctx.fillStyle = "#f1f5f9"; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#123ca5"; ctx.fillRect(0, 0, width, 230);
    ctx.fillStyle = "white"; ctx.font = "900 64px Arial"; ctx.fillText("TSDS", padding, 100);
    ctx.font = "700 32px Arial"; ctx.fillText("RESUMEN DE VENTA", padding, 158);
    ctx.font = "22px Arial"; ctx.fillStyle = "#dbeafe"; ctx.fillText(new Date().toLocaleString("es-CL"), padding, 202);
    ctx.fillStyle = "white"; ctx.fillRect(45, 260, width - 90, height - 315);
    let y = 315;
    for (const [label, value] of rows) {
      ctx.font = "700 18px Arial"; ctx.fillStyle = "#64748b"; ctx.fillText(label, padding, y);
      ctx.font = "700 24px Arial"; ctx.fillStyle = "#0f172a";
      const text = value || "—"; const maxWidth = width - 415;
      if (ctx.measureText(text).width > maxWidth) { ctx.font = "700 19px Arial"; }
      ctx.fillText(text, 380, y);
      ctx.strokeStyle = "#e2e8f0"; ctx.beginPath(); ctx.moveTo(padding, y + 20); ctx.lineTo(width - padding, y + 20); ctx.stroke();
      y += rowGap;
    }
    ctx.fillStyle = "#123ca5"; ctx.font = "700 18px Arial"; ctx.fillText("Documento generado en tsds.cl/ingresoventa", padding, height - 35);
  }

  function download() {
    drawCanvas();
    const link = document.createElement("a");
    link.download = `venta-${data.cliente.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = canvasRef.current?.toDataURL("image/png") ?? ""; link.click();
  }

  async function copyImage() {
    drawCanvas();
    const blob = await new Promise<Blob | null>((resolve) => canvasRef.current?.toBlob(resolve, "image/png"));
    if (!blob) return;
    try { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); setMensaje("Imagen copiada correctamente."); }
    catch { setMensaje("Tu navegador no permite copiar imágenes. Puedes descargarla."); }
  }

  async function share() {
    drawCanvas();
    const blob = await new Promise<Blob | null>((resolve) => canvasRef.current?.toBlob(resolve, "image/png"));
    if (!blob) return;
    const file = new File([blob], "venta-tsds.png", { type: "image/png" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: "Resumen de venta TSDS", files: [file] });
    } else { setMensaje("Para compartir directamente, abre esta página desde tu teléfono. En este equipo puedes descargar la imagen."); }
  }

  if (vista === "preview") return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 text-center"><h1 className="text-3xl font-black text-blue-800">Resumen de venta</h1><p className="text-slate-600">Revisa la ficha antes de compartirla</p></div>
        <canvas ref={canvasRef} className="w-full rounded-2xl bg-white shadow-xl" />
        {mensaje && <p className="mt-4 rounded-xl bg-blue-50 p-3 text-center font-semibold text-blue-800">{mensaje}</p>}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button onClick={download} className="rounded-xl bg-blue-700 py-3 font-bold text-white hover:bg-blue-800">DESCARGAR IMAGEN</button>
          <button onClick={copyImage} className="rounded-xl bg-slate-800 py-3 font-bold text-white hover:bg-slate-900">COPIAR IMAGEN</button>
          <button onClick={share} className="rounded-xl bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-700">COMPARTIR</button>
          <button onClick={() => setVista("form")} className="rounded-xl border border-slate-300 bg-white py-3 font-bold text-slate-700 hover:bg-slate-50">EDITAR DATOS</button>
          <button onClick={() => { setData(initial); setVista("form"); setMensaje(""); }} className="sm:col-span-2 rounded-xl border border-blue-200 bg-blue-50 py-3 font-bold text-blue-800">INGRESAR OTRA VENTA</button>
        </div>
      </div>
    </main>
  );

  const input = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100";
  const label = "mb-2 block text-sm font-bold text-slate-700";
  const section = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7";

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-6 sm:px-6">
      <form onSubmit={validate} className="mx-auto max-w-4xl space-y-5">
        <header className="rounded-3xl bg-gradient-to-r from-blue-900 to-blue-600 p-7 text-white shadow-lg sm:p-9">
          <div className="flex items-start justify-between gap-4"><div><p className="text-4xl font-black">TSDS</p><h1 className="mt-1 text-2xl font-bold">Ingreso de venta</h1><p className="mt-2 text-blue-100">Complete todos los datos para generar la ficha.</p></div><button formAction="/api/ingresoventa/logout" formMethod="post" className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20">Salir</button></div>
        </header>

        <Section title="1. Datos del vendedor" className={section}>
          <Field label="Nombre del vendedor" cls={label}><input className={input} required value={data.vendedor} onChange={(e) => set("vendedor", upper(e.target.value))} /></Field>
          <Field label="Zona" cls={label}><Select cls={input} value={data.zona} onChange={(v) => set("zona", v)} options={zonas} /></Field>
          <Field label="Tipo de venta" cls={label}><Select cls={input} value={data.tipoVenta} onChange={(v) => { set("tipoVenta", v); if (v !== "REEMPLAZO") set("reemplaza", ""); }} options={["VENTA NUEVA", "REINGRESO", "REEMPLAZO"]} /></Field>
          {data.tipoVenta === "REEMPLAZO" && <Field label="Cliente al que reemplaza" cls={label}><input className={input} required value={data.reemplaza} onChange={(e) => set("reemplaza", upper(e.target.value))} /></Field>}
        </Section>

        <Section title="2. Datos del cliente" className={section}>
          <Field label="Nombre del cliente" cls={label}><input className={input} required value={data.cliente} onChange={(e) => set("cliente", upper(e.target.value))} /></Field>
          <Field label="RUT" cls={label}><input className={input} required inputMode="text" placeholder="12.345.678-9" value={data.rut} onChange={(e) => set("rut", formatRut(e.target.value))} /></Field>
          <Field label="Correo electrónico" cls={label}><input className={input} required type="email" placeholder="cliente@correo.cl" value={data.correo} onChange={(e) => set("correo", e.target.value.trim().toLowerCase())} /></Field>
          <div className="sm:col-span-2"><span className={label}>Teléfonos</span><div className="space-y-3">{data.telefonos.map((phone, index) => <div className="flex gap-2" key={index}><input className={input} required={index === 0} type="tel" inputMode="tel" placeholder={index === 0 ? "Teléfono principal" : "Teléfono adicional"} value={phone} onChange={(e) => { const phones = [...data.telefonos]; phones[index] = e.target.value.replace(/[^0-9+ ]/g, ""); set("telefonos", phones); }} />{index > 0 && <button type="button" aria-label="Eliminar teléfono" onClick={() => set("telefonos", data.telefonos.filter((_, i) => i !== index))} className="rounded-xl border border-red-200 px-4 font-bold text-red-600">×</button>}</div>)}</div>{data.telefonos.length < 3 && <button type="button" onClick={() => set("telefonos", [...data.telefonos, ""])} className="mt-3 text-sm font-bold text-blue-700">+ Agregar otro teléfono</button>}</div>
        </Section>

        <Section title="3. Datos del domicilio" className={section}>
          <Field label="Comuna" cls={label}><input className={input} required value={data.comuna} onChange={(e) => set("comuna", upper(e.target.value))} /></Field>
          <Field label="Tipo de vía" cls={label}><Select cls={input} value={data.via} onChange={(v) => { set("via", v); set("complemento", ""); set("complementoDato", ""); }} options={vias} /></Field>
          <Field label="Nombre y número" cls={label}><input className={input} required value={data.direccion} onChange={(e) => set("direccion", upper(e.target.value))} /></Field>
          {data.via && <><Field label="Tipo de complemento" cls={label}><Select cls={input} value={data.complemento} onChange={(v) => set("complemento", v)} options={urban ? urbanas : rurales} /></Field><Field label={`Nombre o número de ${data.complemento || "complemento"}`} cls={label}><input className={input} required value={data.complementoDato} onChange={(e) => set("complementoDato", upper(e.target.value))} /></Field></>}
          <div className="sm:col-span-2"><label className={label}>Referencias</label><textarea className={input} rows={3} value={data.referencias} onChange={(e) => set("referencias", upper(e.target.value))} /></div>
        </Section>

        <Section title="4. Plan contratado" className={section}>
          <Field label="Categoría" cls={label}><Select cls={input} value={data.categoria} onChange={(v) => setData((old) => ({ ...old, categoria: v as Category, plan: "", velocidad: "", modalidad: "", cantidadEquipo: "", premiumFlex: [], premiumAdicional: [] }))} options={Object.keys(plans)} /></Field>
          {data.categoria && <Field label="Plan" cls={label}><Select cls={input} value={data.plan} onChange={(v) => setData((old) => ({ ...old, plan: v, modalidad: "", premiumFlex: [], premiumAdicional: [] }))} options={plans[data.categoria]} /></Field>}
          {data.categoria === "DÚO INTERNET + TV SATELITAL" && <Field label="Velocidad de internet" cls={label}><Select cls={input} value={data.velocidad} onChange={(v) => set("velocidad", v)} options={["500", "800", "940"]} /></Field>}
          {hasMode && <Field label="Modalidad" cls={label}><Select cls={input} value={data.modalidad} onChange={(v) => set("modalidad", v)} options={["NORMAL", "CONVENIO"]} /></Field>}
        </Section>

        {equipment && <Section title="5. Equipamiento" className={section}><Field label={`Cantidad de ${equipment}`} cls={label}><Select cls={input} value={data.cantidadEquipo} onChange={(v) => set("cantidadEquipo", v)} options={["1", "2", "3", "4", "5", "6"]} /></Field></Section>}

        {hasFlex && <Section title="6. Premium flexibles" className={section}><p className="sm:col-span-2 -mt-2 text-sm text-slate-500">Seleccione exactamente 2 ({data.premiumFlex.length}/2)</p><div className="sm:col-span-2 grid gap-2 sm:grid-cols-2">{flexibles.map((item) => <Check key={item} item={item} checked={data.premiumFlex.includes(item)} disabled={!data.premiumFlex.includes(item) && data.premiumFlex.length >= 2} onChange={() => toggleFlex(item)} />)}</div></Section>}

        {data.categoria && data.categoria !== "SOLO INTERNET" && <Section title={`${hasFlex ? "7" : "6"}. Premium adicionales`} className={section}><p className="sm:col-span-2 -mt-2 text-sm text-slate-500">Opcional. Las opciones elegidas como flexibles no pueden repetirse.</p><div className="sm:col-span-2 grid gap-2 sm:grid-cols-2">{adicionales.map((item) => <Check key={item} item={item} checked={data.premiumAdicional.includes(item)} disabled={duplicateAdditional(item)} onChange={() => set("premiumAdicional", data.premiumAdicional.includes(item) ? data.premiumAdicional.filter((x) => x !== item) : [...data.premiumAdicional, item])} />)}</div></Section>}

        <Section title={`${data.categoria === "SOLO INTERNET" ? "5" : hasFlex ? "8" : "7"}. Forma de pago`} className={section}>
          <Field label="Costo de instalación" cls={label}><div className="relative"><span className="absolute left-4 top-3 text-slate-500">$</span><input className={`${input} pl-8`} required type="number" min="0" inputMode="numeric" value={data.costo} onChange={(e) => set("costo", e.target.value)} /></div></Field>
          <Field label="Método de pago" cls={label}><Select cls={input} value={data.pago} onChange={(v) => { set("pago", v); if (v !== "TARJETA") set("tarjeta", ""); }} options={["EFECTIVO", "TARJETA", "PAC"]} /></Field>
          {data.pago === "TARJETA" && <Field label="Tipo de tarjeta" cls={label}><Select cls={input} value={data.tarjeta} onChange={(v) => set("tarjeta", v)} options={["MASTERCARD", "VISA", "AMERICAN EXPRESS"]} /></Field>}
        </Section>

        {mensaje && <p className="rounded-xl bg-red-50 p-4 text-center font-bold text-red-700">{mensaje}</p>}
        <button className="w-full rounded-2xl bg-blue-700 py-4 text-lg font-black text-white shadow-lg transition hover:bg-blue-800">REVISAR Y GENERAR IMAGEN</button>
        <p className="pb-5 text-center text-xs text-slate-500">Los datos no se guardan ni se envían. Solo se utilizan para generar la imagen.</p>
      </form>
    </main>
  );
}

function Section({ title, className, children }: { title: string; className: string; children: React.ReactNode }) { return <section className={className}><h2 className="mb-5 border-b border-slate-200 pb-3 text-xl font-black text-blue-900">{title}</h2><div className="grid gap-4 sm:grid-cols-2">{children}</div></section>; }
function Field({ label, cls, children }: { label: string; cls: string; children: React.ReactNode }) { return <div><label className={cls}>{label}</label>{children}</div>; }
function Select({ cls, value, onChange, options }: { cls: string; value: string; onChange: (value: string) => void; options: string[] }) { return <select className={cls} required value={value} onChange={(e) => onChange(e.target.value)}><option value="" disabled>Seleccione una opción</option>{options.map((option) => <option key={option}>{option}</option>)}</select>; }
function Check({ item, checked, disabled, onChange }: { item: string; checked: boolean; disabled: boolean; onChange: () => void }) { return <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-bold transition ${checked ? "border-blue-600 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-700"} ${disabled ? "cursor-not-allowed opacity-40" : "hover:border-blue-300"}`}><input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} className="h-5 w-5 accent-blue-700" />{item}</label>; }
