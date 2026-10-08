import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authorized, chileDate, sameOrigin } from "@/lib/backoffice-auth";
import { vendedores, normalizar } from "@/lib/backoffice-vendedores";
function database() {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Falta configurar la conexión de Supabase en el servidor.");
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
function reply(data: unknown, status=200) { return NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}}); }
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function GET(request: Request) {
  if (!await authorized()) return reply({error:"Sesión finalizada. Ingresa nuevamente."},401);
  const fecha = new URL(request.url).searchParams.get("fecha") ?? chileDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(fecha)) || new Date(fecha).toISOString().slice(0,10)!==fecha) return reply({error:"Fecha no válida."},400);
  try {
    const db=database(); const rows=[];
    for (let offset=0;;offset+=1000) {
      const {data,error}=await db.from("backoffice_registros").select("id,fecha,cliente,vendedor,zona,tipo_venta,backoffice,created_at").eq("fecha",fecha).order("created_at",{ascending:false}).order("id").range(offset,offset+999);
      if(error) return reply({error:"No fue posible cargar los registros. Verifica la tabla Backoffice."},500);
      rows.push(...data); if(data.length<1000) break;
    }
    return reply({registros:rows});
  } catch { return reply({error:"Falta configurar la conexión de Supabase en el servidor."},503); }
}
async function mutate(request: Request, method: "POST"|"PATCH"|"DELETE") {
  if (!sameOrigin(request)) return reply({error:"Solicitud no válida."},403);
  if (!await authorized()) return reply({error:"Sesión finalizada. Ingresa nuevamente."},401);
  const body=await request.json().catch(()=>null);
  if (!body || (method!=="POST" && (typeof body.id!=="string" || !uuid.test(body.id)))) return reply({error:"Registro no válido."},400);
  const text=(key: string,max: number)=>typeof body[key]==="string" && body[key].trim().length>0 && body[key].trim().length<=max;
  const vendedor=typeof body.vendedor==="string"?vendedores.find(v=>normalizar(v.nombre)===normalizar(body.vendedor)):undefined;
  if(method!=="DELETE" && (!text("cliente",160)||!text("backoffice",80)||!vendedor||!["TV","NET","REINGRESO"].includes(body.tipo_venta))) return reply({error:"Completa los campos y selecciona un vendedor del listado."},400);
  try {
    const db=database();
    if(method==="DELETE") {
      const {data,error}=await db.from("backoffice_registros").delete().eq("id",body.id).select("id").maybeSingle();
      return error?reply({error:"No fue posible eliminar el registro."},500):!data?reply({error:"El registro ya no existe."},404):reply({ok:true});
    }
    const fields={cliente:body.cliente.trim(),vendedor:vendedor!.nombre,zona:vendedor!.zona,tipo_venta:body.tipo_venta,backoffice:body.backoffice.trim()};
    const query=method==="POST"?db.from("backoffice_registros").insert({...fields,fecha:chileDate()}):db.from("backoffice_registros").update(fields).eq("id",body.id);
    const {data,error}=await query.select().maybeSingle();
    return error?reply({error:"No fue posible guardar el registro."},500):!data?reply({error:"El registro ya no existe."},404):reply({registro:data},method==="POST"?201:200);
  } catch { return reply({error:"Falta configurar la conexión de Supabase en el servidor."},503); }
}
export async function POST(r: Request) { return mutate(r,"POST"); }
export async function PATCH(r: Request) { return mutate(r,"PATCH"); }
export async function DELETE(r: Request) { return mutate(r,"DELETE"); }
