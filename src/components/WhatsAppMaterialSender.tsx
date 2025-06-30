import { useState } from 'react';

const MATERIALS = [
  {
    name: 'CATALOGO DE PRODUCTOS',
    url: 'https://1drv.ms/b/c/240b98da269be9b3/EcurnK7OYqVAvOa5jVheczEB0QlU9UG6bu-b_xjHO7NMwQ?e=N81l6i'
  },
  {
    name: 'LOOKBOOK DE OBRAS',
    url: 'https://1drv.ms/b/c/240b98da269be9b3/EdANAQcVZyhFvilI5fJGdnUB4DFt15vYTnbXM58jEbpsjA?e=iM5wIr'
  },
  {
    name: 'SELECCION DE MATERIALES PREMIUM',
    url: 'https://1drv.ms/b/c/240b98da269be9b3/EfoE-_7mq1dAmulQyma2Rv8B47E_6gtCrdvpmVkGgNbncg?e=UvpjHC'
  }
];

export default function WhatsAppMaterialSender({ onSent }: { onSent?: () => void } = {}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [phone, setPhone] = useState('');
  const [open, setOpen] = useState(false);

  function handleSend() {
    if (selected.length === 0) return;
    const links = MATERIALS.filter(m => selected.includes(m.name)).map(m => `${m.name}: ${m.url}`).join('%0A');
    const message = `Hola, te comparto el/los siguiente(s) material(es) de apoyo:%0A${links}`;
    const phoneParam = phone ? `&phone=${encodeURIComponent(phone)}` : '';
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}${phoneParam}`, '_blank');
    setSelected([]);
    setPhone('');
    setOpen(false);
    if (onSent) onSent();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ background: '#25D366', color: 'white', border: 'none', borderRadius: 4, padding: '8px 16px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        title="Enviar material por WhatsApp"
      >
        <span role="img" aria-label="WhatsApp">🟢</span> Enviar por WhatsApp
      </button>
    );
  }

  return (
    <div style={{ marginBottom: 8, background: '#f1f5f9', borderRadius: 8, padding: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      <div style={{ marginBottom: 12, fontWeight: 500 }}>Selecciona el/los archivo(s) a enviar:</div>
      {MATERIALS.map(m => (
        <label key={m.name} style={{ display: 'block', marginBottom: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={selected.includes(m.name)}
            onChange={e => {
              if (e.target.checked) setSelected([...selected, m.name]);
              else setSelected(selected.filter(n => n !== m.name));
            }}
            style={{ marginRight: 8 }}
          />
          {m.name}
        </label>
      ))}
      <div style={{ margin: '16px 0 8px 0', fontWeight: 500 }}>Número de WhatsApp (opcional):</div>
      <input
        type="text"
        placeholder="Ej: 5215555555555"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        maxLength={15}
        style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #cbd5e1', marginBottom: 16 }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSend} disabled={selected.length === 0} style={{ flex: 1, background: selected.length === 0 ? '#cbd5e1' : '#25D366', color: 'white', border: 'none', borderRadius: 4, padding: '8px 0', fontWeight: 500, cursor: selected.length === 0 ? 'not-allowed' : 'pointer' }}>Enviar</button>
        <button onClick={() => setOpen(false)} style={{ flex: 1, background: '#e2e8f0', color: '#2d3748', border: 'none', borderRadius: 4, padding: '8px 0', fontWeight: 500, cursor: 'pointer' }}>Cancelar</button>
      </div>
    </div>
  );
}
