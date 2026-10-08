import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { BO_COOKIE, configuration, issueSession, sameOrigin } from "@/lib/backoffice-auth";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({error:"Solicitud no válida."},{status:403});
  const {code,secret} = configuration();
  if (!code || secret.length < 32) return NextResponse.json({error:"Falta configurar el acceso Backoffice en el servidor."},{status:503});
  const body = await request.json().catch(()=>null);
  if (typeof body?.codigo !== "string" || body.codigo.length > 100) return NextResponse.json({error:"Código incorrecto."},{status:401});
  const hash = (s: string)=>createHash("sha256").update(s).digest();
  if (!timingSafeEqual(hash(body.codigo),hash(code))) return NextResponse.json({error:"Código incorrecto."},{status:401});
  const response = NextResponse.json({ok:true});
  response.cookies.set(BO_COOKIE,issueSession(),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:43200});
  return response;
}
