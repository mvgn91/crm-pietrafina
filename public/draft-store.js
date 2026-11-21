// Local-only Phase 2 workspace. No Firebase SDK imports or network writes.
import { PROJECT } from './config.js';
export function createDraftStore(storage,owner='preview') {
  const key=`${PROJECT.draftKey}:${owner}`;
  let state={changes:{},imported:null,templates:null};
  const raw=storage?.getItem(key);
  if(raw){try{state=JSON.parse(raw);}catch{throw new Error('Borrador local dañado. Exporta o recupera el almacenamiento antes de continuar.');}}
  if(!state || typeof state.changes!=='object' || Array.isArray(state.changes))throw new Error('Borrador local inválido.');
  const commit=next=>{storage.setItem(key,JSON.stringify(next));state=next;};
  return {
    rows(base=[]){const rows=state.imported ?? base;return rows.map(p=>structuredClone(Object.hasOwn(state.changes,p.id) ? state.changes[p.id] : p));},
    save(p){if(!p?.id)throw new Error('Prospecto sin ID.');commit({...state,changes:{...state.changes,[p.id]:structuredClone(p)}});},
    importRows(rows){if(!Array.isArray(rows) || !rows.length)throw new Error('El respaldo está vacío.');commit({...state,imported:structuredClone(rows),changes:{}});},
    getTemplates(){return structuredClone(state.templates);},
    setTemplates(templates){commit({...state,templates:structuredClone(templates)});},
    hasImport(){return state.imported!==null;},
  };
}
