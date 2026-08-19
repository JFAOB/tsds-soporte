import { cookies } from "next/headers";
import { validSession, ventaCookieName } from "@/lib/venta-auth";
import IngresoVentaForm from "./venta-form";
import LoginForm from "./login-form";

export default async function IngresoVentaPage() {
  const cookieStore = await cookies();
  const authenticated = validSession(cookieStore.get(ventaCookieName())?.value);

  return authenticated ? <IngresoVentaForm /> : <LoginForm />;
}
