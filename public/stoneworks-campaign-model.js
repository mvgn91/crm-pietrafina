// Campaña Stoneworks — cola rodante de trabajo para la vista Gestión.
// Módulo PURO: no lee Firestore, no escribe y no normaliza datos persistidos.
// Recibe los prospectos ya cargados y devuelve los 10 siguientes por contactar,
// en la prioridad aprobada por Armand (21 nov 2026), y los contadores de la sección.

export const STONEWORKS_LOTE_MARKER = "Agregado por Nyx — Lote 2026-11-19";
export const STONEWORKS_QUEUE_SIZE = 10;

// Ola 1: orden de trabajo de Muse Nico para los 9 del Lote Nyx.
const LOTE_1 = [
  "solococinas",
  "tekni",
  "kooben",
  "santo patron",
  "hauska",
  "gfa",
  "grupo dmi",
  "worldhotels",
  "bruna",
];
const INTERESADOS_PRIO = ["pigmento", "mo gdl", "ziat"];

// Fuera de flujo o ya clientes: nunca entran a la cola de prospección.
const EXCLUDED_STATUSES = new Set([
  "Convertido a cliente",
  "Ya es nuestro cliente",
  "Rechazado",
  "Completado",
  "Revisión Admin Pendiente",
  "Reactivar Contacto",
]);

const CAMPAIGN_MARKER = /campaña\s+stoneworks/i;
const RESPONSE_MARKER =
  /respondi|respuesta|contest|interesad|rechaz|convert|visita|seguimiento|agend|llamada|whatsapp/i;
const RESPONDED_MARKER = /respondi|respuesta|contest|interesad|rechaz|convert|visita/i;
const TEST_RECORD = /prueba/i;

const normalize = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

// Fechas de calendario (sin zona horaria): "2026-11-22" y "2026-11-22T…" valen lo mismo.
const dayValue = (value) => {
  if (!value) return null;
  const text = String(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime())
      ? null
      : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getTime();
};

// Ventana de la campaña: las notas de meses anteriores son historial legacy y
// no deben marcar envíos/respuestas de esta campaña. 45 días cubre la ola 1,
// la llamada del día 4 y el cierre del día 8 sin depender de la fecha del sistema.
const CAMPAIGN_WINDOW_DAYS = 45;

const noteText = (note) =>
  String(note?.note ?? note?.text ?? note?.message ?? "").trim();

const shortDay = (value) => {
  const ms = dayValue(value);
  if (ms === null) return "";
  const date = new Date(ms);
  const month = date.toLocaleDateString("es-MX", { month: "short" }).replace(".", "");
  return `${date.getDate()} ${month} ${date.getFullYear()}`;
};

/**
 * Estado visible de un prospecto dentro de la campaña.
 * Solo cuentan las notas recientes: el historial de meses anteriores no
 * marca envíos ni respuestas de esta campaña.
 */
export const stoneworksState = (prospect, now = new Date()) => {
  const notes = Array.isArray(prospect?.followUpNotes) ? prospect.followUpNotes : [];
  const today = dayValue(now);
  const campaignStart = today - CAMPAIGN_WINDOW_DAYS * 86400000;
  const campaignNotes = notes.filter((note) => {
    const day = dayValue(note?.date);
    return day !== null && day >= campaignStart && day <= today;
  });
  const outcome = campaignNotes.find((note) => RESPONSE_MARKER.test(noteText(note)));
  if (outcome) {
    const text = noteText(outcome);
    const responded = RESPONDED_MARKER.test(text);
    return {
      key: responded ? "respondido" : "seguimiento",
      label: responded ? "Respondió" : `Seguimiento ${shortDay(outcome.date)}`,
      date: outcome.date || null,
      inQueue: false,
    };
  }
  const sent = campaignNotes.filter((note) => CAMPAIGN_MARKER.test(noteText(note)));
  if (sent.length) {
    const last = sent[sent.length - 1];
    // Armand escribe la fecha en la nota ("... el 22 nov 2026"): se respeta
    // esa fecha antes que la metadata, que a veces se registra otro día.
    const fromText = noteText(last).match(/\d{1,2}\s+\w+\s+\d{4}/);
    const date = fromText?.[0] || shortDay(last.date) || "";
    return {
      key: "enviado",
      label: date ? `Enviado ${date}` : "Enviado",
      date: last.date || null,
      inQueue: true,
    };
  }
  return { key: "por-enviar", label: "Por enviar", date: null, inQueue: true };
};

