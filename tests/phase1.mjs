import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { STATUS_META, groupProspects, getStatusBadgeClass } from '../public/status-model.js';
const rows = [];
const add = (n, status, extra = {}) => { for (let i=0; i<n; i++) rows.push({id: String(rows.length), businessName: `Fixture ${rows.length}`, status, ...extra}); };
add(53, 'En Prospección'); add(2, 'En Prospección', {nextFollowUpDate:'2026-11-20'});
add(3, 'Interesado'); add(2, 'Interesado', {nextFollowUpDate:'2026-11-20'});
add(34, 'Seguimiento agendado', {nextFollowUpDate:'2025-10-28'}); add(1, 'No contesta');
add(2, 'Convertido a cliente'); add(1, 'Rechazado');
add(2, 'Revisión Admin Pendiente'); add(2, 'Completado'); add(1, 'Reactivar Contacto');
assert.equal(rows.length,103);
const before=JSON.stringify(rows);
for (const view of ['management', 'prospecting']) {
 const groups=groupProspects(rows,view), flat=Object.values(groups).flat();
 assert.equal(flat.length,103); assert.equal(new Set(flat.map(p=>p.id)).size,103);
 assert.equal(groups.Archivo.length,3); assert.equal(groups['Fuera de flujo'].length,5);
 if(view==='management') assert.equal(groups.Activos.length,95);
 else { assert.equal(groups.Interesados.length,5); assert.equal(groups['Prospectos Legado (Revisar Estatus)'][0].nextFollowUpDate,'2025-10-28'); }
 const extra=groupProspects([...rows,{id:'unknown',status:'Nuevo estatus'}],view);
 assert.equal(extra['Otros estatus'].length,1);
}
assert.equal(JSON.stringify(rows),before);
assert.equal(Object.keys(STATUS_META).length,11);
assert.equal(new Set(Object.keys(STATUS_META).map(getStatusBadgeClass)).size,11);

// Exercise real rendering and chart updates without importing Firebase or writing data.
const nodes=new Map();
const element=id=> { if(!nodes.has(id)) nodes.set(id,{textContent:'',innerHTML:'',className:'',reset(){},classList:{add(){},remove(){} }}); return nodes.get(id); };
const charts=[];
class Chart { constructor(ctx,config){Object.assign(this,config);charts.push(this);} update(){} }
const context=vm.createContext({document:{getElementById:element}, Chart, STATUS_META,getStatusBadgeClass,console,Intl,Date});
let source=fs.readFileSync(new URL('../public/ui.js',import.meta.url),'utf8').replace(/^import .*;\n/,'').replaceAll('export const ','globalThis.');
vm.runInContext(source,context);
for(const status of Object.keys(STATUS_META)) {
 context.showProspectDetailsModal({businessName:'Fixture',status});
 assert.ok(element('detail-status').className.includes(getStatusBadgeClass(status)));
}
const legacy=rows.find(p=>p.status==='Seguimiento agendado');
assert.ok(context.createProspectRowHTML(legacy).includes('2025'));
assert.ok(!context.createProspectRowHTML(legacy).includes('No agendado'));
context.renderProspectsByStatusChart(rows);
assert.equal(charts[0].data.datasets[0].data.reduce((a,b)=>a+b,0),103);
assert.ok(!charts[0].data.labels.includes('Pendiente de Correo'));
assert.ok(charts[0].data.labels.includes('Completado'));
context.renderProspectsByStatusChart([{status:'Completado'}]);
assert.deepEqual(Array.from(charts[0].data.datasets[0].backgroundColor),[STATUS_META.Completado.color]);
const drawn=[];
charts[0].plugins[0].afterDatasetsDraw({ctx:{save(){},restore(){},strokeText(){},fillText(v){drawn.push(v)}},data:charts[0].data,getDataVisibility:()=>true,getDatasetMeta:()=>({data:[{tooltipPosition:()=>({x:1,y:1})}]})});
assert.deepEqual(drawn,['1']);
console.log('PASS: 103 records partitioned without duplicates or mutation; 11 colors; modal; legacy date; chart counts, zero suppression, colors on update and slice labels. Synthetic data only.');

// Filters expose all eleven statuses and default to all, including Prospección.
const filterContext=vm.createContext({Option:class {constructor(text,value){this.text=text;this.value=value;}}});
const modelSource=fs.readFileSync(new URL('../public/status-model.js',import.meta.url),'utf8').replaceAll('export const ','const ').replaceAll('export function ','function ');
vm.runInContext(modelSource+'\nglobalThis.populate = populateStatusFilter;',filterContext);
for(const active of [false,true]) {
 const select={options:[],replaceChildren(option){this.options=[option];},add(option){this.options.push(option);}};
 filterContext.populate(select,{active});
 assert.equal(select.options[0].value,'all');
 for(const status of Object.keys(STATUS_META)) assert.ok(select.options.some(o=>o.value===status));
}
const firebaseSource=fs.readFileSync(new URL('../public/firebase.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export const ','globalThis.');
const userContext=vm.createContext({initializeApp:()=>({}),getAuth:()=>({}),getFirestore:()=>({})});
vm.runInContext(firebaseSource,userContext);
assert.equal(userContext.getAppDisplayName({uid:'new',email:'test@example.test'}),'test@example.test');
assert.equal(userContext.getAppDisplayName({uid:'new',displayName:'Nombre',email:'test@example.test'}),'Nombre');
const navContext=vm.createContext({document:{getElementById:element,addEventListener(){}},getAppDisplayName:userContext.getAppDisplayName,sessionStorage:{setItem(){},removeItem(){}}});
const navSource=fs.readFileSync(new URL('../public/navigation.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
vm.runInContext(navSource,navContext);
navContext.renderUser({uid:'new',email:'test@example.test'});
assert.equal(element('user-name-display').textContent,'test@example.test');
console.log('PASS: all eleven filter options; authenticated display name/email and actual page ID.');
