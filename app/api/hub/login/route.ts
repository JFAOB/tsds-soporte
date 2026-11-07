import {NextResponse} from "next/server";
import {configured,matches,token,HUB_COOKIE,sameOrigin} from "@/lib/hub-auth";
export async function POST(req:Request){
 if(!sameOrigin(req))return NextResponse.json({error:"Origen no autorizado."},{status:403});
 if(!configured())return NextResponse.json({error:"El administrador debe configurar HUB_PASSWORD y HUB_SESSION_SECRET en Vercel."},{status:503});
 const data=await req.json().catch(()=>null);
 if(typeof data?.password!=="string"||data.password.length>200||!matches(data.password))return NextResponse.json({error:"Contraseña incorrecta."},{status:401});
 const response=NextResponse.json({ok:true});response.cookies.set(HUB_COOKIE,token(),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:43200});return response;
}
