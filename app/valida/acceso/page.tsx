"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
function FormularioAcceso() {
 const params=useSearchParams();
 const isAdmin=params.get("rol")==="admin";
 const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [error,setError]=useState("");const [busy,setBusy]=useState(false);
 async function login(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");try{
 const r=await fetch("/api/valida/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
 const d=await r.json();if(!r.ok)throw new Error(d.error||"Error de acceso.");
 const check=await fetch("/api/valida/auth",{cache:"no-store"});if(!check.ok){await fetch("/api/valida/auth",{method:"DELETE"});throw new Error("Tu cuenta todavía no está habilitada para TSDS Valida.");}
 if(isAdmin && d.role!=="admin"){await fetch("/api/valida/auth",{method:"DELETE"});throw new Error("Esta sección es exclusiva del administrador.");}
 window.location.assign(isAdmin?"/valida/admin":"/valida/backoffice");
 }catch(e){setError(e instanceof Error?e.message:"No fue posible ingresar.");}finally{setBusy(false);}}
 return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-5"><form onSubmit={login} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold text-blue-800">TSDS VALIDA</h1><p className="mt-2 text-sm text-slate-600">{isAdmin?"Ingreso al cPanel de administración.":"Ingreso exclusivo para usuarios Backoffice."}</p><label className="mt-6 block text-sm font-semibold">Usuario<input type="text" autoComplete="username" required className="mt-1 w-full rounded-lg border p-3" value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="mt-4 block text-sm font-semibold">Contraseña<input type="password" autoComplete="current-password" required className="mt-1 w-full rounded-lg border p-3" value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}<button disabled={busy} className="mt-6 w-full rounded-lg bg-blue-700 p-3 font-bold text-white disabled:opacity-50">{busy?"Verificando...":"Ingresar"}</button><a href="/valida" className="mt-4 block text-center text-sm text-blue-700">Volver</a></form></main>;
}
\nexport default function AccesoValida(){return <Suspense fallback={<main className="min-h-screen bg-slate-100"/>}><FormularioAcceso/></Suspense>;}\n