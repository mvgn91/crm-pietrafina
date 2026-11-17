// SIEMDES reactivacion view port: filters, rows, history capture; PF chrome/segments.
import { $, esc, notify, startWorkspace, mountNavigation, saveDraft } from './phase2-runtime.js';
import { dormantProspects, matchesSearch, REACTIVACION_SEGMENTOS } from './reactivacion-model.js';
import { filtrarSegmento, prioridadComercial } from './segmentos-model.js';
import { mountActionForm } from './phase2-forms.js';
import { cadenceState } from './campania-model.js';
import { cargarPlantillasWhatsapp, mensajeDePlantilla, enviarWhatsappDeProspecto } from './whatsapp-envio.js';
let workspace=null;
export function reactivationCards(rows) {
  const labels=Object.fromEntries(REACTIVACION_SEGMENTOS.map(s=>[s.value,s.label]));
  return rows.map(p=>`<article class="pf-panel"><h2>${esc(p.businessName)}</h2><p>${esc(labels[p.segment])} · ${esc(p.status)} · Prioridad ${prioridadComercial(p)}</p><p>${esc(p.contactPerson || 'Sin persona registrada')} · ${esc(p.nextFollowUpDate || 'Sin fecha')} · ${p.daysSince===null ? 'Sin último contacto' : `${p.daysSince} días desde último contacto`}</p><p>Toque ${Math.min(cadenceState(p).index+1,3)}/3 · ${esc(cadenceState(p).step?.label || 'Cadencia cerrada')}</p>${p.requiresResearch ? '<p>Investiga y verifica la persona correcta antes de contactar.</p>' : `<div class="pf-actions"><button class="btn btn-primary" data-record="${esc(p.id)}">Registrar contacto / estatus</button><button class="btn btn-secondary" data-whatsapp="${esc(p.id)}">Preparar WhatsApp</button><a data-phase2 href="./cadencia.html">Ver cadencia 1/4/8</a></div>`}</article>`).join('') || '<p>No hay prospectos que coincidan.</p>';
}
const render=()=>{
  if(!workspace)return;
  const base=dormantProspects(workspace.rows);
  $('react-summary').textContent=`${base.length} prospectos para reactivar · ${REACTIVACION_SEGMENTOS.map(s=>`${s.label} ${base.filter(p=>p.segment===s.value).length}`).join(' · ')}`;
  const segment=$('react-segment').value;
  const list=filtrarSegmento(base,$('business-segment').value).filter(p=>matchesSearch(p,$('phase2-search').value) && (segment==='todos' || p.segment===segment));
  $('react-list').innerHTML=reactivationCards(list);
};
mountNavigation();
const openAction=mountActionForm(()=>workspace,render);
for(const id of ['phase2-search','business-segment','react-segment'])$(id).addEventListener(id==='phase2-search' ? 'input' : 'change',render);
$('react-list').addEventListener('click',async event=>{
  const record=event.target.closest('[data-record]');if(record)return openAction(record.dataset.record);
  const send=event.target.closest('[data-whatsapp]');if(!send)return;
  send.disabled=true;
  try{
    const p=workspace.rows.find(p=>p.id===send.dataset.whatsapp);
    const pkg=await cargarPlantillasWhatsapp(workspace.store);
    const key=p.status==='Interesado' ? 'interesado' : 'recontacto';
    const result=await enviarWhatsappDeProspecto({prospect:p,plantilla:pkg.plantillas[key],mensaje:mensajeDePlantilla(pkg,key,p),user:workspace.user,store:workspace.store});
    saveDraft(workspace,result.prospect);render();notify('WhatsApp preparado. Registra el resultado después de enviarlo.');
  }catch(error){notify(error.message);}finally{send.disabled=false;}
});
startWorkspace(ws=>{workspace=ws;render();}).catch(error=>notify(error.message));
