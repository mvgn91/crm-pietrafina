// Adapted from SIEMDES config.js; status labels remain owned by Phase 1.
import { STATUS_META, ARCHIVED_STATUSES, OUT_OF_FLOW_STATUSES } from './status-model.js';
export const PROJECT = Object.freeze({ id: 'crm-pietrafina', name: 'Pietra Fina', author: 'Nicolas', campaign: 'Campaña de Alianza Estratégica', draftKey: 'pf_phase2_v1' });
export const ESTATUS = { POR_CONTACTAR: 'Pendiente de Correo', CONTACTADO: 'En Prospección', INTERESADO: 'Interesado', CLIENTE: 'Convertido a cliente', DESCARTADO: 'Rechazado' };
export const ESTATUS_PIPELINE = Object.keys(STATUS_META);
export const ESTATUS_TERMINALES = ARCHIVED_STATUSES;
export const ESTATUS_ABIERTOS = ESTATUS_PIPELINE.filter(s => !ESTATUS_TERMINALES.includes(s));
export const ESTATUS_EN_SEGUIMIENTO = ['Interesado', 'Seguimiento agendado'];
export const SEGUIMIENTO = { DIAS_SIN_FECHA_VENCIDO: 15, DIAS_PROXIMO: 7 };
export const REACTIVACION_ESTADOS = { DO_NOT_CONTACT: 'do_not_contact' };
export const ENVIO_CANALES = [{value:'whatsapp',label:'WhatsApp'},{value:'llamada',label:'Llamada'},{value:'visita',label:'Reunión'},{value:'correo',label:'Correo'}];
export const SECUENCIA_PASOS = [{value:'whatsapp_1',label:'Día 1 · WhatsApp',day:1,channel:'whatsapp'},{value:'llamada_4',label:'Día 4 · Llamada',day:4,channel:'llamada'},{value:'whatsapp_8',label:'Día 8 · WhatsApp de cierre',day:8,channel:'whatsapp'}];
export { OUT_OF_FLOW_STATUSES };
