// Port SIEMDES → PF; see PORT-SIEMDES.md.
// segmentos-model.js — Segmentos de campaña (RF-19, F5).
//
// Un segmento es una definición, no una lista guardada a mano: se calcula con
// los campos que ya existen (`status`, `campaignSentAt`, `lastContactChannel`,
// `contactoInvalido`). La vista de Prospección los ofrece como filtro y
// recuerda la elección en localStorage.
//
// Se prueba con node: scripts/test-segmentos.mjs.

import { ESTATUS } from "./config.js";

const CON_SENAL = [
  ESTATUS.INTERESADO,
  "Seguimiento agendado",
  ESTATUS.CLIENTE,
];

export const SEGMENTOS = [
  {value: "cocinas", label: "Cocinas"},
  {value: "disenadores", label: "Diseñadores"},
  {value: "arquitectos", label: "Arquitectos"},
  { value: "todos", label: "Todos los segmentos" },
  { value: "interesado", label: "Interesados" },
  { value: "con_senal", label: "Con señal" },
  { value: "sin_respuesta", label: "Sin respuesta" },
  { value: "rebotes", label: "Rebotes / dato inválido" },
  { value: "sin_correo", label: "Sin correo de campaña" },
];

export const SEGMENTO_AYUDA = {
  todos: "",
  interesado: "Estatus exactamente «Interesado».",
  con_senal: "Interesado, visita, cotización o cliente; o ya hubo llamada/WhatsApp/visita.",
  sin_respuesta: "Campaña enviada y sigue en «Contactado», sin interés declarado.",
  rebotes: "Correo o teléfono marcado como inválido.",
  sin_correo: "No tiene registro de campaña enviada.",
};

export const esSegmentoValido = (value) =>
  SEGMENTOS.some((segmento) => segmento.value === value);

export const tieneDatoInvalido = (prospect) =>
  Boolean(
    prospect?.contactoInvalido?.email || prospect?.contactoInvalido?.phone,
  );

export const perteneceASegmento = (prospect, segmento) => {
  if (!segmento || segmento === "todos") return true;
  if (!prospect) return false;
  const status = (prospect.status || "").trim();
  const businessType = String(prospect.classification || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  switch (segmento) {
    case "cocinas": return /cocina/.test(businessType);
    case "disenadores": return /diseno|disenador/.test(businessType);
    case "arquitectos": return /arquitect/.test(businessType);
    case "interesado":
      return status === ESTATUS.INTERESADO;
    case "con_senal":
      return (
        CON_SENAL.includes(status) ||
        ["llamada", "whatsapp", "visita"].includes(prospect.lastContactChannel)
      );
    case "sin_respuesta":
      return Boolean(prospect.campaignSentAt) && status === ESTATUS.CONTACTADO;
    case "rebotes":
      return tieneDatoInvalido(prospect);
    case "sin_correo":
      return !prospect.campaignSentAt;
    default:
      return true;
  }
};

export const filtrarSegmento = (prospects = [], segmento = "todos") =>
  (Array.isArray(prospects) ? prospects : []).filter((p) =>
    perteneceASegmento(p, segmento),
  );

export const contarSegmentos = (prospects = []) =>
  Object.fromEntries(
    SEGMENTOS.map(({ value }) => [value, filtrarSegmento(prospects, value).length]),
  );

export const prioridadComercial = p => perteneceASegmento(p,"cocinas") ? 1 : perteneceASegmento(p,"disenadores") || perteneceASegmento(p,"arquitectos") ? 2 : 3;
