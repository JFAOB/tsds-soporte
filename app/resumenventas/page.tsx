"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { read, utils } from "xlsx";

type Venta = { id: number; zona: string; estado: string; plan: string; datos: Record<string, string> };
type Resumen = { zona: string; agendada: number; instalada: number; total: number; tv: number; net: number };
const normal = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toUpperCase();
const clave = (s: unknown) => normal(s).replace(/[^A-Z0-9]/g, "");
const tipos = (plan: string) => {
  const p = clave(plan);
  return { tv: p.startsWith("BUNDLE") || p.startsWith("DGO") || p.startsWith("TV"), net: p.startsWith("BUNDLE") || p.startsWith("DGO") || p.startsWith("ONLYNET") };
};
function csv(texto: string): Record<string, unknown>[] {
  const lineas = texto.replace(/^\uFEFF/, "").split(/\r?\n/).filter((s) => s.trim());
  if (!lineas.length) return [];
  const candidatos = ["\t", ";", ","];
  const sep = candidatos.sort((a,b) => lineas[0].split(b).length - lineas[0].split(a).length)[0];
  const parse = (linea: string) => { const out: string[] = []; let campo = "", comillas = false; for(let i=0;i<linea.length;i++){const c=linea[i];if(c==='"'){if(comillas&&linea[i+1]==='"'){campo+='"';i++;}else comillas=!comillas;}else if(c===sep&&!comillas){out.push(campo);campo="";}else campo+=c;}out.push(campo);return out; };
  const cab = parse(lineas[0]);
  return lineas.slice(1).map((linea) => { const vals = parse(linea); return Object.fromEntries(cab.map((h,i)=>[h,vals[i]??""])); });
}
function importarFilas(filas: Record<string, unknown>[]): Venta[] {
  return filas.map((fila, id) => {
    const valor = (col: string) => Object.entries(fila).find(([k]) => clave(k) === clave(col))?.[1];
    return { id, zona: normal(valor("ZONA")), estado: normal(valor("ESTADO")), plan: normal(valor("PLAN")), datos: Object.fromEntries(Object.entries(fila).map(([k,v]) => [clave(k), String(v ?? "").trim()])) };
  }).filter((v) => v.zona && (v.estado === "AGENDADA" || v.estado === "INSTALADA"));
}
function agrupar(ventas: Venta[]): Resumen[] {
  const mapa = new Map<string, Resumen>();
  for (const venta of ventas) {
    if (venta.estado !== "INSTALADA" && venta.estado !== "AGENDADA") continue;
    const zona = normal(venta.zona);
    if (!zona) continue;
    const fila = mapa.get(zona) ?? { zona, agendada: 0, instalada: 0, total: 0, tv: 0, net: 0 };
    if (venta.estado === "AGENDADA") fila.agendada++; else fila.instalada++;
    fila.total++;
    const t = tipos(venta.plan);
    if (t.tv) fila.tv++;
    if (t.net) fila.net++;
    mapa.set(zona, fila);
  }
  return [...mapa.values()].sort((a,b)=>b.total-a.total || a.zona.localeCompare(b.zona, "es"));
}
const columnas: { key: keyof Resumen; titulo: string; color: string }[] = [
  {key:"zona",titulo:"ZONA",color:"#c9e9f4"},
  {key:"agendada",titulo:"AGENDADA",color:"#c9e9f4"},
  {key:"instalada",titulo:"INSTALADA",color:"#c9e9f4"},
  {key:"total",titulo:"TOTAL",color:"#c9e9f4"},
  {key:"tv",titulo:"TV",color:"#56a832"},
  {key:"net",titulo:"NET",color:"#159dd2"},
];

