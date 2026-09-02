"use client";

import Link from "next/link";

export default function PostVisitaForm() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <section className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-blue-950/10">
        <header className="bg-gradient-to-r from-sky-700 to-blue-700 px-6 py-7 text-white sm:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-100">TSDS</p>
          <h1 className="mt-1 text-3xl font-black">POST VISITA</h1>
          <p className="mt-2 max-w-2xl text-sm text-blue-100">
            Envío de información y soporte a clientes después de una visita técnica.
          </p>
        </header>

        <div className="p-6 sm:p-8">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-lg font-bold text-slate-800">Módulo habilitado correctamente</p>
            <p className="mt-2 text-sm text-slate-500">
              El siguiente paso será cargar el Excel y detectar automáticamente los suscriptores.
            </p>
          </div>

          <Link href="/" className="mt-6 inline-block text-sm font-bold text-blue-700 hover:text-blue-900">
            ← Volver al centro de soporte
          </Link>
        </div>
      </section>
    </main>
  );
}
