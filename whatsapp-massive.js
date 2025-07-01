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

  // Inicializar Firebase y Firestore
  async function initializeFirebase() {
    try {
      // Verificar si Firebase ya está inicializado
      if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
        db = firebase.firestore();
        console.log('Firebase ya inicializado, usando instancia existente');
        return true;
      }

      // Si no está inicializado, intentar inicializarlo
      if (typeof firebase !== 'undefined') {
        const firebaseConfig = {
          apiKey: "AIzaSyBvBpgTn8eTVLQqGGGvQGGvQGGvQGGvQGG", // Reemplaza con tu config
          authDomain: "crm-pietrafina.firebaseapp.com",
          projectId: "crm-pietrafina",
          storageBucket: "crm-pietrafina.appspot.com",
          messagingSenderId: "123456789",
          appId: "1:123456789:web:abcdef123456"
        };

        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        console.log('Firebase inicializado correctamente');
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
      
      const firebaseInitialized = await initializeFirebase();
      
      if (!firebaseInitialized || !db) {
        console.warn('Firestore no disponible, usando datos de prueba');
        loadTestData();
        return;
      }

      console.log('Cargando prospectos desde Firestore...');
      
      // Cargar todos los prospectos de la colección
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

      console.log(prospects.length + ' prospectos cargados desde Firestore');
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
        <td colspan="5" class="text-center p-8 text-gray-500">
          <div class="flex flex-col items-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
            <p>Cargando prospectos desde Firestore...</p>
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
    modalMessage.value = 'Hola ' + nombre + ', te comparto el material solicitado.\n\n' +
      MATERIALS.map(function(m) { return '• ' + m.name + ': ' + m.url; }).join('\n') +
      '\n\nSi tienes dudas, estoy a tus órdenes.';
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
    // Abrir WhatsApp con el mensaje
    const whatsappUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl, '_blank');
    closeModal();
  });

  // Función para agregar event listeners a los botones de WhatsApp
  function addButtonListeners() {
    const whatsappButtons = document.querySelectorAll('.whatsapp-send-btn');
    whatsappButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        
        selectedProspect = {
          id: this.getAttribute('data-id'),
          businessName: this.getAttribute('data-name'),
          contactPerson: this.getAttribute('data-contact'),
          phone: this.getAttribute('data-phone'),
          email: this.getAttribute('data-email')
        };
        
        openWhatsAppModal();
      });
    });
  }

  // Función para abrir el modal de WhatsApp
  function openWhatsAppModal() {
    if (!selectedProspect) return;
    
    const businessName = selectedProspect.businessName || 'Cliente';
    const contactPerson = selectedProspect.contactPerson;
    
    // Determinar el saludo personalizado
    let greeting = `¡Hola`;
    if (contactPerson && contactPerson.trim()) {
      greeting += ` ${contactPerson}`;
    }
    greeting += `! 👋`;
    
    // Crear mensaje con todos los materiales
    const materialsText = MATERIALS.map(material => 
      `📄 *${material.name}*\n${material.url}`
    ).join('\n\n');
    
    const defaultMessage = `${greeting}

Soy del equipo de *Pietra Fina* y me da mucho gusto contactarte.

Te comparto nuestros materiales promocionales para ${businessName}:

${materialsText}

Estos documentos incluyen:
• Nuestro catálogo completo de productos
• Lookbook con proyectos realizados
• Selección de materiales premium

Si tienes alguna pregunta específica sobre nuestros productos o necesitas una cotización personalizada, no dudes en contactarme.

¡Quedo atento a tus comentarios! 🏗️✨

*Equipo Pietra Fina*`;

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

    // Asegurar que el teléfono tenga el formato correcto para México
    if (phone.length === 10 && !phone.startsWith('52')) {
      phone = '52' + phone;
    } else if (phone.length === 11 && phone.startsWith('1')) {
      phone = '52' + phone.substring(1);
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
      
      // Opcional: Registrar el envío en Firestore
      logWhatsAppSend();
      
      closeModal();
    } catch (error) {
      console.error('Error al abrir WhatsApp:', error);
      showToast('Error al abrir WhatsApp', 'error');
    }
  }

  // Función para registrar el envío en Firestore (opcional)
  async function logWhatsAppSend() {
    try {
      if (db && selectedProspect) {
        await db.collection('whatsapp_sends').add({
          prospectId: selectedProspect.id,
          businessName: selectedProspect.businessName,
          phone: selectedProspect.phone,
          sentAt: firebase.firestore.FieldValue.serverTimestamp(),
          materials: MATERIALS.map(m => m.name)
        });
        console.log('Envío de WhatsApp registrado en Firestore');
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
    searchInput.addEventListener('input', filterProspects);
    
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
  
