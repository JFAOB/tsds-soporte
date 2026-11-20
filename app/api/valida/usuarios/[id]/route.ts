import { NextResponse } from "next/server";
import { privateClient, staffSession } from "@/lib/valida-auth";
const ZONES=new Set(["CONCEPCION","TEMUCO","VALDIVIA","OSORNO","PUERTO MONTT","COYHAIQUE","PUNTA ARENAS","ONLINE"]);
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 const current=await staffSession();if(current?.role!=="admin")return NextResponse.json({error:"Solo administradores."},{status:403});
 const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({error:"ID inválido."},{status:400});
 const db=privateClient();if(!db)return NextResponse.json({error:"Servicio no configurado."},{status:503});
 const {data:staff,error:lookupError}=await db.rpc("valida_staff_lookup",{p_user_id:id}).single();
 const profile=staff as {role:string}|null;
 if(lookupError||!profile||profile.role!=="backoffice")return NextResponse.json({error:"Solo se pueden modificar cuentas Backoffice."},{status:403});
 let b:Record<string,unknown>;try{b=await request.json();}catch{return NextResponse.json({error:"Datos inválidos."},{status:400});}
 const hasZones=Object.prototype.hasOwnProperty.call(b,"zones");
 if(hasZones&&(!Array.isArray(b.zones)||b.zones.length<1||b.zones.length>8||!b.zones.every(z=>typeof z==="string"&&ZONES.has(z))||new Set(b.zones).size!==b.zones.length))return NextResponse.json({error:"Zonas inválidas."},{status:400});
 if(b.password!==undefined&&(typeof b.password!=="string"||b.password.length<6||b.password.length>128))return NextResponse.json({error:"La contraseña debe tener entre 6 y 128 caracteres."},{status:400});
 if(b.active!==undefined&&typeof b.active!=="boolean")return NextResponse.json({error:"Estado inválido."},{status:400});
 if(b.password===undefined&&!hasZones&&b.active===undefined)return NextResponse.json({error:"No hay cambios."},{status:400});
 if(hasZones||b.active!==undefined){
   const update=await db.rpc("valida_staff_update",{p_user_id:id,p_active:b.active===undefined?null:b.active,p_zones:hasZones?b.zones:null});
   if(update.error)return NextResponse.json({error:"No se pudieron actualizar los permisos."},{status:503});
 }
 if(typeof b.password==="string"){
   const updated=await db.auth.admin.updateUserById(id,{password:b.password});
   if(updated.error)return NextResponse.json({error:"No se pudo cambiar la contraseña."},{status:503});
 }
 return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
}
