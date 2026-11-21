// Shared read-only data loading and isolated local mutations for the ported views.
import { createDraftStore } from './draft-store.js';
import { getDemoProspects, isPreviewEnabled, setPreviewUserBadge } from './preview.js';
export const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const $ = id => document.getElementById(id);
export const notify = text => {const el=$('phase2-notice');if(el)el.textContent=text;};
export function renderUserBadge(name,email='') {
  const display=String(name || 'Sin sesión');
  const initial=(display || '?').charAt(0).toUpperCase();
  const seen=new Set();
  const put=(id,text)=>{
    const el=$(id);
    if(!el || seen.has(el))return;
    seen.add(el);
    el.textContent=text;
  };
  put('user-name-display',display);
  put('user-initials',initial);
  put('user-avatar-initials',initial);
  put('user-role-display',email);
}
export async function startWorkspace(onChange) {
  let base=[], store=null, user='Vista previa', unsub=null;
  const emit=()=>onChange({rows:store.rows(base),store,user});
  const setup=(owner,name)=>{store=createDraftStore(localStorage,owner);user=name;emit();};
  if(isPreviewEnabled()) {base=getDemoProspects();setup('preview','Demo');setPreviewUserBadge();renderUserBadge('Vista previa · datos ficticios');return;}
  const [{auth,getAppDisplayName},{onAuthStateChanged},{subscribeToProspects}]=await Promise.all([
    import('./firebase.js'),import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js'),import('./api.js'),
  ]);
  onAuthStateChanged(auth,person=>{
    unsub?.();
    if(!person){location.href='index.html';return;}
    base=[];setup(person.uid,getAppDisplayName(person));
    renderUserBadge(getAppDisplayName(person) || person.email, person.email || '');
    unsub=subscribeToProspects(list=>{base=list;emit();},error=>notify(`No se pudo leer la base. ${error.message}`));
  });
}
export function saveDraft(workspace,p) {
  workspace.store.save(p);
  workspace.rows=workspace.rows.map(row=>row.id===p.id ? p : row);
}
export function mountNavigation() {
  const preview=isPreviewEnabled();
  document.querySelectorAll('a[data-phase2]').forEach(link=>{if(preview)link.href += '?preview=1';});
  const menu=$('menu-toggle-btn');
  menu?.addEventListener('click',()=>document.body.classList.toggle('sidebar-open'));
  document.querySelectorAll('.page-overlay, #sidebar-overlay').forEach(el=>{
    el.addEventListener('click',()=>document.body.classList.remove('sidebar-open'));
  });
  document.querySelectorAll('.sidebar-nav a').forEach(link=>{
    link.addEventListener('click',()=>document.body.classList.remove('sidebar-open'));
  });
  $('logout-btn')?.addEventListener('click',async()=>{
    if(preview){location.href='index.html';return;}
    const [{auth},{signOut}]=await Promise.all([import('./firebase.js'),import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js')]);
    await signOut(auth);location.href='index.html';
  });
}
