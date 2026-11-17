import assert from 'node:assert/strict';
import { PROJECT, ESTATUS_PIPELINE, SECUENCIA_PASOS } from '../../public/config.js';
import { getDemoProspects, previewMessage, isPreviewEnabled } from '../../public/preview.js';
assert.equal(PROJECT.id,'crm-pietrafina');assert.equal(ESTATUS_PIPELINE.length,11);assert.deepEqual(SECUENCIA_PASOS.map(p=>p.day),[1,4,8]);
assert.equal(getDemoProspects().length,103);assert.ok(getDemoProspects().every(p=>p.id.startsWith('demo-') && !p.phone));
const element={};previewMessage('<script>unsafe</script>',element);assert.equal(element.textContent,'<script>unsafe</script>');
assert.equal(isPreviewEnabled(),false);
console.log('config-preview: PASS PF identity, eleven statuses, day offsets, isolated no-phone demo, text-only preview');
