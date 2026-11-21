import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as runtime from '../../public/phase2-runtime.js';
import * as reactive from '../../public/reactivacion-model.js';
import * as campaign from '../../public/campania-model.js';
import * as segments from '../../public/segmentos-model.js';
import * as reminders from '../../public/recordatorios-model.js';
import * as whatsapp from '../../public/whatsapp-envio.js';
import * as messages from '../../public/whatsapp-model.js';
import * as config from '../../public/config.js';
import * as actions from '../../public/phase2-actions.js';
import * as pipeline from '../../public/pipeline-model.js';
import * as preview from '../../public/preview.js';
import * as csv from '../../public/csv-model.js';
import * as metrics from '../../public/campana-metricas-model.js';
import { createDraftStore } from '../../public/draft-store.js';
const pkg=JSON.parse(fs.readFileSync(new URL('../../public/plantillas.json',import.meta.url),'utf8')).whatsapp;
function setup(name){
 const html=fs.readFileSync(new URL(`../../public/${name}.html`,import.meta.url),'utf8');
 const nodes=new Map();
 for(const [,id] of html.matchAll(/id="([^"]+)"/g))nodes.set(id,{value:['business-segment','react-segment'].includes(id) ? 'todos' : id==='cad-view' ? 'todo' : '',innerHTML:'',textContent:'',hidden:false,disabled:false,listeners:{},options:[],addEventListener(event,fn){this.listeners[event]=fn;},replaceChildren(...options){this.options=options;this.value=options[0]?.value || '';},reset(){},scrollIntoView(){},focus(){}});
 const $=id=>{assert.ok(nodes.has(id),`${name}: selector #${id} must exist`);return nodes.get(id);};
 const map=new Map(),store=createDraftStore({getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)},name);
 const ws={rows:preview.getDemoProspects(new Date(2026,10,17)),store,user:'Tester'};let callback,notice='';
 const context=vm.createContext({...runtime,...reactive,...campaign,...segments,...reminders,...whatsapp,...messages,...config,...actions,...pipeline,...preview,...csv,...metrics,console,Option:class{constructor(text,value){this.text=text;this.value=value;}},document:{getElementById:$},$,notify:text=>{notice=text;},startWorkspace:fn=>{callback=fn;return Promise.resolve();},mountNavigation(){},cargarPlantillasWhatsapp:async()=>structuredClone(pkg),mountActionForm:()=>()=>{},downloadText(){},fetch:async()=>({ok:true,json:async()=>({whatsapp:pkg})})});
 function execute(file){let source=fs.readFileSync(new URL(`../../public/${file}.js`,import.meta.url),'utf8');source=source.replace(/^import\s+[\s\S]*?\sfrom\s+['"][^'"]+['"];\n/gm,'').replaceAll('export const ','const ').replaceAll('export function ','function ');vm.runInContext(source,context);}
 execute(name+'-script');
 return {nodes,$,ws,context,execute,render:()=>callback(ws),notice:()=>notice};
}
const react=setup('reactivacion');await react.render();
assert.ok(react.$('react-summary').textContent.includes('100 prospectos'));
assert.ok(react.$('react-list').innerHTML.includes('Investiga y verifica'));
react.$('react-segment').value='interesado';react.$('react-segment').listeners.change();
assert.equal((react.$('react-list').innerHTML.match(/<article/g)||[]).length,3);
// Exercise the shared real capture form with mock storage and actual actions.
react.execute('phase2-forms');react.context.testWorkspace=react.ws;
const openForm=vm.runInContext('mountActionForm(()=>testWorkspace,()=>{})',react.context);
openForm(react.ws.rows[0].id);
react.$('action-note').value='Registro de prueba';react.$('action-outcome').value='sin_respuesta';react.$('action-channel').value='llamada';
react.$('action-form').listeners.submit({preventDefault(){}});
assert.equal(react.ws.rows[0].followUpNotes.at(-1).note,'Registro de prueba');
assert.ok(react.$('action-form').hidden);
const cad=setup('cadencia');await cad.render();assert.ok(cad.$('cad-list').innerHTML.includes('Toque 1/3'));
const templates=setup('plantillas');await templates.render();assert.ok(templates.$('message-preview').textContent.includes('Nicolas'));
templates.$('template-text').value='Hola, texto editado desde el CRM.';
templates.$('template-form').listeners.submit({preventDefault(){}});
assert.equal(templates.ws.store.getTemplates().plantillas.primer_contacto.texto,'Hola, texto editado desde el CRM.');
const camps=setup('campanas');await camps.render();assert.ok(camps.$('backup-count').textContent.includes('103'));
const backup=csv.exportarBase(camps.ws.rows);
await camps.$('backup-file').listeners.change({target:{files:[{size:backup.length,text:async()=>backup}]}});
assert.equal(camps.$('backup-import').disabled,false);camps.$('backup-import').listeners.click();assert.equal(camps.ws.rows.length,103);
// New pages reuse PF logo/fonts and navigation; existing pages expose all four entries.
for(const page of ['reactivacion','cadencia','plantillas','campanas','admin-app','prospeccion','dashboard']){
 const html=fs.readFileSync(new URL(`../../public/${page}.html`,import.meta.url),'utf8');
 for(const target of ['reactivacion','cadencia','plantillas','campanas'])assert.ok(html.includes(`href="./${target}.html"`),`${page} -> ${target}`);
 assert.ok(html.includes('assets/logo.png'));
}
console.log('controllers: PASS real markup IDs, reactivation filters, cadence cards, template editor, CSV restore, navigation');