const colores = {azul:"#102c50", azul2:"#173f69", borde:"#b6c6d6", tinta:"#19324b", gris:"#f3f7fb", verde:"#d9f1df", verdeTexto:"#17613b", ambar:"#fff0cd", ambarTexto:"#8b5600"};
function cabeceraImagen(ctx: CanvasRenderingContext2D, ancho:number, titulo:string, subtitulo:string) {
  ctx.fillStyle=colores.azul;ctx.fillRect(0,0,ancho,60);
  ctx.fillStyle="#ffffff";ctx.font="bold 20px Arial";ctx.textAlign="left";ctx.textBaseline="middle";
  ctx.fillText("TSDS  |  "+titulo,14,25);
  ctx.fillStyle="#c9dcef";ctx.font="12px Arial";ctx.fillText(subtitulo,15,45);
}
function celdaImagen(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,fondo:string) {
  ctx.fillStyle=fondo;ctx.fillRect(x,y,w,h);ctx.strokeStyle=colores.borde;ctx.lineWidth=.75;ctx.strokeRect(x+.4,y+.4,w-.8,h-.8);
}
function generarImagen(filas: Resumen[], total: Omit<Resumen,"zona">, ocultarEstados: boolean) {
  const visibles=columnas.filter(c=>!ocultarEstados||(c.key!=="agendada"&&c.key!=="instalada"));
  const anchos=visibles.map(c=>c.key==="zona"?205:c.key==="total"?105:98);
  const ancho=anchos.reduce((a,b)=>a+b,0), escala=2, filaH=34, inicio=68, alto=inicio+(filas.length+2)*filaH+10;
  const canvas=document.createElement("canvas");canvas.width=ancho*escala;canvas.height=alto*escala;
  const ctx=canvas.getContext("2d");if(!ctx)throw Error("No se pudo crear la imagen");
  ctx.scale(escala,escala);ctx.fillStyle="#ffffff";ctx.fillRect(0,0,ancho,alto);
  cabeceraImagen(ctx,ancho,"RESUMEN DE VENTAS","Ventas por zona  ·  Ordenadas por total de mayor a menor");
  const dibujar=(fila:Resumen,y:number,esTotal:boolean)=>{
    let x=0;
    visibles.forEach((c,i)=>{
      const fondo=esTotal?"#dbe9f5":c.key==="tv"?"#e8f5e9":c.key==="net"?"#e6f4fb":i===0?"#f1f6fb":"#ffffff";
      celdaImagen(ctx,x,y,anchos[i],filaH,fondo);
      ctx.font=(esTotal||c.key==="zona"||c.key==="total"?"bold ":"")+"14px Arial";
      ctx.fillStyle=colores.tinta;ctx.textAlign=i===0?"left":"center";ctx.textBaseline="middle";
      ctx.fillText(String(fila[c.key]),x+(i===0?10:anchos[i]/2),y+filaH/2,anchos[i]-14);
      x+=anchos[i];
    });
  };
  let x=0;visibles.forEach((c,i)=>{
    const fondo=c.key==="tv"?"#348c4c":c.key==="net"?"#1684b6":colores.azul2;
    celdaImagen(ctx,x,inicio,anchos[i],filaH,fondo);
    ctx.fillStyle="#ffffff";ctx.font="bold 12px Arial";ctx.textAlign=i===0?"left":"center";ctx.textBaseline="middle";
    ctx.fillText(c.titulo,x+(i===0?10:anchos[i]/2),inicio+filaH/2,anchos[i]-12);x+=anchos[i];
  });
  filas.forEach((f,i)=>dibujar(f,inicio+(i+1)*filaH,false));
  dibujar({zona:"TOTAL GENERAL",...total},inicio+(filas.length+1)*filaH,true);
  return canvas;
}
const detalleColumnas = [
  ["NOMBRECLIENTE","NOMBRE CLIENTE",230],["VENDEDOR","VENDEDOR",160],["LOCALIDAD","LOCALIDAD",130],
  ["ZONA","ZONA",130],["PLAN","PLAN",180],["DECOS","DECOS",65],["TECNICO","TÉCNICO",155],
  ["FORMADEPAGO","FORMA DE PAGO",140],["MONTO","MONTO",95],["ESTADO","ESTADO",115]
] as const;
function imagenDetalle(filas:Venta[]) {
  const anchos=detalleColumnas.map(c=>c[2]),ancho=anchos.reduce((a,b)=>a+b,0);
  const filaH=34, inicio=68, margen=10, alto=inicio+(filas.length+1)*filaH+margen;
  const escala=Math.min(1.6,14000/Math.max(ancho,alto));
  const canvas=document.createElement("canvas");canvas.width=Math.round(ancho*escala);canvas.height=Math.round(alto*escala);
  const ctx=canvas.getContext("2d");if(!ctx)throw Error("No se pudo generar la imagen");
  ctx.scale(escala,escala);ctx.fillStyle="#ffffff";ctx.fillRect(0,0,ancho,alto);
  cabeceraImagen(ctx,ancho,"DETALLE DE VENTAS",filas.length+" registros  ·  Zona A-Z  /  Vendedor A-Z  /  Cliente A-Z");
  const comparar=(a:string,b:string)=>a.localeCompare(b,"es",{sensitivity:"base",numeric:true});
  const ordenadas=[...filas]
    .sort((a,b)=>comparar(a.datos.NOMBRECLIENTE??"",b.datos.NOMBRECLIENTE??""))
    .sort((a,b)=>comparar(a.datos.VENDEDOR??"",b.datos.VENDEDOR??""))
    .sort((a,b)=>comparar(a.zona,b.zona));
  let x=0;detalleColumnas.forEach((col,i)=>{
    celdaImagen(ctx,x,inicio,anchos[i],filaH,col[0]==="ESTADO"?"#246b58":col[0]==="ZONA"?"#25577c":colores.azul2);
    ctx.fillStyle="#ffffff";ctx.font="bold 11px Arial";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText(col[1],x+anchos[i]/2,inicio+filaH/2,anchos[i]-8);x+=anchos[i];
  });
  let anterior="";
  ordenadas.forEach((fila,i)=>{
    const nuevaZona=fila.zona!==anterior;anterior=fila.zona;
    const y=inicio+(i+1)*filaH;let x=0;
    detalleColumnas.forEach(([key,,w])=>{
      const valor=String(key==="ZONA"?fila.zona:key==="ESTADO"?fila.estado:key==="PLAN"?fila.plan:fila.datos[key]??"");
      const estado=key==="ESTADO";
      const fondo=estado?(fila.estado==="INSTALADA"?colores.verde:colores.ambar):nuevaZona?"#e8f1f9":i%2===0?colores.gris:"#ffffff";
      celdaImagen(ctx,x,y,w,filaH,fondo);
      if(nuevaZona){ctx.fillStyle="#47799c";ctx.fillRect(x,y,w,2);}
      ctx.fillStyle=estado?(fila.estado==="INSTALADA"?colores.verdeTexto:colores.ambarTexto):colores.tinta;
      ctx.font=(estado||key==="ZONA"?"bold ":"")+"12px Arial";
      ctx.textAlign=key==="NOMBRECLIENTE"||key==="VENDEDOR"?"left":"center";ctx.textBaseline="middle";
      ctx.fillText(valor,x+(ctx.textAlign==="left"?8:w/2),y+filaH/2,w-14);
      x+=w;
    });
  });
  return canvas;
}
export default function ResumenVentasPage() {
  const [ventas,setVentas]=useState<Venta[]>([]);
  const [ocultarEstados,setOcultarEstados]=useState(false);
  const [mensaje,setMensaje]=useState("");
  const [pegado,setPegado]=useState("");
  const archivoRef=useRef<HTMLInputElement>(null);
  const resumen=useMemo(()=>agrupar(ventas),[ventas]);
  const columnasVisibles=useMemo(()=>columnas.filter(c=>!ocultarEstados||(c.key!=="agendada"&&c.key!=="instalada")),[ocultarEstados]);
  const totales=useMemo(()=>resumen.reduce((a,f)=>({agendada:a.agendada+f.agendada,instalada:a.instalada+f.instalada,total:a.total+f.total,tv:a.tv+f.tv,net:a.net+f.net}),{agendada:0,instalada:0,total:0,tv:0,net:0}),[resumen]);
  const cargar=(filas:Record<string,unknown>[])=>{const v=importarFilas(filas);setVentas(v);setMensaje(v.length?`Se importaron ${v.length} ventas AGENDADAS/INSTALADAS.`:"No se encontraron filas válidas. Revisa ZONA, ESTADO y PLAN.");};
  const archivo=async(file?:File)=>{if(!file)return;try{const bytes=await file.arrayBuffer();if(/\.csv$/i.test(file.name)){const a=new Uint8Array(bytes);const texto=a[0]===255&&a[1]===254?new TextDecoder("utf-16le").decode(a):new TextDecoder("utf-8").decode(a);cargar(csv(texto));}else{const libro=read(bytes,{type:"array"});const hoja=libro.Sheets[libro.SheetNames[0]];cargar(utils.sheet_to_json<Record<string,unknown>>(hoja,{defval:"",raw:false}));}}catch(e){setMensaje(e instanceof Error?e.message:"No se pudo leer el archivo.");}};
  const png=()=>new Promise<Blob>((resolve,reject)=>generarImagen(resumen,totales,ocultarEstados).toBlob(blob=>blob?resolve(blob):reject(Error("Error generando PNG")),"image/png"));
  const detallePng=()=>new Promise<Blob>((resolve,reject)=>imagenDetalle(ventas).toBlob(blob=>blob?resolve(blob):reject(Error("Error generando detalle")),"image/png"));
  const copiarDetalle=async()=>{try{const blob=await detallePng();await navigator.clipboard.write([new ClipboardItem({"image/png":blob})]);setMensaje("Imagen del detalle copiada.");}catch(e){setMensaje(e instanceof Error?`No se pudo copiar el detalle: ${e.message}`:"No se pudo copiar.");}};
  const descargarDetalle=async()=>{try{const blob=await detallePng();const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="TSDS-detalle-ventas.png";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);setMensaje("Detalle descargado.");}catch(e){setMensaje(e instanceof Error?e.message:"No se pudo descargar el detalle.");}};
  const copiar=async()=>{try{const blob=await png();await navigator.clipboard.write([new ClipboardItem({"image/png":blob})]);setMensaje("Imagen copiada. Pégala en WhatsApp.");}catch(e){setMensaje(e instanceof Error?`No se pudo copiar: ${e.message}`:"No se pudo copiar.");}};
  const descargar=async()=>{try{const blob=await png();const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="TSDS-resumen-ventas.png";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);setMensaje("PNG descargado.");}catch(e){setMensaje(e instanceof Error?e.message:"No se pudo descargar.");}};
  return <main className="min-h-screen bg-slate-100 px-4 py-7 text-slate-900"><div className="mx-auto max-w-6xl space-y-5">
    <header className="flex items-center justify-between gap-4 rounded-xl bg-[#102c50] p-5 text-white"><div><h1 className="text-xl font-bold">TSDS · Resumen de Ventas</h1><p className="text-sm text-blue-100">Resumen automático por zona, estado y tipo de plan</p></div><Link href="/" className="rounded-lg border border-white/50 px-3 py-2 text-sm">Inicio</Link></header>
    <section className="rounded-xl border border-slate-300 bg-white p-4"><h2 className="mb-3 font-bold">1. Importar base de ventas</h2><input ref={archivoRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e=>void archivo(e.target.files?.[0])}/><button onClick={()=>archivoRef.current?.click()} className="rounded-lg bg-[#123960] px-4 py-2 font-semibold text-white">Subir Excel / CSV</button><p className="my-2 text-xs text-slate-500">También puedes pegar la tabla copiada desde Excel.</p><textarea className="w-full rounded-lg border border-slate-300 p-2 text-sm" rows={3} value={pegado} onChange={e=>setPegado(e.target.value)} placeholder="ZONA    ESTADO    PLAN..."/><button onClick={()=>cargar(csv(pegado))} className="mt-2 rounded-lg border border-[#123960] px-4 py-2 text-sm font-semibold">Procesar tabla pegada</button></section>
    <section className="rounded-xl border border-slate-300 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">2. Resumen por zona</h2><label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 p-2 text-sm font-medium"><input type="checkbox" checked={ocultarEstados} onChange={e=>setOcultarEstados(e.target.checked)}/>Ocultar columnas AGENDADA e INSTALADA</label></div>
      <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[600px] border-collapse text-center text-sm"><thead><tr>{columnasVisibles.map(c=><th key={c.key} style={{background:c.color}} className="border border-slate-500 p-2">{c.titulo}</th>)}</tr></thead><tbody>{resumen.map(f=><tr key={f.zona}>{columnasVisibles.map(c=><td key={c.key} className="border border-slate-400 p-2" style={{background:c.key==="tv"?"#e2f3d8":c.key==="net"?"#d9f1fa":"white"}}>{f[c.key]}</td>)}</tr>)}<tr className="bg-blue-100 font-bold"><td className="border border-slate-500 p-2">TOTAL GENERAL</td>{columnasVisibles.filter(c=>c.key!=="zona").map(c=><td key={c.key} className="border border-slate-500 p-2">{totales[c.key as keyof typeof totales]}</td>)}</tr></tbody></table>{!ventas.length&&<p className="p-5 text-center text-sm text-slate-500">Sube un archivo para generar el resumen.</p>}</div>
      <div className="mt-4 flex flex-wrap gap-2"><button disabled={!ventas.length} onClick={()=>void copiar()} className="rounded-lg bg-[#123960] px-4 py-2 font-semibold text-white disabled:opacity-40">Copiar imagen</button><button disabled={!ventas.length} onClick={()=>void descargar()} className="rounded-lg border border-[#123960] px-4 py-2 font-semibold text-[#123960] disabled:opacity-40">Descargar PNG</button></div>
      {mensaje&&<p role="status" className="mt-3 text-sm text-slate-600">{mensaje}</p>}
    </section>
    {ventas.length>0&&<section className="rounded-xl border border-slate-300 bg-white p-4">
      <h2 className="font-bold">3. Imagen de la base de ventas</h2>
      <p className="my-2 text-sm text-slate-600">Incluye las 10 columnas de la tabla original y todas las ventas AGENDADAS e INSTALADAS. Registros en imagen: {ventas.length}.</p>
      <div className="flex flex-wrap gap-2"><button onClick={()=>void copiarDetalle()} className="rounded-lg bg-[#123960] px-4 py-2 font-semibold text-white">Copiar imagen de la primera tabla</button><button onClick={()=>void descargarDetalle()} className="rounded-lg border border-[#123960] px-4 py-2 font-semibold text-[#123960]">Descargar detalle PNG</button></div>
    </section>}
    <p className="text-xs text-slate-500">Clasificación: BUNDLE/DGO = TV + NET · ONLYNET = NET · TV = TV. Ocultar columnas no modifica los totales ni el detalle de ventas.</p>
  </div></main>;
}
