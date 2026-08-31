"use client";

import { useEffect, useState } from "react";

const ciudades = [
  { nombre: "CONCEPCIÓN", lat: -36.827, lon: -73.050 },
  { nombre: "LOS ÁNGELES", lat: -37.469, lon: -72.353 },
  { nombre: "TEMUCO", lat: -38.736, lon: -72.590 },
  { nombre: "VALDIVIA", lat: -39.814, lon: -73.245 },
  { nombre: "OSORNO", lat: -40.574, lon: -73.133 },
  { nombre: "PUERTO MONTT", lat: -41.469, lon: -72.943 },
  { nombre: "COYHAIQUE", lat: -45.575, lon: -72.067 },
  { nombre: "PUNTA ARENAS", lat: -53.163, lon: -70.917 },
];

type Dia = {
  fecha: string;
  max: number;
  min: number;
  lluvia: number;
  viento: number;
  codigo: number;
};

type ClimaCiudad = {
  nombre: string;
  hoy: Dia;
  manana: Dia;
};

function descripcionClima(codigo: number) {
  if (codigo === 0) return "Despejado";
  if (codigo === 1) return "Mayormente despejado";
  if (codigo === 2) return "Parcialmente nublado";
  if (codigo === 3) return "Nublado";
  if ([45, 48].includes(codigo)) return "Niebla";
  if ([51, 53, 55].includes(codigo)) return "Llovizna";
  if ([56, 57].includes(codigo)) return "Llovizna helada";
  if ([61, 63, 65].includes(codigo)) return "Lluvia";
  if ([66, 67].includes(codigo)) return "Lluvia helada";
  if ([71, 73, 75, 77].includes(codigo)) return "Nieve";
  if ([80, 81, 82].includes(codigo)) return "Chubascos";
  if ([85, 86].includes(codigo)) return "Chubascos de nieve";
  if ([95, 96, 99].includes(codigo)) return "Tormenta";

  return "Variable";
}

function iconoClima(codigo: number) {
  if (codigo === 0) return "☀️";
  if ([1, 2].includes(codigo)) return "🌤️";
  if (codigo === 3) return "☁️";
  if ([45, 48].includes(codigo)) return "🌫️";

  if (
    [
      51, 53, 55, 56, 57,
      61, 63, 65, 66, 67,
      80, 81, 82,
    ].includes(codigo)
  )
    return "🌧️";

  if ([71, 73, 75, 77, 85, 86].includes(codigo))
    return "🌨️";

  if ([95, 96, 99].includes(codigo))
    return "⛈️";

  return "🌦️";
}

export default function TTCC() {
  const [climas, setClimas] = useState<ClimaCiudad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  async function cargarClima() {
    setCargando(true);
    setError(false);

    try {
      const resultados = await Promise.all(
        ciudades.map(async (ciudad) => {
          const url =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${ciudad.lat}` +
            `&longitude=${ciudad.lon}` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max` +
            `&timezone=America%2FSantiago` +
            `&forecast_days=2`;

          const response = await fetch(url);

          if (!response.ok) {
            throw new Error("Error consultando clima");
          }

          const data = await response.json();

          return {
            nombre: ciudad.nombre,

            hoy: {
              fecha: data.daily.time[0],
              max: data.daily.temperature_2m_max[0],
              min: data.daily.temperature_2m_min[0],
              lluvia: data.daily.precipitation_probability_max[0],
              viento: data.daily.wind_speed_10m_max[0],
              codigo: data.daily.weather_code[0],
            },

            manana: {
              fecha: data.daily.time[1],
              max: data.daily.temperature_2m_max[1],
              min: data.daily.temperature_2m_min[1],
              lluvia: data.daily.precipitation_probability_max[1],
              viento: data.daily.wind_speed_10m_max[1],
              codigo: data.daily.weather_code[1],
            },
          };
        })
      );

      setClimas(resultados);
    } catch (err) {
      console.error(err);
      setError(true);
    }

    setCargando(false);
  }

  useEffect(() => {
    cargarClima();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-[1600px] mx-auto">

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">
              TSDS
            </h1>

            <p className="text-gray-600">
              Condiciones meteorológicas
            </p>
          </div>

          <button
            onClick={cargarClima}
            disabled={cargando}
            className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white px-5 py-2 rounded-lg font-semibold"
          >
            {cargando ? "ACTUALIZANDO..." : "ACTUALIZAR"}
          </button>
        </div>

        {cargando && climas.length === 0 && (
          <div className="text-center py-20 text-gray-600">
            Consultando condiciones meteorológicas...
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            No fue posible obtener la información meteorológica.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

          {climas.map((ciudad) => (
            <div
              key={ciudad.nombre}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >

              <div className="bg-blue-800 text-white text-center py-3">
                <h2 className="font-bold text-lg">
                  {ciudad.nombre}
                </h2>
              </div>

              <div className="grid grid-cols-2 divide-x divide-gray-200">

                <DiaClima
                  titulo="HOY"
                  dia={ciudad.hoy}
                />

                <DiaClima
                  titulo="MAÑANA"
                  dia={ciudad.manana}
                />

              </div>
            </div>
          ))}

        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          Información meteorológica actualizada mediante Open-Meteo.
        </div>

      </div>
    </main>
  );
}

function DiaClima({
  titulo,
  dia,
}: {
  titulo: string;
  dia: Dia;
}) {
  return (
    <div className="p-4 text-center">

      <div className="font-bold text-blue-800 mb-2">
        {titulo}
      </div>

      <div className="text-4xl mb-2">
        {iconoClima(dia.codigo)}
      </div>

      <div className="font-semibold text-gray-800 min-h-[48px]">
        {descripcionClima(dia.codigo)}
      </div>

      <div className="mt-3 text-lg font-bold text-gray-900">
        {Math.round(dia.max)}° / {Math.round(dia.min)}°
      </div>

      <div className="text-xs text-gray-500">
        Máx. / Mín.
      </div>

      <div className="border-t border-gray-100 mt-3 pt-3 space-y-1 text-sm text-gray-700">

        <div>
          🌧️ Lluvia{" "}
          <strong>{dia.lluvia ?? 0}%</strong>
        </div>

        <div>
          💨 Viento{" "}
          <strong>{Math.round(dia.viento)} km/h</strong>
        </div>

      </div>

    </div>
  );
}