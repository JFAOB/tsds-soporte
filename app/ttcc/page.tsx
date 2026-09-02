"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const ciudades = [
  { nombre: "CONCEPCIÓN", lat: -36.827, lon: -73.05 },
  { nombre: "LOS ÁNGELES", lat: -37.469, lon: -72.353 },
  { nombre: "TEMUCO", lat: -38.736, lon: -72.59 },
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

type Evento = {
  id: number;
  fecha: string;
  motivo: string;
  tecnico: string;
};

type Formulario = {
  suscriptor: string;
  idCto: string;
  potenciaCto: string;
  clienteNavega: string;
  clienteNavego: string;
  otrosClientes: string;
  modemDomicilio: string;
  desconectadoTercero: string;
  luzPon: string;
  luzLos: string;
  luzInternet: string;
  comentarios: string;
};

const formularioInicial: Formulario = {
  suscriptor: "",
  idCto: "",
  potenciaCto: "",
  clienteNavega: "",
  clienteNavego: "",
  otrosClientes: "",
  modemDomicilio: "",
  desconectadoTercero: "",
  luzPon: "",
  luzLos: "",
  luzInternet: "",
  comentarios: "",
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
  ) {
    return "🌧️";
  }

  if ([71, 73, 75, 77, 85, 86].includes(codigo)) {
    return "🌨️";
  }

  if ([95, 96, 99].includes(codigo)) return "⛈️";

  return "🌦️";
}

function fechaLocalISO(fecha: Date) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function mostrarFecha(fecha: string) {
  const [year, month, day] = fecha.split("-");

  return `${day}/${month}/${year}`;
}

