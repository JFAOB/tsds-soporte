import Link from "next/link";
const options=[
 {title:"VENDEDORES",detail:"Ingreso de ventas por zona",href:"/valida/vendedores"},
 {title:"BACKOFFICE",detail:"Revisión y validación de prospectos",href:"/valida/acceso?rol=backoffice"},
 {title:"ADMINISTRADOR",detail:"Configuración y control de usuarios",href:"/valida/acceso?rol=admin"}
];
export default function ValidaInicio(){
 return <main className="flex min-h-screen items-center justify-center bg-white px-5 py-12 text-slate-900">
 <div className="w-full max-w-lg">
 <div className="mb-9 flex flex-col items-center text-center">
 <img src="/logo-tsds-white.png" alt="TSDS" className="h-auto w-52 max-w-full object-contain" />
 <div className="mt-3 text-3xl font-black tracking-[.38em] text-blue-700">VALIDA</div>
 <p className="mt-3 text-sm text-slate-600">Plataforma de validación de ventas</p>
 </div>
 <div className="space-y-3">{options.map(item=><Link key={item.title} href={item.href} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 shadow-lg backdrop-blur transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
 
 <span className="min-w-0 flex-1"><strong className="block text-base tracking-wide">{item.title}</strong><span className="mt-1 block text-sm text-slate-600">{item.detail}</span></span>
 <span aria-hidden="true" className="text-2xl text-blue-600">›</span></Link>)}</div>
 <div className="mt-8 text-center text-xs text-slate-500">TSDS · VALIDA v1.0</div>
 </div></main>;
}