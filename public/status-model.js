// Presentation only: never normalizes or writes persisted prospect data.
export const STATUS_META = {
  'Pendiente de Correo': { badge: 'bg-yellow-100 text-yellow-800', color: '#ca8a04' },
  'En Prospección': { badge: 'bg-blue-100 text-blue-800', color: '#3b82f6' },
  'Interesado': { badge: 'bg-green-100 text-green-800', color: '#16a34a' },
  'Seguimiento agendado': { badge: 'bg-cyan-100 text-cyan-800', color: '#0891b2' },
  'No contesta': { badge: 'bg-gray-100 text-gray-800', color: '#6b7280' },
  'Rechazado': { badge: 'bg-red-100 text-red-800', color: '#dc2626' },
  'Convertido a cliente': { badge: 'bg-purple-100 text-purple-800', color: '#9333ea' },
  'Ya es nuestro cliente': { badge: 'bg-indigo-100 text-indigo-800', color: '#4f46e5' },
  'Revisión Admin Pendiente': { badge: 'bg-amber-100 text-amber-800', color: '#d97706' },
  'Completado': { badge: 'bg-teal-100 text-teal-800', color: '#0f766e' },
  'Reactivar Contacto': { badge: 'bg-orange-100 text-orange-800', color: '#ea580c' },
};
export const ARCHIVED_STATUSES = ['Rechazado', 'Convertido a cliente', 'Ya es nuestro cliente'];
export const OUT_OF_FLOW_STATUSES = ['Revisión Admin Pendiente', 'Completado', 'Reactivar Contacto'];
export const getStatusBadgeClass = status => STATUS_META[status]?.badge || 'bg-gray-100 text-gray-800';

// Each input record belongs to exactly one group, including unexpected statuses.
export function groupProspects(prospects, view = 'management') {
  const groups = view === 'management'
    ? { 'Pendientes de Correo': [], Activos: [], Archivo: [], 'Fuera de flujo': [], 'Otros estatus': [] }
    : { Interesados: [], 'Seguimientos agendados': [], 'Prospección Activa (Sin Fecha Agendada)': [], 'Prospectos Legado (Revisar Estatus)': [], 'Pendientes de Correo': [], Archivo: [], 'Fuera de flujo': [], 'Otros estatus': [] };
  for (const p of prospects) {
    let group;
    if (ARCHIVED_STATUSES.includes(p.status)) group = 'Archivo';
    else if (OUT_OF_FLOW_STATUSES.includes(p.status)) group = 'Fuera de flujo';
    else if (p.status === 'Pendiente de Correo') group = 'Pendientes de Correo';
    else if (!STATUS_META[p.status]) group = 'Otros estatus';
    else if (view === 'management') group = 'Activos';
    else if (p.status === 'Interesado') group = 'Interesados';
    else if (['Seguimiento agendado', 'No contesta'].includes(p.status)) group = 'Prospectos Legado (Revisar Estatus)';
    else if (p.nextFollowUpDate) group = 'Seguimientos agendados';
    else group = 'Prospección Activa (Sin Fecha Agendada)';
    groups[group].push(p);
  }
  return groups;
}

export function populateStatusFilter(select, { active = false } = {}) {
  if (!select) return;
  select.replaceChildren(new Option('Todos los Estatus', 'all'));
  if (active) select.add(new Option('Prospectos Activos', 'active'));
  for (const status of Object.keys(STATUS_META)) select.add(new Option(status, status));
}
