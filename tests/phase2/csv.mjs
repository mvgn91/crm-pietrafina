import assert from 'node:assert/strict';
import { exportarBase, importarBase } from '../../public/csv-model.js';
import { getDemoProspects } from '../../public/preview.js';
const rows=getDemoProspects(new Date(2026,10,17));rows[0].businessName='Estudio "Nico", cocina; México\nNorte';rows[0].custom={nested:[1,{a:'=1+1'}]};
assert.deepEqual(importarBase(exportarBase(rows)),rows);
assert.throws(()=>importarBase(exportarBase([rows[0],rows[0]])),/duplicado/);
assert.throws(()=>importarBase('id,name\na,x'),/columnas/);
assert.throws(()=>importarBase('id,prospect_json\na,"incompleto'),/comillas/);
console.log('csv: PASS lossless 103-record full-history round trip, quoting, unicode, duplicate/malformed rejection');
