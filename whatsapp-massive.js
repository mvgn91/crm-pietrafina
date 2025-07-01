// Este script asume que tienes acceso a la lista de prospectos en allProspects (como en script.js)
// Si no, deberás cargarla desde Firestore o desde una variable global

document.addEventListener('DOMContentLoaded', function () {
  const tbody = document.getElementById('whatsapp-massive-tbody');
  const searchInput = document.getElementById('whatsapp-massive-search');
  const modal = document.getElementById('whatsapp-massive-modal');
  const modalClose = document.getElementById('whatsapp-massive-modal-close');
  const modalMessage = document.getElementById('whatsapp-massive-message');
  const modalSend = document.getElementById('whatsapp-massive-send-btn');
  const modalCancel = document.getElementById('whatsapp-massive-cancel-btn');

  let selectedProspect = null;
  let prospects = [];

  // Escuchar el evento de carga de prospectos
  window.addEventListener('prospectsLoaded', function(event) {
    prospects = event.detail;
    renderTable(prospects);
  });

  // Si ya están cargados los prospectos, usarlos inmediatamente
  if (window.allProspects && window.allProspects.length > 0) {
    prospects = window.allProspects;
    renderTable(prospects);
  }

  function renderTable(list) {
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center p-6 text-slate-500">No se encontraron prospectos.</td></tr>';
      return;
    }
    tbody.innerHTML = list.map((p, i) => `
      <tr class="${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-green-50 transition">
        <td class="p-3 font-medium text-slate-800">${p.businessName || ''}</td>
        <td class="p-3 text-slate-700">${p.phone || ''}</td>
        <td class="p-3 text-slate-700">${p.email || ''}</td>
        <td class="p-3">
          <button class="action-btn bg-green-600 hover:bg-green-700 text-white whatsapp-massive-send" data-id="${p.id}"><i class="fab fa-whatsapp"></i> Enviar WhatsApp</button>
        </td>
      </tr>
    `).join('');
  }

  function filterProspects() {
    const q = searchInput.value.trim().toLowerCase();
    const filtered = prospects.filter(p =>
      (p.businessName || '').toLowerCase().includes(q) ||
      (p.phone || '').includes(q) ||
      (p.email || '').toLowerCase().includes(q)
    );
    renderTable(filtered);
  }

  searchInput.addEventListener('input', filterProspects);

  tbody.addEventListener('click', function (e) {
    const btn = e.target.closest('.whatsapp-massive-send');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    selectedProspect = prospects.find(p => String(p.id) === String(id));
    if (!selectedProspect) return;
    let nombre = selectedProspect.businessName || '';
    modalMessage.value = `Hola ${nombre}, te comparto el material solicitado. Si tienes dudas, estoy a tus órdenes.`;
    modal.classList.remove('hidden');
    modalMessage.focus();
  });

  function closeModal() {
    modal.classList.add('hidden');
    selectedProspect = null;
  }
  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);

  modalSend.addEventListener('click', function () {
    if (!selectedProspect) return;
    let telefono = (selectedProspect.phone || '').replace(/\D/g, '');
    let mensaje = modalMessage.value;
    if (!telefono) {
      alert('No hay teléfono válido para este prospecto.');
      return;
    }
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
    closeModal();
  });

  // Inicializar tabla
  renderTable(prospects);
});
