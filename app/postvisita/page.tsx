import { cookies } from "next/headers";
import { validSession, ventaCookieName } from "@/lib/venta-auth";
import PostVisitaLogin from "./postvisita-login";
import PostVisitaUpload from "./postvisita-upload";

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
          <PostVisitaUpload />
        </div>
      </section>
    </main>
  );
}
