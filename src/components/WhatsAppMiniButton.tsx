import { useState } from 'react';
import WhatsAppMaterialSender from './WhatsAppMaterialSender';

export default function WhatsAppMiniButton() {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShow(!show)}
        title="Enviar material por WhatsApp"
        style={{ background: '#25D366', color: 'white', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer', marginLeft: 8 }}
      >
        <span role="img" aria-label="WhatsApp">🟢</span>
      </button>
      {show && (
        <div style={{ position: 'absolute', zIndex: 1000, background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20, maxWidth: 320, right: 0, top: 40, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          <WhatsAppMaterialSender onSent={() => setShow(false)} />
          <button onClick={() => setShow(false)} style={{ background: '#e2e8f0', color: '#2d3748', border: 'none', borderRadius: 4, padding: '4px 12px', fontWeight: 500, cursor: 'pointer', marginTop: 8, width: '100%' }}>Cerrar</button>
        </div>
      )}
    </div>
  );
}
