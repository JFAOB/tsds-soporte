"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import cobertura from "./cobertura-data.json";

type Cobertura = {
  region: string;
  comuna: string;
  plazo: string;
  fibra: string;
  servicioTecnico: string;
};

const nombresRegion: Record<string, string> = {
  "REGION 8": "Región del Biobío",
  "REGION 16": "Región de Ñuble",
  "REGION 9": "Región de La Araucanía",
  "REGION 14": "Región de Los Ríos",
  "REGION 10": "Región de Los Lagos",
  "REGION 11": "Región de Aysén",
  "REGION 12": "Región de Magallanes",
};

const ordenRegiones = [
  "REGION 8",
  "REGION 16",
  "REGION 9",
  "REGION 14",
  "REGION 10",
  "REGION 11",
  "REGION 12",
];

function normalizar(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function SelectFiltro({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
      >
        {children}
      </select>
    </label>
  );
}

export default function CoberturaClient() {
  const datos = cobertura as Cobertura[];
  const [busqueda, setBusqueda] = useState("");
  const [region, setRegion] = useState("");
  const [plazo, setPlazo] = useState("");
  const [fibra, setFibra] = useState("");
  const [servicio, setServicio] = useState("");

  const resultados = useMemo(() => {
    const termino = normalizar(busqueda.trim());

    return datos.filter((item) => {
      const coincideBusqueda =
        !termino ||
        normalizar(item.comuna).includes(termino) ||
        normalizar(nombresRegion[item.region] || item.region).includes(termino);

      return (
        coincideBusqueda &&
        (!region || item.region === region) &&
        (!plazo || item.plazo === plazo) &&
        (!fibra || item.fibra === fibra) &&
        (!servicio || item.servicioTecnico === servicio)
      );
    });
  }, [busqueda, datos, fibra, plazo, region, servicio]);

  const resumen = useMemo(
    () => ({
      fibra: resultados.filter((item) => item.fibra === "SI").length,
      servicio: resultados.filter((item) => item.servicioTecnico === "SI").length,
      ruta: resultados.filter((item) => item.plazo === "SE HACE RUTA").length,
    }),
    [resultados],
  );

  const hayFiltros = Boolean(busqueda || region || plazo || fibra || servicio);

  function limpiarFiltros() {
    setBusqueda("");
    setRegion("");
    setPlazo("");
    setFibra("");
    setServicio("");
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-sky-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Volver al inicio de TSDS">
            <Image
              src="/logo-tsds.png"
              alt="TSDS"
              width={154}
              height={54}
              priority
              className="h-11 w-auto object-contain"
            />
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
          >
            Volver al inicio
          </Link>
        </div>
      </header>

      <section className="bg-gradient-to-br from-sky-700 via-sky-600 to-blue-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-sky-100">
            Consulta territorial
          </p>
          <h1 className="max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            Cobertura TSDS
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-sky-50 sm:text-lg">
            Busca una comuna y revisa el plazo de atención, la disponibilidad de fibra y el tipo de soporte disponible.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="-mt-14 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-300/30 sm:p-6">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Buscar comuna
            </span>
            <div className="relative">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Ejemplo: Concepción, Osorno o Punta Arenas"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </div>
          </label>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SelectFiltro label="Región" value={region} onChange={setRegion}>
              <option value="">Todas las regiones</option>
              {ordenRegiones.map((item) => (
                <option key={item} value={item}>
                  {nombresRegion[item]}
                </option>
              ))}
            </SelectFiltro>

            <SelectFiltro label="Plazo" value={plazo} onChange={setPlazo}>
              <option value="">Todos los plazos</option>
              <option value="CORTO PLAZO">Corto plazo</option>
              <option value="SE HACE RUTA">Se hace ruta</option>
            </SelectFiltro>

            <SelectFiltro label="Instalación de fibra" value={fibra} onChange={setFibra}>
              <option value="">Todas las opciones</option>
              <option value="SI">Sí instalamos</option>
              <option value="NO">No instalamos</option>
            </SelectFiltro>

            <SelectFiltro label="Atención técnica" value={servicio} onChange={setServicio}>
              <option value="">Todas las opciones</option>
              <option value="SI">Sí atendemos</option>
              <option value="SOLO VENTA">Solo venta</option>
            </SelectFiltro>
          </div>

          {hayFiltros && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="mt-5 text-sm font-bold text-sky-700 transition hover:text-sky-900"
            >
              Limpiar filtros
            </button>
          )}
        </section>

        <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <p className="text-2xl font-black text-slate-900 sm:text-3xl">{resultados.length}</p>
            <p className="mt-1 text-sm font-medium text-slate-500">Comunas encontradas</p>
          </article>
          <article className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 sm:p-5">
            <p className="text-2xl font-black text-emerald-700 sm:text-3xl">{resumen.fibra}</p>
            <p className="mt-1 text-sm font-medium text-emerald-700">Con instalación de fibra</p>
          </article>
          <article className="rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
            <p className="text-2xl font-black text-blue-700 sm:text-3xl">{resumen.servicio}</p>
            <p className="mt-1 text-sm font-medium text-blue-700">Con atención técnica</p>
          </article>
          <article className="rounded-2xl border border-amber-100 bg-amber-50 p-4 sm:p-5">
            <p className="text-2xl font-black text-amber-700 sm:text-3xl">{resumen.ruta}</p>
            <p className="mt-1 text-sm font-medium text-amber-700">Atendidas mediante ruta</p>
          </article>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 sm:text-2xl">Resultados</h2>
              <p className="mt-1 text-sm text-slate-500">Información obtenida desde la base de cobertura TSDS.</p>
            </div>
          </div>

          {resultados.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {resultados.map((item) => {
                const tieneFibra = item.fibra === "SI";
                const tieneServicio = item.servicioTecnico === "SI";
                const esRuta = item.plazo === "SE HACE RUTA";

                return (
                  <article
                    key={`${item.region}-${item.comuna}`}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-sky-700">
                          {nombresRegion[item.region] || item.region}
                        </p>
                        <h3 className="mt-1 text-xl font-black text-slate-900">{item.comuna}</h3>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                          esRuta
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {esRuta ? "Se hace ruta" : "Corto plazo"}
                      </span>
                    </div>

                    <dl className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Fibra</dt>
                        <dd className={`mt-1 text-sm font-black ${tieneFibra ? "text-emerald-700" : "text-rose-700"}`}>
                          {tieneFibra ? "Sí instalamos" : "No instalamos"}
                        </dd>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Servicio técnico</dt>
                        <dd className={`mt-1 text-sm font-black ${tieneServicio ? "text-blue-700" : "text-amber-700"}`}>
                          {tieneServicio ? "Sí atendemos" : "Solo venta"}
                        </dd>
                      </div>
                    </dl>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <h3 className="text-lg font-black text-slate-800">No encontramos coincidencias</h3>
              <p className="mt-2 text-sm text-slate-500">Prueba con otra comuna o limpia los filtros aplicados.</p>
              <button
                type="button"
                onClick={limpiarFiltros}
                className="mt-5 rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sky-800"
              >
                Mostrar toda la cobertura
              </button>
            </div>
          )}
        </section>

        <p className="mt-10 pb-8 text-center text-xs leading-5 text-slate-500">
          La cobertura puede requerir validación técnica según la dirección exacta del cliente.
        </p>
      </div>
    </main>
  );
}