export default function TTCC() {
  const [climas, setClimas] = useState<ClimaCiudad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  // EVENTOS
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [mostrarNuevoEvento, setMostrarNuevoEvento] =
    useState(false);

  const [fechaEvento, setFechaEvento] = useState("");
  const [motivoEvento, setMotivoEvento] = useState("");
  const [tecnicoEvento, setTecnicoEvento] = useState("");

  // TICKETS
  const [tipoTicket, setTipoTicket] = useState("");
  const [formulario, setFormulario] =
    useState<Formulario>(formularioInicial);

  const [textoGenerado, setTextoGenerado] = useState("");
  const [copiado, setCopiado] = useState(false);

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
            throw new Error(
              "Error consultando clima"
            );
          }

          const data = await response.json();

          return {
            nombre: ciudad.nombre,

            hoy: {
              fecha: data.daily.time[0],
              max: data.daily.temperature_2m_max[0],
              min: data.daily.temperature_2m_min[0],
              lluvia:
                data.daily
                  .precipitation_probability_max[0],
              viento:
                data.daily.wind_speed_10m_max[0],
              codigo: data.daily.weather_code[0],
            },

            manana: {
              fecha: data.daily.time[1],
              max: data.daily.temperature_2m_max[1],
              min: data.daily.temperature_2m_min[1],
              lluvia:
                data.daily
                  .precipitation_probability_max[1],
              viento:
                data.daily.wind_speed_10m_max[1],
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

  async function cargarEventos() {
    const { data, error } = await supabase
      .from("eventos_ttcc")
      .select("id, fecha, motivo, tecnico")
      .order("fecha", { ascending: true });

    if (error) {
      console.error(
        "Error cargando eventos:",
        error
      );
      return;
    }

    setEventos(data ?? []);
  }

  useEffect(() => {
    cargarClima();
    cargarEventos();
  }, []);

  async function guardarEvento() {
    if (
      !fechaEvento ||
      !motivoEvento.trim() ||
      !tecnicoEvento.trim()
    ) {
      alert(
        "Complete fecha, motivo y técnico."
      );
      return;
    }

    const { error } = await supabase
      .from("eventos_ttcc")
      .insert({
        fecha: fechaEvento,
        motivo: motivoEvento.trim(),
        tecnico: tecnicoEvento.trim(),
      });

    if (error) {
      console.error(
        "Error guardando evento:",
        error
      );

      alert(
        "No fue posible guardar el evento."
      );

      return;
    }

    setFechaEvento("");
    setMotivoEvento("");
    setTecnicoEvento("");
    setMostrarNuevoEvento(false);

    await cargarEventos();
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const ultimoDia = new Date(hoy);
  ultimoDia.setDate(
    ultimoDia.getDate() + 4
  );

  const hoyISO = fechaLocalISO(hoy);
  const ultimoDiaISO =
    fechaLocalISO(ultimoDia);

  const eventosVisibles = eventos
    .filter(
      (evento) =>
        evento.fecha >= hoyISO &&
        evento.fecha <= ultimoDiaISO
    )
    .sort((a, b) =>
      a.fecha.localeCompare(b.fecha)
    );

  const formularioCompleto =
    tipoTicket ===
      "AT: CLIENTE SIN SERVICIO" ||
    tipoTicket ===
      "ERROR DE ACTIVACIÓN EN OPTIMUS" ||
    tipoTicket ===
      "INS: CLIENTE SIN SERVICIO";

  function actualizarCampo(
    campo: keyof Formulario,
    valor: string
  ) {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  function limpiarFormulario() {
    setFormulario(formularioInicial);
    setTextoGenerado("");
    setCopiado(false);
  }

  function generarTexto() {
    if (!tipoTicket) {
      alert(
        "Seleccione un tipo de ticket."
      );
      return;
    }

    let texto = "";

    texto += `TIPO DE TICKET: ${tipoTicket}\n`;
    texto += `Suscriptor: ${formulario.suscriptor}\n`;
    texto += `ID CTO: ${formulario.idCto}\n`;
    texto += `Potencia CTO: ${formulario.potenciaCto}\n`;

    if (formularioCompleto) {
      texto += `Cliente navega: ${formulario.clienteNavega}\n`;
      texto += `Cliente navegó: ${formulario.clienteNavego}\n`;
      texto += `CTO con otros clientes conectados: ${formulario.otrosClientes}\n`;
      texto += `Módem conectado en domicilio: ${formulario.modemDomicilio}\n`;
      texto += `Desconectado por un tercero: ${formulario.desconectadoTercero}\n`;
      texto += `Luz PON: ${formulario.luzPon}\n`;
      texto += `Luz LOS: ${formulario.luzLos}\n`;
      texto += `Luz Internet: ${formulario.luzInternet}\n`;
    }

    texto += `Comentarios: ${formulario.comentarios}`;

    setTextoGenerado(texto);
    setCopiado(false);
  }

  async function copiarTexto() {
    if (!textoGenerado) return;

    await navigator.clipboard.writeText(
      textoGenerado
    );

    setCopiado(true);

    setTimeout(() => {
      setCopiado(false);
    }, 2000);
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-3">
      <div className="max-w-[1500px] mx-auto">

        {/* CABECERA CLIMA */}
        <div className="mb-3 flex items-center justify-between">

          <div>
            <h1 className="text-2xl font-bold text-blue-800">
              TSDS
            </h1>

            <p className="text-xs text-gray-600">
              Condiciones meteorológicas
            </p>
          </div>

          <button
            onClick={cargarClima}
            disabled={cargando}
            className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-xs font-semibold"
          >
            {cargando
              ? "ACTUALIZANDO..."
              : "ACTUALIZAR"}
          </button>

        </div>

        {cargando &&
          climas.length === 0 && (
            <div className="text-center py-16 text-sm text-gray-600">
              Consultando condiciones meteorológicas...
            </div>
          )}

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-3 text-sm">
            No fue posible obtener la información meteorológica.
          </div>
        )}

        {/* CLIMA */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">

          {climas.map((ciudad) => (
            <div
              key={ciudad.nombre}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >

              <div className="bg-blue-800 text-white text-center py-2">
                <h2 className="font-bold text-sm">
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

        <div className="mt-3 text-center text-[10px] text-gray-500">
          Información meteorológica actualizada mediante Open-Meteo.
        </div>

        {/* EVENTOS */}
        <section className="mt-6">

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

            <div className="bg-blue-800 text-white px-5 py-2.5 flex items-center justify-between">

              <h2 className="font-bold text-base">
                EVENTOS
              </h2>

              <button
                type="button"
                onClick={() =>
                  setMostrarNuevoEvento(
                    !mostrarNuevoEvento
                  )
                }
                className="bg-white text-blue-800 hover:bg-gray-100 w-8 h-8 rounded-lg text-xl font-bold flex items-center justify-center"
              >
                +
              </button>

            </div>

            {mostrarNuevoEvento && (
              <div className="p-4 bg-blue-50 border-b border-gray-200">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                  <div>

                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Fecha
                    </label>

                    <input
                      type="date"
                      min={hoyISO}
                      value={fechaEvento}
                      onChange={(e) =>
                        setFechaEvento(
                          e.target.value
                        )
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                    />

                  </div>

                  <div>

                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Motivo
                    </label>

                    <input
                      type="text"
                      value={motivoEvento}
                      onChange={(e) =>
                        setMotivoEvento(
                          e.target.value
                        )
                      }
                      placeholder="Motivo del evento"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                    />

                  </div>

                  <div>

                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Técnico
                    </label>

                    <input
                      type="text"
                      value={tecnicoEvento}
                      onChange={(e) =>
                        setTecnicoEvento(
                          e.target.value
                        )
                      }
                      placeholder="Nombre técnico"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                    />

                  </div>

                </div>

                <div className="mt-3 flex gap-2">

                  <button
                    type="button"
                    onClick={guardarEvento}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-bold"
                  >
                    GUARDAR EVENTO
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setMostrarNuevoEvento(
                        false
                      )
                    }
                    className="border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold"
                  >
                    CANCELAR
                  </button>

                </div>

              </div>
            )}

            <div className="overflow-x-auto">

              <div className="grid grid-cols-[160px_1fr_1fr] bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-700">

                <div className="px-4 py-2">
                  FECHA
                </div>

                <div className="px-4 py-2">
                  MOTIVO
                </div>

                <div className="px-4 py-2">
                  TÉCNICO
                </div>

              </div>

              {eventosVisibles.length === 0 ? (

                <div className="text-center text-sm text-gray-500 py-5">
                  No hay eventos programados para los próximos 5 días.
                </div>

              ) : (

                eventosVisibles.map(
                  (evento) => (
                    <div
                      key={evento.id}
                      className="grid grid-cols-[160px_1fr_1fr] border-b last:border-b-0 border-gray-100 text-sm text-gray-800"
                    >

                      <div className="px-4 py-2.5 font-semibold">
                        {mostrarFecha(
                          evento.fecha
                        )}
                      </div>

                      <div className="px-4 py-2.5">
                        {evento.motivo}
                      </div>

                      <div className="px-4 py-2.5">
                        {evento.tecnico}
                      </div>

                    </div>
                  )
                )
              )}

            </div>

          </div>

        </section>

        {/* GENERADOR TICKET */}
        <section className="mt-6">

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

            <div className="bg-blue-800 text-white px-5 py-3">
              <h2 className="font-bold text-lg">
                Generador de texto para Ticket
              </h2>
            </div>

            <div className="p-5">

              <div className="mb-5">

                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Tipo de Ticket
                </label>

                <select
                  value={tipoTicket}
                  onChange={(e) => {
                    setTipoTicket(
                      e.target.value
                    );
                    limpiarFormulario();
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                >

                  <option value="">
                    Seleccionar...
                  </option>

                  <option>
                    AT: CLIENTE SIN SERVICIO
                  </option>

                  <option>
                    ERROR DE ACTIVACIÓN EN OPTIMUS
                  </option>

                  <option>
                    ERROR DE CAMBIO CTO/PUERTO
                  </option>

                  <option>
                    ERROR INTERVENCIÓN ASEGURADA
                  </option>

                  <option>
                    INS: CLIENTE SIN SERVICIO
                  </option>

                </select>

              </div>

              {tipoTicket && (
                <>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                    <CampoTexto
                      label="Suscriptor"
                      type="number"
                      value={
                        formulario.suscriptor
                      }
                      onChange={(v) =>
                        actualizarCampo(
                          "suscriptor",
                          v
                        )
                      }
                    />

                    <CampoTexto
                      label="ID CTO"
                      value={
                        formulario.idCto
                      }
                      onChange={(v) =>
                        actualizarCampo(
                          "idCto",
                          v
                        )
                      }
                    />

                    <CampoTexto
                      label="Potencia CTO"
                      type="number"
                      value={
                        formulario.potenciaCto
                      }
                      onChange={(v) =>
                        actualizarCampo(
                          "potenciaCto",
                          v
                        )
                      }
                    />

                    {formularioCompleto && (
                      <>

                        <Selector
                          label="Cliente navega"
                          value={
                            formulario.clienteNavega
                          }
                          opciones={[
                            "Sí",
                            "No",
                          ]}
                          onChange={(v) =>
                            actualizarCampo(
                              "clienteNavega",
                              v
                            )
                          }
                        />

                        <Selector
                          label="Cliente navegó"
                          value={
                            formulario.clienteNavego
                          }
                          opciones={[
                            "Sí",
                            "No",
                          ]}
                          onChange={(v) =>
                            actualizarCampo(
                              "clienteNavego",
                              v
                            )
                          }
                        />

                        <Selector
                          label="CTO con otros clientes conectados"
                          value={
                            formulario.otrosClientes
                          }
                          opciones={[
                            "Sí",
                            "No",
                          ]}
                          onChange={(v) =>
                            actualizarCampo(
                              "otrosClientes",
                              v
                            )
                          }
                        />

                        <Selector
                          label="Módem conectado en domicilio"
                          value={
                            formulario.modemDomicilio
                          }
                          opciones={[
                            "Sí",
                            "No",
                          ]}
                          onChange={(v) =>
                            actualizarCampo(
                              "modemDomicilio",
                              v
                            )
                          }
                        />

                        <Selector
                          label="Desconectado por un tercero"
                          value={
                            formulario.desconectadoTercero
                          }
                          opciones={[
                            "Sí",
                            "No aplica",
                            "No",
                          ]}
                          onChange={(v) =>
                            actualizarCampo(
                              "desconectadoTercero",
                              v
                            )
                          }
                        />

                        <Selector
                          label="Luz PON"
                          value={
                            formulario.luzPon
                          }
                          opciones={[
                            "Apagado",
                            "Verde fijo",
                            "Verde parpadea",
                          ]}
                          onChange={(v) =>
                            actualizarCampo(
                              "luzPon",
                              v
                            )
                          }
                        />

                        <Selector
                          label="Luz LOS"
                          value={
                            formulario.luzLos
                          }
                          opciones={[
                            "Apagado",
                            "Rojo fijo",
                            "Rojo parpadea",
                          ]}
                          onChange={(v) =>
                            actualizarCampo(
                              "luzLos",
                              v
                            )
                          }
                        />

                        <Selector
                          label="Luz Internet"
                          value={
                            formulario.luzInternet
                          }
                          opciones={[
                            "Apagado",
                            "Verde fijo",
                            "Verde parpadea",
                          ]}
                          onChange={(v) =>
                            actualizarCampo(
                              "luzInternet",
                              v
                            )
                          }
                        />

                      </>
                    )}

                  </div>

                  <div className="mt-4">

                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Comentarios
                    </label>

                    <textarea
                      value={
                        formulario.comentarios
                      }
                      onChange={(e) =>
                        actualizarCampo(
                          "comentarios",
                          e.target.value
                        )
                      }
                      rows={4}
                      placeholder="Ingrese comentarios..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                    />

                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">

                    <button
                      type="button"
                      onClick={generarTexto}
                      className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold"
                    >
                      GENERAR TEXTO
                    </button>

                    <button
                      type="button"
                      onClick={
                        limpiarFormulario
                      }
                      className="border border-gray-300 hover:bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-semibold"
                    >
                      LIMPIAR
                    </button>

                  </div>

                </>
              )}

              {textoGenerado && (
                <div className="mt-6 border-t border-gray-200 pt-5">

                  <div className="flex items-center justify-between mb-2">

                    <h3 className="font-bold text-gray-900">
                      Cuerpo generado
                    </h3>

                    <button
                      type="button"
                      onClick={copiarTexto}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-semibold"
                    >
                      {copiado
                        ? "COPIADO ✓"
                        : "COPIAR TEXTO"}
                    </button>

                  </div>

                  <textarea
                    value={textoGenerado}
                    onChange={(e) =>
                      setTextoGenerado(
                        e.target.value
                      )
                    }
                    rows={14}
                    className="w-full border border-gray-300 bg-gray-50 rounded-lg px-3 py-3 text-sm text-gray-900 font-mono"
                  />

                </div>
              )}

            </div>

          </div>

        </section>

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
    <div className="px-2 py-2 text-center">

      <div className="font-bold text-blue-800 text-xs mb-1">
        {titulo}
      </div>

      <div className="text-2xl leading-none mb-1">
        {iconoClima(dia.codigo)}
      </div>

      <div className="font-semibold text-gray-800 text-[11px] min-h-[28px] flex items-center justify-center leading-tight">
        {descripcionClima(
          dia.codigo
        )}
      </div>

      <div className="mt-1 text-sm font-bold text-gray-900">
        {Math.round(dia.max)}° /{" "}
        {Math.round(dia.min)}°
      </div>

      <div className="text-[9px] text-gray-500">
        Máx. / Mín.
      </div>

      <div className="border-t border-gray-100 mt-2 pt-1.5 space-y-0.5 text-[10px] text-gray-700">

        <div>
          🌧️ Lluvia{" "}
          <strong>
            {dia.lluvia ?? 0}%
          </strong>
        </div>

        <div>
          💨 Viento{" "}
          <strong>
            {Math.round(
              dia.viento
            )}{" "}
            km/h
          </strong>
        </div>

      </div>

    </div>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (
    valor: string
  ) => void;
  type?: string;
}) {
  return (
    <div>

      <label className="block text-xs font-semibold text-gray-700 mb-1">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
      />

    </div>
  );
}

function Selector({
  label,
  value,
  opciones,
  onChange,
}: {
  label: string;
  value: string;
  opciones: string[];
  onChange: (
    valor: string
  ) => void;
}) {
  return (
    <div>

      <label className="block text-xs font-semibold text-gray-700 mb-1">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
      >

        <option value="">
          Seleccionar...
        </option>

        {opciones.map(
          (opcion) => (
            <option
              key={opcion}
              value={opcion}
            >
              {opcion}
            </option>
          )
        )}

      </select>

    </div>
  );
}