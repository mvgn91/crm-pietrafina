// Port SIEMDES → PF. No source service URLs or identities are configured here.
// whatsapp-model.js — Lógica PURA de las plantillas de WhatsApp (F7).
//
// El copy vive en `public/plantillas.json` (fuente única, igual que el correo).
// Aquí solo se sustituye lo que el CRM sabe del prospecto y de su último
// envío: nada se inventa. Si falta un dato, la frase que lo usa se omite.
//
// Se prueba con node: scripts/test-whatsapp.mjs.

import { toDate } from "./pipeline-model.js";
const decisorDe = prospect => Array.isArray(prospect?.contacts) ? prospect.contacts.find(c => c.decisor) : null;

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** Fecha legible para el mensaje: «10 de noviembre de 2026». */
export const formatearFechaEnvio = (valor) => {
  const fecha = toDate(valor);
  if (!fecha) return "";
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
};

/**
 * Último envío de correo con destinatario. El mensaje habla del «correo que le
 * enviamos»: un envío de WhatsApp posterior no debe borrar esa referencia.
 */
export const ultimoEnvioCorreoDe = (envios = []) => {
  const lista = Array.isArray(envios) ? envios.filter(Boolean) : [];
  return (
    lista
      .filter((envio) => envio.canal === "correo" || envio.destinatario)
      .sort((a, b) => (toDate(b.fecha)?.getTime() || 0) - (toDate(a.fecha)?.getTime() || 0))[0] ||
    null
  );
};

/** Datos con los que se rellenan los {{campos}} de la plantilla. */
export const datosPlantillaDe = (
  prospect = {},
  { envios = [], enlaces = {} } = {},
) => {
  const envio = ultimoEnvioCorreoDe(envios);
  // Sin persona de contacto, el negocio es el saludo; si tampoco hay negocio,
  // el render deja un saludo neutro en vez de "¡Hola, !".
  const nombreContacto =
    String(prospect?.contactPerson || "").trim() ||
    String(decisorDe(prospect)?.nombre || "").trim() ||
    String(prospect?.businessName || "").trim();
  return {
    nombre_contacto: nombreContacto,
    empresa: String(prospect?.businessName || "").trim(),
    fecha_envio: envio ? formatearFechaEnvio(envio.fecha) : "",
    correo_envio: String(envio?.destinatario || prospect?.email || "").trim(),
    link_presentacion: String(enlaces?.presentacion || "").trim(),
    link_pdf: String(enlaces?.pdf || "").trim(),
    telefono: String(prospect?.phone || "").trim(),
  };
};

const TOKENS = [
  "nombre_contacto",
  "empresa",
  "fecha_envio",
  "correo_envio",
  "link_presentacion",
  "link_pdf",
];

const limpiar = (texto) =>
  String(texto)
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+([.,;:?])/g, "$1")
    .replace(/\.\s+\./g, ".")
    .trim();

/**
 * Sustituye los campos de una plantilla aprobada. Reglas (PRD F7-03):
 *  · sin nombre de contacto, el saludo queda en «Hola, buen día.»;
 *  · sin envío registrado, la frase del correo se omite;
 *  · sin enlace configurado, la frase que lo presenta se omite (no se
 *    escribe un enlace falso ni un placeholder).
 */
