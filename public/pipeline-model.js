// Port SIEMDES → PF; see PORT-SIEMDES.md.
// pipeline-model.js — Lógica PURA del pipeline de fase 1 (sin DOM ni Firestore).
//
// Una sola definición de «qué tan urgente es este prospecto» y de «qué
// transiciones de estatus son válidas». El tablón, la lista de Gestión, la
// ficha y el panel pintan lo que diga este módulo: antes cada vista tenía su
// propia cuenta de fechas y el mismo prospecto se veía distinto en cada una.
//
// Se puede probar con node: scripts/test-pipeline.mjs.

import {
  ESTATUS_ABIERTOS,
  ESTATUS_PIPELINE,
  ESTATUS_EN_SEGUIMIENTO,
  ESTATUS_TERMINALES,
  SEGUIMIENTO,
} from "./config.js";

// ── Fechas ──────────────────────────────────────────────────────────────────
export const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  // Acepta ISO y fechas de formulario (YYYY-MM-DD) sin corrimiento de zona:
  // `new Date("2026-10-12")` es medianoche UTC y en México cae el día 11.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    const result = new Date(y, m - 1, d);
    return result.getFullYear() === y && result.getMonth() === m - 1 && result.getDate() === d ? result : null;
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

/** Día de calendario en UTC: comparar fechas sin que las horas importen. */
export const diaDe = (value) => {
  const d = toDate(value);
  if (!d) return null;
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
};

export const daysBetween = (from, to = new Date()) => {
  const a = diaDe(from);
  const b = diaDe(to);
  if (a === null || b === null) return null;
  // Días de calendario, no fracciones: «hace 15 días» debe coincidir con la fecha.
  return Math.round((b - a) / 86400000);
};

const iso = d => toDate(d)?.toISOString() || null;

export const formatDias = (n) => {
  if (n === null || n === undefined) return "sin registro";
  if (n === 0) return "hoy";
  if (n === 1) return "ayer";
  return `hace ${n} días`;
};

// ── Historial de notas ──────────────────────────────────────────────────────
export const notesOf = (prospect) =>
  (Array.isArray(prospect?.followUpNotes) ? prospect.followUpNotes : [])
    .filter((n) => n && (n.date || n.at))
    .map((n) => ({ ...n, _d: toDate(n.date || n.at) }))
    .filter((n) => n._d)
    .sort((a, b) => a._d - b._d);

/**
 * Último toque comercial real, con su canal. Manda `lastContactAt` (decisión
 * D-23); los registros anteriores a la regla no lo traen y el toque se deriva
 * del historial y de la campaña marcada, así que la ficha cuenta la verdad
 * aunque el dato viejo no se haya vuelto a escribir.
 *
 * El contacto directo con Alfredo cuenta como toque: el hilo lo llevó él.
 */
export const ultimoContacto = (prospect) => {
  const candidatos = [];
  if (prospect?.lastContactAt) {
    candidatos.push({
      fecha: prospect.lastContactAt,
      canal: prospect.lastContactChannel || "nota",
    });
  }
  if (prospect?.directoAlfredoAt) {
    candidatos.push({ fecha: prospect.directoAlfredoAt, canal: "alfredo_directo" });
  } else if (prospect?.directoAlfredo) {
    // Contacto directo sin fecha: se usa la del alta para no perder la señal.
    candidatos.push({ fecha: prospect.createdAt, canal: "alfredo_directo" });
  }
  if (prospect?.campaignSentAt) {
    candidatos.push({ fecha: prospect.campaignSentAt, canal: "campana" });
  }
  notesOf(prospect).forEach((nota) => {
    candidatos.push({ fecha: nota._d, canal: nota.channel || "nota" });
  });
  return candidatos.reduce((max, candidato) => {
    const t = toDate(candidato.fecha)?.getTime();
    if (!Number.isFinite(t)) return max;
    return !max || t > max.t ? { ...candidato, t } : max;
  }, null);
};

export const ultimoContactoAt = (prospect) => iso(ultimoContacto(prospect)?.fecha ?? null);

/** Antigüedad del hilo: días desde el último toque (o desde el alta). */
export const diasSinToque = (prospect, ahora = new Date()) => {
  const ultimo = ultimoContacto(prospect);
  const referencia = ultimo?.fecha || prospect?.createdAt || null;
  if (!referencia) return null;
  return daysBetween(referencia, ahora);
};

// ── Semáforo ────────────────────────────────────────────────────────────────
export const SEMAFORO = {
  VENCIDO: "vencido",
  HOY: "hoy",
  PROXIMO: "proximo",
  SIN_FECHA: "sin_fecha",
  AL_DIA: "al_dia",
  TERMINAL: "terminal",
};

export const esTerminal = (estatus) => ESTATUS_TERMINALES.includes(estatus);

export const estaEnSeguimiento = (estatus) => ESTATUS_EN_SEGUIMIENTO.includes(estatus);

