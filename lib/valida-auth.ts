import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
const projectUrl = (process.env.VALIDA_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
const publicKey = (process.env.VALIDA_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const secretKey = (process.env.VALIDA_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
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
  const profile=staff as {user_id:string;display_name:string;role:"admin"|"backoffice";active:boolean;zones:string[]} | null;
  if (staffError || !profile?.active) return null;
  return { userId: user.id, email: user.email ?? "", name: profile.display_name as string, role: profile.role as "admin" | "backoffice", zones: profile.role === "admin" ? ["CONCEPCION","TEMUCO","VALDIVIA","OSORNO","PUERTO MONTT","COYHAIQUE","PUNTA ARENAS","ONLINE"] : (profile.zones??[]) };
}
