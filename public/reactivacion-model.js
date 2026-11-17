// Adapted from SIEMDES computeEligibility/buildRow/matchesSearch/ordenarReactivacion.
// PF eligibility is based on schedule/status, not inferred calls or campaign proof.
import { OUT_OF_FLOW_STATUSES } from './config.js';
import { diaDe, daysBetween, esTerminal, notesOf, ultimoContacto, toDate } from './pipeline-model.js';
export const REACTIVACION_SEGMENTOS = [
  {value:'interesado',label:'Interesado sin fecha'},
  {value:'vencido',label:'Seguimiento vencido'},
  {value:'prospeccion',label:'En Prospección sin fecha'},
  {value:'nunca',label:'Nunca contactado / investigar'},
];
export const knownContactOf = p => {
  const name=String(p?.contactPerson || '').trim();
  return /^(null|undefined|n\/a)$/i.test(name) ? '' : name;
};
export const computeEligibility = (p, now = new Date()) => {
  const blockedBy=[];
  if (esTerminal(p?.status)) blockedBy.push('archivado');
  const date=diaDe(p?.nextFollowUpDate), today=diaDe(now);
  if (date !== null && date > today) blockedBy.push('fecha_futura');
  if (p?.reactivation?.closedStatus && p.reactivation.closedStatus === p.status) blockedBy.push('estatus_cambiado');
  if (p?.reactivation?.status === 'do_not_contact') blockedBy.push('no_contactar');
  let segment;
  if (OUT_OF_FLOW_STATUSES.includes(p?.status) || p?.status === 'Pendiente de Correo') segment='nunca';
  else if (p?.status === 'Interesado' && date === null) segment='interesado';
  else if (date !== null && date <= today) segment='vencido';
  else segment='prospeccion';
  const last = ultimoContacto(p);
  return { eligible: !blockedBy.length, blockedBy, segment, requiresResearch: segment === 'nunca' && !knownContactOf(p), lastInteractionAt: last?.fecha || null, daysSince: last ? daysBetween(last.fecha,now) : null };
};
export const buildRow = (p,now=new Date()) => ({...p,...computeEligibility(p,now)});
const norm = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const matchesSearch = (p,term) => norm([p.businessName,p.contactPerson,p.phone,...notesOf(p).map(n=>n.note)].join(' ')).includes(norm(term).trim());
export const ordenarReactivacion = rows => rows.slice().sort((a,b) => {
  const order=['interesado','vencido','prospeccion','nunca'];
  return order.indexOf(a.segment)-order.indexOf(b.segment) || (b.daysSince ?? -1)-(a.daysSince ?? -1) || String(a.businessName).localeCompare(String(b.businessName),'es');
});
export const dormantProspects = (rows,now=new Date()) => ordenarReactivacion(rows.map(p=>buildRow(p,now)).filter(p=>p.eligible));
export { notesOf, toDate };
