import assert from 'node:assert/strict';
import { resumenSemanal, recordatorioDe } from '../../public/recordatorios-model.js';
import { getDemoProspects } from '../../public/preview.js';
const now=new Date(2026,10,17),rows=getDemoProspects(now),summary=resumenSemanal(rows,now);
assert.equal(summary.inicio,'2026-11-16');assert.equal(summary.fin,'2026-11-20');assert.equal(summary.vencidos.length,7);assert.equal(summary.semanaVacia,true);
assert.equal(resumenSemanal([{status:'Interesado',nextFollowUpDate:'2026-10-01'}],now).semanaVacia,true);
assert.equal(recordatorioDe({status:'Rechazado',nextFollowUpDate:'2026-10-01'},now),null);
assert.equal(recordatorioDe({status:'Interesado',nextFollowUpDate:'2026-10-01',sequence:{step:'whatsapp_1',nextStep:'llamada_4',nextAt:'2026-11-20'}},now).fecha,'2026-11-20');
console.log('recordatorios: PASS weekly boundaries, overdue, empty week, cadence priority');
