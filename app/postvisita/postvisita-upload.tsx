"use client";

import { useRef, useState } from "react";

type ArchivoInfo = {
  nombre: string;
  tamano: string;
};

type XLSXApi = {
  read: (data: ArrayBuffer, options?: Record<string, unknown>) => {
    SheetNames: string[];
    Sheets: Record<string, unknown>;
  };
  utils: {
    sheet_to_json: (sheet: unknown, options?: Record<string, unknown>) => unknown[][];
  };
};

declare global {
  interface Window {
    XLSX?: XLSXApi;
  }
}

function formatearTamano(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizar(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function esColumnaSuscriptor(value: unknown) {
  const texto = normalizar(value);
  return [
    "suscriptor",
    "numerosuscriptor",
    "nrosuscriptor",
    "numsuscriptor",
    "idsuscriptor",
    "subscriber",
    "subscriberid",
  ].includes(texto);
}

function cargarXlsx() {
  return new Promise<XLSXApi>((resolve, reject) => {
    if (window.XLSX) {
      resolve(window.XLSX);
      return;
    }

    const existente = document.querySelector<HTMLScriptElement>("script[data-tsds-xlsx]");
    if (existente) {
      existente.addEventListener("load", () => {
        if (window.XLSX) resolve(window.XLSX);
        else reject(new Error("No se pudo iniciar el lector de Excel."));
      });
      existente.addEventListener("error", () => reject(new Error("No se pudo cargar el lector de Excel.")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    script.async = true;
    script.dataset.tsdsXlsx = "true";
    script.onload = () => {
      if (window.XLSX) resolve(window.XLSX);
      else reject(new Error("No se pudo iniciar el lector de Excel."));
    };
    script.onerror = () => reject(new Error("No se pudo cargar el lector de Excel."));
    document.head.appendChild(script);
  });
}

export default function PostVisitaUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<ArchivoInfo | null>(null);
  const [suscriptores, setSuscriptores] = useState<string[]>([]);
  const [leyendo, setLeyendo] = useState(false);
  const [error, setError] = useState("");

  async function seleccionarArchivo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError("");
    setSuscriptores([]);

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
    setLeyendo(true);

    try {
      const XLSX = await cargarXlsx();
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const primeraHoja = workbook.SheetNames[0];

      if (!primeraHoja) throw new Error("El archivo no contiene hojas.");

      const filas = XLSX.utils.sheet_to_json(workbook.Sheets[primeraHoja], {
        header: 1,
        defval: "",
        raw: false,
      });

      let filaCabecera = -1;
      let columnaSuscriptor = -1;

      for (let i = 0; i < Math.min(filas.length, 25); i += 1) {
        const fila = Array.isArray(filas[i]) ? filas[i] : [];
        const indice = fila.findIndex(esColumnaSuscriptor);
        if (indice >= 0) {
          filaCabecera = i;
          columnaSuscriptor = indice;
          break;
        }
      }

      if (filaCabecera < 0 || columnaSuscriptor < 0) {
        throw new Error("No encontré una columna llamada SUSCRIPTOR en el archivo.");
      }

      const encontrados: string[] = [];
      const repetidos = new Set<string>();

      for (let i = filaCabecera + 1; i < filas.length; i += 1) {
        const fila = Array.isArray(filas[i]) ? filas[i] : [];
        const valor = String(fila[columnaSuscriptor] ?? "").trim();
        if (!valor) continue;

        const limpio = valor.replace(/\.0$/, "").replace(/\s+/g, "");
        if (!limpio || repetidos.has(limpio)) continue;

        repetidos.add(limpio);
        encontrados.push(limpio);
      }

      if (encontrados.length === 0) {
        throw new Error("Encontré la columna SUSCRIPTOR, pero no contiene datos.");
      }

      setSuscriptores(encontrados);
    } catch (err) {
      setSuscriptores([]);
      setError(err instanceof Error ? err.message : "No fue posible leer el archivo.");
    } finally {
      setLeyendo(false);
    }
  }

  function limpiar() {
    setArchivo(null);
    setSuscriptores([]);
    setLeyendo(false);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <div className="text-4xl">📂</div>
        <h2 className="mt-3 text-xl font-black text-slate-800">Carga de clientes</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
          Selecciona el archivo con las visitas finalizadas. Buscaremos automáticamente la columna SUSCRIPTOR.
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
          disabled={leyendo}
          className="mt-6 rounded-xl bg-blue-700 px-7 py-3 font-bold text-white transition hover:bg-blue-800 disabled:bg-slate-400"
        >
          {leyendo ? "LEYENDO EXCEL…" : "📂 CARGAR EXCEL"}
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

      {suscriptores.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-blue-700">Lectura correcta</p>
              <h3 className="text-lg font-black text-slate-800">
                {suscriptores.length} suscriptores detectados
              </h3>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-700">OK</span>
          </div>

          <div className="max-h-80 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white text-xs uppercase text-slate-500 shadow-sm">
                <tr>
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Suscriptor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suscriptores.map((suscriptor, index) => (
                  <tr key={`${suscriptor}-${index}`}>
                    <td className="px-5 py-3 text-slate-400">{index + 1}</td>
                    <td className="px-5 py-3 font-bold text-slate-800">{suscriptor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
