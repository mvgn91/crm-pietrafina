import assert from 'node:assert/strict';
import { filtrarSegmento, prioridadComercial } from '../../public/segmentos-model.js';
const rows=[{classification:'Showrooms de Baños / Cocinas'},{classification:'Diseño de Interiores'},{classification:'Despacho de Arquitectos'},{classification:'Otro'}];
for(const s of ['cocinas','disenadores','arquitectos'])assert.equal(filtrarSegmento(rows,s).length,1);
assert.deepEqual(rows.map(prioridadComercial),[1,2,2,3]);
console.log('segmentos: PASS kitchens/designers/architects priorities');
