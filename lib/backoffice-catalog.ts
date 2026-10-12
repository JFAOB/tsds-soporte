import "server-only";
import {createClient} from "@supabase/supabase-js";
import {vendedores,normalizar} from "./backoffice-vendedores";
export const sellerKey=(name:string)=>normalizar(name).replace(/\s+/g," ");
export function sellerDatabase(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error("Conexión no configurada.");return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});}
export async function listSellers(){const db=sellerDatabase(),catalog=new Map<string,{nombre:string;zona:string}>(vendedores.map(row=>[sellerKey(row.nombre),{...row}]));for(let offset=0;;offset+=1000){const {data,error}=await db.from("backoffice_vendedores").select("nombre,zona").order("nombre_key").range(offset,offset+999);if(error)throw error;for(const row of data)catalog.set(sellerKey(row.nombre),row);if(data.length<1000)break;}return [...catalog.values()].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es"));}
