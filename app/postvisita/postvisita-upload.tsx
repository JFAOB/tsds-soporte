"use client";

import { useRef, useState } from "react";

type ArchivoInfo = {
  nombre: string;
  tamano: string;
};

function formatearTamano(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PostVisitaUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<ArchivoInfo | null>(null);
  const [error, setError] = useState("");

  function seleccionarArchivo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError("");

    if (!file) return;

    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension || !["xlsx", "xls", "csv"].includes(extension)) {
      setArchivo(null);
      setError("Seleccione un archivo Excel (.xlsx, .xls) o CSV.");
      event.target.value = "";
      return;
    }

    setArchivo({
      nombre: file.name,
      tamano: formatearTamano(file.size),
    });
  }

  function limpiar() {
    setArchivo(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <div className="text-4xl">📂</div>
      <h2 className="mt-3 text-xl font-black text-slate-800">Carga de clientes</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
        Selecciona el archivo con las visitas finalizadas. En el siguiente paso leeremos automáticamente los suscriptores.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={seleccionarArchivo}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-6 rounded-xl bg-blue-700 px-7 py-3 font-bold text-white transition hover:bg-blue-800"
      >
        📂 CARGAR EXCEL
      </button>

      {archivo && (
        <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Archivo cargado</p>
              <p className="mt-1 break-all font-bold text-slate-800">{archivo.nombre}</p>
              <p className="mt-1 text-sm text-slate-500">{archivo.tamano}</p>
            </div>
            <button
              type="button"
              onClick={limpiar}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
            >
              Quitar
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mx-auto mt-5 max-w-xl rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
