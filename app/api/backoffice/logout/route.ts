import { NextResponse } from "next/server";
import { BO_COOKIE, sameOrigin } from "@/lib/backoffice-auth";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({error:"Solicitud no válida."},{status:403});
  const response = NextResponse.json({ok:true});
  response.cookies.set(BO_COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:0});
  return response;
}
