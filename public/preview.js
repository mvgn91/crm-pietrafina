// Port SIEMDES preview.js: isolated, synthetic PF dataset and session-only opt-in.
import { dateInput, addDays } from './pipeline-model.js';
import { PROJECT } from './config.js';
export const isPreviewEnabled = () => typeof location !== 'undefined' && new URLSearchParams(location.search).get('preview')==='1';
export const setPreviewUserBadge = () => {
  const el=document.getElementById('user-name-display');if(el)el.textContent='Vista previa · datos ficticios';
};
export const getDemoProspects = (now=new Date()) => {
  const list=[];
  const overdue=addDays(now,-((now.getDay()+6)%7)-3);
  const add=(n,status,fields={})=>{for(let i=0;i<n;i++)list.push({id:`demo-${list.length+1}`,businessName:`Ejemplo PF ${list.length+1}`,contactPerson:'Contacto de ejemplo',phone:'',classification:['Showrooms de Baños / Cocinas','Diseño de Interiores','Despacho de Arquitectos'][list.length%3],status,nextFollowUpDate:null,createdAt:new Date(now.getTime()-40*86400000).toISOString(),followUpNotes:[],...fields});};
  add(53,'En Prospección');add(2,'En Prospección',{nextFollowUpDate:overdue});
  add(3,'Interesado');add(2,'Interesado',{nextFollowUpDate:overdue});
  add(3,'Seguimiento agendado',{nextFollowUpDate:overdue});
  add(31,'Seguimiento agendado');add(1,'No contesta');
  add(2,'Convertido a cliente');add(1,'Rechazado');
  add(2,'Revisión Admin Pendiente',{contactPerson:''});add(2,'Completado',{contactPerson:''});add(1,'Reactivar Contacto',{contactPerson:''});
  list[0].followUpNotes=[{note:'Campaña de Alianza Estratégica enviada.',date:dateInput(now),user:'Demo',campaign:PROJECT.campaign,channel:'correo',outcome:'enviado'}];
  return list;
};
export const previewMessage = (text,element) => {if(element)element.textContent=String(text || '');return String(text || '');};
