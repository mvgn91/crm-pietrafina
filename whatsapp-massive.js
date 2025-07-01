// WhatsApp Material Sender - Integración con Firestore
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
  let db = null;

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

  // Inicializar Firebase y Firestore
  function initializeFirebase() {
    try {
      if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
        db = firebase.firestore();
        console.log('Firebase ya inicializado, usando instancia existente');
        return true;
      }
      console.warn('Firebase no está disponible');
      return false;
    } catch (error) {
      console.error('Error inicializando Firebase:', error);
      return false;
    }
  }

  // Función para cargar prospectos desde Firestore
  async function loadProspectsFromFirestore() {
    try {
      showLoadingState();
      const firebaseInitialized = initializeFirebase();
      if (!firebaseInitialized || !db) {
        console.warn('Firestore no disponible, usando datos de prueba');
        loadTestData();
        return;
      }
      
      console.log('Cargando prospectos desde Firestore...');
      const snapshot = await db.collection('prospects').get();
      
      if (snapshot.empty) {
        console.log('No se encontraron prospectos en Firestore');
        prospects = [];
        renderTable(prospects);
        return;
      }
      
      prospects = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        prospects.push({
          id: doc.id,
          businessName: data.businessName || data.nombre || 'Sin nombre',
          contactPerson: data.contactPerson || data.contacto || '',
          phone: data.phone || data.telefono || '',
          email: data.email || data.correo || '',
          classification: data.classification || data.clasificacion || '',
          status: data.status || data.estado || '',
          observations: data.observations || data.observaciones || '',
          createdAt: data.createdAt || data.fechaCreacion || null
        });
      });
      
      console.log(`${prospects.length} prospectos cargados desde Firestore`);
      renderTable(prospects);
      
    } catch (error) {
      console.error('Error cargando prospectos desde Firestore:', error);
      showToast('Error al cargar prospectos desde la base de datos', 'error');
      loadTestData();
    }
  }

  // Función para mostrar estado de carga
  function showLoadingState() {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center p-8 text-gray-500">
          <div class="flex flex-col items-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
            <p>Conectando con Firestore...</p>
            <p class="text-sm text-gray-400 mt-1">Cargando prospectos en tiempo real</p>
          </div>
        </td>
      </tr>
    `;
  }

  // Función para cargar datos de prueba si Firestore no está disponible
  function loadTestData() {
    console.log('Cargando datos de prueba...');
    prospects = [
      { 
        id: 'demo1', 
        businessName: 'Arquitectos Modernos S.A.', 
        contactPerson: 'Juan Pérez',
        phone: '5215551234567', 
        email: 'juan.perez@arquitectosmodernos.com',
        classification: 'Despacho de Arquitectos',
        status: 'En Prospección'
      },
      { 
        id: 'demo2', 
        businessName: 'Diseño Interior Premium', 
        contactPerson: 'María López',
        phone: '5215559876543', 
        email: 'maria.lopez@disenointerior.com',
        classification: 'Diseño de Interiores',
        status: 'Interesado'
      },
      { 
        id: 'demo3', 
        businessName: 'Constructora del Valle', 
        contactPerson: 'Carlos Ruiz',
        phone: '5215555555555', 
        email: 'carlos.ruiz@constructoradelvalle.com',
        classification: 'Constructoras',
        status: 'Pendiente de Correo'
      }
    ];
    renderTable(prospects);
    showToast('Usando datos de demostración (Firestore no disponible)', 'warning');
  }

  // Función para renderizar la tabla con prospectos
  function renderTable(list) {
    // Actualizar contadores
    updateCounters(list);

    if (!list.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center p-8 text-gray-500">
            <div class="flex flex-col items-center">
              <i class="fas fa-inbox text-4xl mb-4 text-gray-300"></i>
              <p class="text-lg font-medium">No se encontraron prospectos</p>
              <p class="text-sm text-gray-400 mt-1">Intenta ajustar los filtros de búsqueda</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map((prospect, index) => {
      const hasPhone = prospect.phone && prospect.phone.length >= 10;
      const statusColor = getStatusColor(prospect.status);
      
      return `
        <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50 transition-colors duration-200">
          <td class="p-4 border-b border-gray-100">
            <div class="font-semibold text-gray-900">${prospect.businessName || 'Sin nombre'}</div>
            ${prospect.contactPerson ? `<div class="text-sm text-gray-600 mt-1">${prospect.contactPerson}</div>` : ''}
            ${prospect.classification ? `<div class="text-xs text-gray-500 mt-1 bg-gray-100 px-2 py-1 rounded-full inline-block">${prospect.classification}</div>` : ''}
          </td>
          <td class="p-4 border-b border-gray-100">
            <div class="flex items-center">
              ${hasPhone ? `
                <i class="fas fa-phone text-green-600 mr-2"></i>
                <span class="font-mono text-sm">${prospect.phone}</span>
              ` : `
                <i class="fas fa-phone-slash text-red-400 mr-2"></i>
                <span class="text-gray-400 text-sm">Sin teléfono</span>
              `}
            </div>
          </td>
          <td class="p-4 border-b border-gray-100">
            <div class="text-sm text-gray-700">${prospect.email || 'Sin email'}</div>
            ${prospect.status ? `
              <div class="mt-1">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}">
                  ${prospect.status}
                </span>
              </div>
            ` : ''}
          </td>
          <td class="p-4 border-b border-gray-100 text-center">
            ${hasPhone ? `
              <button 
                class="whatsapp-send-btn inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                data-prospect-id="${prospect.id}"
                title="Enviar material por WhatsApp"
              >
                <i class="fab fa-whatsapp mr-2"></i>
                Enviar Material
              </button>
            ` : `
              <span class="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-500 font-medium rounded-lg cursor-not-allowed">
                <i class="fas fa-ban mr-2"></i>
                Sin WhatsApp
              </span>
            `}
          </td>
        </tr>
      `;
    }).join('');

    // Agregar event listeners a los botones de WhatsApp
    addWhatsAppEventListeners();
  }

  // Función para obtener el color del status
  function getStatusColor(status) {
    const statusColors = {
      'Pendiente de Correo': 'bg-yellow-100 text-yellow-800',
      'En Prospección': 'bg-blue-100 text-blue-800',
      'Pendiente de Validación': 'bg-orange-100 text-orange-800',
      'Interesado': 'bg-green-100 text-green-800',
      'No contesta': 'bg-gray-100 text-gray-800',
      'Rechazado': 'bg-red-100 text-red-800',
      'Seguimiento agendado': 'bg-purple-100 text-purple-800',
      'Reactivar Contacto': 'bg-indigo-100 text-indigo-800',
      'Completado': 'bg-emerald-100 text-emerald-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  // Función para actualizar contadores
  function updateCounters(list) {
    const totalCount = document.getElementById('total-prospects-count');
    const whatsappCount = document.getElementById('whatsapp-prospects-count');
    const filteredCount = document.getElementById('filtered-prospects-count');
    
    const totalProspects = prospects.length;
    const whatsappProspects = prospects.filter(p => p.phone && p.phone.length >= 10).length;
    const filteredProspects = list.length;
    
    if (totalCount) totalCount.textContent = totalProspects;
    if (whatsappCount) whatsappCount.textContent = whatsappProspects;
    if (filteredCount) filteredCount.textContent = filteredProspects;
  }

  // Función para agregar event listeners a los botones de WhatsApp
  function addWhatsAppEventListeners() {
    const whatsappButtons = document.querySelectorAll('.whatsapp-send-btn');
    whatsappButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        const prospectId = this.getAttribute('data-prospect-id');
        const prospect = prospects.find(p => p.id === prospectId);
        if (prospect) {
          openModal(prospect);
        }
      });
    });
  }

  // Función para abrir el modal con los datos del prospecto
  function openModal(prospect) {
    selectedProspect = prospect;
    const message = generateWhatsAppMessage(prospect);
    modalMessage.value = message;
    modal.classList.remove('hidden');
    
    // Enfocar el textarea para edición inmediata
    setTimeout(() => {
      modalMessage.focus();
    }, 100);
  }

  // Función para cerrar el modal
  function closeModal() {
    modal.classList.add('hidden');
    selectedProspect = null;
    modalMessage.value = '';
  }

  // Función para generar el mensaje personalizado de WhatsApp
  function generateWhatsAppMessage(prospect) {
    const contactName = prospect.contactPerson || 'Estimado/a';
    const businessName = prospect.businessName || 'su empresa';
    
    let message = `¡Hola ${contactName}!\n\n`;
    message += `Espero que se encuentre muy bien. Mi nombre es [TU NOMBRE] de Pietra Fina.\n\n`;
    message += `Me da mucho gusto contactarle porque hemos identificado que ${businessName} podría beneficiarse enormemente de nuestros materiales premium para proyectos de alta gama.\n\n`;
    message += `Le comparto nuestro material exclusivo:\n\n`;
    
    MATERIALS.forEach((material, index) => {
      message += `📋 *${material.name}*\n${material.url}\n\n`;
    });
    
    message += `Estos materiales incluyen:\n`;
    message += `✨ Nuestra línea completa de productos premium\n`;
    message += `🏗️ Proyectos realizados y referencias de obras\n`;
    message += `💎 Selección exclusiva de materiales de lujo\n\n`;
    message += `¿Le gustaría que agendemos una reunión para platicar sobre cómo podemos colaborar en sus próximos proyectos?\n\n`;
    message += `Quedo atento a sus comentarios.\n\n`;
    message += `Saludos cordiales,\n`;
    message += `[TU NOMBRE]\n`;
    message += `Pietra Fina\n`;
    message += `📱 [TU TELÉFONO]\n`;
    message += `📧 [TU EMAIL]`;
    
    return message;
  }

  // Función para enviar mensaje por WhatsApp
  function sendWhatsApp() {
    if (!selectedProspect) {
      showToast('Error: No hay prospecto seleccionado', 'error');
      return;
    }

    if (!selectedProspect.phone) {
      showToast('Error: El prospecto no tiene número de teléfono', 'error');
      return;
    }

    const message = modalMessage.value.trim();
    if (!message) {
      showToast('Error: El mensaje no puede estar vacío', 'error');
      return;
    }

    // Limpiar el número de teléfono (remover espacios, guiones, etc.)
    let cleanPhone = selectedProspect.phone.replace(/\D/g, '');
    
    // Asegurar que el número tenga el formato correcto para México
    if (cleanPhone.startsWith('52')) {
      // Ya tiene código de país
    } else if (cleanPhone.length === 10) {
      // Número de 10 dígitos, agregar código de país
      cleanPhone = '52' + cleanPhone;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
      // Número con 1 al inicio (formato antiguo), remover el 1 y agregar 52
      cleanPhone = '52' + cleanPhone.substring(1);
    }

    // Codificar el mensaje para URL
    const encodedMessage = encodeURIComponent(message);
    
    // Crear URL de WhatsApp
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    
    // Abrir WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Registrar el envío (opcional - puedes implementar esto más tarde)
    registerWhatsAppSend(selectedProspect);
    
    // Mostrar confirmación
    showToast(`Material enviado a ${selectedProspect.businessName}`, 'success');
    
    // Cerrar modal
    closeModal();
  }

  // Función para registrar el envío en Firestore (opcional)
  async function registerWhatsAppSend(prospect) {
    try {
      if (db) {
        await db.collection('whatsapp_sends').add({
          prospectId: prospect.id,
          businessName: prospect.businessName,
          phone: prospect.phone,
          sentAt: firebase.firestore.FieldValue.serverTimestamp(),
          materials: MATERIALS.map(m => m.name)
        });
        console.log('Envío registrado en Firestore');
      }
    } catch (error) {
      console.error('Error registrando envío:', error);
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
      const contactPerson = (prospect.contactPerson || '').toLowerCase();
      const phone = (prospect.phone || '').toLowerCase();
      const email = (prospect.email || '').toLowerCase();
      const classification = (prospect.classification || '').toLowerCase();
      
      return businessName.includes(query) || 
             contactPerson.includes(query) ||
             phone.includes(query) || 
             email.includes(query) ||
             classification.includes(query);
    });

    renderTable(filtered);
    
    // Mostrar resultado de búsqueda
    if (query && filtered.length === 0) {
      showToast(`No se encontraron resultados para "${query}"`, 'info');
    }
  }

  // Función para mostrar notificaciones toast
  function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container') || document.body;
    const toast = document.createElement('div');
    
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    
    const colors = {
      success: 'border-green-500 bg-green-50 text-green-800',
      error: 'border-red-500 bg-red-50 text-red-800',
      warning: 'border-yellow-500 bg-yellow-50 text-yellow-800',
      info: 'border-blue-500 bg-blue-50 text-blue-800'
    };
    
    toast.className = `toast ${colors[type]} show fixed top-4 right-4 z-50 p-4 rounded-lg border-l-4 shadow-lg max-w-sm`;
    toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${icons[type]} mr-3 text-lg"></i>
        <span class="font-medium">${message}</span>
      </div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.add('opacity-0');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 4000);
  }

  // Event Listeners
  if (searchInput) {
    // Búsqueda en tiempo real con debounce
    let searchTimeout;
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(filterProspects, 300);
    });
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

  // Teclas de acceso rápido
  document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + F para enfocar búsqueda
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // Inicializar la aplicación
  console.log('Inicializando WhatsApp Massive...');
  loadProspectsFromFirestore();
});