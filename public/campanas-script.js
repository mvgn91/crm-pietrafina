// PF campaign panel consuming the SIEMDES pure metrics/CSV ports.
import { $, esc, notify, startWorkspace, mountNavigation } from './phase2-runtime.js';
import { metricasPorCampania } from './campana-metricas-model.js';
import { exportarBase, importarBase, descargarCSV, nombreArchivo } from './csv-model.js';
let workspace=null,imported=null;
export const campaignTable = rows => {
 const metrics=metricasPorCampania(rows);
 if(!metrics.length)return '<p>No hay evidencia de campaña en el historial.</p>';
 return `<div class="pf-metrics"><table><caption>Eventos confirmados por campaña; convertidos cuenta prospectos únicos</caption><thead><tr><th>Campaña</th><th>Enviados</th><th>Respuestas</th><th>Reuniones</th><th>Convertidos</th><th>Preparados</th></tr></thead><tbody>${metrics.map(m=>`<tr><th>${esc(m.campaign)}</th><td>${m.enviados}</td><td>${m.respuestas}</td><td>${m.reuniones}</td><td>${m.convertidos}</td><td>${m.preparados}</td></tr>`).join('')}</tbody></table></div>`;
};
const render=()=>{if(!workspace)return;$('campaign-metrics').innerHTML=campaignTable(workspace.rows);$('backup-count').textContent=`${workspace.rows.length} prospectos completos, con ID, historial, fechas, campos adicionales y secuencia.`;};
mountNavigation();
$('backup-export').addEventListener('click',()=>{if(workspace)descargarCSV(nombreArchivo('pf-base'),exportarBase(workspace.rows));});
$('backup-file').addEventListener('change',async event=>{
 imported=null;$('backup-import').disabled=true;
 try{
  const file=event.target.files[0];if(!file)return;
  if(file.size>10*1024*1024)throw new Error('El respaldo supera 10 MB.');
  imported=importarBase(await file.text());if(!imported.length)throw new Error('El respaldo está vacío.');
  $('backup-summary').textContent=`Respaldo válido con ${imported.length} IDs únicos. Restaurar reemplazará únicamente el espacio local.`;$('backup-import').disabled=false;
 }catch(error){notify(error.message);}
});
$('backup-import').addEventListener('click',()=>{
 try{if(!workspace || !imported)return;workspace.store.importRows(imported);workspace.rows=workspace.store.rows([]);render();$('backup-import').disabled=true;notify('Respaldo restaurado localmente. Firestore no cambió.');}
 catch(error){notify(error.message);}
});
startWorkspace(ws=>{workspace=ws;render();}).catch(error=>notify(error.message));
