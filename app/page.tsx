"use client";

import { useState } from "react";

export default function Home() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setCargando(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    const response = await fetch("https://formspree.io/f/mwleedje", {
      method: "POST",
      body: data,
      headers: {
        Accept: "application/json",
      },
    });

    setCargando(false);

    if (response.ok) {
      setEnviado(true);
      form.reset();
    } else {
      alert("Ocurrió un error al enviar la solicitud. Intente nuevamente.");
    }
  }

  if (enviado) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <div className="text-6xl mb-6">✅</div>

          <h1 className="text-3xl font-bold text-blue-700 mb-4">
            Solicitud enviada
          </h1>

          <p className="text-gray-700 leading-7">
            Su solicitud fue enviada correctamente.
            <br />
            <br />
            Será contactado en el menor tiempo posible por nuestro equipo de
            asistencia técnica.
          </p>

          <button
            onClick={() => {
              setEnviado(false);
              setMostrarFormulario(false);
            }}
            className="mt-8 w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition"
          >
            VOLVER AL INICIO
          </button>
        </div>
      </main>
    );
  }

  if (mostrarFormulario) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full"
        >
          <h1 className="text-4xl font-bold text-center text-blue-700 mb-2">
            TSDS
          </h1>

          <h2 className="text-2xl font-semibold text-center text-gray-900 mb-8">
            Centro de Soporte
          </h2>

          <div className="space-y-4">
            <input
              name="nombre"
              required
              type="text"
              placeholder="Nombre del titular"
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <input
              name="rut"
              required
              type="text"
              placeholder="RUT del titular"
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <input
              name="comuna"
              required
              type="text"
              placeholder="Comuna"
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <input
              name="telefono"
              required
              type="tel"
              placeholder="Teléfono de contacto"
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <select
              name="problema"
              required
              defaultValue=""
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="" disabled>
                Seleccione un problema
              </option>
              <option>Sin servicio de Internet</option>
              <option>Sin servicio de Televisión</option>
              <option>Otros</option>
            </select>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
            >
              {cargando ? "ENVIANDO..." : "ENVIAR"}
            </button>

            <button
              type="button"
              onClick={() => setMostrarFormulario(false)}
              className="w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-100 transition"
            >
              VOLVER
            </button>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
        <h1 className="text-5xl font-bold text-blue-700 mb-2">
          TSDS
        </h1>

        <h2 className="text-2xl font-semibold text-gray-900 mb-10">
          Centro de Soporte
        </h2>

        <button
          onClick={() => setMostrarFormulario(true)}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-4 rounded-lg transition"
        >
          PROBLEMAS CON MI SERVICIO
        </button>
      </div>
    </main>
  );
}