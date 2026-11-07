import {authorized} from "@/lib/hub-auth";
import HubClient from "./hub-client";
export const dynamic="force-dynamic";
export const metadata={title:"TSDS HUB | Acceso privado",robots:{index:false,follow:false}};
export default async function Hub(){return <HubClient initialAuth={await authorized()}/>;}
