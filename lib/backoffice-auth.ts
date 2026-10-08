import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
export const BO_COOKIE = "tsds_backoffice";
export function configuration() { return { code: process.env.BACKOFFICE_CODIGO ?? "", secret: process.env.BACKOFFICE_SESSION_SECRET ?? "" }; }
function sign(value: string) { return createHmac("sha256", configuration().secret).update(value).digest("hex"); }
export function issueSession() { const value = `${Math.floor(Date.now()/1000)+43200}.${randomBytes(16).toString("hex")}`; return `${value}.${sign(value)}`; }
export function validToken(token?: string) {
  if (!token || !configuration().code || configuration().secret.length < 32) return false;
  const [expiry, nonce, signature, extra] = token.split(".");
  if (extra || !expiry || !nonce || !signature || !/^\d+$/.test(expiry) || Number(expiry) <= Date.now()/1000) return false;
  const expected = sign(`${expiry}.${nonce}`);
  return signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
export async function authorized() { return validToken((await cookies()).get(BO_COOKIE)?.value); }
export function sameOrigin(request: Request) { const origin = request.headers.get("origin");
  if (!origin) return false;
  try { const url = new URL(origin); return ["http:", "https:"].includes(url.protocol) && url.host === request.headers.get("host"); } catch { return false; } }
export function chileDate() {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {timeZone:"America/Santiago",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()).map(p=>[p.type,p.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
