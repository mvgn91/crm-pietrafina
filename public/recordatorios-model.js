// Port SIEMDES: one pending item per prospect; live cadence takes precedence.
import { CADENCIA, clasificarFecha, cadenceState } from './campania-model.js';
import { diaDe, esTerminal, addDays, dateInput } from './pipeline-model.js';
export const recordatorioDe = (prospect,now=new Date()) => {
  if (esTerminal(prospect?.status) || prospect?.reactivation?.status === 'do_not_contact') return null;
  const state=cadenceState(prospect,now);
  const live=state.active && prospect.sequence?.nextAt;
  const fecha=live ? prospect.sequence.nextAt : prospect.nextFollowUpDate;
  if (!fecha) return null;
  const result=clasificarFecha(fecha,now);
  return {prospect,fecha,...result,canal:live ? state.step?.channel : 'seguimiento',origen:live ? 'secuencia' : 'seguimiento'};
};
export const agruparRecordatorios = (rows=[],now=new Date()) => {
  const groups=Object.fromEntries(['vencido','hoy','semana','despues','sin_fecha'].map(k=>[k,[]]));
  for(const p of rows){const r=recordatorioDe(p,now);if(r)groups[r.clave].push(r);}
  Object.values(groups).forEach(g=>g.sort((a,b)=>diaDe(a.fecha)-diaDe(b.fecha)));
  return {...groups,total:Object.values(groups).flat().length};
};
export const resumenSemanal = (rows=[],now=new Date()) => {
  const monday=new Date(now);monday.setHours(0,0,0,0);monday.setDate(monday.getDate()-((monday.getDay()+6)%7));
  const end=addDays(monday,4), groups=agruparRecordatorios(rows,now);
  const agenda=rows.filter(p=>!esTerminal(p.status) && diaDe(p.nextFollowUpDate)!==null && diaDe(p.nextFollowUpDate)>=diaDe(monday) && diaDe(p.nextFollowUpDate)<=diaDe(end));
  return {inicio:dateInput(monday),fin:end,vencidos:groups[CADENCIA.VENCIDO],agenda,semanaVacia:agenda.length===0};
};
