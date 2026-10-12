"use strict";
let running=false,blocked=false;
const modal=()=>document.getElementById("modalInfoCliente");
function ready(){const element=modal();return !blocked&&element&&element.getClientRects().length>0&&element.querySelector("#txtNroSuscriptor")&&element.querySelector("#btnBuscarCliente");}
function emailNode(){const root=modal();if(!root)return null;for(const row of root.querySelectorAll(".item-row-q")){const label=row.querySelector(".nombre");if(label?.textContent.trim().toLowerCase()==="email")return row.querySelector(".dato");}return null;}
function loading(){return [...document.querySelectorAll(".loader-overlay")].some(node=>getComputedStyle(node).display!=="none"&&getComputedStyle(node).visibility!=="hidden"&&Number(getComputedStyle(node).opacity)!==0);}
async function consult(cliente){
  if(running)return {ok:false,error:"Hay una consulta en curso. Espera a que termine."};
  if(!/^\d{5,15}$/.test(cliente)||!ready())return {ok:false,error:"Abre Consulta cliente en DIRECTV o recarga la página si una consulta anterior no terminó."};
  running=true;
  try{
    if(loading())throw new Error("DIRECTV está cargando. Espera antes de iniciar.");
    const root=modal(),input=root.querySelector("#txtNroSuscriptor"),button=root.querySelector("#btnBuscarCliente");
    // Clear only displayed results; the server data and customer account are never changed.
    for(const node of root.querySelectorAll(".formPopupDatos .dato"))node.textContent="";
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;setter.call(input,cliente);input.dispatchEvent(new Event("input",{bubbles:true}));input.dispatchEvent(new Event("change",{bubbles:true}));
    const started=Date.now();let lastChange=started,changed=false;
    const observer=new MutationObserver(()=>{changed=true;lastChange=Date.now();});observer.observe(root,{subtree:true,childList:true,characterData:true});
    try{
      button.click();
      while(Date.now()-started<25000){
        await new Promise(resolve=>setTimeout(resolve,200));
        if(!modal()||!root.isConnected||input.value!==cliente||!root.getClientRects().length){blocked=true;throw new Error("La consulta cambió o la sesión terminó. Recarga DIRECTV antes de continuar.");}
        const node=emailNode();
        if(changed&&Date.now()-lastChange>=800&&!loading()&&node){
          const email=node.textContent.trim().toLowerCase();
          if(!email)return {ok:true,cliente,email:"",status:"sin_correo"};
          if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return {ok:true,cliente,email:"",status:"correo_invalido"};
          return {ok:true,cliente,email,status:"encontrado"};
        }
      }
      blocked=true;throw new Error("DIRECTV no confirmó un resultado nuevo. Recarga DIRECTV antes de volver a intentar.");
    }finally{observer.disconnect();}
  }catch(error){return {ok:false,error:error.message||"No fue posible consultar el cliente."};}finally{running=false;}
}
browser.runtime.onMessage.addListener(message=>{if(message?.kind==="tsds:probe")return Promise.resolve({ready:Boolean(ready())});if(message?.kind==="tsds:consult")return consult(message.cliente);return undefined;});
