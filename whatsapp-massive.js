// WhatsApp Material Sender - Vanilla JS con estilos aplicados
document.addEventListener('DOMContentLoaded', function () {
  console.log('WhatsApp Massive JS cargado');
  
  const tbody = document.getElementById('whatsapp-massive-tbody');
  const searchInput = document.getElementById('whatsapp-massive-search');
  const modal = document.getElementById('whatsapp-massive-modal');
  const modalClose = document.getElementById('whatsapp-massive-modal-close');
  const modalMessage = document.getElementById('whatsapp-massive-message');
  const modalSend = document.getElementById('whatsapp-massive-send-btn');
  const modalCancel = document.getElementById('whatsapp-massive-cancel-btn');

  let selectedProspect = null;
  let prospects = [];

  // Materiales disponibles para envío
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

  // Función para cargar prospectos desde Firestore (si está disponible)
  async function loadProspects() {
    try {
      if (typeof window.db !== 'undefined') {
        const snapshot = await window.db.collection('prospects').get();
        prospects = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else {
        // Datos de prueba si no hay Firestore
        prospects = [
          { id: 1, businessName: 'Empresa Demo 1', phone: '5215551234567', email: 'demo1@email.com' },
          { id: 2, businessName: 'Empresa Demo 2', phone: '5215559876543', email: 'demo2@email.com' },
          { id: 3, businessName: 'Empresa Demo 3', phone: '5215555555555', email: 'demo3@email.com' }
        ];
      }
      renderTable(prospects);
    } catch (error) {
      console.error('Error cargando prospectos:', error);
      showToast('Error al cargar prospectos', 'error');
    }
  }

  // Función para renderizar la tabla con estilos aplicados
  function renderTable(list) {
    if (!list || list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center p-8 text-slate-500">
            <i class="fas fa-inbox text-4xl mb-4 block"></i>
            <p>No se encontraron prospectos.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map((prospect, index) => {
      const businessName = prospect.businessName || 'Sin nombre';
      const phone = prospect.phone || 'Sin teléfono';
      const email = prospect.email || 'Sin email';
      const rowClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
      
      return `
        <tr class="${rowClass} hover:bg-green-50 transition-all duration-200 border-b border-gray-100">
          <td class="p-4 font-medium text-gray-800">
            <div class="flex items-center">
              <i class="fas fa-building text-gray-600 mr-2"></i>
              ${businessName}
            </div>
          </td>
          <td class="p-4 text-gray-700">
            <div class="flex items-center">
              <i class="fas fa-phone text-gray-600 mr-2"></i>
              ${phone}
            </div>
          </td>
          <td class="p-4 text-gray-700">
            <div class="flex items-center">
              <i class="fas fa-envelope text-gray-600 mr-2"></i>
              <span class="truncate max-w-xs">${email}</span>
            </div>
          </td>
          <td class="p-4">
            <button 
              class="action-btn bg-green-600 hover:bg-green-700 text-white whatsapp-send-btn transition-all duration-200 transform hover:scale-105" 
              data-id="${prospect.id}"
              data-name="${businessName}"
              data-phone="${phone}"
            >
              <i class="fab fa-whatsapp mr-2"></i>
              Enviar Material
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Agregar event listeners a los botones
    addButtonListeners();
  }

  // Función para agregar event listeners a los botones de WhatsApp
  function addButtonListeners() {
    const whatsappButtons = document.querySelectorAll('.whatsapp-send-btn');
    whatsappButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        const prospectId = this.getAttribute('data-id');
        const prospectName = this.getAttribute('data-name');
        const prospectPhone = this.getAttribute('data-phone');
        
        selectedProspect = {
          id: prospectId,
          businessName: prospectName,
          phone: prospectPhone
        };
        
        openWhatsAppModal();
      });
    });
  }

  // Función para abrir el modal de WhatsApp
  function openWhatsAppModal() {
    if (!selectedProspect) return;
    
    const businessName = selectedProspect.businessName || 'Cliente';
    
    // Crear mensaje con todos los materiales
    const materialsText = MATERIALS.map(material => 
      `📄 *${material.name}*: ${material.url}`
    ).join('\n\n');
    
    const defaultMessage = `¡Hola ${businessName}! 👋

Te comparto nuestros materiales de Pietra Fina:

${materialsText}

Si tienes alguna pregunta o necesitas más información, no dudes en contactarme.

¡Saludos! 🏗️✨`;

    modalMessage.value = defaultMessage;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    
    // Agregar animación de entrada
    setTimeout(() => {
      modal.querySelector('.modal-container').classList.add('animate-modalIn');
    }, 10);
    
    modalMessage.focus();
  }

  // Función para cerrar el modal
  function closeModal() {
    const container = modal.querySelector('.modal-container');
    container.classList.remove('animate-modalIn');
    container.classList.add('animate-modalOut');
    
    setTimeout(() => {
      modal.classList.add('hidden');
      modal.style.display = 'none';
      container.classList.remove('animate-modalOut');
      selectedProspect = null;
    }, 200);
  }

  // Función para enviar WhatsApp
  function sendWhatsApp() {
    if (!selectedProspect) {
      showToast('No hay prospecto seleccionado', 'error');
      return;
    }

    let phone = selectedProspect.phone || '';
    phone = phone.replace(/\D/g, ''); // Remover caracteres no numéricos
    
    if (!phone) {
      showToast('No hay teléfono válido para este prospecto', 'error');
      return;
    }

    // Asegurar que el teléfono tenga el formato correcto
    if (!phone.startsWith('52') && phone.length === 10) {
      phone = '52' + phone;
    }

    const message = modalMessage.value.trim();
    if (!message) {
      showToast('El mensaje no puede estar vacío', 'error');
      return;
    }

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    
    try {
      window.open(whatsappUrl, '_blank');
      showToast(`Material enviado a ${selectedProspect.businessName}`, 'success');
      closeModal();
    } catch (error) {
      console.error('Error al abrir WhatsApp:', error);
      showToast('Error al abrir WhatsApp', 'error');
    }
  }

  // Función para filtrar prospectos
  function filterProspects() {
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) {
      renderTable(prospects);
      return;
    }

    const filtered = prospects.filter(prospect => {
      const businessName = (prospect.businessName || '').toLowerCase();
      const phone = (prospect.phone || '').toLowerCase();
      const email = (prospect.email || '').toLowerCase();
      
      return businessName.includes(query) || 
             phone.includes(query) || 
             email.includes(query);
    });

    renderTable(filtered);
  }

  // Función para mostrar notificaciones toast
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type} show`;
    toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-2"></i>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  // Event Listeners
  if (searchInput) {
    searchInput.addEventListener('input', filterProspects);
  }

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  if (modalCancel) {
    modalCancel.addEventListener('click', closeModal);
  }

  if (modalSend) {
    modalSend.addEventListener('click', sendWhatsApp);
  }

  // Cerrar modal al hacer clic fuera
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // Cerrar modal con tecla Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });

  // Inicializar la aplicación
  loadProspects();
  
  console.log('WhatsApp Massive inicializado correctamente');
});