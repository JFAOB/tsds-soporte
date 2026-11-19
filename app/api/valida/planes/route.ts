import { NextResponse } from "next/server";
import { privateClient, staffSession } from "@/lib/valida-auth";
export async function GET() {
 const session=await staffSession();
 if(!session) return NextResponse.json({error:"No autorizado."},{status:401});
 const db=privateClient();
 if(!db) return NextResponse.json({error:"Servicio no configurado."},{status:503});
 const {data,error}=await db.schema("valida").from("plans").select("id,name,category,regular_price,promotional_price,promotion_months,terms,active,created_at").order("created_at",{ascending:false});
 if(error) return NextResponse.json({error:"No se pudieron consultar los planes."},{status:500});
 return NextResponse.json({plans:data},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:Request) {
 const session=await staffSession();
 if(!session || session.role!=="admin") return NextResponse.json({error:"Acceso restringido."},{status:403});
 const db=privateClient();
 if(!db) return NextResponse.json({error:"Servicio no configurado."},{status:503});
 let b:Record<string,unknown>;
 try{b=await request.json();}catch{return NextResponse.json({error:"Solicitud inválida."},{status:400});}
 const name=typeof b.name==="string"?b.name.trim():"";
 const terms=typeof b.terms==="string"?b.terms.trim():"";
 const category=typeof b.category==="string"?b.category:"";
 const price=Number(b.regular_price);
 const promo=b.promotional_price==null||b.promotional_price===""?null:Number(b.promotional_price);
 const months=b.promotion_months==null||b.promotion_months===""?null:Number(b.promotion_months);
 if(!name||name.length>150||!terms||terms.length>10000||!["ONLYNET","DUO","TV","DGO"].includes(category)||!Number.isSafeInteger(price)||price<=0||(promo!==null&&(!Number.isSafeInteger(promo)||promo<=0))||(months!==null&&(!Number.isSafeInteger(months)||months<=0))||((promo===null)!==(months===null))) return NextResponse.json({error:"Revise los datos del plan."},{status:400});
 const {data,error}=await db.schema("valida").from("plans").insert({name,category,regular_price:price,promotional_price:promo,promotion_months:months,terms}).select("id").single();
 if(error) return NextResponse.json({error:"No se pudo crear el plan."},{status:500});
 return NextResponse.json({id:data.id},{status:201});
}
