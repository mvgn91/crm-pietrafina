import WhatsAppMaterialSender from './WhatsAppMaterialSender';

const PROSPECTOS_INICIALES = [
  { id: 1, nombre: 'Juan Pérez', telefono: '5215551112233', email: 'juan@mail.com', correoEnviado: false },
  { id: 2, nombre: 'María López', telefono: '5215552223344', email: 'maria@mail.com', correoEnviado: false },
  { id: 3, nombre: 'Carlos Ruiz', telefono: '5215553334455', email: 'carlos@mail.com', correoEnviado: false },
];

import { useState } from 'react';

export default function WhatsAppSection() {
  const [filtro, setFiltro] = useState('');
  const [prospectos, setProspectos] = useState(PROSPECTOS_INICIALES);
  const [nuevo, setNuevo] = useState({ nombre: '', telefono: '', email: '', correoEnviado: false });

  // Filtrar prospectos según búsqueda
  const prospectosFiltrados = prospectos.filter(p =>
    p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    p.telefono.includes(filtro) ||
    p.email.toLowerCase().includes(filtro.toLowerCase())
  );

  // Handler para marcar correo como enviado

  // Handler para agregar prospecto directamente a prospección (correoEnviado: true)
  const handleAgregar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevo.nombre || !nuevo.telefono || !nuevo.email) return;
    setProspectos(prev => [
      ...prev,
      {
        id: prev.length ? Math.max(...prev.map(p => p.id)) + 1 : 1,
        nombre: nuevo.nombre,
        telefono: nuevo.telefono,
        email: nuevo.email,
        correoEnviado: true // Siempre pasa a prospección
      }
    ]);
    setNuevo({ nombre: '', telefono: '', email: '', correoEnviado: false });
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <h2 style={{ fontSize: '1.5rem', color: '#2d3748', marginBottom: 24 }}>Envío de Material por WhatsApp</h2>

      {/* Formulario para agregar prospecto */}
      <form onSubmit={handleAgregar} style={{ display: 'flex', gap: 8, marginBottom: 24, alignItems: 'flex-end' }}>
        <input type="text" placeholder="Nombre" value={nuevo.nombre} onChange={e => setNuevo(n => ({ ...n, nombre: e.target.value }))} style={{ flex: 2, padding: 8, borderRadius: 4, border: '1px solid #cbd5e1' }} />
        <input type="text" placeholder="Teléfono" value={nuevo.telefono} onChange={e => setNuevo(n => ({ ...n, telefono: e.target.value }))} style={{ flex: 2, padding: 8, borderRadius: 4, border: '1px solid #cbd5e1' }} />
        <input type="email" placeholder="Email" value={nuevo.email} onChange={e => setNuevo(n => ({ ...n, email: e.target.value }))} style={{ flex: 3, padding: 8, borderRadius: 4, border: '1px solid #cbd5e1' }} />
        <button type="submit" style={{ flex: 1, background: '#2b6cb0', color: 'white', border: 'none', borderRadius: 4, padding: '8px 0', fontWeight: 500, cursor: 'pointer' }}>Agregar</button>
      </form>

      <input
        type="text"
        placeholder="Buscar prospecto por nombre, teléfono o email..."
        value={filtro}
        onChange={e => setFiltro(e.target.value)}
        style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', marginBottom: 24 }}
      />
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <thead>
          <tr style={{ background: '#f1f5f9' }}>
            <th style={{ textAlign: 'left', padding: 12 }}>Nombre</th>
            <th style={{ textAlign: 'left', padding: 12 }}>Teléfono</th>
            <th style={{ textAlign: 'left', padding: 12 }}>Email</th>
            <th style={{ textAlign: 'center', padding: 12 }}>Correo enviado</th>
            <th style={{ textAlign: 'center', padding: 12 }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {prospectosFiltrados.length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#718096' }}>No se encontraron prospectos.</td></tr>
          ) : (
            prospectosFiltrados.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: 12 }}>{p.nombre}</td>
                <td style={{ padding: 12 }}>{p.telefono}</td>
                <td style={{ padding: 12 }}>{p.email}</td>
                <td style={{ padding: 12, textAlign: 'center' }}>
                  {p.correoEnviado ? (
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>Enviado</span>
                  ) : (
                    <span style={{ color: '#f59e42', fontWeight: 600 }}>Pendiente de correo</span>
                  )}
                </td>
                <td style={{ padding: 12, textAlign: 'center' }}>
                  <WhatsAppMaterialSender />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
