import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validarPlantillas, textoNico } from '../../public/whatsapp-model.js';
import { mensajeDePlantilla, cargarPlantillasWhatsapp, CLAVES_WHATSAPP } from '../../public/whatsapp-envio.js';
const pkg=JSON.parse(fs.readFileSync(new URL('../../public/plantillas.json',import.meta.url),'utf8')).whatsapp;
assert.equal(CLAVES_WHATSAPP.length,6);assert.ok(validarPlantillas(pkg.plantillas));
for(const key of CLAVES_WHATSAPP){const text=mensajeDePlantilla(pkg,key,{businessName:'Estudio'});assert.ok(text.length>20);assert.equal(text,textoNico(text));assert.ok(!/[¿¡:]/.test(text));}
assert.throws(()=>validarPlantillas({x:{titulo:'Prueba',texto:'Hola: ¿cómo?'}}),/Unicode/);
const local={...pkg,plantillas:{...pkg.plantillas,recontacto:{titulo:'Cambio',texto:'Hola, mensaje editable.'}}};
assert.equal((await cargarPlantillasWhatsapp({getTemplates:()=>local})).plantillas.recontacto.texto,'Hola, mensaje editable.');
console.log('plantillas: PASS six scenarios, ASCII Nico text, editable local override');
