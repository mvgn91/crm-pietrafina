// WhatsApp Material Sender - Integración con Firestore (VERSIÓN CORREGIDA PARA MÚLTIPLES DISPOSITIVOS)
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
    if (user.uid === "kRTRRDQ9k9hFzSqy1rDkMDtvaav2") { // MVGN's UID
      currentUserName = "MVGN";
    } else if (user.uid === "Wv1BcMQlQreQ3doUPccObJdX6cS2") { // Nicolas's UID
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
  console.log('WhatsApp Massive JS cargado (VERSIÓN CORREGIDA PARA MÚLTIPLES DISPOSITIVOS)');
  
  const cardsContainer = document.getElementById('prospect-cards-container');
  const searchInput = document.getElementById('whatsapp-massive-search');
  const modal = document.getElementById('whatsapp-massive-modal');
  const detailModal = document.getElementById('detail-modal');
  const detailCloseBtn = document.getElementById('detail-close-btn');
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
        console.warn('Firestore no disponible');
        showToast('Error: Firestore no está disponible', 'error');
        return;
      }
      
      console.log('Cargando prospectos desde Firestore...');
      const snapshot = await getDocs(collection(db, 'prospects'));
      
      if (snapshot.empty) {
        console.log('No se encontraron prospectos en Firestore');
        prospects = [];
        renderProspects(prospects);
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
          createdAt: data.createdAt || data.fechaCreacion || null,
          lastContact: data.lastContact || null
        });
      });
      
      console.log(`${prospects.length} prospectos cargados desde Firestore`);
      renderProspects(prospects);
      
    } catch (error) {
      console.error('Error cargando prospectos desde Firestore:', error);
      showToast('Error al cargar prospectos desde la base de datos', 'error');
    }
  }

  // Función para mostrar estado de carga
  function showLoadingState() {
    const loadingHTML = `
      <div class="text-center p-8 text-gray-500">
        <div class="flex flex-col items-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
          <p>Conectando con Firestore...</p>
          <p class="text-sm text-gray-400 mt-1">Cargando prospectos en tiempo real</p>
        </div>
      </div>
    `;
    if (cardsContainer) {
        cardsContainer.innerHTML = loadingHTML;
    }
  }



  // Función para renderizar las tarjetas de prospectos
  function renderProspects(list) {
    updateCounters(list);

    const noResultsHTML = `
      <div class="text-center p-8 text-gray-500 md:col-span-2 lg:col-span-3">
        <div class="flex flex-col items-center">
          <i data-lucide="inbox" class="w-12 h-12 mb-4 text-gray-300"></i>
          <p class="text-lg font-medium">No se encontraron prospectos</p>
          <p class="text-sm text-gray-400 mt-1">Intenta ajustar los filtros de búsqueda</p>
        </div>
      </div>
    `;

    if (!list.length) {
      if (cardsContainer) cardsContainer.innerHTML = noResultsHTML;
      return;
    }

    if (cardsContainer) {
      cardsContainer.innerHTML = list.map(prospect => {
        const hasPhone = prospect.phone && prospect.phone.length >= 10;
        const statusSlug = (prospect.status || '').toLowerCase().replace(/\s+/g, '-');

        return `
          <div class="prospect-card">
            <div class="card-header">
              <div class="card-title">${prospect.businessName || 'Sin nombre'}</div>
              ${prospect.status ? `<span class="status-badge ${statusSlug}">${prospect.status}</span>` : ''}
            </div>
            ${prospect.contactPerson ? `<div class="card-encargado">${prospect.contactPerson}</div>` : ''}
            <div class="card-contact">
              ${prospect.phone || 'Sin teléfono'}
            </div>
            <div class="card-date">
              <span class="label">Clasificación:</span> ${prospect.classification || 'Sin clasificación'}
            </div>
            <div class="card-actions">
              <button data-prospect-id="${prospect.id}" class="btn btn-detail view-details-btn">
                <i data-lucide="eye" class="w-4 h-4 mr-2"></i> Ver Detalle
              </button>
              ${hasPhone ? `
                <button data-prospect-id="${prospect.id}" class="btn btn-whatsapp whatsapp-send-btn">
                  <i data-lucide="message-circle" class="w-4 h-4 mr-2"></i> WhatsApp
                </button>
              ` : `
                <button class="btn btn-disabled bg-red-600 text-white border border-red-600 cursor-not-allowed" disabled>
                  WhatsApp no disponible
                </button>
              `}
            </div>
          </div>
        `;
      }).join('');
    }

    addCardActionListeners();
    
    // Reinicializar Lucide Icons para el contenido dinámico
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
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

  // Función para agregar event listeners a los botones de las tarjetas
  function addCardActionListeners() {
    document.querySelectorAll('.whatsapp-send-btn').forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        const prospectId = this.getAttribute('data-prospect-id');
        const prospect = prospects.find(p => p.id === prospectId);
        if (prospect) {
          openModal(prospect);
        }
      });
    });

    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const prospectId = this.getAttribute('data-prospect-id');
            const prospect = prospects.find(p => p.id === prospectId);
            if (prospect) {
                showProspectDetailsModal(prospect);
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

  // Función para limpiar y formatear número de teléfono para WhatsApp (México)
  function cleanPhoneNumber(phone) {
    if (!phone) return null;
    
    // Remover todos los caracteres que no sean números
    let cleanPhone = phone.replace(/\D/g, '');
    
    console.log('📱 Número original:', phone);
    console.log('📱 Número limpio:', cleanPhone);
    
    // Validar que el número tenga al menos 10 dígitos
    if (cleanPhone.length < 10) {
      console.warn('❌ Número muy corto:', cleanPhone);
      return null;
    }
    
    // Formatear según las reglas de México para WhatsApp
    if (cleanPhone.length === 10) {
      // Número de 10 dígitos, agregar 521 (México)
      const formattedNumber = '521' + cleanPhone;
      console.log('✅ Número de 10 dígitos → 521 +', cleanPhone, '=', formattedNumber);
      return formattedNumber;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('52')) {
      // Ya tiene código de país México (52), agregar 1 para WhatsApp
      const formattedNumber = '521' + cleanPhone.substring(2);
      console.log('✅ Número con 52 → 521 +', cleanPhone.substring(2), '=', formattedNumber);
      return formattedNumber;
    } else if (cleanPhone.length === 13 && cleanPhone.startsWith('521')) {
      // Ya tiene formato correcto para WhatsApp (521)
      console.log('✅ Número ya tiene formato 521:', cleanPhone);
      return cleanPhone;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
      // Número con 1 al inicio (formato antiguo), remover el 1 y agregar 521
      const formattedNumber = '521' + cleanPhone.substring(1);
      console.log('✅ Número con 1 → 521 +', cleanPhone.substring(1), '=', formattedNumber);
      return formattedNumber;
    } else {
      // Para otros casos, intentar con el número tal como está
      console.warn('⚠️ Formato de número no reconocido:', cleanPhone);
      return cleanPhone;
    }
  }

  // Función para detectar si estamos en móvil
  function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Función para detectar si es iOS
  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  // Función para detectar si es Windows
  function isWindows() {
    return navigator.platform.indexOf('Win') > -1;
  }

  // Función para detectar el navegador
  function getBrowserInfo() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'chrome';
    if (userAgent.includes('Firefox')) return 'firefox';
    if (userAgent.includes('Safari')) return 'safari';
    if (userAgent.includes('Edge')) return 'edge';
    return 'unknown';
  }

  // FUNCIÓN CORREGIDA para enviar mensaje por WhatsApp
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

    console.log('🚀 Iniciando envío de WhatsApp (VERSIÓN CORREGIDA PARA MÚLTIPLES DISPOSITIVOS)...');
    console.log('📱 Número final para WhatsApp:', cleanPhone);
    console.log('💬 Mensaje a enviar:', message);
    console.log('🌐 Dispositivo móvil:', isMobileDevice());
    console.log('💻 Es Windows:', isWindows());
    console.log('🔍 Navegador:', getBrowserInfo());

    try {
      // CORRECCIÓN PRINCIPAL: Usar método más robusto para abrir WhatsApp
      openWhatsAppRobust(cleanPhone, message);
      
      // Registrar el envío en Firestore (opcional)
      registerWhatsAppSend(selectedProspect, message);
      
      // Mostrar confirmación de éxito
      showToast(`✅ Abriendo WhatsApp para ${selectedProspect.businessName || selectedProspect.contactPerson}`, 'success');
      
      // Cerrar modal después de un breve delay
      setTimeout(() => {
        closeModal();
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error al enviar mensaje por WhatsApp:', error);
      showToast('Error al generar el enlace de WhatsApp', 'error');
    }
  }

  // FUNCIÓN CORREGIDA para abrir WhatsApp con método simplificado y compatible
  async function openWhatsAppRobust(phone, message) {
    console.log('🎯 MÉTODO SIMPLIFICADO: Usando enlace estándar de WhatsApp Web');
    
    // Estrategia 1: Mensaje corto si es muy largo
    let finalMessage = message;
    const maxLength = 1800; // Límite conservador para evitar problemas de URL
    
    if (message.length > maxLength) {
      console.log('⚠️ Mensaje muy largo, usando versión simplificada');
      const contactName = selectedProspect.contactPerson || selectedProspect.businessName || 'Estimado/a';
      finalMessage = `¡Hola ${contactName}!\n\nTe envío el material de Pietra Fina:\n\n${MATERIALS[0].url}\n\nSaludos,\n${currentUserName}\nPietra Fina`;
    }
    
    const encodedMessage = encodeURIComponent(finalMessage);
    
    try {
      // MÉTODO SIMPLIFICADO Y COMPATIBLE CON MÓVIL
      // Usar el enlace estándar de WhatsApp Web que funciona en todos los dispositivos
      const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
      
      console.log('📱 URL de WhatsApp generada:', whatsappUrl);
      
      // Abrir en nueva ventana/pestaña
      window.open(whatsappUrl, '_blank');
      
      console.log('✅ WhatsApp abierto exitosamente');
      
    } catch (error) {
      console.error('❌ Error al abrir WhatsApp:', error);
      await copyToClipboard(finalMessage);
      showToast('Error al abrir WhatsApp. Mensaje copiado al portapapeles.', 'error');
    }
    
    // Estrategia final: Mostrar información adicional al usuario
    setTimeout(() => {
      showWhatsAppInstructions(phone, finalMessage);
    }, 2000);
  }

  // Función para copiar texto al portapapeles
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Mensaje copiado al portapapeles:', text);
      return true;
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
      return false;
    }
  }

  // Función para mostrar instrucciones adicionales si es necesario
  function showWhatsAppInstructions(phone, message) {
    const instructionsHtml = `
      <div id="whatsapp-instructions" class="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 max-w-sm shadow-lg z-50">
        <div class="flex items-start">
          <i class="fab fa-whatsapp text-green-600 text-xl mr-3 mt-1"></i>
          <div>
            <h4 class="font-semibold text-green-800 mb-2">WhatsApp abierto</h4>
            <p class="text-sm text-green-700 mb-2">
              Si WhatsApp no se abrió automáticamente o el mensaje no se pegó:
            </p>
            <ul class="text-xs text-green-600 space-y-1">
              <li>• Verifica que WhatsApp esté instalado</li>
              <li>• Permite ventanas emergentes en tu navegador</li>
              <li>• El mensaje ya está preparado para enviar (copiado al portapapeles)</li>
              <li>• Pégalo manualmente en el chat de WhatsApp</li>
            </ul>
            <button onclick="document.getElementById('whatsapp-instructions').remove()" 
                    class="mt-2 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
              Entendido
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Remover instrucciones anteriores si existen
    const existingInstructions = document.getElementById('whatsapp-instructions');
    if (existingInstructions) {
      existingInstructions.remove();
    }
    
    // Agregar nuevas instrucciones
    document.body.insertAdjacentHTML('beforeend', instructionsHtml);
    
    // Auto-remover después de 10 segundos
    setTimeout(() => {
      const instructions = document.getElementById('whatsapp-instructions');
      if (instructions) {
        instructions.remove();
      }
    }, 10000);
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
          sentBy: currentUserName,
          lastContact: serverTimestamp() // Actualizar fecha de último contacto
        });
        console.log('📝 Envío registrado en Firestore');
      }
    } catch (error) {
      console.error('❌ Error registrando envío:', error);
      // No mostrar error al usuario ya que el envío principal fue exitoso
    }
  }

  // --- FILTRADO MEJORADO ---
  // const statusFilter = document.getElementById('status-filter'); // Eliminado duplicado
  // const searchInput = document.getElementById('whatsapp-massive-search'); // Eliminado duplicado

  function filterProspects() {
    const statusValue = document.getElementById('status-filter').value; // Usar el ID correcto
    const searchValue = searchInput.value.trim().toLowerCase();
    let filtered = prospects;
    if (statusValue) {
      filtered = filtered.filter(p => (p.status || '').toLowerCase() === statusValue.toLowerCase());
    }
    if (searchValue) {
      filtered = filtered.filter(p =>
        (p.businessName && p.businessName.toLowerCase().includes(searchValue)) ||
        (p.contactPerson && p.contactPerson.toLowerCase().includes(searchValue)) ||
        (p.phone && p.phone.includes(searchValue)) ||
        (p.email && p.email.toLowerCase().includes(searchValue)) ||
        (p.classification && p.classification.toLowerCase().includes(searchValue))
      );
    }
    renderProspects(filtered);
  }

  document.getElementById('status-filter').addEventListener('change', filterProspects); // Usar el ID correcto
  searchInput.addEventListener('input', filterProspects);

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

  // --- Lógica del modal de detalles ---
  function showProspectDetailsModal(prospect) {
    if (!prospect || !detailModal) return;

    // Llenar el modal con los datos del prospecto
    detailModal.querySelector('#detail-businessName').textContent = prospect.businessName || '-';
    detailModal.querySelector('#detail-contactPerson').textContent = prospect.contactPerson || '-';
    detailModal.querySelector('#detail-email').textContent = prospect.email || '-';
    detailModal.querySelector('#detail-phone').textContent = prospect.phone || '-';
    detailModal.querySelector('#detail-classification').textContent = prospect.classification || '-';
    detailModal.querySelector('#detail-status').textContent = prospect.status || '-';
    detailModal.querySelector('#detail-observations').textContent = prospect.observations || 'Ninguna';

    // Mostrar el modal
    detailModal.classList.remove('hidden');
  }

  function closeDetailModal() {
      if (detailModal) {
          detailModal.classList.add('hidden');
      }
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

  if (detailCloseBtn) {
      detailCloseBtn.addEventListener('click', closeDetailModal);
  }

  if (detailModal) {
      detailModal.addEventListener('click', function(e) {
          if (e.target === detailModal) {
              closeDetailModal();
          }
      });
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
    if (e.key === 'Escape') {
        if (!modal.classList.contains('hidden')) {
            closeModal();
        }
        if (detailModal && !detailModal.classList.contains('hidden')) {
            closeDetailModal();
        }
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
  console.log('🚀 Inicializando WhatsApp Massive (VERSIÓN CORREGIDA PARA MÚLTIPLES DISPOSITIVOS)...');
  loadProspectsFromFirestore();
});