"use client";

import { useState } from "react";
import Image from "next/image";

function limpiarRut(value: string) {
  return value.replace(/[^0-9kK]/g, "").toUpperCase();
}

function rutChilenoValido(value: string) {
  const rut = limpiarRut(value);

  if (!/^\d{7,8}[0-9K]$/.test(rut)) {
    return false;
  }

  const cuerpo = rut.slice(0, -1);
  const digitoVerificador = rut.slice(-1);
  let suma = 0;
  let multiplicador = 2;

  for (let indice = cuerpo.length - 1; indice >= 0; indice -= 1) {
    suma += Number(cuerpo[indice]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resultado = 11 - (suma % 11);
  const esperado = resultado === 11 ? "0" : resultado === 10 ? "K" : String(resultado);

  return digitoVerificador === esperado;
}

function formatearRut(value: string) {
  const rut = limpiarRut(value);
  if (rut.length < 2) return value;

  const cuerpo = rut.slice(0, -1);
  const digitoVerificador = rut.slice(-1);
  return `${Number(cuerpo).toLocaleString("es-CL")}-${digitoVerificador}`;
}

export default function Home() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const rutInput = form.elements.namedItem("rut") as HTMLInputElement;
    const telefonoInput = form.elements.namedItem("telefono") as HTMLInputElement;

    if (!rutChilenoValido(rutInput.value)) {
      rutInput.setCustomValidity("Ingrese un RUT chileno válido con su dígito verificador.");
      rutInput.reportValidity();
      rutInput.focus();
      return;
    }

    telefonoInput.value = telefonoInput.value.replace(/\D/g, "");

    setCargando(true);

    const data = Object.fromEntries(new FormData(form));

    try {
      const response = await fetch("/api/soporte", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error || "No fue posible enviar la solicitud.");
      }

      setEnviado(true);
      form.reset();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al enviar la solicitud. Intente nuevamente.",
      );
    } finally {
      setCargando(false);
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
            <div className="hidden" aria-hidden="true">
              <label htmlFor="empresa">Empresa</label>
              <input
                id="empresa"
                name="empresa"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

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
              inputMode="text"
              maxLength={12}
              placeholder="RUT del titular (ej: 12.345.678-5)"
              onInput={(event) => {
                const input = event.currentTarget;
                input.value = input.value.replace(/[^0-9kK.-]/g, "").toUpperCase();
                input.setCustomValidity("");
              }}
              onBlur={(event) => {
                const input = event.currentTarget;

                if (input.value && !rutChilenoValido(input.value)) {
                  input.setCustomValidity("Ingrese un RUT chileno válido con su dígito verificador.");
                  input.reportValidity();
                  return;
                }

                input.setCustomValidity("");
                if (input.value) input.value = formatearRut(input.value);
              }}
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
              inputMode="numeric"
              pattern="[0-9]+"
              maxLength={15}
              placeholder="Teléfono de contacto"
              onInput={(event) => {
                event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "");
              }}
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
            </select>

            <textarea
              name="comentarios"
              rows={4}
              maxLength={1000}
              placeholder="Comentarios (opcional)"
              className="w-full resize-y border border-gray-300 rounded-lg p-3 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

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
        <div className="relative mx-auto mb-4 h-40 w-full max-w-[340px] overflow-hidden">
          <Image
            src="/logo-tsds-white.png"
            alt="Televisión Satelital del Sur SpA"
            width={640}
            height={640}
            priority
            className="absolute left-1/2 top-[-72px] w-[320px] max-w-none -translate-x-1/2"
          />
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 mb-10">
          Centro de Soporte
        </h1>

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
