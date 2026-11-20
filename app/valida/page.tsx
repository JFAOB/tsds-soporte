import Link from "next/link";
const options=[
 {title:"VENDEDORES",detail:"Ingreso de ventas por zona",href:"/valida/vendedores",icon:"01"},
 {title:"BACKOFFICE",detail:"Revisión y validación de prospectos",href:"/valida/acceso?rol=backoffice",icon:"02"},
 {title:"ADMINISTRADOR",detail:"Configuración y control de usuarios",href:"/valida/acceso?rol=admin",icon:"03"}
];
export default function ValidaInicio(){
 return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-5 py-12 text-white">
 <div className="w-full max-w-lg">
 <div className="mb-9 flex flex-col items-center text-center">
 <img src="/logo-tsds-white.png" alt="TSDS" className="h-auto w-52 max-w-full object-contain" />
 <div className="mt-3 text-3xl font-black tracking-[.38em] text-sky-300">VALIDA</div>
 <p className="mt-3 text-sm text-slate-300">Plataforma de validación de ventas</p>
 </div>
 <div className="space-y-3">{options.map(item=><Link key={item.title} href={item.href} className="group flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 px-5 py-5 shadow-lg backdrop-blur transition hover:border-sky-300 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300">
 <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-400/15 text-sm font-black text-sky-300">{item.icon}</span>
 <span className="min-w-0 flex-1"><strong className="block text-base tracking-wide">{item.title}</strong><span className="mt-1 block text-sm text-slate-300">{item.detail}</span></span>
 <span aria-hidden="true" className="text-2xl text-sky-300">›</span></Link>)}</div>
 <div className="mt-8 text-center text-xs text-slate-400">TSDS · VALIDA v1.0</div>
 </div></main>;
}