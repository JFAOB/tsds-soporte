import { NextResponse } from "next/server";
import { privateClient, staffSession } from "@/lib/valida-auth";
const ZONES=new Set(["CONCEPCION","TEMUCO","VALDIVIA","OSORNO","PUERTO MONTT","COYHAIQUE","PUNTA ARENAS","ONLINE"]);
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 const current=await staffSession();if(current?.role!=="admin")return NextResponse.json({error:"Solo administradores."},{status:403});
 const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({error:"ID inválido."},{status:400});
 const db=privateClient();if(!db)return NextResponse.json({error:"Servicio no configurado."},{status:503});
 const {data:target,error:lookupError}=await db.schema("valida").from("staff").select("role,active").eq("user_id",id).single();
 if(lookupError||!target||target.role!=="backoffice")return NextResponse.json({error:"Solo se pueden modificar cuentas Backoffice."},{status:403});
 let b:Record<string,unknown>;try{b=await request.json();}catch{return NextResponse.json({error:"Datos inválidos."},{status:400});}
 const hasZones=Object.prototype.hasOwnProperty.call(b,"zones");
 if(hasZones&&(!Array.isArray(b.zones)||b.zones.length<1||b.zones.length>8||!b.zones.every(z=>typeof z==="string"&&ZONES.has(z))||new Set(b.zones).size!==b.zones.length))return NextResponse.json({error:"Zonas inválidas."},{status:400});
 if(b.password!==undefined&&(typeof b.password!=="string"||b.password.length<12||b.password.length>128))return NextResponse.json({error:"La contraseña debe tener entre 12 y 128 caracteres."},{status:400});
 if(b.active!==undefined&&typeof b.active!=="boolean")return NextResponse.json({error:"Estado inválido."},{status:400});
 if(b.password===undefined&&!hasZones&&b.active===undefined)return NextResponse.json({error:"No hay cambios."},{status:400});
 // Apply zone and status changes before password changes; every API read must re-check staff.active.
 if(hasZones){
   const previous=await db.schema("valida").from("staff_zones").select("zone_code").eq("user_id",id);
   if(previous.error)return NextResponse.json({error:"No se pudieron consultar las zonas."},{status:503});
   const del=await db.schema("valida").from("staff_zones").delete().eq("user_id",id);
   if(del.error)return NextResponse.json({error:"No se pudieron modificar las zonas."},{status:503});
   const ins=await db.schema("valida").from("staff_zones").insert((b.zones as string[]).map(zone_code=>({user_id:id,zone_code})));
   if(ins.error){
     await db.schema("valida").from("staff_zones").insert((previous.data??[]).map(z=>({user_id:id,zone_code:z.zone_code})));
     return NextResponse.json({error:"No se pudieron guardar las zonas."},{status:503});
   }
 }
 if(b.active!==undefined){
   const update=await db.schema("valida").from("staff").update({active:b.active}).eq("user_id",id).eq("role","backoffice");
   if(update.error)return NextResponse.json({error:"No se pudo actualizar el estado."},{status:503});
 }
 if(typeof b.password==="string"){
   const updated=await db.auth.admin.updateUserById(id,{password:b.password});
   if(updated.error)return NextResponse.json({error:"No se pudo cambiar la contraseña."},{status:503});
 }
 await db.schema("valida").from("audit_events").insert({actor_id:current.userId,action:"staff_updated",metadata:{staff_user_id:id,zones:hasZones?b.zones:undefined,active:b.active,password_changed:typeof b.password==="string"}});
 return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
}
