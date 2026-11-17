// Port SIEMDES → PF; see PORT-SIEMDES.md.
// campana-metricas-model.js — Métricas de campaña (RF-17, F2-08C/D).
//
// Se calculan desde los envíos reales (`prospects/{id}/envios`) y los
// prospectos; no se guardan contadores. «Conversión» aquí es la tasa de
// respuesta de la campaña (envíos con resultado `respondido`), no el cierre
// comercial: son dos preguntas distintas.
//
// Se prueba con node: scripts/test-metricas.mjs.

import { ENVIO_CANALES } from "./config.js";

const RESULTADOS = ["enviado", "entregado", "rebotado", "respondido"];
const CANAL_SEGUIMIENTO = "seguimiento";

export const canalMetricaLabel = (canal) =>
  ENVIO_CANALES.find((c) => c.value === canal)?.label ||
  (canal === CANAL_SEGUIMIENTO ? "Seguimiento" : canal);

const aFecha = (valor) => {
  if (!valor) return null;
  const fecha = valor instanceof Date ? valor : new Date(valor);
  return isNaN(fecha.getTime()) ? null : fecha;
};

/** Lunes de la semana local de una fecha (00:00). */
export const lunesDe = (valor) => {
  const fecha = aFecha(valor);
  if (!fecha) return null;
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};

export const labelSemana = (lunes) => {
  if (!lunes) return "";
  const dd = String(lunes.getDate()).padStart(2, "0");
  const mm = String(lunes.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
};

const redondear = (n) => Math.round(n * 10) / 10;

/**
 * @param {Array} prospects  prospectos con `id` y `classification`
 * @param {Array} envios     envíos con `fecha`, `canal`, `resultado` y
 *                           `prospectId` (el panel lo agrega desde la ruta)
 */
export const metricasCampania = (
  prospects = [],
  envios = [],
  { semanas = 6, ahora = new Date() } = {},
) => {
  const porId = new Map(
    (Array.isArray(prospects) ? prospects : []).map((p) => [p.id, p]),
  );
  const validos = (Array.isArray(envios) ? envios : []).filter((envio) => {
    if (!envio || !aFecha(envio.fecha)) return false;
    return (
      envio.canal === CANAL_SEGUIMIENTO ||
      ENVIO_CANALES.some((c) => c.value === envio.canal)
    );
  });

  const total = validos.length;
  const porResultado = Object.fromEntries(
    RESULTADOS.map((r) => [r, validos.filter((e) => e.resultado === r).length]),
  );
  const respondidos = porResultado.respondido;
  const rebotados = porResultado.rebotado;
  const tasaRespuesta = total ? redondear((respondidos / total) * 100) : 0;
  const tasaRebote = total ? redondear((rebotados / total) * 100) : 0;

  const porCanal = ENVIO_CANALES.map(({ value, label }) => {
    const lista = validos.filter((e) => e.canal === value);
    const respondidosCanal = lista.filter((e) => e.resultado === "respondido").length;
    return {
      canal: value,
      label,
      total: lista.length,
      respondidos: respondidosCanal,
      rebotados: lista.filter((e) => e.resultado === "rebotado").length,
      tasaRespuesta: lista.length
        ? redondear((respondidosCanal / lista.length) * 100)
        : 0,
    };
  });

  // Seis semanas: la actual y las cinco anteriores, incluidas las vacías para
  // que un hueco no se lea como caída.
  const lunesActual = lunesDe(ahora);
  const inicio = new Date(lunesActual);
  inicio.setDate(inicio.getDate() - (Math.max(1, semanas) - 1) * 7);
  const porSemana = Array.from({ length: Math.max(1, semanas) }, (_, i) => {
    const lunes = new Date(inicio);
    lunes.setDate(lunes.getDate() + i * 7);
    const fin = new Date(lunes);
    fin.setDate(fin.getDate() + 7);
    const lista = validos.filter((e) => {
      const fecha = aFecha(e.fecha);
      return fecha >= lunes && fecha < fin;
    });
    return {
      lunes,
      label: labelSemana(lunes),
      total: lista.length,
      respondidos: lista.filter((e) => e.resultado === "respondido").length,
      rebotados: lista.filter((e) => e.resultado === "rebotado").length,
    };
  });

  const segmentos = new Map();
  validos.forEach((envio) => {
    const prospect = porId.get(envio.prospectId);
    const segmento = prospect?.classification || "Sin segmento";
    if (!segmentos.has(segmento)) {
      segmentos.set(segmento, { segmento, total: 0, respondidos: 0, rebotados: 0 });
    }
    const fila = segmentos.get(segmento);
    fila.total += 1;
    if (envio.resultado === "respondido") fila.respondidos += 1;
    if (envio.resultado === "rebotado") fila.rebotados += 1;
  });
  const porSegmento = [...segmentos.values()]
    .map((fila) => ({
      ...fila,
      tasaRespuesta: fila.total ? redondear((fila.respondidos / fila.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total || a.segmento.localeCompare(b.segmento));

  const fechas = validos
    .map((e) => aFecha(e.fecha))
    .filter(Boolean)
    .sort((a, b) => b - a);

  return {
    total,
    porResultado,
    respondidos,
    rebotados,
    tasaRespuesta,
    tasaRebote,
    porCanal,
    porSemana,
    porSegmento,
    ultimoEnvio: fechas[0] ? fechas[0].toISOString() : null,
  };
};

// PF stores its campaign history in followUpNotes, not SIEMDES subcollections.
// Text inference is only accepted for explicit legacy campaign + result words.
export const metricasPorCampania = (prospects=[]) => {
  const groups=new Map();
  for(const p of prospects) {
    for(const note of Array.isArray(p.followUpNotes) ? p.followUpNotes : []) {
      const text=String(note?.note || '');
      const explicit=note?.campaign || (/campa[nñ]a de alianza estrat[eé]gica/i.test(text) ? 'Campaña de Alianza Estratégica' : null);
      if(!explicit) continue;
      if(!groups.has(explicit))groups.set(explicit,{campaign:explicit,enviados:0,respuestas:0,reuniones:0,convertidos:0,preparados:0,legacy:0,ids:new Set(),converted:new Set()});
      const g=groups.get(explicit);g.ids.add(p.id);
      const outcome=note.outcome;
      if(note.event==='whatsapp_preparado'){g.preparados++;continue;}
      const textSent=!outcome && /enviad[oa]|se envi[oó]/i.test(text);
      if(['sin_respuesta','respondido','reunion','convertido','rechazado','enviado'].includes(outcome) && ['whatsapp','correo'].includes(note.channel) || textSent)g.enviados++;
      if(['respondido','reunion','convertido'].includes(outcome))g.respuestas++;
      if(outcome==='reunion')g.reuniones++;
      if(outcome==='convertido')g.converted.add(p.id);
      if(!outcome)g.legacy++;
    }
  }
  // Current status alone does not attribute a conversion to a campaign.
  return [...groups.values()].map(g=>{const {ids,converted,...rest}=g;return {...rest,prospectos:ids.size,convertidos:converted.size};});
};
