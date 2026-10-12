"use strict";
function allowedSender(sender) {try{const url=new URL(sender.url);return ["tsds.cl","www.tsds.cl"].includes(url.hostname)&&url.protocol==="https:"&&url.pathname.replace(/\/$/,"")==="/postvisita";}catch{return false;}}
browser.runtime.onMessage.addListener((message,sender)=>{
  if(!allowedSender(sender))return undefined;
  if(message?.kind==="tsds:ping")return Promise.resolve({ok:true,version:"0.1.0"});
  if(message?.kind!=="tsds:lookup")return undefined;
  return (async()=>{try{
    if(typeof message.cliente!=="string"||!/^\d{5,15}$/.test(message.cliente))throw new Error("Nº de cliente no válido.");
    const tabs=await browser.tabs.query({url:"https://sistemas.directv.cl/AW080_Eservice/*"}),ready=[];
    for(const tab of tabs){try{const probe=await browser.tabs.sendMessage(tab.id,{kind:"tsds:probe"});if(probe?.ready)ready.push(tab);}catch{/* Tab not yet loaded or login required. */}}
    if(ready.length!==1)throw new Error(ready.length>1?"Deja abierta Consulta cliente en una sola pestaña de DIRECTV.":"Abre Consulta cliente en DIRECTV. Si ya está abierta, recarga DIRECTV y abre nuevamente la consulta.");
    return await browser.tabs.sendMessage(ready[0].id,{kind:"tsds:consult",cliente:message.cliente});
  }catch(error){return {ok:false,error:error.message||"No fue posible conectar con DIRECTV."};}})();
});
