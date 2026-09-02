import { cookies } from "next/headers";
import { validSession, ventaCookieName } from "@/lib/venta-auth";
import PostVisitaLogin from "./postvisita-login";

export default async function PostVisitaPage() {
  const cookieStore = await cookies();
  const authenticated = validSession(cookieStore.get(ventaCookieName())?.value);

  if (!authenticated) {
    return <PostVisitaLogin />;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-blue-950/10">
        <header className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-7 text-white sm:px-9">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-100">TSDS</p>
          <h1 className="mt-1 text-3xl font-black">POST VISITA</h1>
          <p className="mt-2 max-w-2xl text-sm text-blue-100">
            Envío de información y soporte a clientes después de una visita técnica.
          </p>
        </header>

        <div className="p-6 sm:p-9">
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <div className="text-4xl">📂</div>
            <h2 className="mt-3 text-xl font-black text-slate-800">Carga de clientes</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
              En el siguiente paso habilitaremos la carga del Excel para obtener automáticamente los suscriptores atendidos.
            </p>
            <button
              type="button"
              disabled
              className="mt-6 rounded-xl bg-slate-300 px-7 py-3 font-bold text-slate-600"
            >
              CARGAR EXCEL — PRÓXIMO PASO
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
