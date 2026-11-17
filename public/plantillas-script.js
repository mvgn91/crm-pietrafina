// SIEMDES template view port: same JSON/rendering bridge plus PF local editing.
import { $, notify, startWorkspace, mountNavigation } from './phase2-runtime.js';
import { cargarPlantillasWhatsapp, mensajeDePlantilla, enviarWhatsappDeProspecto, CLAVES_WHATSAPP } from './whatsapp-envio.js';
import { validarPlantillas } from './whatsapp-model.js';
import { previewMessage } from './preview.js';
import { downloadText } from './backup-view.js';
let workspace=null,pkg=null;
const selected=()=>workspace?.rows.find(p=>p.id===$('template-prospect').value) || {};
const preview=()=>{
 if(!pkg)return;
 const key=$('template-key').value,template={...pkg.plantillas[key],texto:$('template-text').value};
 previewMessage(mensajeDePlantilla({...pkg,plantillas:{...pkg.plantillas,[key]:template}},key,selected()),$('message-preview'));
};
const show=()=>{
 if(!pkg)return;const template=pkg.plantillas[$('template-key').value];
 $('template-title').value=template.titulo;$('template-text').value=template.texto;
 $('template-origin').textContent=template.propuesta ? 'Texto propuesto para revisión, editable antes de usar.' : 'Texto adaptado de la estrategia de contacto de PF.';
 preview();
};
mountNavigation();
$('template-key').addEventListener('change',show);$('template-prospect').addEventListener('change',preview);$('template-text').addEventListener('input',preview);
$('template-form').addEventListener('submit',event=>{
 event.preventDefault();if(!workspace || !pkg)return;
 try{
  const key=$('template-key').value,next={...pkg,plantillas:{...pkg.plantillas,[key]:{...pkg.plantillas[key],titulo:$('template-title').value.trim(),texto:$('template-text').value.trim()}}};
  validarPlantillas(next.plantillas);workspace.store.setTemplates(next);pkg=next;notify('Plantilla guardada en este navegador.');
 }catch(error){notify(error.message);}
});
$('template-copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('message-preview').textContent);notify('Mensaje copiado.');}catch{notify('No se pudo copiar. Selecciona el texto de la vista previa.');}});
$('template-export').addEventListener('click',()=>{if(pkg)downloadText('pf-plantillas.json',JSON.stringify(pkg,null,2),'application/json');});
$('template-import').addEventListener('change',async event=>{
 try{
   const file=event.target.files[0];if(!file)return;
   const next=JSON.parse(await file.text());
   if(!next.plantillas || CLAVES_WHATSAPP.some(key=>!next.plantillas[key]))throw new Error('El respaldo no contiene todos los escenarios.');
   validarPlantillas(next.plantillas);workspace.store.setTemplates(next);pkg=next;show();notify('Plantillas restauradas en este navegador.');
 }catch(error){notify(error.message);}
});
$('template-open').addEventListener('click',async event=>{
 event.target.disabled=true;
 try{
   if(!workspace || !pkg)throw new Error('Espera a que cargue la base.');
   const p=selected();const result=await enviarWhatsappDeProspecto({prospect:p,plantilla:pkg.plantillas[$('template-key').value],mensaje:$('message-preview').textContent,user:workspace.user,store:workspace.store});
   workspace.rows=workspace.rows.map(p=>p.id===result.prospect.id ? result.prospect : p);notify('Preparación guardada. Confirma el resultado en Reactivación o Cadencia después de enviar.');
 }catch(error){notify(error.message);}finally{event.target.disabled=false;}
});
startWorkspace(async ws=>{
 workspace=ws;
 try{
  pkg=await cargarPlantillasWhatsapp(ws.store);
  $('template-key').replaceChildren(...Object.entries(pkg.plantillas).map(([key,t])=>new Option(t.titulo,key)));
  const selectedId=$('template-prospect').value;
  $('template-prospect').replaceChildren(...ws.rows.map(p=>new Option(p.businessName,p.id)));
  if(ws.rows.some(p=>p.id===selectedId))$('template-prospect').value=selectedId;
  show();
 }catch(error){notify(error.message);}
}).catch(error=>notify(error.message));
