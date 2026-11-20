"use client";
import Link from "next/link";
import { useState } from "react";
const ZONES=["CONCEPCION","TEMUCO","VALDIVIA","OSORNO","PUERTO MONTT","COYHAIQUE","PUNTA ARENAS","ONLINE"];
export default function AccesoVendedores(){
 const [zone,setZone]=useState(""),[password,setPassword]=useState("");
 return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-5 text-slate-900"><div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
 <div className="text-sm font-bold tracking-widest text-blue-700">TSDS VALIDA</div><h1 className="mt-2 text-2xl font-black">Acceso vendedores</h1><p className="mt-2 text-sm text-slate-600">Selecciona tu zona e ingresa la clave asignada.</p>
 <form onSubmit={e=>e.preventDefault()} className="mt-6 space-y-4"><label className="block text-sm font-semibold">Zona<select required value={zone} onChange={e=>setZone(e.target.value)} className="mt-1 w-full rounded-lg border p-3"><option value="">Seleccionar zona</option>{ZONES.map(z=><option key={z}>{z}</option>)}</select></label>
 <label className="block text-sm font-semibold">Clave<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-lg border p-3"/></label>
 <button type="submit" disabled className="w-full rounded-lg bg-blue-700 p-3 font-bold text-white opacity-50">Ingresar</button>
 <p role="status" className="text-sm text-amber-800">El ingreso de vendedores se habilitará al configurar las claves de zona y conectar el registro seguro de prospectos. No ingreses datos de clientes todavía.</p></form>
 <Link href="/valida" className="mt-5 block text-center text-sm text-blue-700">Volver al inicio</Link></div></main>;
}