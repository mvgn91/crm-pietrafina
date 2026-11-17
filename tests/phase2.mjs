// Pure Node test suite. No Firebase, network access or messages.
for(const name of ['pipeline','reactivacion','cadencia','plantillas','segmentos','recordatorios','metricas','csv','whatsapp','config-preview','draft-store','modal','runtime','controllers']) {
  await import(`./phase2/${name}.mjs`);
}
console.log('Phase 2: ALL PASS');
