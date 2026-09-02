"use client";

import { useState } from "react";
import Link from "next/link";

export default function PostVisitaLogin() {
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function ingresar(event: React.FormEvent) {
    event.preventDefault();
    setCargando(true);
    setError("");

    const response = await fetch("/api/ingresoventa/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clave }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "No fue posible ingresar.");
      setCargando(false);
      return;
    }

    window.location.reload();
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 flex items-center justify-center">
      <section className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl shadow-blue-950/10">
        <div className="bg-gradient-to-br from-sky-700 to-blue-700 px-8 py-9 text-center text-white">
          <p className="text-5xl font-black tracking-tight">TSDS</p>
          <h1 className="mt-2 text-xl font-semibold">Post visita</h1>
          <p className="mt-2 text-sm text-blue-100">Envío de información y soporte a clientes atendidos</p>
        </div>

        <form onSubmit={ingresar} className="space-y-5 p-8">
          <div>
            <label htmlFor="clave" className="mb-2 block text-sm font-bold text-slate-700">
              Clave de acceso
            </label>
            <input
              id="clave"
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
              autoFocus
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              placeholder="Ingrese la clave"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>
          )}

          <button
            disabled={cargando}
            className="w-full rounded-xl bg-blue-700 py-3.5 font-bold text-white transition hover:bg-blue-800 disabled:bg-slate-400"
          >
            {cargando ? "VALIDANDO…" : "INGRESAR"}
          </button>

          <Link href="/" className="block text-center text-sm font-semibold text-slate-500 hover:text-blue-700">
            Volver al centro de soporte
          </Link>
        </form>
      </section>
    </main>
  );
}
