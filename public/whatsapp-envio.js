// SIEMDES bridge adapted to local drafts. Opening WhatsApp does not prove sending.
import { datosPlantillaDe, renderPlantillaWhatsapp, enlaceWhatsapp, textoNico } from './whatsapp-model.js';
import { createDraftStore } from './draft-store.js';
import { PROJECT } from './config.js';
export const CLAVES_WHATSAPP = ['primer_contacto','recontacto','interesado','rechazo','cultivo','cierre'];
export const cargarPlantillasWhatsapp = async (store=null) => {
  const local=store?.getTemplates();if(local)return local;
  const response=await fetch('./plantillas.json',{cache:'no-store'});
  if(!response.ok)throw new Error('No se pudieron leer las plantillas.');
  return (await response.json()).whatsapp;
};
export const construirMensajeWhatsapp = ({plantilla,prospect,envios=[],enlaces={}}) => textoNico(renderPlantillaWhatsapp(plantilla?.texto || '',datosPlantillaDe(prospect,{envios,enlaces})));
export const mensajeDePlantilla = (paquete,clave,prospect,envios=[]) => construirMensajeWhatsapp({plantilla:paquete?.plantillas?.[clave],prospect,envios,enlaces:paquete?.enlaces});
// En el celular, navegar en la misma pestaña es lo que abre la app de WhatsApp.
// En escritorio se mantiene la pestaña nueva; los tests inyectan su propio open.
const abrirEnNavegador = (url) => {
  if (typeof window === 'undefined') throw new Error('No hay navegador para abrir WhatsApp.');
  const esMovil = window.matchMedia?.('(pointer: coarse)').matches ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  if (esMovil) {
    window.location.href = url;
    return { navegacion: true };
  }
  const tab = window.open(url, '_blank');
  if (!tab) throw new Error('El navegador bloqueo la ventana de WhatsApp. Permite ventanas para este sitio.');
  try { tab.opener = null; } catch {}
  return tab;
};
export const abrirWhatsapp = (telefono,mensaje,open=abrirEnNavegador) => {
  const enlace=enlaceWhatsapp(telefono,mensaje);
  if(!enlace)throw new Error('Registra un telefono mexicano valido antes de abrir WhatsApp.');
  const tab=open(enlace,'_blank');
  if(!tab)throw new Error('El navegador bloqueo la ventana de WhatsApp. Permite ventanas para este sitio.');
  try{tab.opener=null;}catch{}
  return enlace;
};
export const enviarWhatsappDeProspecto = async ({prospect,plantilla,mensaje,user='Usuario',store=null,open,now=new Date()}) => {
  if(!prospect?.id)throw new Error('Prospecto sin ID.');
  const text=textoNico(mensaje);if(!text)throw new Error('Escribe un mensaje.');
  if(!store){
    const {auth}=await import('./firebase.js');
    if(!auth.currentUser?.uid)throw new Error('Inicia sesion antes de preparar WhatsApp.');
    store=createDraftStore(localStorage,auth.currentUser.uid);
  }
  const row=store.rows([prospect]).find(p=>p.id===prospect.id) || prospect;
  const enlace=abrirWhatsapp(row.phone,text,open);
  const event={note:'WhatsApp preparado. Envio pendiente de confirmacion del operador.',event:'whatsapp_preparado',channel:'whatsapp',message:text,template:plantilla?.titulo || 'Mensaje manual',campaign:PROJECT.campaign,date:now.toISOString(),user};
  const updated={...row,followUpNotes:[...(row.followUpNotes || []),event]};
  store.save(updated);
  return {enlace,prospect:updated};
};
