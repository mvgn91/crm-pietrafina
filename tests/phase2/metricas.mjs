import assert from 'node:assert/strict';
import { metricasPorCampania, metricasCampania } from '../../public/campana-metricas-model.js';
const note=(outcome,channel='whatsapp')=>({campaign:'Alianza',outcome,channel});
const rows=[{id:'1',status:'Convertido a cliente',followUpNotes:[note('enviado'),note('respondido'),note('reunion','llamada'),note('convertido','llamada'),note('convertido','llamada'),{campaign:'Alianza',event:'whatsapp_preparado'}]},{id:'2',status:'Convertido a cliente',followUpNotes:[{note:'Campaña de Alianza Estratégica enviada.'}]}];
const m=metricasPorCampania(rows);assert.equal(m[0].enviados,2);assert.equal(m[0].reuniones,1);assert.equal(m[0].convertidos,1);assert.equal(m[0].preparados,1);assert.equal(m[1].enviados,1);assert.equal(m[1].convertidos,0,'no automatic attribution from current status');
assert.equal(metricasCampania([],[]).total,0);
console.log('metricas: PASS campaign attribution, legacy explicit sends, prepared excluded, unique conversions');
