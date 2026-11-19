"use client";

import { useMemo, useState } from "react";

const ZONES = ["CONCEPCION", "TEMUCO", "VALDIVIA", "OSORNO", "PUERTO MONTT", "COYHAIQUE", "PUNTA ARENAS", "ONLINE"] as const;
type Zone = (typeof ZONES)[number];
type Plan = { id: number; name: string; category: string; price: number; promo: number | null; months: number | null; active: boolean };
const initialPlans: Plan[] = [];
type Prospect = { id: string; zone: Zone; seller: string; sds: string; client: string; email: string; phone: string; rut: string; address: string; planId: number; status: "borrador" | "pendiente_cliente" | "aceptado_cliente" | "rechazado_cliente" | "observado" | "aprobado_sds"; createdAt: string };
const input = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500";
const btn = "rounded-xl bg-blue-700 px-4 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40";
const secondary = "rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50";
const format = (n: number) => "$" + n.toLocaleString("es-CL");
export default function ValidaPage() {
  const [view, setView] = useState<"inicio" | "vendedor" | "backoffice" | "admin">("inicio");
  const [plans, setPlans] = useState(initialPlans);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [zone, setZone] = useState<Zone>("OSORNO");
  const [seller, setSeller] = useState("");
  const [sds, setSds] = useState("");
  const [client, setClient] = useState("");
  const [rut, setRut] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [planId, setPlanId] = useState("");
  const [filterZone, setFilterZone] = useState("TODAS");
  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [search, setSearch] = useState("");
  const [planName, setPlanName] = useState("");
  const [category, setCategory] = useState("ONLYNET");
  const [price, setPrice] = useState("");
  const [promo, setPromo] = useState("");
  const [months, setMonths] = useState("");
  const [message, setMessage] = useState("");
  const filtered = useMemo(() => prospects.filter(p => (filterZone === "TODAS" || p.zone === filterZone) && (filterStatus === "TODOS" || p.status === filterStatus) && [p.client,p.seller,p.sds].join(" ").toLowerCase().includes(search.toLowerCase())), [prospects, filterZone, filterStatus, search]);
  const activePlans = plans.filter(p => p.active);
  const selectedPlan = plans.find(p => String(p.id) === planId);
  function savePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!planName.trim() || Number(price) <= 0 || (promo && Number(promo) <= 0) || (promo && Number(months) <= 0)) return;
    setPlans(prev => [...prev, {id:Date.now(), name:planName.trim(),category,price:Number(price),promo:promo?Number(promo):null,months:months?Number(months):null,active:true}]);
    setPlanName(""); setPrice(""); setPromo(""); setMonths(""); setMessage("Plan añadido a la demostración. No se guardó en el servidor.");
  }
  function saveProspect(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan || !seller.trim() || !sds.trim() || !client.trim() || !rut.trim() || !email.trim() || !phone.trim() || !address.trim()) return;
    if (prospects.some(p => p.sds.toLowerCase() === sds.trim().toLowerCase())) { setMessage("La referencia SDS ya está registrada en esta demostración."); return; }
    setProspects(prev => [{id:"TV-"+String(prev.length+1).padStart(4,"0"),zone,seller:seller.trim(),sds:sds.trim(),client:client.trim(),rut:rut.trim(),email:email.trim(),phone:phone.trim(),address:address.trim(),planId:selectedPlan.id,status:"borrador",createdAt:new Date().toLocaleString("es-CL")},...prev]);
    setMessage("Borrador creado solo en esta sesión. No se enviaron datos ni correos."); setClient("");setRut("");setEmail("");setPhone("");setAddress("");setSds("");
  }
  return <main className="min-h-screen bg-slate-100 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5"><div><div className="text-xl font-black tracking-tight text-blue-800">TSDS <span className="text-slate-900">VALIDA</span></div><div className="text-xs text-slate-500">Confirmación digital de prospectos · Entorno de diseño</div></div><a className="text-sm font-semibold text-blue-700 hover:underline" href="/hub">Volver al HUB</a></div></header>
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Prototipo sin conexión:</strong> los datos de esta página existen únicamente en la memoria de esta pestaña. No hay autenticación, envío de correos, persistencia ni integración con SDS Web. No ingreses información real de clientes.</div>
      <nav className="mb-7 flex flex-wrap gap-2">{([["inicio","Inicio"],["vendedor","Vendedores"],["backoffice","Backoffice"],["admin","cPanel Admin"]] as const).map(([id,label])=><button key={id} className={view===id?btn:secondary} onClick={()=>{setView(id);setMessage("");}}>{label}</button>)}</nav>
      {message && <div role="status" className="mb-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">{message}</div>}
      {view==="inicio" && <><h1 className="mb-2 text-3xl font-bold">Control de validaciones comerciales</h1><p className="mb-6 text-slate-600">SDS Mobile → Prospecto TSDS → Confirmación del cliente → Revisión Backoffice → SDS Web.</p><div className="grid gap-4 md:grid-cols-3">{[["Vendedores","Registrar la venta SDS y seleccionar un plan autorizado.","vendedor"],["Backoffice","Revisar confirmaciones y gestionar zonas asignadas.","backoffice"],["Administración","Gestionar planes, usuarios y zonas.","admin"]].map(([title,desc,target])=><button key={target} onClick={()=>setView(target as typeof view)} className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm hover:border-blue-400"><h2 className="mb-2 text-lg font-bold">{title}</h2><p className="text-sm text-slate-600">{desc}</p><span className="mt-5 block text-sm font-bold text-blue-700">Abrir módulo →</span></button>)}</div></>}
      {view==="vendedor" && <section className="rounded-2xl bg-white p-6 shadow-sm"><h1 className="mb-1 text-2xl font-bold">Nuevo prospecto</h1><p className="mb-6 text-sm text-slate-500">Primero ingresa la venta en SDS Mobile. Luego completa este formulario.</p><form onSubmit={saveProspect} className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold">Zona<select className={input+" mt-1"} value={zone} onChange={e=>setZone(e.target.value as Zone)}>{ZONES.map(z=><option key={z}>{z}</option>)}</select></label>
        <label className="text-sm font-semibold">Nombre del vendedor<input required className={input+" mt-1"} value={seller} onChange={e=>setSeller(e.target.value)} /></label>
        <label className="text-sm font-semibold">Referencia SDS Mobile<input required className={input+" mt-1"} value={sds} onChange={e=>setSds(e.target.value)}/></label>
        <label className="text-sm font-semibold">Nombre completo del cliente<input required className={input+" mt-1"} value={client} onChange={e=>setClient(e.target.value)}/></label>
        <label className="text-sm font-semibold">RUT<input required className={input+" mt-1"} value={rut} onChange={e=>setRut(e.target.value)} placeholder="Solo datos ficticios"/></label>
        <label className="text-sm font-semibold">Teléfono<input required className={input+" mt-1"} value={phone} onChange={e=>setPhone(e.target.value)}/></label>
        <label className="text-sm font-semibold">Correo del cliente<input required type="email" className={input+" mt-1"} value={email} onChange={e=>setEmail(e.target.value)}/></label>
        <label className="text-sm font-semibold">Dirección de instalación<input required className={input+" mt-1"} value={address} onChange={e=>setAddress(e.target.value)}/></label>
        <label className="text-sm font-semibold md:col-span-2">Plan preconfigurado<select required className={input+" mt-1"} value={planId} onChange={e=>setPlanId(e.target.value)}><option value="">Seleccionar plan</option>{activePlans.map(p=><option value={p.id} key={p.id}>{p.name} — {format(p.promo??p.price)}{p.promo?" promoción":""}</option>)}</select></label>
        {selectedPlan && <div className="rounded-xl bg-blue-50 p-4 text-sm md:col-span-2"><strong>{selectedPlan.name}</strong> · Precio normal {format(selectedPlan.price)}{selectedPlan.promo!==null&&<> · Promoción {format(selectedPlan.promo)} por {selectedPlan.months} meses</>}</div>}
        <div className="md:col-span-2"><button className={btn} disabled={!selectedPlan}>Guardar borrador de prueba</button><p className="mt-2 text-xs text-slate-500">El envío al cliente se habilitará tras implementar autenticación, almacenamiento y correo.</p></div>
      </form></section>}
      {view==="backoffice" && <section><h1 className="mb-2 text-2xl font-bold">Bandeja Backoffice</h1><p className="mb-5 text-sm text-slate-600">Vista demostrativa. El acceso por usuario y las restricciones de zona aún no están implementados.</p><div className="mb-5 grid gap-3 sm:grid-cols-3">{[["Pendientes cliente",prospects.filter(p=>p.status==="pendiente_cliente").length],["Confirmadas cliente",prospects.filter(p=>p.status==="aceptado_cliente").length],["Aprobadas SDS",prospects.filter(p=>p.status==="aprobado_sds").length]].map(([label,n])=><div key={label} className="rounded-xl bg-white p-5 shadow-sm"><div className="text-sm text-slate-500">{label}</div><div className="mt-2 text-3xl font-bold">{n}</div></div>)}</div><div className="mb-4 grid gap-3 sm:grid-cols-3"><input className={input} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar referencia, vendedor, cliente"/><select className={input} value={filterZone} onChange={e=>setFilterZone(e.target.value)}><option value="TODAS">Todas las zonas</option>{ZONES.map(z=><option key={z}>{z}</option>)}</select><select className={input} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>{["TODOS","borrador","pendiente_cliente","aceptado_cliente","rechazado_cliente","observado","aprobado_sds"].map(s=><option key={s} value={s}>{s.replaceAll("_"," ")}</option>)}</select></div><div className="space-y-3">{filtered.map(p=><div key={p.id} className="rounded-xl bg-white p-5 shadow-sm"><div className="flex flex-wrap justify-between gap-2"><strong>{p.id} · {p.client}</strong><span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{p.status.replaceAll("_"," ")}</span></div><p className="mt-2 text-sm text-slate-600">{p.zone} · {p.seller} · SDS {p.sds} · {plans.find(x=>x.id===p.planId)?.name}</p><p className="mt-1 text-xs text-slate-500">Registrado {p.createdAt}</p></div>)}{filtered.length===0&&<div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">No hay prospectos para mostrar.</div>}</div></section>}
      {view==="admin" && <section className="grid gap-5 lg:grid-cols-2"><div className="rounded-2xl bg-white p-6 shadow-sm"><h1 className="mb-2 text-xl font-bold">Catálogo comercial</h1><p className="mb-5 text-sm text-slate-500">Crear planes manualmente. Los precios no serán editables por vendedores.</p><form onSubmit={savePlan} className="space-y-3"><label className="block text-sm font-semibold">Nombre del plan<input required className={input+" mt-1"} value={planName} onChange={e=>setPlanName(e.target.value)}/></label><label className="block text-sm font-semibold">Producto<select className={input+" mt-1"} value={category} onChange={e=>setCategory(e.target.value)}>{["ONLYNET","DUO","TV","DGO"].map(c=><option key={c}>{c}</option>)}</select></label><label className="block text-sm font-semibold">Precio normal CLP<input required type="number" min="1" className={input+" mt-1"} value={price} onChange={e=>setPrice(e.target.value)}/></label><div className="grid grid-cols-2 gap-3"><label className="text-sm font-semibold">Precio promocional<input type="number" min="1" className={input+" mt-1"} value={promo} onChange={e=>setPromo(e.target.value)}/></label><label className="text-sm font-semibold">Meses promoción<input type="number" min="1" className={input+" mt-1"} value={months} onChange={e=>setMonths(e.target.value)}/></label></div><button className={btn}>Agregar plan de prueba</button></form><div className="mt-5 space-y-2">{plans.map(p=><div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border p-3"><div><strong>{p.name}</strong><div className="text-xs text-slate-500">{p.category} · {format(p.price)} {p.promo!==null?"· Promo "+format(p.promo):""}</div></div><button className={secondary} onClick={()=>setPlans(prev=>prev.map(x=>x.id===p.id?{...x,active:!x.active}:x))}>{p.active?"Desactivar":"Activar"}</button></div>)}</div></div><div className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="mb-2 text-xl font-bold">Usuarios y zonas</h2><p className="mb-4 text-sm text-slate-600">La versión conectada permitirá crear cuentas Backoffice individuales, asignar múltiples zonas, desactivar accesos y registrar quién aprueba cada venta.</p><div className="grid grid-cols-2 gap-2">{ZONES.map(z=><div key={z} className="rounded-lg bg-slate-100 p-3 text-sm font-medium">{z}</div>)}</div><div className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">La creación de cuentas se habilitará solo cuando esté conectado Supabase Auth y los permisos por zona estén protegidos en el servidor.</div></div></section>}
    </div>
  </main>;
}
