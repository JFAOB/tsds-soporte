import Link from "next/link";
import { redirect } from "next/navigation";
import { staffSession } from "@/lib/valida-auth";
export const dynamic="force-dynamic";
export default async function BackofficeValida(){
 const user=await staffSession();if(!user)redirect("/valida/acceso");
 return <main className="min-h-screen bg-slate-100 p-6"><div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-sm"><div className="flex flex-wrap justify-between gap-3"><h1 className="text-2xl font-bold text-blue-800">TSDS VALIDA · Backoffice</h1><Link href="/valida" className="text-blue-700">Inicio</Link></div><p className="mt-3">Bienvenido, <strong>{user.name}</strong> · {user.role==="admin"?"Administrador":"Backoffice"}</p><p className="mt-4 text-sm text-slate-600">Zonas autorizadas: {user.zones.join(", ")||"Sin zonas asignadas"}</p><div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm">El acceso está protegido con sesión y perfil activo. La bandeja real de prospectos se habilitará al conectar sus operaciones y permisos.</div>{user.role==="admin"&&<Link href="/valida/admin/planes" className="mt-6 inline-block rounded-lg bg-blue-700 px-4 py-3 font-bold text-white">Administrar planes</Link>}</div></main>;
}
