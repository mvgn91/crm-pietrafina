// Shared capture/history ported from SIEMDES reactivacion-script.js guardarLlamada.
import { $, esc, notify, saveDraft } from './phase2-runtime.js';
import { ESTATUS_PIPELINE, PROJECT } from './config.js';
import { recordAction } from './phase2-actions.js';
import { notesOf } from './pipeline-model.js';
import { cadenceState } from './campania-model.js';
export function mountActionForm(getWorkspace,onSave) {
  let selected=null,kind='reactivation';
  const form=$('action-form');
  form.addEventListener('submit',event=>{
    event.preventDefault();
    try{
      const ws=getWorkspace(),p=ws.rows.find(p=>p.id===selected);
      if(!p)throw new Error('Prospecto no disponible.');
      if($('action-channel').value==='whatsapp' && !$('action-confirm').checked)throw new Error('Confirma que el mensaje fue enviado antes de registrarlo.');
      const updated=recordAction(p,{kind,note:$('action-note').value,outcome:$('action-outcome').value,channel:$('action-channel').value,followUpDate:$('action-date').value,newStatus:$('action-status').value,reopen:$('action-reopen').checked,campaign:$('action-campaign').value,user:ws.user});
      saveDraft(ws,updated);form.hidden=true;notify('Registro guardado en el borrador local. Firestore no cambió.');onSave();
    }catch(error){notify(error.message);}
  });
  $('action-cancel').addEventListener('click',()=>{form.hidden=true;});
  return (id,actionKind='reactivation')=>{
    const ws=getWorkspace(),p=ws.rows.find(p=>p.id===id);if(!p)return;
    selected=id;kind=actionKind;form.reset();form.hidden=false;
    $('action-title').textContent=`${actionKind==='cadence' ? 'Registrar toque' : 'Registrar contacto / transición'} · ${p.businessName}`;
    $('action-status').replaceChildren(...ESTATUS_PIPELINE.map(s=>new Option(s,s)));
    $('action-status').value=p.status;$('action-status').disabled=kind==='cadence';
    $('action-campaign').value=PROJECT.campaign;
    for (const option of $('action-outcome').options) option.hidden = kind==='cadence' && ['enviado','nota'].includes(option.value);
    const state=cadenceState(p);
    $('action-channel').value=kind==='cadence' ? state.step?.channel || 'whatsapp' : 'llamada';
    $('action-channel').disabled=kind==='cadence';
    $('action-history').innerHTML=notesOf(p).slice().reverse().map(n=>`<li><time>${esc(String(n.date || n.at).slice(0,10))}</time> · ${esc(n.user)} · ${esc(n.note)}</li>`).join('') || '<li>Sin notas</li>';
    form.scrollIntoView({behavior:'auto',block:'start'});$('action-note').focus();
  };
}
