import { authorized, chileDate } from "@/lib/backoffice-auth";
import Backoffice from "./backoffice-client";
export const metadata = {title:"Backoffice | TSDS",robots:{index:false,follow:false}};
export default async function Page() { return <Backoffice authenticated={await authorized()} today={chileDate()} />; }
