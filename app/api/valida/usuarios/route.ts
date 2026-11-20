import { NextResponse } from "next/server";
import { privateClient, staffSession } from "@/lib/valida-auth";
const ZONES = new Set(["CONCEPCION","TEMUCO","VALDIVIA","OSORNO","PUERTO MONTT","COYHAIQUE","PUNTA ARENAS","ONLINE"]);
const noStore = {"Cache-Control":"no-store"};
async function admin() { const s=await staffSession(); return s?.role==="admin"?s:null; }
export async function GET(){
 if(!await admin())return NextResponse.json({error:"Solo administradores."},{status:403});
 const db=privateClient();if(!db)return NextResponse.json({error:"Servicio no configurado."},{status:503});
 const users=await db.rpc("valida_staff_list");
 if(users.error)return NextResponse.json({error:"No fue posible consultar usuarios."},{status:503});
 const {data:authUsers,error:authError}=await db.auth.admin.listUsers({perPage:1000});
 if(authError)return NextResponse.json({error:"No fue posible consultar cuentas."},{status:503});
 const emails=new Map(authUsers.users.map(u=>[u.id,u.email?.endsWith("@users.valida.tsds.invalid")?u.email.split("@")[0]:(u.email==="jocares@tsds.cl"?"admin":u.email??"")]));
 return NextResponse.json({users:(users.data??[]).map(u=>({...u,username:emails.get(u.user_id)??"",zones:u.zones??[]}))},{headers:noStore});
}
export async function POST(request:Request){
 const current=await admin();if(!current)return NextResponse.json({error:"Solo administradores."},{status:403});
 const db=privateClient();if(!db)return NextResponse.json({error:"Servicio no configurado."},{status:503});
 let body:Record<string,unknown>;try{body=await request.json();}catch{return NextResponse.json({error:"Datos inválidos."},{status:400});}
 const name=typeof body.name==="string"?body.name.trim():"";
 const username=typeof body.username==="string"?body.username.trim().toLowerCase():"";
 const email=username+"@users.valida.tsds.invalid";
 const password=typeof body.password==="string"?body.password:"";
 const zones=body.zones;
 if(!name||name.length>120||!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)||username==="admin"||password.length<12||password.length>128||!Array.isArray(zones)||zones.length<1||zones.length>8||!zones.every(z=>typeof z==="string"&&ZONES.has(z))||new Set(zones).size!==zones.length)
 return NextResponse.json({error:"Nombre, correo, contraseña de al menos 12 caracteres y zonas válidas son obligatorios."},{status:400});
 const created=await db.auth.admin.createUser({email,password,email_confirm:true});
 if(created.error||!created.data.user)return NextResponse.json({error:"No fue posible crear la cuenta; comprueba si el correo ya existe."},{status:409});
 const id=created.data.user.id;
 const profile=await db.rpc("valida_staff_create",{p_user_id:id,p_display_name:name,p_zones:zones});
 if(profile.error){
   await db.auth.admin.deleteUser(id);
   return NextResponse.json({error:"No fue posible completar la asignación de zonas. Cuenta revertida si fue posible."},{status:503});
 }

 return NextResponse.json({ok:true,id},{status:201,headers:noStore});
}
