import {NextResponse} from "next/server";
import {HUB_COOKIE,sameOrigin} from "@/lib/hub-auth";
export async function POST(req:Request){if(!sameOrigin(req))return NextResponse.json({error:"Origen no autorizado"},{status:403});const response=NextResponse.json({ok:true});response.cookies.set(HUB_COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:0});return response;}
