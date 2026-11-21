// Port SIEMDES → PF; see PORT-SIEMDES.md.
// campania-model.js — Lógica PURA de la campaña permanente (sin DOM ni
// Firestore). Una sola definición de «en qué paso va este prospecto», «qué
// toca después» y «cuánto se ha retrasado la cadencia».
//
// El historial de ENVÍOS vive en la subcolección `prospects/{id}/envios`; el
// ESTADO de la cadencia vive en el prospecto (`sequence.step`, `nextStep`,
// `nextAt`). Este módulo no escribe nada: calcula.
//
// Se prueba con node: scripts/test-campania.mjs.

import { ENVIO_CANALES, SECUENCIA_PASOS, PROJECT } from "./config.js";
import { diaDe, daysBetween, esTerminal, addDays, toDate } from "./pipeline-model.js";

// Grupos de la vista de cadencia. Reusan los nombres del semáforo donde el
// significado es el mismo (vencido / hoy) para no crear un cuarto vocabulario.
export const CADENCIA = {
  VENCIDO: "vencido",
  HOY: "hoy",
  SEMANA: "semana",
  DESPUES: "despues",
  SIN_FECHA: "sin_fecha",
  TERMINAL: "terminal",
};

export const cadenciaLabel = (clave) =>
  ({
    [CADENCIA.VENCIDO]: "Vencido",
    [CADENCIA.HOY]: "Hoy",
    [CADENCIA.SEMANA]: "Esta semana",
    [CADENCIA.DESPUES]: "Más adelante",
    [CADENCIA.SIN_FECHA]: "Sin fecha",
    [CADENCIA.TERMINAL]: "Cerrado",
  })[clave] || "";

export const pasoLabel = (value) =>
  SECUENCIA_PASOS.find((p) => p.value === value)?.label || value || "";

export const esCanalValido = (value) =>
  ENVIO_CANALES.some((c) => c.value === value);

/** Paso que sigue en la cadencia. `null` si ya está en el último (visita). */
export const siguientePasoDe = (paso) => {
  const i = SECUENCIA_PASOS.findIndex((p) => p.value === paso);
  if (i === -1) return SECUENCIA_PASOS[0].value;
  return SECUENCIA_PASOS[i + 1]?.value ?? null;
};

/** Lectura normalizada de `sequence.*` (tolera prospectos sin cadencia). */
export const secuenciaDe = (prospect) => {
  const seq = prospect?.sequence || {};
  const paso = seq.step || null;
  return {
    paso,
    pasoLabel: pasoLabel(paso),
    siguiente: seq.nextStep || (paso ? siguientePasoDe(paso) : null),
    fecha: seq.nextAt || null,
    canal: seq.channel || SECUENCIA_PASOS.find(p => p.value === (seq.nextStep || paso))?.channel || null,
    updatedAt: seq.updatedAt || null,
    activa: !seq.completed && Boolean(paso || seq.nextStep || seq.nextAt),
  };
};

/**
 * Clasifica una fecha por día de calendario. `dias` es el desfase: negativo =
 * pasado, 0 = hoy, positivo = por venir. Fuente única para cadencia y bandeja.
 */
export const clasificarFecha = (fecha, ahora = new Date()) => {
  if (!fecha) return { clave: CADENCIA.SIN_FECHA, dias: null };
  const delta = daysBetween(fecha, ahora);
  if (delta === null) return { clave: CADENCIA.SIN_FECHA, dias: null };
  if (delta > 0) return { clave: CADENCIA.VENCIDO, dias: -delta };
  if (delta === 0) return { clave: CADENCIA.HOY, dias: 0 };
  if (delta >= -7) return { clave: CADENCIA.SEMANA, dias: -delta };
  return { clave: CADENCIA.DESPUES, dias: -delta };
};

/**
 * Estado de la cadencia de un prospecto. `dias` es el desfase en días de
 * calendario: negativo = pasado, 0 = hoy, positivo = por venir.
 */
export const cadenciaDe = (prospect, ahora = new Date()) => {
  const secuencia = secuenciaDe(prospect);

  if (esTerminal(prospect?.status)) {
    return { clave: CADENCIA.TERMINAL, etiqueta: "", dias: null, secuencia };
  }

  const { clave, dias } = clasificarFecha(secuencia.fecha, ahora);
  if (clave === CADENCIA.SIN_FECHA) {
    return {
      clave,
      etiqueta: secuencia.activa ? "SIN FECHA" : "",
      dias,
      secuencia,
    };
  }
  if (clave === CADENCIA.VENCIDO) {
    return {
      clave,
      etiqueta: `VENCIDO · hace ${dias === -1 ? "1 día" : `${Math.abs(dias)} días`}`,
      dias,
      secuencia,
    };
  }
  if (clave === CADENCIA.HOY) {
    return { clave, etiqueta: "HOY", dias, secuencia };
  }
  return { clave, etiqueta: "", dias, secuencia };
};

/** Solo los prospectos con cadencia viva y abiertos entran a la vista. */
export const enCadencia = (prospect) =>
  !esTerminal(prospect?.status) && secuenciaDe(prospect).activa;

