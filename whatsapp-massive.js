// WhatsApp Material Sender - Integración con Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Configuración de Firebase para tu aplicación web
const firebaseConfig = {
    apiKey: "AIzaSyB2VgG-spKXngIcC5pbP_Knpi3e06c6z4E",
    authDomain: "crm-pietrafina.firebaseapp.com",
    projectId: "crm-pietrafina",
    storageBucket: "crm-pietrafina.firebasestorage.app",
    messagingSenderId: "765972736898",
    appId: "1:765972736898:web:3cffb3322601fa5d607d9b",
    measurementId: "G-2BZ0J4T69V"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUserName = "Pietra Fina"; // Default name

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in.
    if (user.uid === "Wv1BcMQlQreQ3doUPccObJdX6cS2") { // Nicolas's UID
      currentUserName = "NICOLAS CAPETILLO";
    } else if (user.uid === "n4WFgGtOtDQwYaV9QXy16bDvYE32") { // Francisco's UID
      currentUserName = "FRANCISCO CAPETILLO";
    }
  } else {
    // User is signed out.
    currentUserName = "Pietra Fina";
  }
});

document.addEventListener('DOMContentLoaded', function () {
  console.log('WhatsApp Massive JS cargado');
  
  const tbody = document.getElementById('whatsapp-massive-tbody');
  const searchInput = document.getElementById('whatsapp-massive-search');
  const modal = document.getElementById('whatsapp-massive-modal');
  const modalClose = document.getElementById('whatsapp-massive-modal-close');
  const modalMessage = document.getElementById('whatsapp-massive-message');
  const modalSend = document.getElementById('whatsapp-massive-send-btn');
  const modalCancel = document.getElementById('whatsapp-massive-cancel-btn');
  const materialsCheckboxContainer = document.getElementById('materials-checkbox-container');

  let selectedProspect = null;
  let prospects = [];

  // Materiales disponibles para envío
  const MATERIALS = [
    {
      name: 'CATALOGO DE PRODUCTOS',
      url: 'http://bit.ly/3IbX56b'
    },
    {
      name: 'LOOKBOOK DE OBRAS',
      url: 'https://bit.ly/4kj5TnW'
    },
    {
      name: 'SELECCION DE MATERIALES PREMIUM',
      url: 'https://bit.ly/4etgonw'
    }
  ];

  // Función para cargar prospectos desde Firestore
  async function loadProspectsFromFirestore() {
    try {
      showLoadingState();
      if (!db) {
        console.warn('Firestore no disponible, usando datos de prueba');
        loadTestData();
        return;
      }
      
      console.log('Cargando prospectos desde Firestore...');
      const snapshot = await getDocs(collection(db, 'prospects'));
      
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
    populateMaterialsCheckboxes();
    // Generar mensaje inicial después de crear los checkboxes
    setTimeout(() => {
      updateWhatsAppMessage();
    }, 100);
    modal.classList.remove('hidden');
    
    // Enfocar el textarea para edición inmediata
    setTimeout(() => {
      modalMessage.focus();
    }, 200);
  }

  // Función para cerrar el modal
  function closeModal() {
    modal.classList.add('hidden');
    selectedProspect = null;
    modalMessage.value = '';
  }

  // Función para generar checkboxes de materiales
  function populateMaterialsCheckboxes() {
    materialsCheckboxContainer.innerHTML = '';
    MATERIALS.forEach((material, index) => {
      const checkboxId = `material-${index}`;
      const checkboxHTML = `
        <div class="flex items-center">
          <input id="${checkboxId}" type="checkbox" value="${material.url}" class="form-checkbox h-5 w-5 text-green-600" checked>
          <label for="${checkboxId}" class="ml-2 text-gray-700">${material.name}</label>
        </div>
      `;
      materialsCheckboxContainer.insertAdjacentHTML('beforeend', checkboxHTML);
    });

    // Agregar event listeners para actualizar mensaje cuando cambien los checkboxes
    materialsCheckboxContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', updateWhatsAppMessage);
    });
  }

  // Función para actualizar el mensaje en el textarea
  function updateWhatsAppMessage() {
    if (!selectedProspect) return;
    modalMessage.value = generateWhatsAppMessage(selectedProspect);
  }

  // Función para generar el mensaje personalizado de WhatsApp
  function generateWhatsAppMessage(prospect) {
    const contactName = prospect.contactPerson || prospect.businessName || 'Estimado/a';
    
    let message = `¡Hola ${contactName}!\n\n`;
    message += `Adjunto el material previamente acordado:\n\n`;
    
    // Obtener materiales seleccionados
    const selectedMaterials = [];
    const checkboxes = materialsCheckboxContainer.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
      const material = MATERIALS.find(m => m.url === checkbox.value);
      if (material) {
        selectedMaterials.push(material);
      }
    });

    // Agregar materiales al mensaje
    if (selectedMaterials.length > 0) {
      selectedMaterials.forEach((material) => {
        message += `*${material.name}*\n${material.url}\n\n`;
      });
    }
    
    message += `Quedo atento a sus comentarios.\n\n`;
    message += `Saludos cordiales,\n`;
    message += `${currentUserName}\n`;
    message += `Pietra Fina`;
    
    return message;
  }

  // Función para limpiar y formatear número de teléfono
  function cleanPhoneNumber(phone) {
    if (!phone) return null;
    
    // Remover todos los caracteres que no sean números
    let cleanPhone = phone.replace(/\D/g, '');
    
    console.log('Número original:', phone);
    console.log('Número limpio:', cleanPhone);
    
    // Validar que el número tenga al menos 10 dígitos
    if (cleanPhone.length < 10) {
      console.warn('Número muy corto:', cleanPhone);
      return null;
    }
    
    // Formatear según las reglas de México
    if (cleanPhone.startsWith('52') && cleanPhone.length >= 12) {
      // Ya tiene código de país México (52)
      return cleanPhone;
    } else if (cleanPhone.length === 10) {
      // Número de 10 dígitos, agregar código de país México
      return '52' + cleanPhone;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
      // Número con 1 al inicio (formato antiguo), remover el 1 y agregar 52
      return '52' + cleanPhone.substring(1);
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('521')) {
      // Formato 521XXXXXXXXX, mantener como está
      return cleanPhone;
    } else {
      // Para otros casos, intentar con el número tal como está
      console.warn('Formato de número no reconocido:', cleanPhone);
      return cleanPhone;
    }
  }

  // Función para enviar mensaje por WhatsApp - VERSIÓN CORREGIDA
  function sendWhatsApp() {
    if (!selectedProspect) {
      showToast('Error: No hay prospecto seleccionado', 'error');
      return;
    }

    if (!selectedProspect.phone) {
      showToast('Error: El prospecto no tiene número de teléfono', 'error');
      return;
    }

    // Obtener el mensaje del textarea (permite ediciones del usuario)
    const message = modalMessage.value.trim();
    
    if (!message) {
      showToast('Error: El mensaje no puede estar vacío', 'error');
      return;
    }

    // Limpiar y formatear el número de teléfono
    const cleanPhone = cleanPhoneNumber(selectedProspect.phone);
    
    if (!cleanPhone) {
      showToast('Error: Formato de número de teléfono inválido', 'error');
      return;
    }

    console.log('Número final para WhatsApp:', cleanPhone);
    console.log('Mensaje a enviar:', message);

    try {
      // MÉTODO SIMPLE Y DIRECTO - Sin codificación compleja
      // Reemplazar saltos de línea por %0A (formato URL para nueva línea)
      const encodedMessage = message
        .replace(/\n/g, '%0A')
        .replace(/\*/g, '%2A')  // Asteriscos para negrita
        .replace(/ /g, '%20');   // Espacios
      
      // Crear URL de WhatsApp con el formato más simple
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
      
      console.log('URL de WhatsApp generada:', whatsappUrl);
      
      // Abrir WhatsApp en una nueva ventana/pestaña
      const whatsappWindow = window.open(whatsappUrl, '_blank');
      
      // Verificar si la ventana se abrió correctamente
      if (!whatsappWindow) {
        showToast('Error: No se pudo abrir WhatsApp. Verifica que no esté bloqueado por el navegador.', 'error');
        return;
      }
      
      // Registrar el envío en Firestore (opcional)
      registerWhatsAppSend(selectedProspect, message);
      
      // Mostrar confirmación de éxito
      showToast(`Material enviado a ${selectedProspect.businessName || selectedProspect.contactPerson}`, 'success');
      
      // Cerrar modal después de un breve delay
      setTimeout(() => {
        closeModal();
      }, 1000);
      
    } catch (error) {
      console.error('Error al enviar mensaje por WhatsApp:', error);
      showToast('Error al generar el enlace de WhatsApp', 'error');
    }
  }

  // Función para registrar el envío en Firestore (opcional)
  async function registerWhatsAppSend(prospect, message) {
    try {
      if (db) {
        const selectedMaterials = [];
        materialsCheckboxContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
          const material = MATERIALS.find(m => m.url === checkbox.value);
          if (material) {
            selectedMaterials.push(material.name);
          }
        });

        await addDoc(collection(db, 'whatsapp_sends'), {
          prospectId: prospect.id,
          businessName: prospect.businessName,
          contactPerson: prospect.contactPerson,
          phone: prospect.phone,
          message: message,
          materials: selectedMaterials,
          sentAt: serverTimestamp(),
          sentBy: currentUserName
        });
        console.log('Envío registrado en Firestore');
      }
    } catch (error) {
      console.error('Error registrando envío:', error);
      // No mostrar error al usuario ya que el envío principal fue exitoso
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