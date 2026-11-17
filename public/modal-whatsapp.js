// Shared PF modal integration for the SIEMDES template/message/cadence ports.
import { cargarPlantillasWhatsapp, mensajeDePlantilla } from './whatsapp-envio.js';
import { createDraftStore } from './draft-store.js';
import { cadenceState } from './campania-model.js';
export const modalDraft = (prospect,uid,storage=localStorage) => {
  if(!uid)return {prospect,store:null};
  const store=createDraftStore(storage,uid);
  return {prospect:store.rows([prospect]).find(p=>p.id===prospect.id) || prospect,store};
};
let messageRequest = 0;
export async function renderModalMessage({prospect,uid,textarea,materials=[],reset=false}) {
  const request = ++messageRequest;
  const {prospect:row,store}=modalDraft(prospect,uid);
  const pkg=await cargarPlantillasWhatsapp(store);
  if (request !== messageRequest) return;
  let select=document.getElementById('modal-template');
  if(!select){
    const label=document.createElement('label');label.textContent='Escenario de WhatsApp';
    select=document.createElement('select');select.id='modal-template';select.className='form-select';
    label.append(select);textarea.parentNode.insertBefore(label,textarea);
  }
  const previous=select.value;
  select.replaceChildren(...Object.entries(pkg.plantillas).map(([key,t])=>new Option(t.titulo,key)));
  select.value=!reset && pkg.plantillas[previous] ? previous : ['Convertido a cliente','Ya es nuestro cliente'].includes(row.status) ? 'cultivo' : row.status==='Interesado' ? 'interesado' : row.status==='Pendiente de Correo' ? 'primer_contacto' : 'recontacto';
  const render=()=>{
    const base=mensajeDePlantilla(pkg,select.value,row);
    textarea.value=[base,...materials.map(m=>`${m.name}\n${m.url}`)].join('\n\n');
  };
  select.onchange=render;render();
}
export function renderDetailCadence(prospect) {
  const anchor=document.getElementById('detail-status');if(!anchor)return;
  let badge=document.getElementById('detail-cadence');
  if(!badge){badge=document.createElement('p');badge.id='detail-cadence';badge.className='text-sm text-gray-600 mt-2';anchor.parentNode.append(badge);}
  const s=cadenceState(prospect);
  badge.textContent=s.complete ? `Cadencia cerrada · seguimiento ${prospect.nextFollowUpDate || 'sin fecha'}` : `Toque ${s.index+1}/3 · ${s.step?.label || 'Sin cadencia'} · ${prospect.sequence?.nextAt || 'Sin iniciar'}`;
}