const isLote1 = (prospect) =>
  /agregado por nyx.*lote 2026-11-19/i.test(String(prospect?.observations ?? ""));

const hasContact = (prospect) =>
  Boolean(String(prospect?.phone ?? "").trim() || String(prospect?.email ?? "").trim());

const waveOf = (prospect, nowMs) => {
  if (isLote1(prospect)) return 1;
  if (prospect?.status === "Interesado") return 2;
  if (
    prospect?.status === "Seguimiento agendado" &&
    (() => {
      const date = dayValue(prospect.nextFollowUpDate);
      return date !== null && date < nowMs;
    })()
  ) return 3;
  if (prospect?.status === "En Prospección") return 4;
  return null;
};

const priorityIndex = (name, anchors) => {
  const normalized = normalize(name);
  const found = anchors.findIndex((anchor) => normalized.includes(anchor));
  return found === -1 ? anchors.length : found;
};

const classificationTanda = (prospect) => {
  const classification = normalize(prospect?.classification);
  if (/cocina|kitchen/.test(classification)) return 0;
  if (/diseno|interior|arquitect/.test(classification)) return 1;
  return 2;
};

const nameOf = (prospect) => String(prospect?.businessName ?? "");

const byName = (a, b) => nameOf(a.prospect).localeCompare(nameOf(b.prospect), "es");

// Orden dentro de cada ola. El resultado es determinista y no muta los datos.
const compareQueue = (a, b) => {
  if (a.wave !== b.wave) return a.wave - b.wave;
  if (a.wave === 1) {
    const diff = a.priority - b.priority;
    return diff || byName(a, b);
  }
  if (a.wave === 2) {
    const diff = a.priority - b.priority;
    return diff || byName(a, b);
  }
  if (a.wave === 3) return a.day - b.day || byName(a, b);
  const diff = a.tanda - b.tanda;
  return diff || byName(a, b);
};

/**
 * Construye la cola de la campaña.
 * @param {Array} prospects prospectos ya cargados (no se modifican).
 * @param {Date} [now] fecha de referencia; inyectable para pruebas.
 */
export const buildStoneworksQueue = (prospects = [], now = new Date()) => {
  const nowMs = dayValue(now) ?? Date.now();
  const seen = new Set();
  const counts = { lote: 0, interesados: 0, vencidos: 0, prospeccion: 0 };
  const excluded = [];
  const candidates = [];

  for (const prospect of Array.isArray(prospects) ? prospects : []) {
    const key = String(prospect?.id ?? nameOf(prospect)).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const status = String(prospect?.status ?? "");
    const state = stoneworksState(prospect, now);
    const wave = waveOf(prospect, nowMs);

    if (
      EXCLUDED_STATUSES.has(status) ||
      TEST_RECORD.test(nameOf(prospect)) ||
      !hasContact(prospect) ||
      wave === null ||
      !state.inQueue
    ) {
      excluded.push({ id: prospect?.id ?? null, reason: state.inQueue ? "fuera-de-campaña" : state.key });
      continue;
    }

    if (wave === 1) counts.lote += 1;
    else if (wave === 2) counts.interesados += 1;
    else if (wave === 3) counts.vencidos += 1;
    else counts.prospeccion += 1;

    candidates.push({
      prospect,
      wave,
      state,
      priority:
        wave === 1 ? priorityIndex(nameOf(prospect), LOTE_1)
          : wave === 2 ? priorityIndex(nameOf(prospect), INTERESADOS_PRIO)
            : 0,
      day: wave === 3 ? dayValue(prospect.nextFollowUpDate) ?? 0 : 0,
      tanda: wave === 4 ? classificationTanda(prospect) : 0,
    });
  }

  candidates.sort(compareQueue);
  const queue = candidates.slice(0, STONEWORKS_QUEUE_SIZE);
  return {
    queue,
    porContactar: queue.length,
    remaining: candidates.length,
    counts,
    excluded,
  };
};
