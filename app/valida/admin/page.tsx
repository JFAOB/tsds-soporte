import Link from "next/link";
import { redirect } from "next/navigation";
import { staffSession } from "@/lib/valida-auth";
export const dynamic="force-dynamic";
export default async function ValidaAdmin(){
 const user=await staffSession();if(!user||user.role!=="admin")redirect("/valida/acceso?rol=admin");
 return <main className="min-h-screen bg-slate-100 p-5 text-slate-900"><div className="mx-auto max-w-4xl space-y-5">
 <header className="rounded-2xl bg-white p-7 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold tracking-widest text-blue-600">TSDS VALIDA</p><h1 className="mt-1 text-2xl font-black">Panel de administración</h1></div><Link href="/valida" className="text-sm text-blue-700">Volver al inicio</Link></div><p className="mt-3 text-sm text-slate-600">Administrador: {user.name}</p></header>
 <div className="grid gap-4 sm:grid-cols-2"><Link href="/valida/admin/usuarios" className="rounded-2xl bg-white p-7 shadow-sm transition hover:shadow-md"><h2 className="text-lg font-bold text-blue-800">Usuarios Backoffice</h2><p className="mt-2 text-sm text-slate-600">Crear usuarios, cambiar claves y asignar zonas.</p></Link><Link href="/valida/admin/planes" className="rounded-2xl bg-white p-7 shadow-sm transition hover:shadow-md"><h2 className="text-lg font-bold text-blue-800">Planes comerciales</h2><p className="mt-2 text-sm text-slate-600">Configurar planes y condiciones de venta.</p></Link></div>
 </div></main>;
}