const porFecha = (a, b) => {
  const fa = secuenciaDe(a).fecha;
  const fb = secuenciaDe(b).fecha;
  if (!fa && !fb) return (a.businessName || "").localeCompare(b.businessName || "");
  if (!fa) return 1;
  if (!fb) return -1;
  return new Date(fa) - new Date(fb);
};

/**
 * Agrupa la cartera para la vista de cadencia. Cada grupo va ordenado por
 * fecha ascendente: lo que venció primero es lo que más urge.
 */
export const agruparCadencia = (prospects = [], ahora = new Date()) => {
  const grupos = {
    [CADENCIA.VENCIDO]: [],
    [CADENCIA.HOY]: [],
    [CADENCIA.SEMANA]: [],
    [CADENCIA.DESPUES]: [],
    [CADENCIA.SIN_FECHA]: [],
  };
  let terminales = 0;

  (Array.isArray(prospects) ? prospects : []).forEach((p) => {
    if (esTerminal(p?.status)) {
      terminales += 1;
      return;
    }
    if (!secuenciaDe(p).activa) return;
    const { clave } = cadenciaDe(p, ahora);
    if (grupos[clave]) grupos[clave].push(p);
  });

  Object.values(grupos).forEach((lista) => lista.sort(porFecha));
  return {
    ...grupos,
    total: Object.values(grupos).reduce((n, lista) => n + lista.length, 0),
    terminales,
  };
};

/**
 * Etiqueta corta para la fila: «Correo → WhatsApp · 14 nov». Sin fechas
 * inventadas: si no hay siguiente paso o fecha, se dice.
 */
export const resumenSecuencia = (prospect) => {
  const s = secuenciaDe(prospect);
  if (!s.activa) return "Sin cadencia";
  const pasos = [s.pasoLabel, s.siguiente ? pasoLabel(s.siguiente) : null]
    .filter(Boolean)
    .join(" → ");
  const fecha = s.fecha ? String(s.fecha).slice(0, 10) : "sin fecha";
  return `${pasos} · ${fecha}`;
};

export { diaDe, daysBetween };

// PF adaptation: three attempts 1/4/8, each with an explicit outcome and note.
// No inference of a sent message from opening wa.me.
export const cadenceState = (p, now = new Date()) => {
  const s=p?.sequence || {};
  const complete=s.completed === true;
  const index=Number.isInteger(s.completedTouches) ? s.completedTouches : 0;
  const step=SECUENCIA_PASOS[index] || null;
  return { ...s, complete, index, step, due: !(s.nextAt || (!s.startedAt && p.nextFollowUpDate)) || (daysBetween(s.nextAt || p.nextFollowUpDate,now) ?? -1) >= 0, active: !complete && !esTerminal(p?.status) && p?.reactivation?.status !== 'do_not_contact' };
};
export const buildCadenceTouch = (p, { note, outcome, user, now = new Date(), followUpDate = null, campaign, message = '', template = '' } = {}) => {
  const state=cadenceState(p,now);
  if (!String(campaign || PROJECT.campaign).trim()) throw new Error('Indica la campaña.');
  if (!state.active || !state.step) throw new Error('La cadencia está cerrada.');
  if (!state.due) throw new Error('Todavía no vence el siguiente toque.');
  if (!String(note || '').trim()) throw new Error('Cada toque requiere una nota.');
  if (!['sin_respuesta','respondido','reunion','convertido','rechazado'].includes(outcome)) throw new Error('Selecciona un resultado válido.');
  const start=p.sequence?.startedAt || now.toISOString();
  const completedTouches=state.index+1;
  const completed=outcome!=='sin_respuesta' || completedTouches===3;
  const nextStep=completed ? null : SECUENCIA_PASOS[completedTouches].value;
  const nextAt=completed ? null : addDays(start,SECUENCIA_PASOS[completedTouches].day-1);
  let status=p.status, nextFollowUpDate=p.nextFollowUpDate || null;
  if (outcome==='respondido' || outcome==='reunion') {
    if (!toDate(followUpDate) || diaDe(followUpDate) < diaDe(now)) throw new Error('La respuesta requiere fecha de visita o seguimiento válida.');
    status='Interesado'; nextFollowUpDate=followUpDate;
  } else if (outcome==='convertido') status='Convertido a cliente';
  else if (outcome==='rechazado') status='Rechazado';
  else if (completedTouches===3) { status='Seguimiento agendado'; nextFollowUpDate=addDays(now,30); }
  const event={ note:String(note).trim(), date:now.toISOString(), user:user || 'Usuario', channel:state.step.channel, campaign:campaign || PROJECT.campaign, outcome, cadenceTouch:completedTouches, message, template };
  return { ...p, status, nextFollowUpDate, lastUpdated:event.date, followUpNotes:[...(p.followUpNotes || []),event], sequence:{ startedAt:start,completedTouches,step:state.step.value,nextStep,nextAt,completed,updatedAt:event.date } };
};
