import { NextResponse } from "next/server";
import { authClient, SESSION_COOKIE, staffSession } from "@/lib/valida-auth";
export async function GET() {
  const session = await staffSession();
  if (!session) return NextResponse.json({error:"Sesión no autorizada."},{status:401,headers:{"Cache-Control":"no-store"}});
  return NextResponse.json({session},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request: Request) {
  const auth = authClient();
  if (!auth || !process.env.VALIDA_SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({error:"Autenticación aún no configurada."},{status:503});
  let body: {email?:unknown;password?:unknown};
  try { body=await request.json(); } catch { return NextResponse.json({error:"Solicitud inválida."},{status:400}); }
  if(typeof body.email!=="string" || typeof body.password!=="string" || body.email.length>254 || body.password.length>256 || !(body.email.includes("@") || body.email.trim().toLowerCase()==="admin")) return NextResponse.json({error:"Credenciales inválidas."},{status:400});
  const loginEmail=body.email.trim().toLowerCase()==="admin"?"jocares@tsds.cl":body.email.trim();
  const {data,error}=await auth.auth.signInWithPassword({email:loginEmail,password:body.password});
  if(error || !data.session) return NextResponse.json({error:"Usuario o contraseña incorrectos."},{status:401});
  const response=NextResponse.json({ok:true});
  response.cookies.set(SESSION_COOKIE,data.session.access_token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:Math.min(data.session.expires_in,3600)});
  // The session must also be verified against staff before granting any data access.
  return response;
}
export async function DELETE() {
  const response=NextResponse.json({ok:true});
  response.cookies.set(SESSION_COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:0});
  return response;
}
