// Versión simple sin Chakra UI
import { useState } from 'react';
import WhatsAppMaterialSender from './components/WhatsAppMaterialSender';
import WhatsAppMiniButton from './components/WhatsAppMiniButton';
import WhatsAppSection from './components/WhatsAppSection';

// Ejemplo de datos de prospectos para pruebas
const PROSPECTOS = [
  { id: 1, nombre: 'Juan Pérez', telefono: '5551234567', email: 'juan.perez@email.com' },
  { id: 2, nombre: 'María López', telefono: '5559876543', email: 'maria.lopez@email.com' },
  { id: 3, nombre: 'Carlos Sánchez', telefono: '5551112233', email: 'carlos.sanchez@email.com' },
];
// ...existing code...

// ...existing code...

function ProspectoDetalle({ prospecto, onBack }: { prospecto: any, onBack: () => void }) {
  return (
    <div style={{ background: '#f1f5f9', borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: 32, marginBottom: 32 }}>
      <button onClick={onBack} style={{ marginBottom: 16, background: '#e2e8f0', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer', color: '#2d3748', fontWeight: 500 }}>← Volver</button>
      <h3 style={{ fontSize: '1.2rem', color: '#2b6cb0', marginBottom: 8 }}>{prospecto.nombre}</h3>
      <div style={{ color: '#4a5568', marginBottom: 8 }}>Tel: {prospecto.telefono}</div>
      <div style={{ color: '#4a5568', marginBottom: 16 }}>Email: {prospecto.email}</div>
      {/* Aquí va el botón de WhatsApp para este prospecto */}
      <WhatsAppMaterialSender />
    </div>
  );
}

// ...existing code...



// Pantalla de login y selector de roles con acceso directo a WhatsApp
// Pantalla de login con acceso directo a WhatsApp
function LoginScreen({ onLogin, onWhatsApp }: { onLogin: () => void, onWhatsApp: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f7fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 40, minWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', color: '#2b6cb0', marginBottom: 24 }}>CRM Pietrafina</h1>
        <button onClick={onLogin} style={{ width: '100%', background: '#2b6cb0', color: 'white', border: 'none', borderRadius: 6, padding: '0.75rem 0', fontSize: '1.1rem', fontWeight: 700, marginBottom: 18, cursor: 'pointer' }}>Iniciar sesión</button>
        <button onClick={onWhatsApp} style={{ width: '100%', background: '#25D366', color: 'white', border: 'none', borderRadius: 6, padding: '0.75rem 0', fontSize: '1.1rem', fontWeight: 700, marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span role="img" aria-label="WhatsApp">🟢</span> Enviar material por WhatsApp
        </button>
        <div style={{ color: '#718096', fontSize: 14, marginTop: 8, textAlign: 'center' }}>Puedes probar la función de WhatsApp sin iniciar sesión</div>
      </div>
    </div>
  );
}


function App() {
  // login: false = pantalla de login, true = app principal
  const [loggedIn, setLoggedIn] = useState(false);
  const [vista, setVista] = useState<'prospectos' | 'whatsapp'>('prospectos');
  const [detalle, setDetalle] = useState<null | number>(null);

  // Al iniciar sesión, mostrar la vista principal directamente (por defecto: Prospección)
  if (!loggedIn) {
    return (
      <LoginScreen
        onLogin={() => { setLoggedIn(true); setVista('prospectos'); }}
        onWhatsApp={() => { setLoggedIn(true); setVista('whatsapp'); }}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7fafc' }}>
      <header style={{ background: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: '1rem 2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: '1.25rem', color: '#2b6cb0', margin: 0 }}>CRM Pietrafina</h1>
          <div>
            <button onClick={() => setVista('prospectos')} style={{ border: '2px solid #2b6cb0', background: vista === 'prospectos' ? '#2b6cb0' : 'white', color: vista === 'prospectos' ? 'white' : '#2b6cb0', borderRadius: 6, padding: '0.5rem 1.5rem', fontSize: '1rem', cursor: 'pointer', marginRight: 12, fontWeight: 700 }}>Prospección</button>
            <button onClick={() => setVista('whatsapp')} style={{ border: '2px solid #25D366', background: vista === 'whatsapp' ? '#25D366' : 'white', color: vista === 'whatsapp' ? 'white' : '#25D366', borderRadius: 6, padding: '0.5rem 1.5rem', fontSize: '1rem', cursor: 'pointer', fontWeight: 700 }}>WhatsApp</button>
          </div>
        </div>
      </header>
      {vista === 'whatsapp' ? (
        <WhatsAppSection />
      ) : (
        <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#2d3748', marginBottom: 24 }}>Prospección de Clientes</h2>
          <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: 32 }}>
            {detalle === null ? (
              <>
                <p style={{ color: '#718096', marginBottom: 24 }}>Selecciona un prospecto para ver detalles:</p>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {PROSPECTOS.map(p => (
                    <li key={p.id} style={{ marginBottom: 16, background: '#f1f5f9', borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                      <span style={{ fontWeight: 500 }}>{p.nombre}</span>
                      {/* Ejemplo de etiqueta de estatus visual para "CLIENTE CONVERTIDO" */}
                      {p.nombre === 'Juan Pérez' && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          borderRadius: 5,
                          padding: '2px 10px',
                          background: '#e6f4ea',
                          color: '#17803a',
                          border: '1px solid #b6e2c6',
                          letterSpacing: 0.2,
                          lineHeight: 1.2,
                          minHeight: 22,
                          userSelect: 'none',
                        }}>
                          <span style={{fontSize:14,marginRight:4}}>★</span>CLIENTE CONVERTIDO
                        </span>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Ejemplo de uso de EtiquetaStatus para "CLIENTE CONVERTIDO" */}
                        {/* <EtiquetaStatus texto="CLIENTE CONVERTIDO" color="#e6f4ea" textoColor="#17803a" icono={<span style={{fontSize:14}}>★</span>} /> */}
                        <button onClick={() => setDetalle(p.id)} style={{ background: '#2b6cb0', color: 'white', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer', fontWeight: 500 }}>Ver detalles</button>
                        <WhatsAppMiniButton />
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <ProspectoDetalle prospecto={PROSPECTOS.find(p => p.id === detalle)} onBack={() => setDetalle(null)} />
            )}
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
