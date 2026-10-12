"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { normalizar, vendedores } from "@/lib/backoffice-vendedores";
import styles from "./backoffice.module.css";
type Row={id:string;fecha:string;cliente:string;vendedor:string;zona:string;tipo_venta:string;backoffice:string;created_at:string};
const empty={cliente:"",vendedor:"",tipo_venta:"TV",backoffice:""};
export default function Backoffice({authenticated,today}:{authenticated:boolean;today:string}) {
  const [access,setAccess]=useState(authenticated),[codigo,setCodigo]=useState(""),[error,setError]=useState(""),[notice,setNotice]=useState("");
  const [fecha,setFecha]=useState(today),[rows,setRows]=useState<Row[]>([]),[form,setForm]=useState(empty),[editing,setEditing]=useState<Row|null>(null);
  const [busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[search,setSearch]=useState(""),[zone,setZone]=useState(""),[showSuggestions,setShowSuggestions]=useState(false);
  const [activeSuggestion,setActiveSuggestion]=useState(-1);
  const suggestionList=useRef<HTMLDivElement>(null);
  const generation=useRef(0);
  const selected=vendedores.find(v=>normalizar(v.nombre)===normalizar(form.vendedor));
  const matches=vendedores.filter(v=>normalizar(v.nombre).includes(normalizar(form.vendedor)));
  const suggestionsOpen=showSuggestions&&Boolean(form.vendedor)&&!selected;
  function chooseSeller(nombre:string) { setForm({...form,vendedor:nombre});setShowSuggestions(false);setActiveSuggestion(-1); }
  useEffect(()=>{if(suggestionsOpen&&activeSuggestion>=0)suggestionList.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({block:"nearest"});},[activeSuggestion,suggestionsOpen]);
  const load=useCallback(async()=>{
    const current=++generation.current; setLoading(true); setError("");
    try { const r=await fetch(`/api/backoffice/registros?fecha=${fecha}`,{cache:"no-store"}); const data=await r.json(); if(current!==generation.current)return;
      if(r.status===401)setAccess(false); if(!r.ok)throw new Error(data.error); setRows(data.registros);
    } catch(e) {if(current===generation.current)setError(e instanceof Error?e.message:"No fue posible conectar.");}
    finally {if(current===generation.current)setLoading(false);}
  },[fecha]);
  const invalidate=useCallback(()=>{generation.current++;},[]);
  useEffect(()=>{if(access){const initial=setTimeout(()=>void load(),0);const timer=setInterval(()=>void load(),30000);return()=>{clearTimeout(initial);clearInterval(timer);invalidate();};}},[access,load,invalidate]);
  async function request(path:string,method:string,body?:unknown) {
    const r=await fetch(`/api/backoffice/${path}`,{method,headers:{"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)});
    const data=await r.json(); if(r.status===401)setAccess(false); if(!r.ok)throw new Error(data.error??"No fue posible completar la acción."); return data;
  }
  async function login(e:React.FormEvent) {e.preventDefault();setBusy(true);setError("");try{await request("login","POST",{codigo});setCodigo("");setAccess(true);}catch(e){setError(e instanceof Error?e.message:"Error de conexión.");}finally{setBusy(false);}}
  async function save(e:React.FormEvent) {
    e.preventDefault(); if(!selected){setError("Selecciona un vendedor del listado.");return;}setBusy(true);setError("");setNotice("");
    try {await request("registros",editing?"PATCH":"POST",{...form,vendedor:selected.nombre,...(editing?{id:editing.id}:{})});setForm(empty);setEditing(null);setNotice(editing?"Registro actualizado.":"Registro guardado.");await load();}
    catch(e){setError(e instanceof Error?e.message:"Error de conexión.");}finally{setBusy(false);}
  }
  async function remove(row:Row){if(!confirm(`¿Eliminar el registro de ${row.cliente}?`))return;setBusy(true);setError("");try{await request("registros","DELETE",{id:row.id});if(editing?.id===row.id){setEditing(null);setForm({...empty,backoffice:form.backoffice});}setNotice("Registro eliminado.");await load();}catch(e){setError(e instanceof Error?e.message:"Error de conexión.");}finally{setBusy(false);}}
  const dailyIds=new Map([...rows].sort((a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id)).map((row,index)=>[row.id,index+1]));
  const visible=rows.filter(r=>(!zone||r.zona===zone)&&normalizar(`${r.cliente} ${r.vendedor} ${r.backoffice} ${r.tipo_venta}`).includes(normalizar(search)));
  return <main className={styles.page}><div className={styles.container}>
    <header className={styles.header}><div><p className={styles.brand}>TSDS · GESTIÓN DE VENTAS</p><h1>Backoffice</h1><p>Registro diario de ingresos</p></div>{access&&<button disabled={busy} onClick={async()=>{setBusy(true);try{await request("logout","POST");setAccess(false);setRows([]);setForm(empty);setEditing(null);setError("");setNotice("");}catch(e){setError(e instanceof Error?e.message:"Error de conexión.");}finally{setBusy(false);}}}>Cerrar sesión</button>}</header>
    {error&&<p role="alert" className={styles.error}>{error}</p>}{notice&&access&&<p role="status" className={styles.notice}>{notice}</p>}
    {!access?<form onSubmit={login} className={styles.login}><h2>Acceso Backoffice</h2><label>Código de acceso<input autoFocus type="password" inputMode="numeric" autoComplete="current-password" value={codigo} onChange={e=>setCodigo(e.target.value)} required maxLength={100}/></label><button className={styles.primary} disabled={busy}>{busy?"Ingresando…":"Ingresar"}</button></form>:<>
    <section className={styles.card}><h2>{editing?"Editar registro":"Nuevo registro"}</h2><p className={styles.muted}>{editing?`Fecha original: ${editing.fecha.split("-").reverse().join("/")}`:"La fecha se asigna automáticamente al guardar, según la hora de Chile."}</p>
    <form onSubmit={save} className={styles.form}><label>Nombre cliente<input value={form.cliente} onChange={e=>setForm({...form,cliente:e.target.value})} required maxLength={160}/></label>
    <div className={styles.seller} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget)){setShowSuggestions(false);setActiveSuggestion(-1);}}}><label>Nombre vendedor<input autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={suggestionsOpen} aria-controls="vendedor-opciones" aria-activedescendant={suggestionsOpen&&activeSuggestion>=0?`vendedor-opcion-${activeSuggestion}`:undefined} value={form.vendedor} onFocus={()=>{setShowSuggestions(true);setActiveSuggestion(-1);}} onChange={e=>{setForm({...form,vendedor:e.target.value});setShowSuggestions(true);setActiveSuggestion(-1);}} onKeyDown={e=>{
      if(e.nativeEvent.isComposing)return;
      if((e.key==="ArrowDown"||e.key==="ArrowUp")&&form.vendedor&&!selected&&matches.length){e.preventDefault();setShowSuggestions(true);setActiveSuggestion(current=>e.key==="ArrowDown"?(current+1)%matches.length:current<=0?matches.length-1:current-1);}
      else if(e.key==="Enter"&&suggestionsOpen){e.preventDefault();if(activeSuggestion>=0&&matches[activeSuggestion])chooseSeller(matches[activeSuggestion].nombre);}
      else if(e.key==="Escape"){e.preventDefault();setShowSuggestions(false);setActiveSuggestion(-1);}
    }} required maxLength={100} aria-describedby="vendedor-ayuda"/></label><small id="vendedor-ayuda">Escribe un nombre. Usa ↑ y ↓ para recorrer las opciones y Enter para seleccionar.</small>{suggestionsOpen&&<div ref={suggestionList} id="vendedor-opciones" role="listbox" aria-label="Vendedores" className={styles.suggestions}>{matches.length?matches.map((v,index)=><button type="button" role="option" id={`vendedor-opcion-${index}`} aria-selected={activeSuggestion===index} tabIndex={-1} style={activeSuggestion===index?{background:"#d8ebff",boxShadow:"inset 3px 0 #126fb6"}:undefined} key={v.nombre} onMouseDown={e=>e.preventDefault()} onMouseEnter={()=>setActiveSuggestion(index)} onClick={()=>chooseSeller(v.nombre)}>{v.nombre}<small>{v.zona}</small></button>):<p>No hay coincidencias.</p>}</div>}</div>
    <label>Zona<input readOnly value={selected?.zona??""} placeholder="Según vendedor"/></label>
    <label>Tipo de venta<select value={form.tipo_venta} onChange={e=>setForm({...form,tipo_venta:e.target.value})}><option>TV</option><option>NET</option><option>REINGRESO</option></select></label>
    <label>Backoffice<input value={form.backoffice} onChange={e=>setForm({...form,backoffice:e.target.value})} required maxLength={80}/></label>
    <div className={styles.actions}><button className={styles.primary} disabled={busy}>{busy?"Guardando…":editing?"Guardar cambios":"Guardar registro"}</button>{editing&&<button type="button" disabled={busy} onClick={()=>{setEditing(null);setForm({...empty,backoffice:form.backoffice});}}>Cancelar</button>}</div></form></section>
    <section className={styles.card}><div className={styles.heading}><h2>Registros del día</h2><button disabled={busy||loading} onClick={()=>void load()}>Actualizar</button></div>
    <div className={styles.filters}><label>Fecha<input type="date" required value={fecha} onChange={e=>{if(e.target.value){setFecha(e.target.value);setRows([]);}}}/></label><label>Buscar<input placeholder="Cliente, vendedor o backoffice" value={search} onChange={e=>setSearch(e.target.value)}/></label><label>Zona<select value={zone} onChange={e=>setZone(e.target.value)}><option value="">Todas las zonas</option>{[...new Set(vendedores.map(v=>v.zona))].map(z=><option key={z}>{z}</option>)}</select></label></div>
    <div className={styles.stats}>{["TV","NET","REINGRESO"].map(t=><span key={t}>{t}<strong>{visible.filter(r=>r.tipo_venta===t).length}</strong></span>)}<span>Total<strong>{visible.length}</strong></span></div>
    <p className={styles.muted}>Actualización automática cada 30 segundos.</p><div className={styles.table}><table><thead><tr>{["ID","Fecha","Cliente","Vendedor","Zona","Tipo venta","Backoffice","Acciones"].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{visible.map(r=><tr key={r.id}><td>{dailyIds.get(r.id)}</td><td>{r.fecha.split("-").reverse().join("/")}</td><td>{r.cliente}</td><td>{r.vendedor}</td><td>{r.zona}</td><td>{r.tipo_venta}</td><td>{r.backoffice}</td><td className={styles.rowActions}><button disabled={busy} onClick={()=>{setEditing(r);setForm({cliente:r.cliente,vendedor:r.vendedor,tipo_venta:r.tipo_venta,backoffice:r.backoffice});setShowSuggestions(false);setNotice("");window.scrollTo({top:0,behavior:"smooth"});}}>Editar</button><button className={styles.danger} disabled={busy} onClick={()=>void remove(r)}>Eliminar</button></td></tr>)}</tbody></table></div>{!visible.length&&<p className={styles.empty}>{loading?"Cargando registros…":"No hay registros para esta consulta."}</p>}
    </section></>}
  </div></main>;
}
