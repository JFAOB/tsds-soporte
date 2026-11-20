import Link from "next/link";
import { redirect } from "next/navigation";
import { privateClient, staffSession } from "@/lib/valida-auth";
export const dynamic="force-dynamic";
type Staff={role:string;active:boolean;zones:string[]};
export default async function ValidaAdmin(){
 const user=await staffSession();if(!user||user.role!=="admin")redirect("/valida/acceso?rol=admin");
 const db=privateClient();
 const result=db?await db.rpc("valida_staff_list"):null;
 const profiles=(result?.data??[]) as Staff[];
 const backoffice=profiles.filter(p=>p.role==="backoffice");
 const active=backoffice.filter(p=>p.active).length;
 const covered=new Set(backoffice.filter(p=>p.active).flatMap(p=>p.zones??[])).size;
 const stats=[{label:"Usuarios Backoffice",value:backoffice.length},{label:"Usuarios activos",value:active},{label:"Usuarios inactivos",value:backoffice.length-active},{label:"Zonas con cobertura",value:covered}];
 return <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900"><div className="mx-auto max-w-5xl space-y-5">
 <header className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-extrabold tracking-[.2em] text-blue-700">TSDS · VALIDA v1.2</p><h1 className="mt-2 text-2xl font-black">Panel de administración</h1><p className="mt-1 text-sm text-slate-500">Bienvenido, {user.name}</p></div><Link href="/valida" className="rounded-lg border px-4 py-2 text-sm font-semibold text-blue-700">Inicio</Link></div></header>
 {result?.error&&<p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">No se pudieron cargar las estadísticas. Puedes seguir usando los módulos.</p>}
 <section aria-label="Resumen" className="grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(s=><div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-xs font-medium text-slate-500">{s.label}</p><p className="mt-2 text-3xl font-black text-blue-800">{s.value}</p></div>)}</section>
 <section className="grid gap-3 sm:grid-cols-2"><Link href="/valida/admin/usuarios" className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition hover:border-blue-400"><p className="text-lg font-bold text-blue-800">Usuarios Backoffice →</p><p className="mt-2 text-sm text-slate-600">Crear cuentas, buscar usuarios, editar zonas y cambiar claves.</p></Link><Link href="/valida/admin/planes" className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition hover:border-blue-400"><p className="text-lg font-bold text-blue-800">Planes comerciales →</p><p className="mt-2 text-sm text-slate-600">Administrar los planes disponibles.</p></Link><section><Link href="/valida/admin/zonas" className="block rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition hover:border-blue-400"><p className="text-lg font-bold text-blue-800">Claves de acceso por zona →</p><p className="mt-2 text-sm text-slate-600">Configura una contraseña compartida para cada zona de vendedores.</p></Link></section>
 </div></main>;
}