export const renderPlantillaWhatsapp = (texto, datos = {}) => {
  let salida = String(texto || "");

  const nombre = String(datos.nombre_contacto || "").trim();
  if (nombre) {
    salida = salida.split("{{nombre_contacto}}").join(nombre);
  } else {
    // Cubre las formas de saludo que un operador pueda editar en una plantilla.
    // Nunca debe llegar al textarea un "¡Hola, !" ni un "Hola, ,".
    salida = salida
      .replace(/¡?Hola,\s*\{\{nombre_contacto\}\}\s*,?\s*buen día[.!]?/gi, "Hola, buen día.")
      .replace(/¡Hola,\s*\{\{nombre_contacto\}\}!/gi, "¡Hola, buen día!")
      .replace(/Hola,\s*\{\{nombre_contacto\}\}/gi, "Hola")
      .split("Hola, {{nombre_contacto}}, buen día.")
      .join("Hola, buen día.");
  }

  const fecha = String(datos.fecha_envio || "").trim();
  const correo = String(datos.correo_envio || "").trim();
  if (!fecha || !correo) {
    salida = salida
      .split(
        " y le enviamos un correo el {{fecha_envio}} a {{correo_envio}} con nuestra presentación de servicios",
      )
      .join("")
      .split(
        " Le escribo para dar seguimiento al correo que le enviamos el {{fecha_envio}} a {{correo_envio}}. ¿Le llegó la presentación de servicios?",
      )
      .join("");
  }

  const presentacion = String(datos.link_presentacion || "").trim();
  if (!presentacion) {
    salida = salida
      .split("\n\nLe comparto la presentación: {{link_presentacion}}.")
      .join("")
      .split(" Le comparto la presentación: {{link_presentacion}}.")
      .join("")
      .split("\n\nAquí se la dejo de nuevo: {{link_presentacion}}.")
      .join("")
      .split(" Aquí se la dejo de nuevo: {{link_presentacion}}.")
      .join("");
  }

  const pdf = String(datos.link_pdf || "").trim();
  if (!pdf) {
    salida = salida
      .split("\n\nAquí le dejo también el PDF de servicios: {{link_pdf}}.")
      .join("")
      .split(" Aquí le dejo también el PDF de servicios: {{link_pdf}}.")
      .join("");
  }

  for (const token of TOKENS) {
    salida = salida.split(`{{${token}}}`).join(String(datos[token] || ""));
  }

  // Un token desconocido no debe llegar al mensaje del operador como «{{x}}».
  salida = salida.replace(/\{\{[^}]*\}\}/g, "");
  return limpiar(salida);
};

/** Teléfono en formato wa.me: solo dígitos y con código de país 52. */
export const normalizarTelefono = telefono => {
  let digits=String(telefono || '').replace(/\D/g,'').replace(/^00/,'');
  if(digits.length===13 && digits.startsWith('521'))digits=`52${digits.slice(3)}`;
  if(digits.length===10)digits=`52${digits}`;
  return /^52\d{10}$/.test(digits) ? digits : '';
};

/**
 * Enlace de WhatsApp Web / app con el mensaje escrito. `null` si no hay
 * teléfono: sin número no hay a quién escribirle.
 */
export const enlaceWhatsapp = (telefono, mensaje = "") => {
  const numero = normalizarTelefono(telefono);
  if (!numero) return null;
  const texto = String(mensaje || "").trim();
  return `https://wa.me/${numero}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
};

/**
 * Envío que deja el clic de WhatsApp en `prospects/{id}/envios` (F7-06).
 * `sequence.step` queda en «whatsapp» y la cadencia sigue en «llamada»;
 * la fecha es el próximo seguimiento que ya puso el operador (sin inventar
 * plazos). `registerEnvio` completa el toque y la nota en la misma escritura.
 */
export const envioWhatsappDe = (
  prospect = {},
  { plantilla, fecha = null, user = "Usuario" } = {},
) => ({
  canal: "whatsapp",
  resultado: "enviado",
  plantilla: plantilla?.titulo || "Mensaje de WhatsApp",
  destinatario: null,
  fecha: fecha || new Date().toISOString(),
  user,
  secuencia: { nextStep: "llamada", nextAt: prospect?.nextFollowUpDate || null },
});

/** Enlaces aún no configurados, para avisarlo en la vista de plantillas. */
export const enlacesPendientes = (enlaces = {}) =>
  [
    ["presentacion", "Presentación (Canva)"],
    ["pdf", "PDF de servicios"],
  ]
    .filter(([clave]) => !String(enlaces?.[clave] || "").trim())
    .map(([, etiqueta]) => etiqueta);

// PF format: ordinary ASCII text; preserve URL protocols when composing legacy materials.
export const textoNico = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x09\x0a\x0d\x20-\x7e]/g,'').replace(/:(?!\/\/)/g,'').trim();
export const validarPlantillas = templates => {
  for(const [key,t] of Object.entries(templates || {})){
    if(!key || !t?.titulo || !String(t.texto || '').trim())throw new Error('Cada plantilla requiere titulo y texto.');
    if(t.texto!==textoNico(t.texto))throw new Error('Usa texto normal sin Unicode ni dos puntos.');
  }
  return true;
};
