import {createHmac,createHash,timingSafeEqual,randomBytes} from "node:crypto";
import {cookies} from "next/headers";
export const HUB_COOKIE="tsds_hub_session";
const password=()=>process.env.HUB_PASSWORD??"";
const secret=()=>process.env.HUB_SESSION_SECRET??"";
export const configured=()=>password().length>=8&&secret().length>=32;
export function matches(input:string){if(!configured())return false;return timingSafeEqual(createHash("sha256").update(input).digest(),createHash("sha256").update(password()).digest());}
const sign=(data:string)=>createHmac("sha256",secret()).update(data).digest("hex");
export function token(){const data=`${Math.floor(Date.now()/1000)+43200}.${randomBytes(16).toString("hex")}`;return `${data}.${sign(data)}`;}
export function valid(value?:string){if(!configured()||!value)return false;const [exp,nonce,sig,...rest]=value.split(".");if(rest.length||!/^\d+$/.test(exp??"")||!nonce||!sig||Number(exp)<=Date.now()/1000)return false;const expected=sign(`${exp}.${nonce}`);return sig.length===expected.length&&timingSafeEqual(Buffer.from(sig),Buffer.from(expected));}
export async function authorized(){return valid((await cookies()).get(HUB_COOKIE)?.value);}
export function sameOrigin(req:Request){try{const origin=req.headers.get("origin");return !!origin&&new URL(origin).host===req.headers.get("host")&&["https:","http:"].includes(new URL(origin).protocol);}catch{return false;}}
