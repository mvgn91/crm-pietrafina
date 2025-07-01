// WhatsApp Material Sender - Standalone Version
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

  // Materiales disponibles
  const MATERIALS = [
    {
      name: 'CATALOGO DE PRODUCTOS',
      url: 'https://1drv.ms/b/c/240b98da269be9b3/EcurnK7OYqVAvOa5jVheczEB0QlU9UG6bu-b_xjHO7NMwQ?e=N81l6i'
    },
    {
      name: 'LOOKBOOK DE OBRAS',
      url: 'https://1drv.ms/b/c/240b98da269be9b3/EdANAQcVZyhFvilI5fJGdnUB4DFt15vYTnbXM58jEbpsjA?e=jkFCeE'
    }
  ];

  // Crear checkboxes dinámicamente en el modal
  function renderMaterialsSelector() {
    let container = document.getElementById('whatsapp-massive-materials');
    if (!container) {
      // Crear el contenedor si no existe
      const modalContent = document.querySelector('.modal-content');
      container = document.createElement('div');
      container.id = 'whatsapp-massive-materials';
      container.className = 'mb-4';
      modalContent.insertBefore(container, modalContent.querySelector('label'));
    }
    container.innerHTML = `<div class="mb-2 font-semibold text-sm text-gray-700">Selecciona los materiales a enviar:</div>` +
      MATERIALS.map((mat, i) => `
        <label class="flex items-center space-x-2 mb-1">
          <input type="checkbox" class="material-checkbox" value="${i}" checked>
          <span>${mat.name}</span>
        </label>
      `).join('');
  }


  // Cargar prospectos directamente desde Firestore (todos los estatus) con logs y manejo de errores
  function tryLoadProspectsFromFirestore() {
    if (window.firebase && window.firebase.firestore) {
      console.log('[WhatsApp Massive] Firebase y Firestore detectados. Intentando cargar prospectos...');
      try {
        const db = window.firebase.firestore();
        db.collection('prospects').onSnapshot(
          snapshot => {
            prospects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log(`[WhatsApp Massive] Prospectos recibidos:`, prospects);
            renderTable(prospects);
          },
          error => {
            console.error('[WhatsApp Massive] Error al escuchar Firestore:', error);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center p-6 text-red-500">Error al conectar con Firestore: ' + (error.message || error) + '</td></tr>';
          }
        );
      } catch (err) {
        console.error('[WhatsApp Massive] Error al inicializar Firestore:', err);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center p-6 text-red-500">Error al inicializar Firestore: ' + (err.message || err) + '</td></tr>';
      }
    } else if (window.allProspects && window.allProspects.length > 0) {
      // Fallback: usar los prospectos globales si existen
      console.log('[WhatsApp Massive] Usando window.allProspects como fallback.');
      prospects = window.allProspects;
      renderTable(prospects);
    } else {
      // Fallback: escuchar el evento si se usa otro método
      console.log('[WhatsApp Massive] Esperando evento prospectsLoaded...');
      window.addEventListener('prospectsLoaded', function(event) {
        prospects = event.detail;
        renderTable(prospects);
      });
    }
  }

  tryLoadProspectsFromFirestore();

  function renderTable(list) {
    // Actualizar contadores
    const totalCount = document.getElementById('total-prospects-count');
    const whatsappCount = document.getElementById('whatsapp-prospects-count');
    const filteredCount = document.getElementById('filtered-prospects-count');
    if (totalCount) totalCount.textContent = list.length;
    if (whatsappCount) whatsappCount.textContent = list.filter(p => p.phone && p.phone.length >= 10).length;
    if (filteredCount) filteredCount.textContent = list.length;

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center p-6 text-slate-500">No se encontraron prospectos.</td></tr>';
      return;
    }
    tbody.innerHTML = list.map((p, i) => `
      <tr class="${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-green-50 transition">
        <td class="p-3 font-medium text-slate-800">${p.businessName || ''} <span class="block text-xs text-slate-500">${p.contactPerson || ''}</span></td>
        <td class="p-3 text-slate-700">${p.phone || ''}</td>
        <td class="p-3 text-slate-700">${p.email || ''} <span class="block text-xs text-slate-500">${p.status || ''}</span></td>
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
    renderMaterialsSelector();
    // Mensaje base
    modalMessage.value = `Hola ${nombre}, te comparto el material solicitado.\n\n` +
      MATERIALS.map(m => `• ${m.name}: ${m.url}`).join('\n') +
      `\n\nSi tienes dudas, estoy a tus órdenes.`;
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
    // Obtener materiales seleccionados
    const checked = Array.from(document.querySelectorAll('.material-checkbox:checked')).map(cb => MATERIALS[cb.value]);
    let nombre = selectedProspect.businessName || '';
    let mensaje = `Hola ${nombre}, te comparto el material solicitado.\n\n` +
      checked.map(m => `• ${m.name}: ${m.url}`).join('\n') +
      `\n\nSi tienes dudas, estoy a tus órdenes.`;
    // Si el usuario editó el mensaje manualmente, respétalo
    if (modalMessage.value && modalMessage.value !== '' && modalMessage.value !== modalMessage.defaultValue) {
      mensaje = modalMessage.value;
    }
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
