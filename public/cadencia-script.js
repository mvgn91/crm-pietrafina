// SIEMDES cadence/reminder grouping adapted to PF day 1/4/8 touch capture.
import { $, esc, notify, startWorkspace, mountNavigation, saveDraft } from './phase2-runtime.js';
import { cadenceState } from './campania-model.js';
import { recordatorioDe, resumenSemanal } from './recordatorios-model.js';
import { filtrarSegmento } from './segmentos-model.js';
import { computeEligibility, matchesSearch } from './reactivacion-model.js';
import { mountActionForm } from './phase2-forms.js';
import { cargarPlantillasWhatsapp, mensajeDePlantilla, enviarWhatsappDeProspecto } from './whatsapp-envio.js';
let workspace=null;
export const cadenceCandidates = (rows,now=new Date()) => rows.filter(p=>recordatorioDe(p,now) || computeEligibility(p,now).eligible);
export const cadenceCards = (rows,now=new Date()) => rows.map(p=>{
 const s=cadenceState(p,now),r=recordatorioDe(p,now),research=computeEligibility(p,now).requiresResearch;
 return `<article class="pf-panel"><h2>${esc(p.businessName)}</h2><p>${esc(p.status)} · ${esc(r?.fecha || 'Sin fecha')} · ${esc(r?.clave || 'sin_fecha')}</p><p>${s.complete ? 'Tres toques cerrados o respuesta registrada' : `Toque ${s.index+1}/3 · ${esc(s.step?.label)}`} · Próximo ${esc(p.sequence?.nextAt || p.nextFollowUpDate || 'Al iniciar')}</p>${research ? '<p>Investigar contacto antes de iniciar.</p>' : `<div class="pf-actions"><button class="btn btn-primary" data-touch="${esc(p.id)}" ${!s.active || !s.due ? 'disabled' : ''}>Registrar toque y resultado</button>${s.step?.channel==='whatsapp' && s.active && s.due ? `<button class="btn btn-secondary" data-whatsapp="${esc(p.id)}">Preparar WhatsApp</button>` : ''}</div>`}</article>`;
}).join('') || '<p>No hay pendientes con estos filtros.</p>';
const render=()=>{
 if(!workspace)return;
 const weekly=resumenSemanal(workspace.rows);
 $('weekly-summary').textContent=`Semana ${weekly.inicio} al ${weekly.fin} · ${weekly.vencidos.length} vencidos · ${weekly.semanaVacia ? 'Semana vacía, agenda seguimientos.' : `${weekly.agenda.length} seguimientos agendados.`}`;
 const view=$('cad-view').value;
 const rows=filtrarSegmento(cadenceCandidates(workspace.rows),$('business-segment').value).filter(p=>matchesSearch(p,$('phase2-search').value) && (view==='todo' || recordatorioDe(p)?.clave===view));
 $('cad-list').innerHTML=cadenceCards(rows);
};
mountNavigation();
const openAction=mountActionForm(()=>workspace,render);
for(const id of ['phase2-search','business-segment','cad-view'])$(id).addEventListener(id==='phase2-search' ? 'input' : 'change',render);
$('cad-list').addEventListener('click',async event=>{
 const touch=event.target.closest('[data-touch]');if(touch)return openAction(touch.dataset.touch,'cadence');
 const send=event.target.closest('[data-whatsapp]');if(!send)return;
 send.disabled=true;
 try{
   const p=workspace.rows.find(p=>p.id===send.dataset.whatsapp),state=cadenceState(p),pkg=await cargarPlantillasWhatsapp(workspace.store);
   const key=state.index===2 ? 'cierre' : 'recontacto';
   const result=await enviarWhatsappDeProspecto({prospect:p,plantilla:pkg.plantillas[key],mensaje:mensajeDePlantilla(pkg,key,p),user:workspace.user,store:workspace.store});
   saveDraft(workspace,result.prospect);render();notify('WhatsApp preparado. Envíalo y registra el resultado para avanzar.');
 }catch(error){notify(error.message);}finally{send.disabled=false;}
});
startWorkspace(ws=>{workspace=ws;render();}).catch(error=>notify(error.message));
