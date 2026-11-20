import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
const projectUrl = process.env.VALIDA_SUPABASE_URL;
const publicKey = process.env.VALIDA_SUPABASE_ANON_KEY;
const secretKey = process.env.VALIDA_SUPABASE_SERVICE_ROLE_KEY;
export const SESSION_COOKIE = "tsds_valida_access";
export function authClient() {
  if (!projectUrl || !publicKey) return null;
  return createClient(projectUrl, publicKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function privateClient() {
  if (!projectUrl || !secretKey) return null;
  return createClient(projectUrl, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function staffSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const auth = authClient();
  const db = privateClient();
  if (!token || !auth || !db) return null;
  const { data: { user }, error } = await auth.auth.getUser(token);
  if (error || !user) return null;
  const { data: staff, error: staffError } = await db.rpc("valida_staff_lookup",{p_user_id:user.id}).single();
  if (staffError || !staff?.active) return null;
  return { userId: user.id, email: user.email ?? "", name: staff.display_name as string, role: staff.role as "admin" | "backoffice", zones: staff.role === "admin" ? ["CONCEPCION","TEMUCO","VALDIVIA","OSORNO","PUERTO MONTT","COYHAIQUE","PUNTA ARENAS","ONLINE"] : (staff.zones??[]) };
}
