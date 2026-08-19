import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "tsds_ingreso_venta";

export function ventaCookieName() {
  return COOKIE_NAME;
}

export function configuredPassword() {
  return process.env.INGRESO_VENTA_CLAVE ?? "";
}

export function sessionToken(password: string) {
  return createHmac("sha256", password)
    .update("tsds-ingreso-venta-session-v1")
    .digest("hex");
}

export function validSession(value: string | undefined) {
  const password = configuredPassword();
  if (!password || !value) return false;

  const expected = sessionToken(password);
  if (value.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}
