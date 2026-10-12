"use strict";
window.addEventListener("message",event=>{
  const data=event.data;
  if(event.source!==window||event.origin!==location.origin||data?.source!=="TSDS_POSTVISITA_REQUEST"||typeof data.id!=="string"||!["ping","lookup"].includes(data.action))return;
  browser.runtime.sendMessage({kind:data.action==="ping"?"tsds:ping":"tsds:lookup",cliente:data.cliente}).then(result=>window.postMessage({source:"TSDS_POSTVISITA_RESPONSE",id:data.id,result},location.origin)).catch(()=>window.postMessage({source:"TSDS_POSTVISITA_RESPONSE",id:data.id,result:{ok:false,error:"La extensión perdió la conexión. Recarga Postvisita."}},location.origin));
});
