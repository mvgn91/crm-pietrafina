import { validarTransicion, toDate, diaDe } from './pipeline-model.js';
import { PROJECT } from './config.js';
import { buildCadenceTouch } from './campania-model.js';
export function recordAction(p, input = {}) {
  const {kind='reactivation',note='',outcome='sin_respuesta',channel='llamada',campaign=PROJECT.campaign,followUpDate='',newStatus=p.status,reopen=false,user='Usuario',now=new Date(),message=''}=input;
  if(!String(note).trim())throw new Error('Escribe una nota para el historial.');
  if(kind==='cadence')return buildCadenceTouch(p,{note,outcome,user,now,followUpDate,campaign,message});
  if(!['sin_respuesta','respondido','reunion','convertido','rechazado','enviado','nota'].includes(outcome))throw new Error('Resultado inválido.');
  if(!['llamada','whatsapp','correo','visita'].includes(channel))throw new Error('Canal inválido.');
  if(!String(campaign).trim())throw new Error('Indica la campaña.');
  if(followUpDate && !toDate(followUpDate))throw new Error('Fecha inválida.');
  if(['respondido','reunion'].includes(outcome) && (!toDate(followUpDate) || diaDe(followUpDate)<diaDe(now)))throw new Error('Agenda el siguiente seguimiento o visita.');
  const status=outcome==='convertido' ? 'Convertido a cliente' : outcome==='rechazado' ? 'Rechazado' : newStatus;
  const nextFollowUpDate=followUpDate || p.nextFollowUpDate || null;
  const result=validarTransicion({actual:p.status,nuevo:status,nota:note,nextFollowUpDate,permitirReapertura:reopen});
  if(!result.ok)throw new Error(result.error);
  const event={note:String(note).trim(),date:now.toISOString(),user,channel,outcome,campaign:String(campaign).trim(),event:status===p.status ? 'contacto' : 'transicion',message};
  return {...p,status,nextFollowUpDate,lastUpdated:event.date,followUpNotes:[...(p.followUpNotes || []),event],reactivation:{...p.reactivation,...(status!==p.status ? {closedStatus:status} : {})}};
}