/**
 * Semáforo derivado (no se guarda, se calcula). Reglas:
 *
 *  · vencido  → la fecha de seguimiento ya pasó, O el prospecto sigue abierto
 *               sin fecha y nadie lo tocó en más de SEGUIMIENTO.DIAS_SIN_FECHA_VENCIDO
 *               (el caso que antes se quedaba en «sin fecha» para siempre).
 *  · hoy      → el seguimiento vence hoy.
 *  · proximo  → vence dentro de la semana (sin alarma).
 *  · al_dia   → vence más adelante.
 *  · sin_fecha→ abierto, sin fecha y con toque reciente: requiere agendar.
 *  · terminal → Cliente / Descartado: no llevan semáforo.
 *
 * Devuelve `dias` como días de desfase para vencido/hoy/próximo (negativo =
 * pasado) y como días sin toque cuando el vencimiento es por antigüedad.
 */
export const semaforoDe = (prospect, ahora = new Date()) => {
  const estatus = prospect?.status || "";
  if (esTerminal(estatus)) {
    return { clave: SEMAFORO.TERMINAL, etiqueta: "", dias: null, porAntiguedad: false, fecha: null };
  }

  const hoy = diaDe(ahora);
  const fecha = prospect?.nextFollowUpDate || null;
  const diaFecha = diaDe(fecha);

  if (diaFecha !== null) {
    const delta = Math.round((diaFecha - hoy) / 86400000);
    if (delta < 0) {
      const dias = Math.abs(delta);
      return {
        clave: SEMAFORO.VENCIDO,
        etiqueta: `VENCIDO · hace ${dias === 1 ? "1 día" : `${dias} días`}`,
        dias: delta,
        porAntiguedad: false,
        fecha,
      };
    }
    if (delta === 0) {
      return { clave: SEMAFORO.HOY, etiqueta: "HOY", dias: 0, porAntiguedad: false, fecha };
    }
    if (delta <= SEGUIMIENTO.DIAS_PROXIMO) {
      return { clave: SEMAFORO.PROXIMO, etiqueta: "", dias: delta, porAntiguedad: false, fecha };
    }
    return { clave: SEMAFORO.AL_DIA, etiqueta: "", dias: delta, porAntiguedad: false, fecha };
  }

  // Abierto y sin fecha: la antigüedad decide. Un prospecto recién dado de alta
  // no está vencido; uno que lleva tres semanas sin toque, sí.
  const dias = diasSinToque(prospect, ahora);
  if (dias !== null && dias > SEGUIMIENTO.DIAS_SIN_FECHA_VENCIDO) {
    return {
      clave: SEMAFORO.VENCIDO,
      etiqueta: `VENCIDO · hace ${dias} días`,
      dias,
      porAntiguedad: true,
      fecha: null,
    };
  }
  return {
    clave: SEMAFORO.SIN_FECHA,
    etiqueta: "SIN FECHA",
    dias,
    porAntiguedad: false,
    fecha: null,
  };
};

/**
 * «Requieren acción» no es «sin fecha»: un vencido es justo el que más urge y
 * el seguimiento de hoy es el trabajo del día (RF-23). La regla anterior
 * dejaba fuera los de hoy: el filtro mostraba 31/33 y escondía a FAMESA y
 * Tequila Embajador. Ahora incluye vencidos, hoy y sin fecha.
 */
export const requiereAccion = (prospect, ahora = new Date()) => {
  if (esTerminal(prospect?.status)) return false;
  const clave = semaforoDe(prospect, ahora).clave;
  return (
    clave === SEMAFORO.VENCIDO ||
    clave === SEMAFORO.HOY ||
    clave === SEMAFORO.SIN_FECHA
  );
};

/**
 * Rebanada con la que abre el tablón (RF-22). «Hoy» es la vista natural, pero
 * si hoy no vence nada el operador abriría una lista vacía mientras los
 * atrasados esperan: en ese caso se abre en Atrasados. No cambia las reglas
 * de las rebanadas, solo cuál se muestra al cargar.
 */
export const vistaInicialDelTablon = (
  { hoy = 0, atrasados = 0, vistaActual = "hoy" } = {},
) => (vistaActual === "hoy" && hoy === 0 && atrasados > 0 ? "atrasados" : vistaActual);


// PF has no Visita/Cotización status: retain its eleven statuses, no migration.
export const validarTransicion = ({ actual, nuevo, nota = '', nextFollowUpDate = null, permitirReapertura = false } = {}) => {
  if (!ESTATUS_PIPELINE.includes(nuevo)) return { ok: false, error: 'Estatus desconocido.' };
  if (nuevo === actual) return { ok: true, error: null };
  if (!String(nota).trim()) return { ok: false, error: 'El cambio requiere una nota en el historial.' };
  if (esTerminal(actual) && !permitirReapertura) return { ok: false, error: 'Confirma la reapertura del registro archivado.' };
  if (nuevo === 'Seguimiento agendado' && !toDate(nextFollowUpDate)) return { ok: false, error: 'Seguimiento agendado requiere una fecha válida.' };
  return { ok: true, error: null };
};
export const siguientesEstatus = (actual, { permitirReapertura = false } = {}) =>
  esTerminal(actual) && !permitirReapertura ? [actual] : ESTATUS_PIPELINE.slice();
export const dateInput = (value) => {
  const d = toDate(value);
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
export const addDays = (value, days) => {
  const d = toDate(value); if (!d) throw new Error('Fecha inválida.');
  const next = new Date(d); next.setDate(next.getDate()+days); return dateInput(next);
};
