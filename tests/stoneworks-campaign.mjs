import assert from 'node:assert/strict';
import {
  buildStoneworksQueue,
  stoneworksState,
  STONEWORKS_LOTE_MARKER,
  STONEWORKS_QUEUE_SIZE,
} from '../public/stoneworks-campaign-model.js';

// Datos sintéticos: nadie escribe en Firestore. Se reproducen las cantidades
// aprobadas por Armand (9 + 5 + 34 + 55 = 103 en campaña).
const now = new Date('2026-11-21T12:00:00');
// Las notas de campaña se registran después del lanzamiento (22 nov).
const campaignNow = new Date('2026-11-23T12:00:00');
const loteNames = [
  'SoloCocinas Gallery', 'Tekni-K', 'Kooben', 'Santo Patrón Cucine Studio',
  'HAUSKA', 'GFA (Grupo Inmobiliario GFA)', 'Grupo DMI',
  'WorldHotels Acueducto', 'Bruna Restaurante',
];
const records = [];
const add = (businessName, extra = {}) => records.push({
  id: `s${records.length}`,
  businessName,
  phone: '3330000000',
  email: 'contacto@ejemplo.mx',
  classification: 'Otro',
  followUpNotes: [],
  ...extra,
});

loteNames.forEach((name, i) => add(name, {
  status: 'En Prospección',
  observations: `Agregado por Nyx — Lote 2026-11-19. Orden ${i + 1}`,
  classification: 'Cocinas y Baños',
}));
['PIGMENTO INDUSTRIAL', 'MO GDL', 'ZIAT', 'Otro Interesado A', 'Otro Interesado B']
  .forEach((name) => add(name, { status: 'Interesado' }));
for (let i = 0; i < 34; i++) add(`Vencido ${String(i + 1).padStart(2, '0')}`, {
  status: 'Seguimiento agendado',
  nextFollowUpDate: `2026-10-${String(20 - (i % 19)).padStart(2, '0')}`,
});
for (let i = 0; i < 55; i++) add(`Prospección ${String(i + 1).padStart(2, '0')}`, {
  status: 'En Prospección',
  classification: i % 3 === 0 ? 'Cocinas y Baños'
    : i % 3 === 1 ? 'Diseño de Interiores' : 'Corporativos / Oficinas',
});
// Excluidos
add('INTERDEK', { status: 'Convertido a cliente' });
add('CB4U', { status: 'Ya es nuestro cliente' });
add('AMATES', { status: 'Completado' });
add('AVANA', { status: 'Revisión Admin Pendiente' });
add('LATITUDE', { status: 'Revisión Admin Pendiente' });
add('FINCARTI', { status: 'Reactivar Contacto' });
add('Registro de prueba', { status: 'En Prospección' });
add('Sin forma de contacto', { status: 'En Prospección', phone: '', email: '' });
add('Rechazado', { status: 'Rechazado' });

const before = JSON.stringify(records);
const result = buildStoneworksQueue(records, now);
assert.equal(JSON.stringify(records), before, 'la cola no muta los prospectos');
assert.equal(result.porContactar, 10);
assert.equal(result.remaining, 103);
assert.deepEqual(result.counts, { lote: 9, interesados: 5, vencidos: 34, prospeccion: 55 });
assert.deepEqual(result.queue.map((item) => item.prospect.businessName), [
  ...loteNames, 'PIGMENTO INDUSTRIAL',
]);
assert.equal(result.queue[0].state.label, 'Por enviar');
assert.equal(result.queue[0].wave, 1);
assert.equal(result.queue[9].wave, 2);
// Los excluidos no aparecen ni en la cola ni en el total de la campaña.
const names = result.queue.map((item) => item.prospect.businessName);
for (const excluded of ['INTERDEK', 'CB4U', 'AMATES', 'AVANA', 'LATITUDE', 'FINCARTI', 'Registro de prueba', 'Sin forma de contacto', 'Rechazado']) {
  assert.ok(!names.includes(excluded));
}
assert.equal(new Set(result.queue.map((item) => item.prospect.id)).size, 10);

// Un prospecto enviado se queda en la cola con su fecha visible.
const sent = stoneworksState({
  followUpNotes: [{ date: '2026-11-22T10:00:00Z', note: 'Campaña Stoneworks enviada por correo el 22 nov 2026.' }],
}, campaignNow);
assert.equal(sent.key, 'enviado');
assert.equal(sent.label, 'Enviado 22 nov 2026');
assert.equal(sent.inQueue, true);

// Con respuesta registrada, sale de la cola y reduce el total de la campaña.
records[0].followUpNotes.push({ date: '2026-11-23T10:00:00Z', note: 'Respondió: quiere ver materiales.' });
const afterResponse = buildStoneworksQueue(records, campaignNow);
assert.equal(afterResponse.remaining, 102);
assert.ok(!afterResponse.queue.some((item) => item.prospect.id === records[0].id));
assert.ok(afterResponse.excluded.some((item) => item.reason === 'respondido'));

// Las notas anteriores al lanzamiento no cuentan como resultado de campaña.
assert.equal(stoneworksState({ followUpNotes: [{ date: '2025-10-23T10:00:00Z', note: 'Seguimiento reagendado.' }] }, now).key, 'por-enviar');

// Cola rodante: al responder el primero entra el décimo primero (MO GDL).
assert.equal(afterResponse.queue[9].prospect.businessName, 'MO GDL');
assert.equal(afterResponse.queue[9].state.label, 'Por enviar');
assert.equal(STONEWORKS_QUEUE_SIZE, 10);
assert.ok(loteNames.every((name) => STONEWORKS_LOTE_MARKER.includes('Lote 2026-11-19')));

console.log('PASS: cola Stoneworks de 10 en orden de prioridad, 103 en campaña, excluidos fuera, enviado/respondido y sin mutación.');
