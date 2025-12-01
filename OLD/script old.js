// ===============================================
// LEGACY FILE - SOLO REFERENCIA HISTÓRICA
// Este archivo corresponde a la versión anterior (OLD)
// y no forma parte del flujo activo de la aplicación.
// Mantener sin modificaciones salvo para aclaraciones.
// ===============================================
// --- Splash Screen de Carga ---
function showSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    const loadingBar = document.getElementById('loading-bar');
    
    if (splashScreen && loadingBar) {
        // Iniciar la animación de la barra de carga
        setTimeout(() => {
            loadingBar.style.width = '100%';
        }, 100);
        
        // Ocultar splash screen después de 3 segundos
        setTimeout(() => {
            splashScreen.classList.add('fade-out');
            setTimeout(() => {
                splashScreen.style.display = 'none';
            }, 1000);
        }, 3000);
    }
}

// --- Botón de acceso masivo a WhatsApp ---
document.addEventListener('DOMContentLoaded', function () {
  const btn = document.getElementById('whatsapp-massive-button');
  if (btn) {
    btn.addEventListener('click', function () {
      window.location.href = './whatsapp-massive.html';
    });
  }

  // --- Inicializar Lucide Icons ---
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // --- Mostrar splash screen ---
  showSplashScreen();
});

// Importa las funciones necesarias de los SDKs de Firebase (v11.6.1)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword, browserLocalPersistence, setPersistence } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, doc, onSnapshot, query, where, getDocs, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

// Variables globales para el estado de la aplicación y elementos del DOM
let currentUser = null;
let currentUserId = null;
let currentUserRole = null;
let currentUserName = "Desconocido";
let currentProspectIdForModal = null;
let allProspects = []; // Almacena todos los prospectos traídos de Firestore
let statusChart = null; // Instancia del gráfico de estatus
let conversionChart = null; // Instancia del gráfico de conversión

// Variables para el calendario semanal
let currentWeekStart = null;
let selectedCalendarDate = null;
let filteredProspects = [];

// Definición del flujo de estatus del CRM con colores corporativos
const STATUS_FLOW = {
    'Pendiente de Correo': {
        name: 'Pendiente de Correo',
        description: 'Prospecto recién agregado, esperando confirmación de envío de correo',
        color: '#dc2626', // Rojo corporativo
        nextStatuses: ['En Prospección'],
        actions: ['confirmar_correo'],
        order: 1
    },
    'En Prospección': {
        name: 'En Prospección',
        description: 'Prospecto disponible para contacto en cualquier momento',
        color: '#1f2937', // Negro corporativo
        nextStatuses: ['Interesado', 'Seguimiento agendado', 'No contesta', 'Rechazado', 'Ya es nuestro cliente'],
        actions: ['seguimiento', 'reagendar', 'whatsapp'],
        order: 2
    },
    'Interesado': {
        name: 'Interesado',
        description: 'Prospecto que ha mostrado interés (semáforo amarillo)',
        color: '#dc2626', // Rojo corporativo
        nextStatuses: ['Seguimiento agendado', 'Convertido a cliente', 'No contesta', 'Rechazado'],
        actions: ['seguimiento', 'reagendar', 'whatsapp', 'enviar_material'],
        order: 3
    },
    'Seguimiento agendado': {
        name: 'Seguimiento agendado',
        description: 'Prospecto con cita o reunión programada (equivalente a Interesado)',
        color: '#dc2626', // Rojo corporativo
        nextStatuses: ['Interesado', 'Convertido a cliente', 'No contesta', 'Rechazado'],
        actions: ['seguimiento', 'reagendar', 'whatsapp', 'enviar_material'],
        order: 4
    },
    'No contesta': {
        name: 'No contesta',
        description: 'Prospecto que no responde a los contactos',
        color: '#6b7280', // Gris neutro
        nextStatuses: ['En Prospección', 'Rechazado'],
        actions: ['reactivar'],
        order: 5
    },
    'Rechazado': {
        name: 'Rechazado',
        description: 'Prospecto que ha rechazado abiertamente la propuesta',
        color: '#374151', // Gris oscuro
        nextStatuses: [],
        actions: [],
        order: 6
    },
    'Convertido a cliente': {
        name: 'Convertido a cliente',
        description: 'Prospecto convertido en cliente por campaña de prospección',
        color: '#dc2626', // Rojo corporativo (éxito)
        nextStatuses: [],
        actions: [],
        order: 7
    },
    'Ya es nuestro cliente': {
        name: 'Ya es nuestro cliente',
        description: 'Prospecto que ya era cliente de la empresa',
        color: '#dc2626', // Rojo corporativo (éxito)
        nextStatuses: [],
        actions: [],
        order: 8
    }
};

// Materiales disponibles para envío
const MATERIALS = [
    {
        name: 'CATALOGO DE PRODUCTOS',
        url: 'https://kutt.it/catalogopf'
    },
    {
        name: 'LOOKBOOK DE OBRAS',
        url: 'https://kutt.it/lookbook'
    },
    {
        name: 'SELECCION DE MATERIALES PREMIUM',
        url: 'https://kutt.it/materialespremium'
    }
];



// UIDs reales de usuarios con permisos de administrador
const ADMIN_UIDS = [
  "kRTRRDQ9k9hFzSqy1rDkMDtvaav2", // MVGN
  "Wv1BcMQlQreQ3doUPccObJdX6cS2", // Nicolás Capetillo
  "n4WFgGtOtDQwYaV9QXy16bDvYE32"  // Francisco Capetillo
];

const NICOLAS_UID = 'Wv1BcMQlQreQ3doUPccObJdX6cS2';
const FRANCISCO_UID = 'n4WFgGtOtDQwYaV9QXy16bDvYE32';
const MVGN_UID = 'kRTRRDQ9k9hFzSqy1rDkMDtvaav2';

/**
 * Obtiene el rol y nombre de un usuario basado en su UID.
 */
const getUserRoleAndName = (uid) => {
    // Mapeo de UID a nombres reales
    const userNames = {
        'kRTRRDQ9k9hFzSqy1rDkMDtvaav2': 'MVGN',
        'Wv1BcMQlQreQ3doUPccObJdX6cS2': 'Nicolás Capetillo',
        'n4WFgGtOtDQwYaV9QXy16bDvYE32': 'Francisco Capetillo'
    };
    
    // Si el UID está en el mapeo, devolver el nombre real
    if (userNames[uid]) {
        return { role: 'admin', name: userNames[uid] };
    }
    
    // Si no está en el mapeo, devolver 'admin' y UID como nombre
    return { role: 'admin', name: uid };
};

/**
 * Retorna un saludo basado en la hora del día.
 */
const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos Días';
    if (hour < 19) return 'Buenas Tardes';
    return 'Buenas Noches';
};

// --- Funciones de utilidad para fechas y validación ---

/**
 * Añade un número de días hábiles a una fecha dada.
 */
const addBusinessDays = (date, days) => {
    let result = new Date(date);
    let addedDays = 0;
    while (addedDays < days) {
        result.setDate(result.getDate() + 1);
        const dayOfWeek = result.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            addedDays++;
        }
    }
    return result;
};

/**
 * Obtiene el inicio de la semana actual (Lunes).
 */
const getStartOfWeek = (date) => {
    const d = new Date(date);
    const dayOfWeek = d.getDay();
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(d.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
};

/**
 * Obtiene el final de la semana actual (Viernes).
 */
const getEndOfWeek = (date) => {
    const startOfWeek = getStartOfWeek(date);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4);
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
};

/**
 * Valida si un email tiene un formato válido.
 */
const isValidEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
};

/**
 * Valida si un número de teléfono tiene un formato válido.
 */
const isValidPhone = (phone) => {
    const re = /^\+?[1-9]\d{1,14}$/;
    return re.test(String(phone));
};

/**
 * Formatea una cadena de fecha a 'DD/MM/YYYY'.
 */
const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return 'Sin fecha';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        console.error("Error al parsear la cadena de fecha:", dateString, e);
        return 'Sin fecha';
    }
};

/**
 * Calcula los días hábiles restantes hasta una fecha límite.
 */
const getRemainingBusinessDays = (prospectingDueDateString, reagendadoParaString) => {
    const effectiveDateString = reagendadoParaString || prospectingDueDateString;
    if (!effectiveDateString) return 'N/A';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = effectiveDateString.split('-');
    const due = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    due.setHours(0, 0, 0, 0);

    if (due < today) {
        return 'Vencido';
    }

    let count = 0;
    let current = new Date(today);
    while (current <= due) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    return count > 0 ? `${count} días` : 'Hoy';
};

/**
 * Función para verificar si una fecha está en la semana actual
 */
const isWithinCurrentWeek = (dateString) => {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    const today = new Date();
    const startOfWeek = getStartOfWeek(today);
    const endOfWeek = getEndOfWeek(today);
    
    return date >= startOfWeek && date <= endOfWeek;
};

/**
 * Función para verificar si un usuario puede reagendar
 */
const canUserReschedule = (userId, userRole, userName) => {
    return userRole === 'admin' || 
           userId === NICOLAS_UID || 
           userId === FRANCISCO_UID ||
           userName === 'Nicolás Capetillo' ||
           userName === 'Francisco Capetillo';
};

/**
 * Función para formatear números de teléfono para WhatsApp (México)
 * Siempre agrega 521 para números de 10 dígitos
 */
const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return null;
    
    // Remover todos los caracteres que no sean números
    let cleanPhone = phone.replace(/\D/g, '');
    
    console.log('📱 Formateando número:', phone, '→', cleanPhone);
    
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
};

// --- Caching de elementos del DOM ---
const elements = {
    appHeader: document.getElementById('app-header'),
    headerLogo: document.getElementById('header-logo'),
    headerTitle: document.getElementById('header-title'),
    appVersionIndicator: document.getElementById('app-version-indicator'),
    onlineStatusIndicator: document.getElementById('online-status-indicator'),
    loginScreen: document.getElementById('login-screen'),
    loginFormContainer: document.getElementById('login-form-container'),
    loginForm: document.getElementById('login-form'),
    loginEmailInput: document.getElementById('login-email'),
    loginPasswordInput: document.getElementById('login-password'),
    loginErrorMessage: document.getElementById('login-error-message'),
    roleSelectionButtons: document.getElementById('role-selection-buttons'),
    logoutButton: document.getElementById('logout-button'),
    adminButton: document.getElementById('admin-button'),
    prospectorButton: document.getElementById('prospector-button'),
    archiveButton: document.getElementById('archive-button'),
    navToProspectorFromAdminBtn: document.getElementById('nav-to-prospector-from-admin'),
    navToAdminFromProspectorBtn: document.getElementById('nav-to-admin-from-prospector'),
    navToArchiveFromAdminBtn: document.getElementById('nav-to-archive-from-admin'),
    navToArchiveFromProspectorBtn: document.getElementById('nav-to-archive-from-prospector'),
    backToRoleSelectionAdminBtn: document.getElementById('back-to-role-selection-admin'),
    backToRoleSelectionProspectorBtn: document.getElementById('back-to-role-selection-prospector'),
    backToRoleSelectionArchiveBtn: document.getElementById('back-to-role-selection-archive'),
    authStatusDiv: document.getElementById('auth-status'),
    adminScreen: document.getElementById('admin-screen'),
    prospectorScreen: document.getElementById('prospector-screen'),
    archiveScreen: document.getElementById('archive-screen'),
    addProspectForm: document.getElementById('add-prospect-form'),
    classificationSelect: document.getElementById('classification'),
    otherClassificationContainer: document.getElementById('otherClassificationContainer'),
    otherClassificationInput: document.getElementById('otherClassification'),
    adminProspectsCardsContainer: document.getElementById('admin-prospects-cards-container'),
    adminNoProspectsDiv: document.getElementById('admin-no-prospects'),
    statusFilter: document.getElementById('statusFilter'),
    dateFilter: document.getElementById('dateFilter'),
    searchFilter: document.getElementById('searchFilter'),
    prospectorProspectsCardsContainer: document.getElementById('prospector-prospects-cards-container'),
    prospectorNoProspectsDiv: document.getElementById('prospector-no-prospects'),
    archiveStatusFilter: document.getElementById('archiveStatusFilter'),
    archiveSearchFilter: document.getElementById('archiveSearchFilter'),
    archiveProspectsCardsContainer: document.getElementById('archive-prospects-cards-container'),
    archiveNoProspectsDiv: document.getElementById('archive-no-prospects'),
    confirmModal: document.getElementById('confirm-modal'),
    confirmModalTitle: document.getElementById('confirm-modal-title'),
    confirmModalMessage: document.getElementById('confirm-modal-message'),
    confirmCancelBtn: document.getElementById('confirm-cancel-btn'),
    confirmActionBtn: document.getElementById('confirm-action-btn'),
    detailModal: document.getElementById('detail-modal'),
    detailCloseBtn: document.getElementById('detail-close-btn'),
    detailBusinessName: document.getElementById('detail-businessName'),
    detailContactPerson: document.getElementById('detail-contactPerson'),
    detailEmail: document.getElementById('detail-email'),
    detailPhone: document.getElementById('detail-phone'),
    detailClassification: document.getElementById('detail-classification'),
    detailStatus: document.getElementById('detail-status'),
    detailInternalNotes: document.getElementById('detail-internalNotes'),
    detailSentEmailDate: document.getElementById('detail-sentEmailDate'),
    detailProspectingDueDate: document.getElementById('detail-prospectingDueDate'),
    detailRemainingDays: document.getElementById('detail-remainingDays'),
    detailContactedBy: document.getElementById('detail-contactedBy'),
    detailObservations: document.getElementById('detail-observations'),
    detailFollowUpNotes: document.getElementById('detail-followUpNotes'),
    detailReagendadoParaContainer: document.getElementById('detail-reagendadoPara-container'),
    detailReagendadoPara: document.getElementById('detail-reagendadoPara'),
    prospectorActionArea: document.getElementById('prospector-action-area'),
    followUpNotesInput: document.getElementById('followUpNotesInput'),
    contactResultSelect: document.getElementById('contactResult'),
    whatsappMessageArea: document.getElementById('whatsappMessageArea'),
    whatsappMessage: document.getElementById('whatsappMessage'),
    whatsappConfirmSendBtn: document.getElementById('whatsappConfirmSendBtn'),
    whatsappCancelBtn: document.getElementById('whatsappCancelBtn'),
    whatsappMessage: document.getElementById('whatsappMessage'),
    whatsappModal: document.getElementById('whatsapp-modal'),
    whatsappModalClose: document.getElementById('whatsapp-modal-close'),
    whatsappModalMessage: document.getElementById('whatsapp-modal-message'),
    whatsappModalSendBtn: document.getElementById('whatsapp-modal-send-btn'),
    whatsappModalCancelBtn: document.getElementById('whatsapp-modal-cancel-btn'),
    whatsappValidatedBtn: document.getElementById('whatsapp-validated-btn'),
    whatsappNoWhatsappBtn: document.getElementById('whatsapp-no-whatsapp-btn'),
    validateAllWhatsappBtn: document.getElementById('validate-all-whatsapp-btn'),
    refreshDataBtn: document.getElementById('refresh-data-btn'),
    materialsCheckboxContainer: document.getElementById('materials-checkbox-container'),
    saveFollowUpBtn: document.getElementById('saveFollowUpBtn'),
    deleteProspectBtn: document.getElementById('deleteProspectBtn'),
    rescheduleActionArea: document.getElementById('reschedule-action-area'),
    adminActionsArea: document.getElementById('admin-actions-area'),
    rescheduleFollowUpBtn: document.getElementById('rescheduleFollowUpBtn'),
    rescheduleModal: document.getElementById('reschedule-modal'),
    rescheduleDateInput: document.getElementById('reschedule-date'),
    rescheduleCancelBtn: document.getElementById('reschedule-cancel-btn'),
    rescheduleConfirmBtn: document.getElementById('reschedule-confirm-btn'),
    editProspectActionArea: document.getElementById('edit-prospect-action-area'),
    editProspectBtn: document.getElementById('editProspectBtn'),
    editProspectModal: document.getElementById('edit-prospect-modal'),
    editProspectCloseBtn: document.getElementById('edit-prospect-close-btn'),
    editProspectForm: document.getElementById('edit-prospect-form'),
    editBusinessName: document.getElementById('edit-businessName'),
    editContactPerson: document.getElementById('edit-contactPerson'),
    editEmail: document.getElementById('edit-email'),
    editPhone: document.getElementById('edit-phone'),
    editClassification: document.getElementById('edit-classification'),
    editOtherClassificationContainer: document.getElementById('editOtherClassificationContainer'),
    editOtherClassification: document.getElementById('edit-otherClassification'),
    editObservations: document.getElementById('edit-observations'),
    editProspectCancelBtn: document.getElementById('edit-prospect-cancel-btn'),
    editProspectSaveBtn: document.getElementById('edit-prospect-save-btn'),
    totalProspectsCount: document.getElementById('totalProspectsCount'),
    enProspeccionCount: document.getElementById('enProspeccionCount'),
    interesadoCount: document.getElementById('interesadoCount'),
    conversionRate: document.getElementById('conversionRate'),
    dailyNotificationContainer: document.getElementById('daily-notification-container'),
    
    // Elementos del calendario semanal
    weeklyCalendar: document.getElementById('weekly-calendar'),
    currentWeekDisplay: document.getElementById('current-week-display'),
    prevWeekBtn: document.getElementById('prev-week-btn'),
    nextWeekBtn: document.getElementById('next-week-btn'),
    todayBtn: document.getElementById('today-btn'),
    totalFollowups: document.getElementById('total-followups'),
    pendingToday: document.getElementById('pending-today'),
    completedWeek: document.getElementById('completed-week'),
    filterIndicator: document.getElementById('filter-indicator'),
    clearFilterBtn: document.getElementById('clear-filter-btn'),
    
    // Modal de confirmación de correo
    emailConfirmModal: document.getElementById('email-confirm-modal'),
    emailConfirmBusinessName: document.getElementById('email-confirm-business-name'),
    emailConfirmEmail: document.getElementById('email-confirm-email'),
    emailConfirmContact: document.getElementById('email-confirm-contact'),
    emailConfirmCancelBtn: document.getElementById('email-confirm-cancel-btn'),
    emailConfirmActionBtn: document.getElementById('email-confirm-action-btn'),
    
    // Nuevos elementos de navegación del header
    mainNavigation: document.getElementById('main-navigation'),
    navAdmin: document.getElementById('nav-admin'),
    navProspector: document.getElementById('nav-prospector'),
    navArchive: document.getElementById('nav-archive'),
    navWhatsapp: document.getElementById('nav-whatsapp'),
    navLogout: document.getElementById('nav-logout'),
    
    // Navegación móvil
    mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
    mobileMenu: document.getElementById('mobile-menu'),
    mobileNavAdmin: document.getElementById('mobile-nav-admin'),
    mobileNavProspector: document.getElementById('mobile-nav-prospector'),
    mobileNavArchive: document.getElementById('mobile-nav-archive'),
    mobileNavWhatsapp: document.getElementById('mobile-nav-whatsapp'),
    mobileNavLogout: document.getElementById('mobile-nav-logout'),
};

// --- Funciones de control de carga (para botones) ---
const showLoading = (element, loadingText = 'Cargando...') => {
    element.disabled = true;
    element.setAttribute('data-original-html', element.innerHTML);
    element.innerHTML = `<span class="animate-pulse">${loadingText}</span>`;
    element.classList.add('loading-skeleton');
};

const hideLoading = (element, originalText) => {
    element.disabled = false;
    element.innerHTML = originalText;
    element.classList.remove('loading-skeleton');
};



// --- Manejo de autenticación y roles ---
onAuthStateChanged(auth, async (user) => {
    console.log("onAuthStateChanged activado. Usuario:", user ? user.uid : "null");
    if (user) {
        try {
            // Persistir la sesión
            await setPersistence(auth, browserLocalPersistence);
            
            currentUser = user;
            currentUserId = user.uid;
            const userInfo = getUserRoleAndName(currentUserId);
            currentUserName = userInfo.name;
            currentUserRole = userInfo.role;

            // Verificar si el usuario tiene un rol válido
            if (!currentUserRole) {
                await signOut(auth);
                showToast("Tu cuenta no tiene un rol asignado. Contacta al administrador.", 'error');
                return;
            }

            elements.onlineStatusIndicator.classList.remove('is-offline');
            elements.onlineStatusIndicator.classList.add('is-online');
            const statusDot = elements.onlineStatusIndicator.querySelector('.w-2');
            const statusText = elements.onlineStatusIndicator.querySelector('span');
            if (statusDot) statusDot.style.background = 'var(--success-500)';
            if (statusText) statusText.textContent = 'Online';

        elements.authStatusDiv.innerHTML = `
            <span class="px-3 py-1" style="background-color: var(--primary-500); color: white; border-radius: var(--radius-full); font-size: 0.75rem; display: flex; align-items: center; box-shadow: var(--shadow-sm);">
                <i class="fas fa-circle mr-2" style="color: white; font-size: 0.5rem;"></i> ${getGreetingTime()} ${currentUserName}
            </span>
        `;

        // Inicialmente ocultar el menú de navegación (se mostrará cuando se seleccione una pantalla)
        elements.mainNavigation.classList.add('hidden');
        elements.mainNavigation.classList.remove('show');
        
        // Configurar los enlaces de navegación según el rol del usuario
        if (currentUserRole === 'admin') {
            // Admin puede acceder a todo
            elements.navAdmin.style.display = 'inline-block';
            elements.navProspector.style.display = 'inline-block';
            elements.navArchive.style.display = 'inline-block';
            elements.navWhatsapp.style.display = 'inline-block';
        } else if (currentUserRole === 'prospector') {
            // Prospector solo puede acceder a prospección, archivo y WhatsApp
            elements.navAdmin.style.display = 'none';
            elements.navProspector.style.display = 'inline-block';
            elements.navArchive.style.display = 'inline-block';
            elements.navWhatsapp.style.display = 'inline-block';
        } else {
            showToast("Tu cuenta no tiene un rol asignado. Contacta al administrador.", 'error');
            elements.loginErrorMessage.textContent = "Tu cuenta no tiene un rol asignado. Contacta al administrador.";
            elements.loginErrorMessage.classList.remove('hidden');
        }
        
        // Mostrar también los botones de selección de rol (para compatibilidad)
        elements.loginFormContainer.classList.add('hidden');
        elements.roleSelectionButtons.classList.remove('hidden');

        elements.adminButton.classList.add('btn-disabled');
        elements.prospectorButton.classList.add('btn-disabled');
        elements.archiveButton.classList.add('btn-disabled');

        if (currentUserRole === 'admin') {
            elements.adminButton.classList.remove('btn-disabled');
            elements.prospectorButton.classList.remove('btn-disabled');
            elements.archiveButton.classList.remove('btn-disabled');
        } else if (currentUserRole === 'prospector') {
            elements.prospectorButton.classList.remove('btn-disabled');
            elements.archiveButton.classList.remove('btn-disabled');
        }
            
            try {
                await loadProspects();
                renderProspectorCards();
            } catch (error) {
                console.error("Error al cargar los prospectos:", error);
                showToast("Ocurrió un error al cargar los prospectos. Intenta de nuevo.", 'error');
            }
        } catch (error) {
            console.error("Error en onAuthStateChanged:", error);
            showToast("Error al procesar la autenticación", 'error');
        }
    } else {
        currentUserName = "Desconectado";
        elements.authStatusDiv.innerHTML = '';
        
        elements.onlineStatusIndicator.classList.remove('is-online');
        elements.onlineStatusIndicator.classList.add('is-offline');
        const statusDot = elements.onlineStatusIndicator.querySelector('.w-2');
        const statusText = elements.onlineStatusIndicator.querySelector('span');
        if (statusDot) statusDot.style.background = 'var(--error-500)';
        if (statusText) statusText.textContent = 'Offline';

        // Ocultar el menú de navegación principal
        elements.mainNavigation.classList.add('hidden');
        elements.mainNavigation.classList.remove('show');
        
        elements.loginFormContainer.classList.remove('hidden');
        elements.roleSelectionButtons.classList.add('hidden');
        elements.loginErrorMessage.classList.add('hidden');
        showScreen('login');
    }
});

// Envío del formulario de inicio de sesión (con verificación de existencia)
if (elements.loginForm) {
    elements.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    elements.loginErrorMessage.classList.add('hidden');

    const email = elements.loginEmailInput.value.trim();
    const password = elements.loginPasswordInput.value.trim();

    if (!email || !password) {
        showToast("Por favor, ingresa tu correo y contraseña.", 'warning');
        return;
    }

    const loginButton = e.submitter;
    const originalButtonText = loginButton.innerHTML;
    showLoading(loginButton, 'Iniciando Sesión...');

    try {
        // Configurar persistencia local primero
        await setPersistence(auth, browserLocalPersistence);
        
        // Intentar login normal
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        if (!user) {
            throw new Error('No se pudo obtener la información del usuario');
        }

        // La redirección se manejará en onAuthStateChanged
        console.log("Login exitoso:", user.uid);
        
    } catch (error) {
        console.error("Error de inicio de sesión:", error);
        let errorMessage = "Error al iniciar sesión. Verifica tus credenciales.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = "Correo o contraseña incorrectos.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Formato de correo electrónico inválido.";
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = "Demasiados intentos de inicio de sesión fallidos. Intenta de nuevo más tarde.";
        } else if (error.code === 'auth/invalid-credential') {
            errorMessage = "Credenciales inválidas.";
        }
        showToast(errorMessage, 'error');
        elements.loginErrorMessage.textContent = errorMessage;
        elements.loginErrorMessage.classList.remove('hidden');
    } finally {
        hideLoading(loginButton, originalButtonText);
    }
    });
}

// Funcionalidad de cierre de sesión (con verificación de existencia)
if (elements.logoutButton) {
    elements.logoutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            console.log("Usuario desconectado");
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            showToast('Error al cerrar sesión', 'error');
        }
    });
}

// Función para actualizar el indicador de navegación
const updateNavigationIndicator = (activeScreen) => {
    // Remover la clase active de todos los enlaces (desktop y móvil)
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Agregar la clase active al enlace correspondiente (desktop y móvil)
    switch (activeScreen) {
        case 'admin':
            if (elements.navAdmin) elements.navAdmin.classList.add('active');
            if (elements.mobileNavAdmin) elements.mobileNavAdmin.classList.add('active');
            break;
        case 'prospector':
            if (elements.navProspector) elements.navProspector.classList.add('active');
            if (elements.mobileNavProspector) elements.mobileNavProspector.classList.add('active');
            break;
        case 'archive':
            if (elements.navArchive) elements.navArchive.classList.add('active');
            if (elements.mobileNavArchive) elements.mobileNavArchive.classList.add('active');
            break;
        case 'whatsapp':
            if (elements.navWhatsapp) elements.navWhatsapp.classList.add('active');
            if (elements.mobileNavWhatsapp) elements.mobileNavWhatsapp.classList.add('active');
            break;
        default:
            // No mostrar indicador para login o logout
            break;
    }
};

// Función para mostrar/ocultar navegación según la pantalla
const toggleNavigationVisibility = (screenName) => {
    const navigation = document.getElementById('main-navigation');
    
    if (screenName === 'login') {
        // Ocultar navegación en la pantalla de selección de roles
        if (navigation) {
            navigation.classList.add('hidden');
        }
    } else {
        // Mostrar navegación en todas las demás pantallas
        if (navigation) {
            navigation.classList.remove('hidden');
        }
    }
};

// --- Navegación entre pantallas ---
const showScreen = (screenName) => {
    console.log("showScreen llamado con:", screenName);
    
    elements.loginScreen.classList.add('hidden');
    elements.adminScreen.classList.add('hidden');
    elements.prospectorScreen.classList.add('hidden');
    elements.archiveScreen.classList.add('hidden');

    if (elements.dailyNotificationContainer) {
        elements.dailyNotificationContainer.innerHTML = '';
    }

    switch (screenName) {
        case 'login':
            elements.loginScreen.classList.remove('hidden');
            break;
        case 'admin':
            elements.adminScreen.classList.remove('hidden');
            renderAdminCards();
            updateDashboard();
            break;
        case 'prospector':
            elements.prospectorScreen.classList.remove('hidden');
            renderProspectorCards();
            initWeeklyCalendar();
            break;
        case 'archive':
            elements.archiveScreen.classList.remove('hidden');
            renderArchiveCards();
            break;
    }
    
    // Actualizar el indicador de navegación
    updateNavigationIndicator(screenName);
    
    // Controlar visibilidad de la navegación
    toggleNavigationVisibility(screenName);
};

/**
 * Revisa y actualiza el estado de los prospectos 'En Prospección' si su fecha límite ha vencido.
 */
// Función eliminada - ya no se expiran prospectos automáticamente
// Los prospectos permanecen en "En Prospección" hasta que se actualice manualmente su estatus

// Event listeners para botones de selección de rol (con verificación de existencia)
if (elements.adminButton) {
    elements.adminButton.addEventListener('click', () => {
        if (currentUserRole === 'admin') {
            showScreen('admin');
        } else {
            showToast('Permiso Denegado', 'Esta acción es solo para administradores.', 'error');
        }
    });
}

if (elements.prospectorButton) {
    elements.prospectorButton.addEventListener('click', () => {
        if (currentUserRole === 'prospector' || currentUserRole === 'admin') {
            showScreen('prospector');
        } else {
            showToast('Permiso Denegado', 'No tienes permisos para acceder a esta sección.', 'error');
        }
    });
}

if (elements.archiveButton) {
    elements.archiveButton.addEventListener('click', () => {
        if (currentUserRole === 'prospector' || currentUserRole === 'admin') {
            showScreen('archive');
        } else {
            showToast('Permiso Denegado', 'No tienes permisos para acceder a esta sección.', 'error');
        }
    });
}

// Event listeners para botones de navegación entre pantallas (con verificación de existencia)
if (elements.navToProspectorFromAdminBtn) {
    elements.navToProspectorFromAdminBtn.addEventListener('click', () => showScreen('prospector'));
}
if (elements.navToAdminFromProspectorBtn) {
    elements.navToAdminFromProspectorBtn.addEventListener('click', () => {
        if (currentUserRole === 'admin') {
            showScreen('admin');
        } else {
            showToast('Permiso Denegado', 'Solo los administradores pueden acceder a la gestión de base de datos.', 'error');
        }
    });
}
if (elements.navToArchiveFromAdminBtn) {
    elements.navToArchiveFromAdminBtn.addEventListener('click', () => {
        if (currentUserRole === 'admin') {
            showScreen('archive');
        } else {
            showToast('Permiso Denegado', 'No tienes permisos para acceder a esta sección.', 'error');
        }
    });
}
if (elements.navToArchiveFromProspectorBtn) {
    elements.navToArchiveFromProspectorBtn.addEventListener('click', () => {
        if (currentUserRole === 'prospector' || currentUserRole === 'admin') {
            showScreen('archive');
        } else {
            showToast('Permiso Denegado', 'No tienes permisos para acceder a esta sección.', 'error');
        }
    });
}

if (elements.backToRoleSelectionAdminBtn) {
    elements.backToRoleSelectionAdminBtn.addEventListener('click', () => showScreen('login'));
}
if (elements.backToRoleSelectionProspectorBtn) {
    elements.backToRoleSelectionProspectorBtn.addEventListener('click', () => showScreen('login'));
}
if (elements.backToRoleSelectionArchiveBtn) {
    elements.backToRoleSelectionArchiveBtn.addEventListener('click', () => showScreen('login'));
}

// Event listeners para los nuevos enlaces de navegación del header (con verificación de existencia)
if (elements.navAdmin) {
    elements.navAdmin.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUserRole === 'admin') {
            showScreen('admin');
        } else {
            showToast('Permiso Denegado', 'Esta acción es solo para administradores.', 'error');
        }
    });
}

if (elements.navProspector) {
    elements.navProspector.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUserRole === 'prospector' || currentUserRole === 'admin') {
            showScreen('prospector');
        } else {
            showToast('Permiso Denegado', 'No tienes permisos para acceder a esta sección.', 'error');
        }
    });
}

if (elements.navArchive) {
    elements.navArchive.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUserRole === 'prospector' || currentUserRole === 'admin') {
            showScreen('archive');
        } else {
            showToast('Permiso Denegado', 'No tienes permisos para acceder a esta sección.', 'error');
        }
    });
}

if (elements.navWhatsapp) {
    elements.navWhatsapp.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = './whatsapp-massive.html';
    });
}

if (elements.navLogout) {
    elements.navLogout.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            console.log("Usuario desconectado");
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            showToast('Error al cerrar sesión', 'error');
        }
    });
}

// Event listeners para navegación móvil
if (elements.mobileNavAdmin) {
    elements.mobileNavAdmin.addEventListener('click', (e) => {
        e.preventDefault();
        closeMobileMenu();
        if (currentUserRole === 'admin') {
            showScreen('admin');
        } else {
            showToast('Permiso Denegado', 'Esta acción es solo para administradores.', 'error');
        }
    });
}

if (elements.mobileNavProspector) {
    elements.mobileNavProspector.addEventListener('click', (e) => {
        e.preventDefault();
        closeMobileMenu();
        if (currentUserRole === 'prospector' || currentUserRole === 'admin') {
            showScreen('prospector');
        } else {
            showToast('Permiso Denegado', 'No tienes permisos para acceder a esta sección.', 'error');
        }
    });
}

if (elements.mobileNavArchive) {
    elements.mobileNavArchive.addEventListener('click', (e) => {
        e.preventDefault();
        closeMobileMenu();
        if (currentUserRole === 'prospector' || currentUserRole === 'admin') {
            showScreen('archive');
        } else {
            showToast('Permiso Denegado', 'No tienes permisos para acceder a esta sección.', 'error');
        }
    });
}

if (elements.mobileNavWhatsapp) {
    elements.mobileNavWhatsapp.addEventListener('click', (e) => {
        e.preventDefault();
        closeMobileMenu();
        window.location.href = './whatsapp-massive.html';
    });
}

if (elements.mobileNavLogout) {
    elements.mobileNavLogout.addEventListener('click', async (e) => {
        e.preventDefault();
        closeMobileMenu();
        try {
            await signOut(auth);
            console.log("Usuario desconectado");
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            showToast('Error al cerrar sesión', 'error');
        }
    });
}

// Event listener para el botón hamburguesa
if (elements.mobileMenuToggle) {
    elements.mobileMenuToggle.addEventListener('click', () => {
        toggleMobileMenu();
    });
}

// Funciones para manejar el menú móvil
const toggleMobileMenu = () => {
    const menu = elements.mobileMenu;
    const button = elements.mobileMenuToggle;
    
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        menu.classList.add('show');
        button.classList.add('active');
    } else {
        closeMobileMenu();
    }
};

const closeMobileMenu = () => {
    const menu = elements.mobileMenu;
    const button = elements.mobileMenuToggle;
    
    menu.classList.remove('show');
    menu.classList.add('hidden');
    button.classList.remove('active');
};

// Cerrar menú móvil al hacer clic fuera de él
document.addEventListener('click', (e) => {
    const menu = elements.mobileMenu;
    const button = elements.mobileMenuToggle;
    
    if (menu && !menu.contains(e.target) && !button.contains(e.target)) {
        closeMobileMenu();
    }
});

// --- Cargar y mostrar prospectos ---
const loadProspects = () => {
    if (!currentUserId) {
        console.log("loadProspects: No hay usuario actual, limpiando tablas.");
        elements.adminProspectsCardsContainer.innerHTML = '';
        elements.prospectorProspectsCardsContainer.innerHTML = '';
        elements.archiveProspectsCardsContainer.innerHTML = '';
        elements.adminNoProspectsDiv.classList.remove('hidden');
        elements.prospectorNoProspectsDiv.classList.remove('hidden');
        elements.archiveNoProspectsDiv.classList.remove('hidden');
        return;
    }
    console.log("loadProspects: Cargando prospectos para el usuario:", currentUserId, "Rol:", currentUserRole);

    try {
        const prospectsCollectionRef = collection(db, 'prospects');
        onSnapshot(prospectsCollectionRef, (snapshot) => {
            console.log("Instantánea de Firestore recibida. Número de documentos:", snapshot.docs.length);

            let fetchedProspects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // DEBUG: Verificar si los prospectos tienen followUpNotes
            console.log('🔍 DEBUG - Verificando datos de prospectos cargados...');
            fetchedProspects.forEach((prospect, index) => {
                if (prospect.followUpNotes || prospect.internalNotes) {
                    const notesText = formatFollowUpNotes(prospect.followUpNotes || prospect.internalNotes);
                    const preview = notesText.length > 100 ? notesText.substring(0, 100) + '...' : notesText;
                    console.log(`🔍 DEBUG - Prospecto ${index + 1}: ${prospect.businessName} tiene notas:`, preview);
                }
            });

            fetchedProspects.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                return dateB.getTime() - dateA.getTime();
            });

            allProspects = fetchedProspects;

            console.log(`Total prospectos cargados:`, allProspects.length);
            
                    // Validar automáticamente números de WhatsApp para prospectos nuevos
        validateNewProspectsWhatsApp();
        
        // DEBUG: Verificar datos de Firestore automáticamente
        setTimeout(() => {
            debugFirestoreData();
        }, 2000);
            
            renderAdminCards();
            renderProspectorCards();
            renderArchiveCards();
            updateProspectingResultsSummary();
            updateDashboard();
            
            // Actualizar calendario si está en la pantalla de prospección
            if (currentUserRole === 'prospector' || currentUserRole === 'admin') {
                renderProspectingCalendar();
            }
        }, (error) => {
            console.error("Error al escuchar prospectos:", error);
            showToast('Error al cargar prospectos', 'error');
        });

    } catch (e) {
        console.error("Error al configurar el oyente de Firestore:", e);
        elements.adminNoProspectsDiv.classList.remove('hidden');
        elements.prospectorNoProspectsDiv.classList.remove('hidden');
        elements.archiveNoProspectsDiv.classList.remove('hidden');
        showToast('Error de conexión con la base de datos', 'error');
    }
};

/**
 * Renderiza las tarjetas de prospectos para la vista de prospector.
 */
const renderProspectorCards = () => {
    if (currentUserRole !== 'prospector' && currentUserRole !== 'admin') return;
    console.log("Renderizando Tarjetas de Prospector.");

    // Verificar que el contenedor existe
    if (!elements.prospectorProspectsCardsContainer) {
        console.error("Contenedor de prospectos de prospector no encontrado");
        return;
    }

    // Si hay prospectos filtrados por fecha del calendario, usar esos
    let prospectsToRender = filteredProspects.length > 0 ? filteredProspects : allProspects;

    const today = new Date();
    const startOfWeek = getStartOfWeek(today).toISOString().split('T')[0];
    const endOfWeek = getEndOfWeek(today).toISOString().split('T')[0];

    const assignedProspects = prospectsToRender.filter(p => {
        const isAssignedToCurrentUser = p.assignedTo === currentUserId;
        const isNicolasOrFrancisco = currentUserId === NICOLAS_UID || currentUserId === FRANCISCO_UID;
        
        if (isAssignedToCurrentUser && p.status === 'En Prospección') {
            return true;
        }
        
        if (p.status === 'Seguimiento agendado' && isWithinCurrentWeek(p.reagendadoPara)) {
             if (isAssignedToCurrentUser || (!p.assignedTo && isNicolasOrFrancisco)) {
                return true;
             }
        }
        
        if (p.status === 'En Prospección' && !p.assignedTo && isNicolasOrFrancisco) {
            return true;
        }

        if (currentUserRole === 'admin') {
            return p.status === 'En Prospección' || p.status === 'Seguimiento agendado';
        }

        return false;
    });

    // Ordenar por fecha de creación (más recientes primero) y separar por tipo
    const prospectosSinContactar = assignedProspects.filter(p => p.status === 'En Prospección')
        .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB.getTime() - dateA.getTime();
        });

    const prospectosReagendados = assignedProspects.filter(p => p.status === 'Seguimiento agendado')
        .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB.getTime() - dateA.getTime();
        });

    elements.prospectorProspectsCardsContainer.innerHTML = '';
    
    if (assignedProspects.length === 0) {
        elements.prospectorNoProspectsDiv.classList.remove('hidden');
    } else {
        elements.prospectorNoProspectsDiv.classList.add('hidden');
        
        // Renderizar prospectos sin contactar primero
        if (prospectosSinContactar.length > 0) {
            elements.prospectorProspectsCardsContainer.insertAdjacentHTML('beforeend', `
                <div class="prospect-section-header">
                    <h4><i data-lucide="phone" class="w-5 h-5 mr-1"></i> Prospectos Sin Contactar (${prospectosSinContactar.length})</h4>
                </div>
            `);
            
            prospectosSinContactar.forEach(prospect => {
                elements.prospectorProspectsCardsContainer.insertAdjacentHTML('beforeend', createProspectCardHTML(prospect, false));
            });
        }

        // Renderizar prospectos reagendados después
        if (prospectosReagendados.length > 0) {
            elements.prospectorProspectsCardsContainer.insertAdjacentHTML('beforeend', `
                <div class="prospect-section-header">
                    <h4><i data-lucide="calendar" class="w-5 h-5 mr-1"></i> Prospectos Reagendados (${prospectosReagendados.length})</h4>
                </div>
            `);
            
            prospectosReagendados.forEach(prospect => {
                elements.prospectorProspectsCardsContainer.insertAdjacentHTML('beforeend', createProspectCardHTML(prospect, false));
            });
        }

        // Adjuntar event listeners para prospector
        attachProspectorCardEventListeners();
    }
    
    // Reinicializar Lucide Icons para el contenido dinámico
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    addEntryAnimations();
    addHoverEffects();

    // --- Renderizar calendario semanal de reagendados ---
    renderProspectingCalendar();
};

// --- Sistema de notificaciones 'Toast' ---
const showToast = (message, type = 'info', duration = 3000) => {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    }[type] || 'ℹ️';
    
    toast.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="text-lg">${icon}</span>
            <span class="font-medium">${message}</span>
            <button class="ml-auto text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
                ✕
            </button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
};

/**
 * Retorna la clase CSS para el badge de estado de un prospecto.
 */
const getStatusBadgeClass = (status) => {
    // Usar el flujo de estatus definido para obtener la clase
    const statusInfo = STATUS_FLOW[status];
    if (statusInfo) {
        return `status-badge ${status.toLowerCase().replace(/\s+/g, '-')}`;
    }
    
    // Fallback para estatus no definidos
    switch (status) {
        case 'Pendiente de Correo': return 'status-badge pending-email';
        case 'En Prospección': return 'status-badge in-prospecting';
        case 'Pendiente de Validación': return 'status-badge pending-validation';
        case 'Interesado': return 'status-badge interesado';
        case 'No contesta': return 'status-badge no-answer';
        case 'Rechazado': return 'status-badge rejected';
        case 'Seguimiento agendado': return 'status-badge rescheduled';
        // case 'Reactivar Contacto': return 'status-badge reactivate'; // Estatus eliminado
        case 'Completado': return 'status-badge completed';
        default: return 'status-badge';
    }
};

/**
 * Genera el HTML para una tarjeta de prospecto.
 */
const createProspectCardHTML = (prospect, isAdminView = false, isArchiveView = false) => {
    const effectiveDueDate = prospect.reagendadoPara || prospect.prospectingDueDate;

    // --- Información de reagendamiento ---
    let reagendadoInfo = '';
    if (prospect.reagendadoPara && prospect.status === 'Seguimiento agendado') {
        reagendadoInfo = `
            <div class="flex items-center text-sm text-gray-600 mt-1">
                <i data-lucide="calendar" class="w-4 h-4 mr-1"></i>
                <span>Reagendado para: ${formatDate(prospect.reagendadoPara)}</span>
            </div>
        `;
    }

    // Badge de alerta si reagendado para hoy o un día antes
    let bellHTML = '';
    if (prospect.reagendadoPara) {
        const today = new Date();
        today.setHours(0,0,0,0);
        const reagDate = new Date(prospect.reagendadoPara);
        reagDate.setHours(0,0,0,0);
        const diffDays = Math.floor((reagDate - today) / (1000*60*60*24));
        if (diffDays === 0 || diffDays === -1) {
            bellHTML = `<div class="prospect-bell-badge" title="Reagendación próxima"><i data-lucide="bell" class="w-3 h-3"></i></div>`;
        }
    }

    // Etiquetas de estatus para archivo
    let statusTag = '';
    if (isArchiveView) {
      const status = (prospect.status || '').toLowerCase();
      if (prospect.isClient || status === 'ya es nuestro cliente') {
        statusTag = `<span class="archive-tag archive-tag-green">YA ES NUESTRO CLIENTE</span>`;
      } else if (status === 'convertido a cliente') {
        statusTag = `<span class="archive-tag archive-tag-green">CONVERTIDO A CLIENTE</span>`;
      } else if (status === 'interesado') {
        statusTag = `<span class="archive-tag archive-tag-yellow">INTERESADO</span>`;
      } else if (status === 'no contesta') {
        statusTag = `<span class="archive-tag archive-tag-orange">NO CONTESTA</span>`;
      } else if (status === 'rechazado') {
        statusTag = `<span class="archive-tag archive-tag-red">RECHAZADO</span>`;
      }
    }

    // Etiqueta de validación de WhatsApp
    let whatsappTag = '';
    if (prospect.whatsappValidated === true) {
      whatsappTag = `<span class="whatsapp-tag whatsapp-tag-validated">CON WHATSAPP</span>`;
    } else if (prospect.whatsappValidated === false) {
      whatsappTag = `<span class="whatsapp-tag whatsapp-tag-no-whatsapp">SIN WHATSAPP</span>`;
    } else if (prospect.phone) {
      whatsappTag = `<span class="whatsapp-tag whatsapp-tag-pending">PENDIENTE</span>`;
    }

    // Tarjeta rectangular, limpia y mobile first
    let fecha = prospect.reagendadoPara ? formatDate(prospect.reagendadoPara) : formatDate(prospect.sentEmailDate);
    let fechaLabel = prospect.reagendadoPara ? 'Reagendación:' : 'Enviado:';
    

    let compactHTML = `
      <div class="prospect-card">
        ${bellHTML}
        <div class="card-header">
          <div class="card-title">${prospect.businessName}</div>
          ${statusTag}
        </div>
        ${prospect.contactPerson ? `<div class="card-encargado">${prospect.contactPerson}</div>` : ''}
        <div class="card-contact">
          <div class="flex items-center gap-2">
            <span class="phone-number">${prospect.phone}</span>
            <a href="tel:${prospect.phone}" class="call-btn" title="Llamar a ${prospect.phone}">
              <i data-lucide="phone" class="w-4 h-4"></i>
            </a>
            <div class="flex items-center gap-2 ml-auto">
              ${whatsappTag}
            </div>
          </div>
        </div>
        <div class="card-date"><span class="label">${fechaLabel}</span> ${fecha}</div>
        <div class="card-actions">
          ${prospect.status === 'Pendiente de Correo' ? 
            `<button data-id="${prospect.id}" class="btn btn-email-confirm email-confirm-btn" style="background-color: #3b82f6; color: white;">
              <i data-lucide="mail" class="w-4 h-4 mr-2"></i> Confirmar Correo
            </button>` : 
            `<button data-id="${prospect.id}" class="btn btn-whatsapp whatsapp-btn"><i data-lucide="message-circle" class="w-4 h-4 mr-2"></i> WhatsApp</button>`
          }
          <button data-id="${prospect.id}" class="btn btn-detail view-details-btn">Ver Detalle</button>
        </div>
      </div>
    `;

    return compactHTML;
};

/**
 * Renderiza las tarjetas de prospectos para la vista de administrador, aplicando filtros.
 */
const renderAdminCards = () => {
    if (currentUserRole !== 'admin') return;
    console.log("Renderizando Tarjetas de Administración.");
    
    // Verificar que el contenedor existe
    if (!elements.adminProspectsCardsContainer) {
        console.error("Contenedor de prospectos de admin no encontrado");
        return;
    }

    const filterStatus = elements.statusFilter ? elements.statusFilter.value : 'all';
    const filterDate = elements.dateFilter ? elements.dateFilter.value : '';
    const searchTerm = elements.searchFilter ? elements.searchFilter.value.toLowerCase() : '';

    const filteredProspects = allProspects.filter(p => {
        const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
        const matchesDate = !filterDate || (p.sentEmailDate && p.sentEmailDate.startsWith(filterDate));
        const matchesSearch = !searchTerm || p.businessName.toLowerCase().includes(searchTerm) || (p.contactPerson && p.contactPerson.toLowerCase().includes(searchTerm));
        return matchesStatus && matchesDate && matchesSearch;
    });

            if (elements.adminProspectsCardsContainer) {
            elements.adminProspectsCardsContainer.innerHTML = '';
            
            if (filteredProspects.length === 0) {
                elements.adminNoProspectsDiv?.classList.remove('hidden');
            } else {
                elements.adminNoProspectsDiv?.classList.add('hidden');
                
                // Separar y ordenar prospectos por tipo
                const prospectosSinContactar = filteredProspects.filter(p => p.status === 'En Prospección')
                    .sort((a, b) => {
                        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                        return dateB.getTime() - dateA.getTime();
                    });

                const prospectosReagendados = filteredProspects.filter(p => p.status === 'Seguimiento agendado')
                    .sort((a, b) => {
                        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                        return dateB.getTime() - dateA.getTime();
                    });

                const otrosProspectos = filteredProspects.filter(p => p.status !== 'En Prospección' && p.status !== 'Seguimiento agendado')
                    .sort((a, b) => {
                        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                        return dateB.getTime() - dateA.getTime();
                    });

                // Renderizar prospectos sin contactar primero
                if (prospectosSinContactar.length > 0) {
                    elements.adminProspectsCardsContainer.insertAdjacentHTML('beforeend', `
                        <div class="prospect-section-header">
                            <h4><i data-lucide="phone" class="w-5 h-5 mr-1"></i> Prospectos Sin Contactar (${prospectosSinContactar.length})</h4>
                        </div>
                    `);
                    
                    prospectosSinContactar.forEach(prospect => {
                        elements.adminProspectsCardsContainer.insertAdjacentHTML('beforeend', createProspectCardHTML(prospect, true));
                    });
                }

                // Renderizar prospectos reagendados después
                if (prospectosReagendados.length > 0) {
                    elements.adminProspectsCardsContainer.insertAdjacentHTML('beforeend', `
                        <div class="prospect-section-header">
                            <h4><i data-lucide="calendar" class="w-5 h-5 mr-1"></i> Prospectos Reagendados (${prospectosReagendados.length})</h4>
                        </div>
                    `);
                    
                    prospectosReagendados.forEach(prospect => {
                        elements.adminProspectsCardsContainer.insertAdjacentHTML('beforeend', createProspectCardHTML(prospect, true));
                    });
                }

                // Renderizar otros prospectos al final
                if (otrosProspectos.length > 0) {
                    elements.adminProspectsCardsContainer.insertAdjacentHTML('beforeend', `
                        <div class="prospect-section-header">
                            <h4><i data-lucide="file-text" class="w-5 h-5 mr-1"></i> Otros Prospectos (${otrosProspectos.length})</h4>
                        </div>
                    `);
                    
                    otrosProspectos.forEach(prospect => {
                        elements.adminProspectsCardsContainer.insertAdjacentHTML('beforeend', createProspectCardHTML(prospect, true));
                    });
                }

                // Re-adjuntar event listeners para los botones recién creados en las tarjetas
                attachAdminCardEventListeners();
            }
        }
    
    // Reinicializar Lucide Icons para el contenido dinámico
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    addEntryAnimations();
    addHoverEffects();
};

/**
 * Renderiza las tarjetas de prospectos para la vista de archivo, aplicando filtros.
 */
const renderArchiveCards = () => {
    if (currentUserRole !== 'admin' && currentUserRole !== 'prospector') return;
    console.log("Renderizando Tarjetas de Archivo.");
    
    // Verificar que el contenedor existe
    if (!elements.archiveProspectsCardsContainer) {
        console.error("Contenedor de prospectos de archivo no encontrado");
        return;
    }

    const finalStatuses = ['Interesado', 'No contesta', 'Rechazado', 'Completado', 'Convertido'];
    const filterStatus = elements.archiveStatusFilter ? elements.archiveStatusFilter.value : 'all';
    const searchTerm = elements.archiveSearchFilter ? elements.archiveSearchFilter.value.toLowerCase() : '';

    // Mostrar en archivo solo los que realmente están en estatus final o cliente
    const archivedProspects = allProspects.filter(p => {
        const isFinal = finalStatuses.includes(p.status) || p.isClient;
        // Excluir si está en prospección o reagendado
        const isActive = p.status === 'En Prospección' || p.status === 'Seguimiento agendado';
        if (!isFinal || isActive) return false;
        const matchesStatus = (filterStatus === 'all' && isFinal) || (filterStatus !== 'all' && (p.status === filterStatus || (filterStatus === 'Cliente' && p.isClient) || (filterStatus === 'Convertido' && p.status === 'Convertido')));
        const matchesSearch = !searchTerm || (p.businessName && p.businessName.toLowerCase().includes(searchTerm)) || (p.contactPerson && p.contactPerson.toLowerCase().includes(searchTerm));
        return matchesStatus && matchesSearch;
    }).sort((a, b) => {
        const dateA = a.lastUpdated ? new Date(a.lastUpdated) : new Date(0);
        const dateB = b.lastUpdated ? new Date(b.lastUpdated) : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });

    if (elements.archiveProspectsCardsContainer) {
    elements.archiveProspectsCardsContainer.innerHTML = '';
    if (archivedProspects.length === 0) {
            elements.archiveNoProspectsDiv?.classList.remove('hidden');
    } else {
            elements.archiveNoProspectsDiv?.classList.add('hidden');
        archivedProspects.forEach(prospect => {
            elements.archiveProspectsCardsContainer.insertAdjacentHTML('beforeend', createProspectCardHTML(prospect, false, true));
        });

        // Adjuntar event listeners para archivo
        document.querySelectorAll('.view-details-btn').forEach(button => {
            button.onclick = (event) => {
                const prospectId = event.currentTarget.dataset.id;
                console.log('Ver detalles clicked para prospect:', prospectId);
                showProspectDetailsModal(prospectId);
            };
        });
        }
    }
    
    // Reinicializar Lucide Icons para el contenido dinámico
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    addEntryAnimations();
    addHoverEffects();
};

// --- Inicialización de la aplicación ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Aplicación CRM Pietrafina inicializada correctamente");
    
    // Crear contenedor de toasts si no existe
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(toastContainer);
    }
    
    // Reinicializar Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    console.log('✅ Aplicación inicializada correctamente');
});

/**
 * Adjunta event listeners a los botones de las tarjetas de administrador
 */
const attachAdminCardEventListeners = () => {
    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const prospectId = event.currentTarget.dataset.id;
            console.log('Ver detalles clicked para prospect:', prospectId);
            showProspectDetailsModal(prospectId);
        });
    });
    
    // Event listeners para botones de WhatsApp
    document.querySelectorAll('.whatsapp-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const prospectId = event.currentTarget.dataset.id;
            console.log('WhatsApp clicked para prospect:', prospectId);
            showWhatsAppModal(prospectId);
        });
    });
    
    // Event listeners para botones de confirmación de correo
    document.querySelectorAll('.email-confirm-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const prospectId = event.currentTarget.dataset.id;
            const prospect = allProspects.find(p => p.id === prospectId);
            if (prospect) {
                console.log('Confirmar correo clicked para prospect:', prospectId);
                window.pendingEmailConfirmProspectId = prospectId;
                showEmailConfirmModal(prospect);
            }
        });
    });
};

/**
 * Adjunta event listeners a los botones de las tarjetas de prospector
 */
const attachProspectorCardEventListeners = () => {
    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const prospectId = event.currentTarget.dataset.id;
            console.log('Ver detalles clicked para prospect:', prospectId);
            showProspectDetailsModal(prospectId);
        });
    });
    
    // Event listeners para botones de WhatsApp
    document.querySelectorAll('.whatsapp-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const prospectId = event.currentTarget.dataset.id;
            console.log('WhatsApp clicked para prospect:', prospectId);
            showWhatsAppModal(prospectId);
        });
    });
};

/**
 * Actualiza el estado de un prospecto en Firestore.
 */
const updateProspectStatus = async (prospectId, newStatus) => {
    if (!currentUserId) {
        showToast('Usuario no autenticado. Por favor, intenta de nuevo', 'error');
        return;
    }
    try {
        console.log(`Actualizando prospecto ${prospectId} al estado: ${newStatus}`);
        const prospectRef = doc(db, 'prospects', prospectId);
        const updateData = { status: newStatus, lastUpdated: new Date().toISOString().split('T')[0] };

        if (newStatus === 'En Prospección') {
            const today = new Date();
            updateData.sentEmailDate = today.toISOString().split('T')[0];
            // Ya no se establece fecha de vencimiento - el prospecto permanece disponible
            updateData.prospectingDueDate = null;
            updateData.reagendadoPara = null;
        }

        await updateDoc(prospectRef, updateData);
        showToast(`Estado del prospecto actualizado a "${newStatus}"`, 'success');
        
        // Actualizar calendario si está en la pantalla de prospección
        if (currentUserRole === 'prospector' || currentUserRole === 'admin') {
            renderProspectingCalendar();
        }
    }
    catch (e) {
        console.error("Error al actualizar documento:", e);
        showToast(`Error al actualizar el estado: ${e.message}`, 'error');
    }
};

/**
 * Actualiza el resumen de resultados de prospección en el dashboard.
 */
const updateProspectingResultsSummary = () => {
    if (currentUserRole !== 'admin') return;
    console.log("Actualizando resumen de resultados de prospección.");

    const counts = {
        total: allProspects.length,
        enProspeccion: allProspects.filter(p => p.status === 'En Prospección').length,
        interesado: allProspects.filter(p => p.status === 'Interesado').length,
        seguimientoAgendado: allProspects.filter(p => p.status === 'Seguimiento agendado').length,
        pendienteValidacion: allProspects.filter(p => p.status === 'Pendiente de Validación').length
    };

    // Calcular tasa de conversión incluyendo "Seguimiento agendado" como equivalente a "Interesado"
    const totalInteresados = counts.interesado + counts.seguimientoAgendado;
    const conversionRateValue = counts.total > 0 ? ((totalInteresados / counts.total) * 100).toFixed(1) : 0;

    // Calcular estadísticas de reagendamiento
    const rescheduleStats = calculateRescheduleStatistics();

    if (elements.totalProspectsCount) elements.totalProspectsCount.textContent = counts.total;
    if (elements.enProspeccionCount) elements.enProspeccionCount.textContent = counts.enProspeccion + counts.pendienteValidacion;
    if (elements.interesadoCount) elements.interesadoCount.textContent = totalInteresados;
    if (elements.conversionRate) elements.conversionRate.textContent = `${conversionRateValue}%`;
    
    // Mostrar estadísticas de reagendamiento si hay elementos disponibles
    updateRescheduleStatistics(rescheduleStats);
};

// --- Gráficos del Dashboard ---
const updateDashboard = () => {
    console.log("Actualizando gráficos del dashboard.");

    // Crear el flujo visual de estatus
    createStatusFlowVisualization();

    const statusCounts = {
        'Pendiente de Correo': allProspects.filter(p => p.status === 'Pendiente de Correo').length,
        'En Prospección': allProspects.filter(p => p.status === 'En Prospección').length,
        'Interesado': allProspects.filter(p => p.status === 'Interesado').length,
        'Seguimiento agendado': allProspects.filter(p => p.status === 'Seguimiento agendado').length,
        'No contesta': allProspects.filter(p => p.status === 'No contesta').length,
        'Rechazado': allProspects.filter(p => p.status === 'Rechazado').length,
        'Convertido a cliente': allProspects.filter(p => p.status === 'Convertido a cliente').length,
        'Ya es nuestro cliente': allProspects.filter(p => p.status === 'Ya es nuestro cliente').length
    };

    // Solo intentar crear gráficos si Chart.js está disponible
    if (typeof Chart !== 'undefined') {
        const statusCtx = document.getElementById('statusChart');
        if (statusCtx) {
            const statusChartCtx = statusCtx.getContext('2d');
    if (statusChart) {
        statusChart.destroy();
    }
            
            statusChart = new Chart(statusChartCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: [
                            '#1e293b', '#ef4444', '#64748b', '#22c55e',
                            '#f59e42', '#3b82f6', '#b91c1c', '#334155'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                            text: 'Distribución por Estatus'
                }
            }
        }
    });
        }
    }
};

// --- Sistema de Modales ---

/**
 * Muestra el modal de detalles de un prospecto
 */
const showProspectDetailsModal = (prospectId) => {
    const prospect = allProspects.find(p => p.id === prospectId);
    if (!prospect) {
        showToast('Prospecto no encontrado', 'error');
        return;
    }

    currentProspectIdForModal = prospectId;

    // Llenar datos del modal
    if (elements.detailBusinessName) elements.detailBusinessName.textContent = prospect.businessName || 'N/A';
    if (elements.detailContactPerson) elements.detailContactPerson.textContent = prospect.contactPerson || 'N/A';
    if (elements.detailEmail) elements.detailEmail.textContent = prospect.email || 'N/A';
    if (elements.detailPhone) elements.detailPhone.textContent = prospect.phone || 'N/A';
    if (elements.detailClassification) elements.detailClassification.textContent = prospect.classification || 'N/A';
    if (elements.detailStatus) elements.detailStatus.textContent = prospect.status || 'N/A';
    if (elements.detailInternalNotes) elements.detailInternalNotes.textContent = prospect.internalNotes || 'Sin notas';
    if (elements.detailSentEmailDate) elements.detailSentEmailDate.textContent = formatDate(prospect.sentEmailDate);
            if (elements.detailProspectingDueDate) elements.detailProspectingDueDate.textContent = prospect.prospectingDueDate ? formatDate(prospect.prospectingDueDate) : 'Sin fecha límite';
    if (elements.detailContactedBy) elements.detailContactedBy.textContent = prospect.assignedByName || 'No asignado';
    if (elements.detailObservations) elements.detailObservations.textContent = prospect.observations || 'Sin observaciones';
    
    // DEBUG: Verificar si las notas de seguimiento existen
    console.log('🔍 DEBUG - Prospecto:', prospect.businessName);
    console.log('🔍 DEBUG - followUpNotes:', prospect.followUpNotes);
    console.log('🔍 DEBUG - internalNotes:', prospect.internalNotes);
    console.log('🔍 DEBUG - followUpNotes type:', typeof prospect.followUpNotes);
    console.log('🔍 DEBUG - internalNotes type:', typeof prospect.internalNotes);
    console.log('🔍 DEBUG - followUpNotes length:', prospect.followUpNotes ? prospect.followUpNotes.length : 'null');
    console.log('🔍 DEBUG - internalNotes length:', prospect.internalNotes ? prospect.internalNotes.length : 'null');
    
    if (elements.detailFollowUpNotes) {
        // Intentar con followUpNotes primero, luego con internalNotes como fallback
        let notesText = formatFollowUpNotes(prospect.followUpNotes || prospect.internalNotes);
        
        elements.detailFollowUpNotes.innerHTML = notesText;
    }

    // Mostrar días restantes
    if (elements.detailRemainingDays) {
        elements.detailRemainingDays.textContent = prospect.prospectingDueDate ? getRemainingBusinessDays(prospect.prospectingDueDate, prospect.reagendadoPara) : 'Sin fecha límite';
    }

    // Mostrar/ocultar información de reagendamiento
    if (prospect.reagendadoPara && elements.detailReagendadoParaContainer) {
        elements.detailReagendadoParaContainer.classList.remove('hidden');
        if (elements.detailReagendadoPara) {
            elements.detailReagendadoPara.textContent = formatDate(prospect.reagendadoPara);
        }
    } else if (elements.detailReagendadoParaContainer) {
        elements.detailReagendadoParaContainer.classList.add('hidden');
    }

    // Configurar botón de llamada en el modal
    const callButton = document.getElementById('call-button');
    if (callButton && prospect.phone) {
        callButton.href = `tel:${prospect.phone}`;
        callButton.title = `Llamar a ${prospect.phone}`;
        callButton.classList.remove('hidden');
        
        // Actualizar el texto del botón para mostrar el número
        const callButtonText = callButton.querySelector('i');
        if (callButtonText) {
            callButtonText.nextSibling.textContent = ` Llamar a ${prospect.phone}`;
        }
    } else if (callButton) {
        callButton.classList.add('hidden');
    }

    // Mostrar áreas de acción según el rol y estado
    showModalActionAreas(prospect);
    
    // Actualizar opciones del selector de resultados según el estatus actual
    updateContactResultOptions(prospect.status);

    // Mostrar el modal
    if (elements.detailModal) {
        elements.detailModal.classList.remove('hidden');
    }
};

/**
 * Muestra las áreas de acción apropiadas en el modal de detalles
 */
const showModalActionAreas = (prospect) => {
    // Ocultar todas las áreas primero
    if (elements.prospectorActionArea) elements.prospectorActionArea.classList.add('hidden');
    if (elements.rescheduleActionArea) elements.rescheduleActionArea.classList.add('hidden');
    if (elements.adminActionsArea) elements.adminActionsArea.classList.add('hidden');
    if (elements.editProspectActionArea) elements.editProspectActionArea.classList.add('hidden');

    // Obtener información del estatus actual
    const statusInfo = STATUS_FLOW[prospect.status];
    
    // Mostrar área de prospector si el estatus permite acciones de seguimiento
    // O si el usuario es prospector/admin y quiere agregar notas (nueva funcionalidad)
    if ((currentUserRole === 'prospector' || currentUserRole === 'admin') && 
        (currentUserRole === 'prospector' || currentUserRole === 'admin')) {
        if (elements.prospectorActionArea) elements.prospectorActionArea.classList.remove('hidden');
    }

    // Mostrar área de reagendamiento si el estatus permite reagendar y el usuario tiene permisos
    if (allowsReschedule(prospect.status) && 
        canUserReschedule(currentUserId, currentUserRole, currentUserName)) {
        if (elements.rescheduleActionArea) elements.rescheduleActionArea.classList.remove('hidden');
    }

    // Mostrar acciones de admin
    if (currentUserRole === 'admin') {
        if (elements.adminActionsArea) elements.adminActionsArea.classList.remove('hidden');
        if (elements.editProspectActionArea) elements.editProspectActionArea.classList.remove('hidden');
    }
};

/**
 * Muestra el modal de WhatsApp para un prospecto
 */
const showWhatsAppModal = (prospectId) => {
    console.log('🔍 showWhatsAppModal llamado con prospectId:', prospectId);
    console.log('🔍 allProspects length:', allProspects.length);
    
    const prospect = allProspects.find(p => p.id === prospectId);
    console.log('🔍 Prospecto encontrado:', prospect);
    
    if (!prospect) {
        showToast('Prospecto no encontrado', 'error');
        return;
    }

    // Guardar el prospectId para que los checkboxes puedan acceder a él
    window.currentProspectIdForWhatsApp = prospectId;

    // Generar checkboxes de materiales
    populateMaterialsCheckboxes();
    
    // Generar mensaje inicial después de crear los checkboxes
    setTimeout(() => {
        updateWhatsAppMessage(prospect);
    }, 100);
    
    // Configurar el botón de enviar
    if (elements.whatsappModalSendBtn) {
        elements.whatsappModalSendBtn.onclick = () => {
            sendWhatsAppMessage(prospect);
        };
    }
    
    // Configurar el botón de cancelar
    if (elements.whatsappModalCancelBtn) {
        elements.whatsappModalCancelBtn.onclick = () => {
            closeWhatsAppModal();
        };
    }
    
    // Configurar el botón de cerrar
    if (elements.whatsappModalClose) {
        elements.whatsappModalClose.onclick = () => {
            closeWhatsAppModal();
        };
    }
    
    // Configurar botón de validación de WhatsApp (validación automática)
    if (elements.whatsappValidatedBtn) {
        elements.whatsappValidatedBtn.onclick = () => {
            validateSingleWhatsAppNumber(prospectId);
        };
    }
    
    // Actualizar estado visual de los botones de validación
    updateWhatsAppValidationButtons(prospect);
    
    // Mostrar el modal de WhatsApp
    if (elements.whatsappModal) {
        elements.whatsappModal.classList.remove('hidden');
        console.log('✅ Modal de WhatsApp mostrado');
    } else {
        console.error('❌ Elemento whatsappModal no encontrado');
    }
};

/**
 * Cierra el modal de WhatsApp
 */
const closeWhatsAppModal = () => {
    if (elements.whatsappModal) {
        elements.whatsappModal.classList.add('hidden');
        console.log('✅ Modal de WhatsApp cerrado');
    }
};

/**
 * Valida si un número de teléfono tiene WhatsApp usando el microservicio
 */
const validateWhatsAppNumber = async (phoneNumber) => {
    try {
        // Usar la nueva función de formateo que siempre agrega 521
        const formattedNumber = formatPhoneForWhatsApp(phoneNumber);
        
        if (!formattedNumber) {
            console.error('❌ Número inválido para validación:', phoneNumber);
            return false;
        }
        
        console.log('🔍 Validando número formateado:', formattedNumber);
        
        // Verificar formato básico del número
        const isValidFormat = formattedNumber.length >= 12 && formattedNumber.length <= 15;
        
        if (!isValidFormat) {
            console.error('❌ Formato inválido después de formateo:', formattedNumber);
            return false;
        }
        
        // Llamar al microservicio de WhatsApp
        const response = await fetch(`http://localhost:3000/check-whatsapp/${formattedNumber}`);
        
        if (!response.ok) {
            console.error('Error en la respuesta del microservicio:', response.status);
            return false;
        }
        
        const data = await response.json();
        console.log('✅ Resultado de validación:', data);
        return data.tieneWhatsapp;
        
    } catch (error) {
        console.error('Error validando número de WhatsApp:', error);
        // Si el microservicio no está disponible, asumir que tiene WhatsApp
        return true;
    }
};

/**
 * Valida automáticamente todos los prospectos con refresh completo de datos
 */
const validateAllWhatsAppNumbers = async () => {
    try {
        showToast('🔄 Actualizando datos desde la base de datos...', 'info');
        
        // Primero hacer un refresh completo de los datos desde Firestore
        await refreshProspectsFromDatabase();
        
        showToast('📱 Iniciando verificación de números de WhatsApp...', 'info');
        
        // Ahora filtrar prospectos con datos actualizados
        const prospectsToValidate = allProspects.filter(p => 
            p.phone && p.whatsappValidated === undefined
        );
        
        if (prospectsToValidate.length === 0) {
            showToast('✅ Todos los prospectos ya están verificados', 'success');
            return;
        }
        
        let validatedCount = 0;
        let totalCount = prospectsToValidate.length;
        
        showToast(`🔍 Encontrados ${totalCount} prospectos para verificar`, 'info');
        
        for (const prospect of prospectsToValidate) {
            try {
                showToast(`📞 Verificando ${prospect.businessName || prospect.contactPerson || 'prospecto'}...`, 'info');
                
                const hasWhatsApp = await validateWhatsAppNumber(prospect.phone);
                
                // Actualizar en Firestore
                const prospectRef = doc(db, 'prospects', prospect.id);
                await updateDoc(prospectRef, {
                    whatsappValidated: hasWhatsApp,
                    whatsappValidationDate: new Date().toISOString(),
                    lastUpdated: new Date().toISOString()
                });
                
                // Actualizar en el array local
                prospect.whatsappValidated = hasWhatsApp;
                prospect.whatsappValidationDate = new Date().toISOString();
                
                validatedCount++;
                
                // Mostrar progreso cada 3 prospectos
                if (validatedCount % 3 === 0) {
                    showToast(`✅ Verificando... ${validatedCount}/${totalCount} prospectos`, 'info');
                }
                
                // Pequeña pausa para no sobrecargar el microservicio
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`Error verificando prospecto ${prospect.id}:`, error);
                // Continuar con el siguiente prospecto
            }
        }
        
        // Re-renderizar las tarjetas con datos actualizados
        if (currentUserRole === 'admin') {
            renderAdminCards();
        } else {
            renderProspectorCards();
        }
        
        // Actualizar dashboard y resumen
        updateProspectingResultsSummary();
        updateDashboard();
        
        showToast(`🎉 Verificación completada: ${validatedCount} prospectos procesados con datos actualizados.`, 'success');
        
    } catch (error) {
        console.error('Error en verificación automática:', error);
        showToast('❌ Error durante la verificación automática', 'error');
    }
};

/**
 * Función para hacer refresh completo de prospectos desde Firestore
 */
const refreshProspectsFromDatabase = async () => {
    try {
        console.log('🔄 Iniciando refresh completo de prospectos desde Firestore...');
        
        // Obtener todos los prospectos directamente desde Firestore
        const prospectsCollectionRef = collection(db, 'prospects');
        const snapshot = await getDocs(prospectsCollectionRef);
        
        let fetchedProspects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // DEBUG: Verificar datos cargados en refresh
        console.log('🔄 DEBUG - Verificando datos en refresh...');
        fetchedProspects.forEach((prospect, index) => {
            if (prospect.followUpNotes || prospect.internalNotes) {
                console.log(`🔄 DEBUG - Prospecto ${index + 1}: ${prospect.businessName}`);
                const notesText = formatFollowUpNotes(prospect.followUpNotes || prospect.internalNotes);
                const preview = notesText.length > 100 ? notesText.substring(0, 100) + '...' : notesText;
                console.log(`🔄 DEBUG - Notas formateadas:`, preview);
            }
        });
        
        // Ordenar por fecha de creación (más recientes primero)
        fetchedProspects.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB.getTime() - dateA.getTime();
        });
        
        // Actualizar el array global
        allProspects = fetchedProspects;
        
        console.log(`✅ Refresh completado: ${allProspects.length} prospectos cargados desde Firestore`);
        
        // Re-renderizar todas las vistas
        renderAdminCards();
        renderProspectorCards();
        renderArchiveCards();
        updateProspectingResultsSummary();
        updateDashboard();
        
        // Actualizar calendario si está en la pantalla de prospección
        if (currentUserRole === 'prospector' || currentUserRole === 'admin') {
            renderProspectingCalendar();
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error haciendo refresh de prospectos:', error);
        showToast('Error al actualizar datos desde la base de datos', 'error');
        return false;
    }
};

/**
 * Valida un solo número de WhatsApp
 */
const validateSingleWhatsAppNumber = async (prospectId) => {
    try {
        const prospect = allProspects.find(p => p.id === prospectId);
        if (!prospect) {
            showToast('Prospecto no encontrado', 'error');
            return;
        }
        
        showToast('Verificando número de WhatsApp...', 'info');
        
        const hasWhatsApp = await validateWhatsAppNumber(prospect.phone);
        
        // Actualizar en Firestore
        const prospectRef = doc(db, 'prospects', prospectId);
        await updateDoc(prospectRef, {
            whatsappValidated: hasWhatsApp,
            whatsappValidationDate: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        });
        
        // Actualizar en el array local
        prospect.whatsappValidated = hasWhatsApp;
        prospect.whatsappValidationDate = new Date().toISOString();
        
        // Re-renderizar las tarjetas
        if (currentUserRole === 'admin') {
            renderAdminCards();
        } else {
            renderProspectorCards();
        }
        
        showToast(`Número ${hasWhatsApp ? 'tiene' : 'no tiene'} WhatsApp`, hasWhatsApp ? 'success' : 'warning');
        
    } catch (error) {
        console.error('Error validando número individual:', error);
        showToast('Error al validar el número', 'error');
    }
};

/**
 * Función para convertir notas de seguimiento a texto legible con formato de etiquetas
 */
const formatFollowUpNotes = (notes) => {
    if (!notes) return '<span class="text-gray-500 italic">Sin notas de seguimiento previas</span>';
    
    if (typeof notes === 'string') {
        // Si es una cadena simple, crear una etiqueta con fecha actual
        const now = new Date();
        const formattedDate = now.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        return `
            <div class="note-tag note-tag-enhanced" style="border-left: 4px solid #dc2626; margin-bottom: 12px; padding: 12px; background: #fef2f2; border-radius: 8px;">
                <div class="note-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.875rem;">
                    <span class="note-user" style="font-weight: 600; color: #dc2626; background: #fee2e2; padding: 4px 8px; border-radius: 4px;">
                        <i data-lucide="user" class="w-3 h-3 inline mr-1"></i>Usuario
                    </span>
                    <span class="note-date-time" style="color: #6b7280; font-size: 0.75rem;">
                        <i data-lucide="calendar" class="w-3 h-3 inline mr-1"></i>${formattedDate}
                    </span>
                </div>
                <div class="note-content" style="color: #1f2937; line-height: 1.5;">
                    ${notes}
                </div>
                <div class="note-meta" style="margin-top: 6px; font-size: 0.75rem; color: #9ca3af;">
                    <i data-lucide="hash" class="w-3 h-3 inline mr-1"></i>Nota única
                    <span style="margin-left: 8px; color: #dc2626;">⚠️ Formato simple</span>
                </div>
            </div>
        `;
    }
    
    if (Array.isArray(notes)) {
        return notes.map((note, index) => {
            if (typeof note === 'string') {
                // Para notas simples, usar fecha actual
                const now = new Date();
                const formattedDate = now.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                return `
                    <div class="note-tag note-tag-enhanced" style="border-left: 4px solid #dc2626; margin-bottom: 12px; padding: 12px; background: #fef2f2; border-radius: 8px;">
                        <div class="note-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.875rem;">
                            <span class="note-user" style="font-weight: 600; color: #dc2626; background: #fee2e2; padding: 4px 8px; border-radius: 4px;">
                                <i data-lucide="user" class="w-3 h-3 inline mr-1"></i>Usuario
                            </span>
                            <span class="note-date-time" style="color: #6b7280; font-size: 0.75rem;">
                                <i data-lucide="calendar" class="w-3 h-3 inline mr-1"></i>${formattedDate}
                            </span>
                        </div>
                        <div class="note-content" style="color: #1f2937; line-height: 1.5;">
                            ${note}
                        </div>
                        <div class="note-meta" style="margin-top: 6px; font-size: 0.75rem; color: #9ca3af;">
                            <i data-lucide="hash" class="w-3 h-3 inline mr-1"></i>Nota #${index + 1}
                            <span style="margin-left: 8px; color: #dc2626;">⚠️ Formato simple</span>
                        </div>
                    </div>
                `;
            }
            if (typeof note === 'object') {
                // Formatear específicamente para el formato de notas del CRM (nuevo formato)
                if (note.note && note.date && note.user) {
                    const date = new Date(note.date);
                    const formattedDate = date.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    const formattedTime = date.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    return `
                        <div class="note-tag note-tag-enhanced" style="border-left: 4px solid #dc2626; margin-bottom: 12px; padding: 12px; background: #fef2f2; border-radius: 8px;">
                            <div class="note-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.875rem;">
                                <span class="note-user" style="font-weight: 600; color: #dc2626; background: #fee2e2; padding: 4px 8px; border-radius: 4px;">
                                    <i data-lucide="user" class="w-3 h-3 inline mr-1"></i>${note.user}
                                </span>
                                <span class="note-date-time" style="color: #6b7280; font-size: 0.75rem;">
                                    <i data-lucide="calendar" class="w-3 h-3 inline mr-1"></i>${formattedDate} a las ${formattedTime}
                                </span>
                            </div>
                            <div class="note-content" style="color: #1f2937; line-height: 1.5;">
                                ${note.note}
                            </div>
                            <div class="note-meta" style="margin-top: 6px; font-size: 0.75rem; color: #9ca3af;">
                                <i data-lucide="hash" class="w-3 h-3 inline mr-1"></i>Nota #${index + 1}
                            </div>
                        </div>
                    `;
                }
                
                // Formatear específicamente para el formato de notas del CRM (formato legacy)
                if (note.notes && note.timestamp && note.by) {
                    const date = new Date(note.timestamp);
                    const formattedDate = date.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    const formattedTime = date.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    return `
                        <div class="note-tag note-tag-enhanced" style="border-left: 4px solid #dc2626; margin-bottom: 12px; padding: 12px; background: #fef2f2; border-radius: 8px;">
                            <div class="note-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.875rem;">
                                <span class="note-user" style="font-weight: 600; color: #dc2626; background: #fee2e2; padding: 4px 8px; border-radius: 4px;">
                                    <i data-lucide="user" class="w-3 h-3 inline mr-1"></i>${note.by.name || note.by}
                                </span>
                                <span class="note-date-time" style="color: #6b7280; font-size: 0.75rem;">
                                    <i data-lucide="calendar" class="w-3 h-3 inline mr-1"></i>${formattedDate} a las ${formattedTime}
                                </span>
                            </div>
                            <div class="note-content" style="color: #1f2937; line-height: 1.5;">
                                ${note.notes}
                            </div>
                            <div class="note-meta" style="margin-top: 6px; font-size: 0.75rem; color: #9ca3af;">
                                <i data-lucide="hash" class="w-3 h-3 inline mr-1"></i>Nota #${index + 1}
                            </div>
                        </div>
                    `;
                }
                // Fallback para otros formatos
                const date = note.date || new Date().toLocaleDateString('es-ES');
                const content = note.text || note.message || note.note || JSON.stringify(note);
                const user = note.user || note.by || 'Usuario';
                
                return `
                    <div class="note-tag note-tag-enhanced" style="border-left: 4px solid #dc2626; margin-bottom: 12px; padding: 12px; background: #fef2f2; border-radius: 8px;">
                        <div class="note-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.875rem;">
                            <span class="note-user" style="font-weight: 600; color: #dc2626; background: #fee2e2; padding: 4px 8px; border-radius: 4px;">
                                <i data-lucide="user" class="w-3 h-3 inline mr-1"></i>${user}
                            </span>
                            <span class="note-date-time" style="color: #6b7280; font-size: 0.75rem;">
                                <i data-lucide="calendar" class="w-3 h-3 inline mr-1"></i>${date}
                            </span>
                        </div>
                        <div class="note-content" style="color: #1f2937; line-height: 1.5;">
                            ${content}
                        </div>
                        <div class="note-meta" style="margin-top: 6px; font-size: 0.75rem; color: #9ca3af;">
                            <i data-lucide="hash" class="w-3 h-3 inline mr-1"></i>Nota #${index + 1}
                            <span style="margin-left: 8px; color: #dc2626;">⚠️ Formato legacy</span>
                        </div>
                    </div>
                `;
            }
            return `
                <div class="note-tag note-tag-enhanced" style="border-left: 4px solid #dc2626; margin-bottom: 12px; padding: 12px; background: #fef2f2; border-radius: 8px;">
                    <div class="note-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.875rem;">
                        <span class="note-user" style="font-weight: 600; color: #dc2626; background: #fee2e2; padding: 4px 8px; border-radius: 4px;">
                            <i data-lucide="user" class="w-3 h-3 inline mr-1"></i>Usuario
                        </span>
                        <span class="note-date-time" style="color: #6b7280; font-size: 0.75rem;">
                            <i data-lucide="calendar" class="w-3 h-3 inline mr-1"></i>${new Date().toLocaleDateString('es-ES')}
                        </span>
                    </div>
                    <div class="note-content" style="color: #1f2937; line-height: 1.5;">
                        ${String(note)}
                    </div>
                    <div class="note-meta" style="margin-top: 6px; font-size: 0.75rem; color: #9ca3af;">
                        <i data-lucide="hash" class="w-3 h-3 inline mr-1"></i>Nota #${index + 1}
                        <span style="margin-left: 8px; color: #dc2626;">⚠️ Formato simple</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    if (typeof notes === 'object') {
        // Si es un objeto con propiedades como date, text, message, etc.
        if (notes.text || notes.message || notes.note) {
            const date = notes.date || new Date().toLocaleDateString('es-ES');
            const content = notes.text || notes.message || notes.note;
            const user = notes.user || notes.by || 'Usuario';
            
            return `
                <div class="note-tag note-tag-enhanced" style="border-left: 4px solid #dc2626; margin-bottom: 12px; padding: 12px; background: #fef2f2; border-radius: 8px;">
                    <div class="note-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.875rem;">
                        <span class="note-user" style="font-weight: 600; color: #dc2626; background: #fee2e2; padding: 4px 8px; border-radius: 4px;">
                            <i data-lucide="user" class="w-3 h-3 inline mr-1"></i>${user}
                        </span>
                        <span class="note-date-time" style="color: #6b7280; font-size: 0.75rem;">
                            <i data-lucide="calendar" class="w-3 h-3 inline mr-1"></i>${date}
                        </span>
                    </div>
                    <div class="note-content" style="color: #1f2937; line-height: 1.5;">
                        ${content}
                    </div>
                    <div class="note-meta" style="margin-top: 6px; font-size: 0.75rem; color: #9ca3af;">
                        <i data-lucide="hash" class="w-3 h-3 inline mr-1"></i>Nota única
                        <span style="margin-left: 8px; color: #dc2626;">⚠️ Formato objeto</span>
                    </div>
                </div>
            `;
        }
        // Si es un objeto con múltiples entradas
        return Object.entries(notes).map(([key, value], index) => {
            const content = typeof value === 'object' ? JSON.stringify(value) : value;
            return `
                <div class="note-tag note-tag-enhanced" style="border-left: 4px solid #dc2626; margin-bottom: 12px; padding: 12px; background: #fef2f2; border-radius: 8px;">
                    <div class="note-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.875rem;">
                        <span class="note-user" style="font-weight: 600; color: #dc2626; background: #fee2e2; padding: 4px 8px; border-radius: 4px;">
                            <i data-lucide="calendar" class="w-3 h-3 inline mr-1"></i>${key}
                        </span>
                        <span class="note-date-time" style="color: #6b7280; font-size: 0.75rem;">
                            <i data-lucide="hash" class="w-3 h-3 inline mr-1"></i>Propiedad
                        </span>
                    </div>
                    <div class="note-content" style="color: #1f2937; line-height: 1.5;">
                        ${content}
                    </div>
                    <div class="note-meta" style="margin-top: 6px; font-size: 0.75rem; color: #9ca3af;">
                        <i data-lucide="hash" class="w-3 h-3 inline mr-1"></i>Entrada #${index + 1}
                        <span style="margin-left: 8px; color: #dc2626;">⚠️ Formato objeto múltiple</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    return `
        <div class="note-tag">
            <span class="note-date">${new Date().toLocaleDateString('es-ES')}</span>
            <span class="note-content">${JSON.stringify(notes)}</span>
        </div>
    `;
};

/**
 * Función temporal para verificar datos de Firestore directamente
 */
const handleSaveFollowUp = async () => {
    if (!currentProspectIdForModal) {
        showToast('No hay prospecto seleccionado', 'error');
        return;
    }

    const followUpNote = elements.followUpNotesInput?.value?.trim();
    const contactResult = elements.contactResult?.value;

    // Permitir guardar si hay un cambio de estatus O una nota de seguimiento
    if (!followUpNote && !contactResult) {
        showToast('Por favor escribe una nota de seguimiento o selecciona un resultado de contacto.', 'warning');
        return;
    }

    try {
        const prospectRef = doc(db, 'prospects', currentProspectIdForModal);
        // Obtener prospecto actual
        const prospect = allProspects.find(p => p.id === currentProspectIdForModal);
        let notesArr = Array.isArray(prospect?.followUpNotes) ? [...prospect.followUpNotes] : [];
        
        // Solo agregar la nota si existe
        if (followUpNote) {
            notesArr.push({
                note: followUpNote,
                date: new Date().toISOString(),
                user: currentUserName || 'Sistema'
            });
        }

        const updateData = {
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        
        // Solo incluir followUpNotes si hay notas para agregar
        if (followUpNote) {
            updateData.followUpNotes = notesArr;
        }
        // Si el usuario también seleccionó un resultado de contacto, actualiza el status
        if (contactResult) {
            updateData.status = contactResult;
        }

        await updateDoc(prospectRef, updateData);

        showToast('Seguimiento guardado exitosamente', 'success');
        
        // Solo limpiar el input si se escribió una nota
        if (followUpNote) {
            elements.followUpNotesInput.value = '';
        }
        
        // Recargar detalles en el modal
        await showProspectDetailsModal(currentProspectIdForModal);
    } catch (error) {
        console.error('Error al guardar seguimiento:', error);
        showToast('Error al guardar seguimiento: ' + error.message, 'error');
    }
};

/**
 * Función unificada para guardar seguimientos - Permite guardar solo notas sin cambiar estatus
 */
// Código fragmentado eliminado - se mantiene la función unificada arriba

/**
 * Actualiza el estado de WhatsApp de un prospecto
 */
const updateWhatsAppStatus = async (prospectId, hasWhatsApp) => {
    try {
        const prospect = allProspects.find(p => p.id === prospectId);
        if (!prospect) {
            showToast('Prospecto no encontrado', 'error');
            return;
        }
        
        // Actualizar en Firestore
        const prospectRef = doc(db, 'prospects', prospectId);
        await updateDoc(prospectRef, {
            whatsappValidated: hasWhatsApp,
            whatsappValidationDate: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        });
        
        // Actualizar en el array local
        prospect.whatsappValidated = hasWhatsApp;
        prospect.whatsappValidationDate = new Date().toISOString();
        
        // Re-renderizar las tarjetas
        if (currentUserRole === 'admin') {
            renderAdminCards();
        } else {
            renderProspectorCards();
        }
        
        const message = hasWhatsApp ? 'WhatsApp confirmado como disponible' : 'WhatsApp confirmado como no disponible';
        showToast(message, 'success');
        
    } catch (error) {
        console.error('Error actualizando estado de WhatsApp:', error);
        showToast('Error al actualizar el estado de WhatsApp', 'error');
    }
};

/**
 * Actualiza el estado visual del botón de validación de WhatsApp
 */
const updateWhatsAppValidationButtons = (prospect) => {
    if (!elements.whatsappValidatedBtn) return;

    // Mostrar el estado actual si ya está validado
    if (prospect.whatsappValidated === true) {
        elements.whatsappValidatedBtn.innerHTML = '<i class="fas fa-check mr-1"></i> CON WHATSAPP';
        elements.whatsappValidatedBtn.className = 'px-3 py-1 text-xs font-medium rounded-md bg-green-600 text-white border border-green-600 transition-colors';
    } else if (prospect.whatsappValidated === false) {
        elements.whatsappValidatedBtn.innerHTML = '<i class="fas fa-times mr-1"></i> SIN WHATSAPP';
        elements.whatsappValidatedBtn.className = 'px-3 py-1 text-xs font-medium rounded-md bg-red-600 text-white border border-red-600 transition-colors';
    } else {
        // Estado no validado
        elements.whatsappValidatedBtn.innerHTML = '<i class="fas fa-search mr-1"></i> VERIFICAR NÚMERO';
        elements.whatsappValidatedBtn.className = 'px-3 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 transition-colors';
    }
};

/**
 * Genera checkboxes de materiales
 */
const populateMaterialsCheckboxes = () => {
    if (!elements.materialsCheckboxContainer) return;
    
    elements.materialsCheckboxContainer.innerHTML = '';
    MATERIALS.forEach((material, index) => {
        const checkboxId = `material-${index}`;
        const checkboxHTML = `
            <div class="flex items-center">
                <input id="${checkboxId}" type="checkbox" value="${material.url}" class="form-checkbox h-5 w-5 text-green-600" checked>
                <label for="${checkboxId}" class="ml-2 text-gray-700">${material.name}</label>
            </div>
        `;
        elements.materialsCheckboxContainer.insertAdjacentHTML('beforeend', checkboxHTML);
    });

    // Agregar event listeners para actualizar mensaje cuando cambien los checkboxes
    elements.materialsCheckboxContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // Buscar el prospecto actual usando el prospectId que se pasó a showWhatsAppModal
            const currentProspectId = window.currentProspectIdForWhatsApp;
            const prospect = allProspects.find(p => p.id === currentProspectId);
            if (prospect) {
                updateWhatsAppMessage(prospect);
            }
        });
    });
};

/**
 * Actualiza el mensaje en el textarea
 */
const updateWhatsAppMessage = (prospect) => {
    if (!prospect || !elements.whatsappModalMessage) return;
    
    const contactName = prospect.contactPerson || prospect.businessName || 'Estimado/a';
    
    let message = `¡Hola ${contactName}!\n\n`;
    message += `Como acordamos, te comparto los siguientes materiales de Pietrafina:\n\n`;
    
    // Obtener materiales seleccionados
    const selectedMaterials = [];
    if (elements.materialsCheckboxContainer) {
        const checkboxes = elements.materialsCheckboxContainer.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            const material = MATERIALS.find(m => m.url === checkbox.value);
            if (material) {
                selectedMaterials.push(material);
            }
        });
    }

    // Agregar materiales al mensaje
    if (selectedMaterials.length > 0) {
        selectedMaterials.forEach((material) => {
            // Formato con nombre en azul y sin mostrar la URL completa
            message += `🔹 *${material.name}*\n`;
            message += `${material.url}\n\n`;
        });
    }
    
    message += `Quedo atento a tus comentarios.\n\n`;
    message += `Saludos cordiales,\n`;
    message += `${currentUserName}\n`;
    message += `Pietra Fina`;
    
    elements.whatsappModalMessage.value = message;
};

/**
 * Envía el mensaje de WhatsApp usando la app nativa
 */
const sendWhatsAppMessage = (prospect) => {
    // Obtener el mensaje del textarea (permite ediciones del usuario)
    const message = elements.whatsappModalMessage?.value?.trim();
    
    if (!message) {
        showToast('El mensaje no puede estar vacío', 'error');
        return;
    }

    // Usar la nueva función de formateo que siempre agrega 521
    const cleanPhone = formatPhoneForWhatsApp(prospect.phone);
    
    if (!cleanPhone) {
        showToast('Número de teléfono inválido', 'error');
        return;
    }

    console.log('🚀 Iniciando envío de WhatsApp...');
    console.log('📱 Número final para WhatsApp:', cleanPhone);
    console.log('💬 Mensaje a enviar:', message);

    try {
        // MÉTODO SIMPLIFICADO Y COMPATIBLE CON MÓVIL
        // Usar el enlace estándar de WhatsApp Web que funciona en todos los dispositivos
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        
        console.log('📱 URL de WhatsApp generada:', whatsappUrl);
        
        // Abrir en nueva ventana/pestaña
        window.open(whatsappUrl, '_blank');
        
        // Cerrar el modal de WhatsApp
        closeWhatsAppModal();
        
        showToast('Abriendo WhatsApp...', 'success');
        
    } catch (error) {
        console.error('❌ Error al enviar mensaje por WhatsApp:', error);
        showToast('Error al generar el enlace de WhatsApp', 'error');
    }
};

/**
 * Muestra el modal de confirmación
 */
const showConfirmModal = (title, message, onConfirm, confirmButtonText = 'Confirmar', confirmButtonClass = 'btn-danger') => {
    if (elements.confirmModalTitle) elements.confirmModalTitle.textContent = title;
    if (elements.confirmModalMessage) elements.confirmModalMessage.textContent = message;
    
    if (elements.confirmActionBtn) {
        elements.confirmActionBtn.textContent = confirmButtonText;
        elements.confirmActionBtn.className = `btn ${confirmButtonClass}`;
        
        // Remover event listeners anteriores
        const newBtn = elements.confirmActionBtn.cloneNode(true);
        elements.confirmActionBtn.parentNode.replaceChild(newBtn, elements.confirmActionBtn);
        elements.confirmActionBtn = newBtn;
        
        // Agregar nuevo event listener
        elements.confirmActionBtn.addEventListener('click', () => {
            onConfirm();
            hideConfirmModal();
        });
    }
    
    if (elements.confirmModal) {
        // Asegurar que el modal aparezca por encima de todos los demás
        elements.confirmModal.style.zIndex = '9999';
        elements.confirmModal.classList.remove('hidden');
        
        // Agregar clase para animación de entrada
        elements.confirmModal.classList.add('modal-show');
    }
};

/**
 * Oculta el modal de confirmación
 */
const hideConfirmModal = () => {
    if (elements.confirmModal) {
        elements.confirmModal.classList.remove('modal-show');
        elements.confirmModal.classList.add('hidden');
        // Restaurar z-index por defecto
        elements.confirmModal.style.zIndex = '';
    }
};

/**
 * Inicializa los event listeners de los modales
 */
const initModalEventListeners = () => {
    // Cerrar modal de detalles
    if (elements.detailCloseBtn) {
        elements.detailCloseBtn.addEventListener('click', () => {
            if (elements.detailModal) elements.detailModal.classList.add('hidden');
        });
    }
    
    // Cerrar modal de confirmación
    if (elements.confirmCancelBtn) {
        elements.confirmCancelBtn.addEventListener('click', hideConfirmModal);
    }
    
    // Event listeners para el modal de confirmación de correo
    if (elements.emailConfirmCancelBtn) {
        elements.emailConfirmCancelBtn.addEventListener('click', hideEmailConfirmModal);
    }
    if (elements.emailConfirmActionBtn) {
        elements.emailConfirmActionBtn.addEventListener('click', () => {
            if (window.pendingEmailConfirmProspectId) {
                handleEmailConfirm(window.pendingEmailConfirmProspectId);
                window.pendingEmailConfirmProspectId = null;
            }
        });
    }
    
    // Cerrar modales al hacer clic fuera
    [elements.detailModal, elements.confirmModal, elements.whatsappModal, elements.emailConfirmModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    if (modal === elements.whatsappModal) {
                        closeWhatsAppModal();
                    } else {
                        modal.classList.add('hidden');
                    }
                }
            });
        }
    });
    
    // Cerrar modal de WhatsApp con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (elements.whatsappModal && !elements.whatsappModal.classList.contains('hidden')) {
                closeWhatsAppModal();
            }
        }
    });
    
    // Botones de validación automática de WhatsApp
    if (elements.validateAllWhatsappBtn) {
        elements.validateAllWhatsappBtn.addEventListener('click', () => {
            showConfirmModal(
                'Verificar WhatsApp',
                '¿Deseas verificar todos los números de WhatsApp de los prospectos? Esto:\n\n• Actualizará los datos desde la base de datos\n• Verificará cada número con el microservicio de WhatsApp\n• Actualizará el estado en tiempo real\n\n¿Continuar?',
                validateAllWhatsAppNumbers,
                'Iniciar Verificación',
                'btn-success'
            );
        });
    }
    
    // Botones de refresh de datos
    if (elements.refreshDataBtn) {
        elements.refreshDataBtn.addEventListener('click', () => {
            showConfirmModal(
                'Actualizar Datos',
                '¿Deseas actualizar todos los datos desde la base de datos? Esto refrescará la información de todos los prospectos.',
                refreshDataOnly,
                'Actualizar Datos',
                'btn-info'
            );
        });
    }
    

};

const addHoverEffects = () => {
    // Efectos de hover para tarjetas
            // ...eliminada versión duplicada...
        document.querySelectorAll('.prospect-card').forEach(card => {
            if (!card.dataset.hoverListener) {
                card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                });
                
                card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                });
                card.dataset.hoverListener = 'true';
            }
    });
};

const addEntryAnimations = () => {
    // Animaciones de entrada para tarjetas
    document.querySelectorAll('.prospect-card').forEach((card, index) => {
        if (!card.classList.contains('animated')) {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                card.style.transition = 'all 0.3s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
                card.classList.add('animated');
            }, index * 50);
        }
    });
};

// --- Funciones del Calendario Semanal ---

/**
 * Inicializa el calendario semanal
 */
const initWeeklyCalendar = () => {
    if (!elements.weeklyCalendar) return;
    
    // Inicializar con la semana actual
    currentWeekStart = getStartOfWeek(new Date());
    selectedCalendarDate = new Date().toISOString().split('T')[0];
    
    // Renderizar calendario
    renderWeeklyCalendar();
    
    // Agregar event listeners
    if (elements.prevWeekBtn) {
        elements.prevWeekBtn.addEventListener('click', () => {
            currentWeekStart.setDate(currentWeekStart.getDate() - 7);
            renderWeeklyCalendar();
        });
    }
    
    if (elements.nextWeekBtn) {
        elements.nextWeekBtn.addEventListener('click', () => {
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
            renderWeeklyCalendar();
        });
    }
    
    if (elements.todayBtn) {
        elements.todayBtn.addEventListener('click', () => {
            currentWeekStart = getStartOfWeek(new Date());
            selectedCalendarDate = new Date().toISOString().split('T')[0];
            renderWeeklyCalendar();
            clearDateFilter();
        });
    }
    
    if (elements.clearFilterBtn) {
        elements.clearFilterBtn.addEventListener('click', clearDateFilter);
    }
};

/**
 * Renderiza el calendario semanal
 */
const renderWeeklyCalendar = () => {
    if (!elements.weeklyCalendar) return;
    
    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const today = new Date().toISOString().split('T')[0];
    
    // Actualizar display de la semana
    if (elements.currentWeekDisplay) {
        const endOfWeek = new Date(currentWeekStart);
        endOfWeek.setDate(currentWeekStart.getDate() + 6);
        elements.currentWeekDisplay.textContent = `${formatDate(currentWeekStart.toISOString().split('T')[0])} - ${formatDate(endOfWeek.toISOString().split('T')[0])}`;
    }
    
    // Limpiar calendario
    elements.weeklyCalendar.innerHTML = '';
    
    // Generar días de la semana
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(currentWeekStart);
        currentDate.setDate(currentWeekStart.getDate() + i);
        const dateString = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isToday = dateString === today;
        const isSelected = dateString === selectedCalendarDate;
        
        // Contar prospectos para este día
        const dayProspects = getProspectsForDate(dateString);
        const hasFollowups = dayProspects.length > 0;
        
        const dayElement = document.createElement('div');
        dayElement.className = `weekly-calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasFollowups ? 'has-followups' : ''} ${isWeekend ? 'weekend' : ''}`;
        dayElement.dataset.date = dateString;
        
        dayElement.innerHTML = `
            <div class="day-name">${weekDays[i]}</div>
            <div class="day-number">${currentDate.getDate()}</div>
            ${hasFollowups ? `<div class="followup-count">${dayProspects.length}</div>` : ''}
            ${hasFollowups ? '<div class="followup-indicator"></div>' : ''}
        `;
        
        // Event listener para seleccionar día
        dayElement.addEventListener('click', () => {
            selectCalendarDate(dateString);
        });
        
        elements.weeklyCalendar.appendChild(dayElement);
    }
    
    // Actualizar resumen de la semana
    updateWeekSummary();
};

/**
 * Obtiene los prospectos para una fecha específica
 */
const getProspectsForDate = (dateString) => {
    return allProspects.filter(prospect => {
        const effectiveDate = prospect.reagendadoPara || prospect.prospectingDueDate;
        return effectiveDate === dateString && prospect.status === 'Seguimiento agendado';
    });
};

/**
 * Selecciona una fecha en el calendario y filtra los prospectos
 */
const selectCalendarDate = (dateString) => {
    selectedCalendarDate = dateString;
    
    // Actualizar visual del calendario
    const dayElements = elements.weeklyCalendar.querySelectorAll('.weekly-calendar-day');
    dayElements.forEach(el => {
        el.classList.remove('selected');
        if (el.dataset.date === dateString) {
            el.classList.add('selected');
        }
    });
    
    // Filtrar prospectos
    filterProspectsByDate(dateString);
    
    // Mostrar indicador de filtro
    if (elements.filterIndicator) {
        elements.filterIndicator.classList.remove('hidden');
    }
    if (elements.clearFilterBtn) {
        elements.clearFilterBtn.classList.remove('hidden');
    }
};

/**
 * Filtra los prospectos por fecha seleccionada
 */
const filterProspectsByDate = (dateString) => {
    filteredProspects = allProspects.filter(prospect => {
        const effectiveDate = prospect.reagendadoPara || prospect.prospectingDueDate;
        return effectiveDate === dateString && prospect.status === 'Seguimiento agendado';
    });
    
    // Renderizar prospectos filtrados
    renderProspectorCards();
};

/**
 * Limpia el filtro de fecha
 */
const clearDateFilter = () => {
    selectedCalendarDate = null;
    filteredProspects = [];
    
    // Actualizar visual del calendario
    const dayElements = elements.weeklyCalendar.querySelectorAll('.weekly-calendar-day');
    dayElements.forEach(el => el.classList.remove('selected'));
    
    // Ocultar indicadores de filtro
    if (elements.filterIndicator) {
        elements.filterIndicator.classList.add('hidden');
    }
    if (elements.clearFilterBtn) {
        elements.clearFilterBtn.classList.add('hidden');
    }
    
    // Renderizar todos los prospectos
    renderProspectorCards();
};

/**
 * Actualiza el resumen de la semana
 */
const updateWeekSummary = () => {
    const today = new Date().toISOString().split('T')[0];
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    const weekEndString = weekEnd.toISOString().split('T')[0];
    
    // Total de seguimientos en la semana
    const totalFollowups = allProspects.filter(prospect => {
        const effectiveDate = prospect.reagendadoPara || prospect.prospectingDueDate;
        return effectiveDate >= currentWeekStart.toISOString().split('T')[0] && 
               effectiveDate <= weekEndString && 
               prospect.status === 'Seguimiento agendado';
    }).length;
    
    // Pendientes hoy
    const pendingToday = getProspectsForDate(today).length;
    
    // Completados en la semana (prospectos que cambiaron de estado)
    const completedWeek = allProspects.filter(prospect => {
        const effectiveDate = prospect.reagendadoPara || prospect.prospectingDueDate;
        return effectiveDate >= currentWeekStart.toISOString().split('T')[0] && 
               effectiveDate <= weekEndString && 
               prospect.status !== 'Seguimiento agendado' &&
               (prospect.status === 'Interesado' || prospect.status === 'Completado' || 
                prospect.status === 'Ya es nuestro cliente' || prospect.status === 'Convertido a cliente');
    }).length;
    
    // Actualizar elementos
    if (elements.totalFollowups) {
        elements.totalFollowups.textContent = totalFollowups;
    }
    if (elements.pendingToday) {
        elements.pendingToday.textContent = pendingToday;
    }
    if (elements.completedWeek) {
        elements.completedWeek.textContent = completedWeek;
    }
};

const renderProspectingCalendar = () => {
    console.log("Renderizando calendario de prospección");
    initWeeklyCalendar();
};

// --- Funciones del Formulario de Agregar Prospectos ---

/**
 * Inicializa el formulario de agregar prospectos con validaciones y event listeners
 */
const initAddProspectForm = () => {
    if (elements.addProspectForm) {
        elements.addProspectForm.addEventListener('submit', handleAddProspectSubmit);
    }
    
    // Event listener para mostrar/ocultar campo "Otro" en clasificación
    if (elements.classificationSelect) {
        elements.classificationSelect.addEventListener('change', (e) => {
            if (e.target.value === 'Otro') {
                elements.otherClassificationContainer.classList.remove('hidden');
                elements.otherClassificationInput.required = true;
            } else {
                elements.otherClassificationContainer.classList.add('hidden');
                elements.otherClassificationInput.required = false;
                elements.otherClassificationInput.value = '';
            }
        });
    }
};

/**
 * Maneja el envío del formulario de agregar prospecto
 */
const handleAddProspectSubmit = async (event) => {
    event.preventDefault();
    
    if (currentUserRole !== 'admin') {
        showToast('Solo los administradores pueden agregar prospectos', 'error');
        return;
    }

    const formData = new FormData(event.target);
    const prospectData = {
        businessName: formData.get('businessName').trim(),
        contactPerson: formData.get('contactPerson').trim(),
        email: formData.get('email').trim(),
        phone: formData.get('phone').trim(),
        classification: formData.get('classification'),
        observations: formData.get('observations').trim(),
        status: 'Pendiente de Correo',
        createdAt: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0]
    };

    // Validar campos requeridos
    if (!prospectData.businessName || !prospectData.email || !prospectData.phone) {
        showToast('Por favor completa todos los campos requeridos', 'error');
        return;
    }

    // Validar email
    if (!isValidEmail(prospectData.email)) {
        showToast('Por favor ingresa un email válido', 'error');
        return;
    }

    // Validar teléfono (básico)
    if (!prospectData.phone.match(/[\d\s\-\+\(\)]{8,}/)) {
        showToast('Por favor ingresa un número de teléfono válido', 'error');
        return;
    }

    // Manejo de clasificación "Otro"
    if (prospectData.classification === 'Otro') {
        const otherClassification = formData.get('otherClassification').trim();
        if (!otherClassification) {
            showToast('Por favor especifica la clasificación', 'error');
            return;
        }
        prospectData.classification = otherClassification;
    }

    const submitButton = event.submitter;
    const originalText = submitButton.innerHTML;
    showLoading(submitButton, 'Agregando...');

    try {
        // Agregar a Firestore
        await addDoc(collection(db, 'prospects'), prospectData);
        
        showToast('Prospecto agregado exitosamente', 'success');
        
        // Limpiar formulario
        event.target.reset();
        elements.otherClassificationContainer.classList.add('hidden');
        elements.otherClassificationInput.required = false;
        
    } catch (error) {
        console.error('Error al agregar prospecto:', error);
        showToast('Error al agregar prospecto: ' + error.message, 'error');
    } finally {
        hideLoading(submitButton, originalText);
    }
};

// Event listeners para filtros en la vista de administrador
if (elements.statusFilter) {
    elements.statusFilter.addEventListener('change', renderAdminCards);
}
if (elements.dateFilter) {
    elements.dateFilter.addEventListener('change', renderAdminCards);
}
if (elements.searchFilter) {
    elements.searchFilter.addEventListener('input', renderAdminCards);
}

// Event listeners para filtros en la vista de archivo
if (elements.archiveStatusFilter) {
    elements.archiveStatusFilter.addEventListener('change', renderArchiveCards);
}
if (elements.archiveSearchFilter) {
    elements.archiveSearchFilter.addEventListener('input', renderArchiveCards);
}

/**
 * Elimina un prospecto de forma permanente de Firestore.
 */
const deleteProspect = async (prospectId) => {
    if (currentUserRole !== 'admin') {
        showToast('Acceso denegado. Solo los administradores pueden eliminar prospectos.', 'error');
        return;
    }
    if (!currentUserId) {
        showToast('Usuario no autenticado. Por favor, intenta de nuevo', 'error');
        return;
    }
    try {
        console.log(`Eliminando prospecto ${prospectId} permanentemente.`);
        const prospectRef = doc(db, 'prospects', prospectId);
        await deleteDoc(prospectRef);
        showToast('Prospecto eliminado permanentemente.', 'success');
    } catch (e) {
        console.error("Error al eliminar prospecto:", e);
        showToast(`Error al eliminar prospecto: ${e.message}`, 'error');
    }
};

/**
 * Asigna un prospecto al usuario actual (prospector).
 */
const assignProspectToSelf = async (prospectId) => {
    if (!currentUserId) {
        showToast('Usuario no autenticado. Por favor, intenta de nuevo', 'error');
        return;
    }
    try {
        console.log(`Asignando prospecto ${prospectId} a ${currentUserName}.`);
        const prospectRef = doc(db, 'prospects', prospectId);

        const shouldPauseDeadline = (currentUserId === NICOLAS_UID || currentUserId === FRANCISCO_UID);

        const updateData = {
            assignedTo: currentUserId,
            assignedByName: currentUserName,
            lastUpdated: new Date().toISOString().split('T')[0],
            ...(shouldPauseDeadline && { prospectingDueDate: null, sentEmailDate: null, reagendadoPara: null })
        };

        await updateDoc(prospectRef, updateData);
        showToast(`Prospecto asignado a ${currentUserName}`, 'success');
    } catch (e) {
        console.error("Error al asignar prospecto:", e);
        showToast(`Error al asignar prospecto: ${e.message}`, 'error');
    }
};

/**
 * Reactiva un prospecto, moviéndolo de nuevo a "En Prospección".
 */
const reactivateProspect = async (prospectId) => {
    if (!currentUserId) {
        showToast('Usuario no autenticado. Por favor, intenta de nuevo', 'error');
        return;
    }
    try {
        console.log(`Reactivando prospecto ${prospectId}`);
        const prospectRef = doc(db, 'prospects', prospectId);
        const today = new Date();

        await updateDoc(prospectRef, {
            status: 'En Prospección',
            sentEmailDate: today.toISOString().split('T')[0],
            prospectingDueDate: null, // Ya no se establece fecha de vencimiento
            contactResult: null,
            assignedTo: null,
            assignedByName: null,
            adminFinalReviewNeeded: false,
            lastUpdated: new Date().toISOString().split('T')[0],
            reagendadoPara: null
        });
        showToast('Prospecto reactivado y puesto en prospección de nuevo', 'success');
    } catch (e) {
        console.error("Error al reactivar prospecto:", e);
        showToast(`Error al reactivar el prospecto: ${e.message}`, 'error');
    }
};



// Los event listeners de los botones principales ya están definidos arriba
// Solo se agregó checkAndExpireProspects() a la lógica existente 

document.addEventListener('DOMContentLoaded', () => {
    // Inicialización de listeners y modales
    initAddProspectForm();
    initModalEventListeners();
    initFollowUpEventListeners();
    // Puedes agregar aquí otras inicializaciones si agregas más módulos
});

/**
 * Inicializa los event listeners para el seguimiento y reagendamiento
 */
const initFollowUpEventListeners = () => {
    // Event listener para el botón de reagendar
    if (elements.rescheduleFollowUpBtn) {
        elements.rescheduleFollowUpBtn.addEventListener('click', () => {
            if (currentProspectIdForModal) {
                showRescheduleModal();
            }
        });
    }
    
    // Event listener para confirmar reagendamiento
    if (elements.rescheduleConfirmBtn) {
        elements.rescheduleConfirmBtn.addEventListener('click', async () => {
            await handleRescheduleConfirm();
        });
    }
    
    // Event listener para cancelar reagendamiento
    if (elements.rescheduleCancelBtn) {
        elements.rescheduleCancelBtn.addEventListener('click', () => {
            hideRescheduleModal();
        });
    }
    
    // Event listener para el botón de guardar seguimiento
    if (elements.saveFollowUpBtn) {
        elements.saveFollowUpBtn.addEventListener('click', async () => {
            await handleSaveFollowUp();
        });
    }
    
    // Event listener para el botón de enviar WhatsApp desde el modal de seguimiento
    if (elements.whatsappConfirmSendBtn) {
        elements.whatsappConfirmSendBtn.addEventListener('click', () => {
            if (currentProspectIdForModal) {
                const prospect = allProspects.find(p => p.id === currentProspectIdForModal);
                if (prospect) {
                    sendWhatsAppMessageFromFollowUp(prospect);
                }
            }
        });
    }
    
    // Event listener para cancelar WhatsApp desde el modal de seguimiento
    if (elements.whatsappCancelBtn) {
        elements.whatsappCancelBtn.addEventListener('click', () => {
            // Ocultar el área de mensaje de WhatsApp
            const whatsappMessageArea = document.getElementById('whatsappMessageArea');
            if (whatsappMessageArea) {
                whatsappMessageArea.classList.add('hidden');
            }
        });
    }
};

/**
 * Muestra el modal de reagendamiento con validaciones contextuales
 */
const showRescheduleModal = () => {
    if (!elements.rescheduleModal || !elements.rescheduleDateInput) {
        showToast('Error: Modal de reagendamiento no disponible', 'error');
        return;
    }
    
    // Obtener información del prospecto
    const prospect = allProspects.find(p => p.id === currentProspectIdForModal);
    if (!prospect) {
        showToast('Prospecto no encontrado', 'error');
        return;
    }
    
    // Validar contexto antes de mostrar el modal
    const validationResult = validateRescheduleContext(prospect);
    
    // Mostrar modal y limpiar input
    elements.rescheduleModal.classList.remove('hidden');
    elements.rescheduleDateInput.value = '';
    
    // Mostrar advertencias contextuales si las hay
    if (validationResult.warnings.length > 0) {
        showContextualWarning(validationResult, prospect);
    }
    
    // Inicializar Flatpickr
    if (typeof flatpickr !== 'undefined') {
        try {
            // Destruir instancia anterior
            if (elements.rescheduleDateInput._flatpickr) {
                elements.rescheduleDateInput._flatpickr.destroy();
            }
            
            flatpickr(elements.rescheduleDateInput, {
                dateFormat: 'Y-m-d',
                minDate: new Date(),
                locale: 'es',
                allowInput: false
            });
        } catch (error) {
            console.error('Error inicializando Flatpickr:', error);
        }
    }
};

/**
 * Oculta el modal de reagendamiento
 */
const hideRescheduleModal = () => {
    if (elements.rescheduleModal) {
        elements.rescheduleModal.classList.add('hidden');
    }
    // Limpiar input
    if (elements.rescheduleDateInput) {
        elements.rescheduleDateInput.value = '';
    }
    // Limpiar advertencias contextuales
    const warningContainer = document.getElementById('reschedule-warning-container');
    if (warningContainer) {
        warningContainer.style.display = 'none';
    }
};

/**
 * Actualiza un prospecto en el array local
 */
const updateProspectInLocalArray = (prospectId, updates) => {
    const index = allProspects.findIndex(p => p.id === prospectId);
    if (index !== -1) {
        allProspects[index] = { ...allProspects[index], ...updates };
        return true;
    }
    return false;
};

/**
 * Fuerza la actualización de la UI según el rol del usuario
 */
const forceUIUpdate = () => {
    if (currentUserRole === 'prospector' || currentUserRole === 'admin') {
        renderProspectorCards();
        renderProspectingCalendar();
    } else if (currentUserRole === 'admin') {
        renderAdminCards();
    }
    // Actualizar dashboard y resumen
    updateDashboard();
    updateProspectingResultsSummary();
};

/**
 * Valida el contexto antes de permitir reagendamiento
 */
const validateRescheduleContext = (prospect) => {
    const result = {
        isValid: true,
        message: '',
        warnings: []
    };
    
    // Verificar si hay seguimiento previo
    const hasFollowUp = prospect.followUpNotes && prospect.followUpNotes.length > 0;
    const hasInternalNotes = prospect.internalNotes && prospect.internalNotes.trim().length > 0;
    
    // Caso 1: Prospecto en 'En Prospección' sin contacto previo
    if (prospect.status === 'En Prospección' && !hasFollowUp && !hasInternalNotes) {
        result.isValid = false;
        result.message = '⚠️ Este prospecto no tiene contacto ni seguimiento previo. Se recomienda hacer contacto antes de reagendar.';
        result.warnings.push('sin_contacto_previo');
    }
    
    // Caso 2: Prospecto sin notas de seguimiento pero con status 'Interesado'
    if (prospect.status === 'Interesado' && !hasFollowUp) {
        result.warnings.push('sin_seguimiento_documentado');
        result.message = '⚠️ Este prospecto está marcado como "Interesado" pero no tiene seguimiento documentado.';
    }
    
    // Caso 3: Reagendamiento muy frecuente (más de 3 veces en 30 días)
    if (prospect.reagendadoPara) {
        const lastReschedule = new Date(prospect.reagendadoPara);
        const today = new Date();
        const daysSinceLastReschedule = Math.floor((today - lastReschedule) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastReschedule < 7) {
            result.warnings.push('reagendamiento_frecuente');
            if (!result.message) {
                result.message = '⚠️ Este prospecto fue reagendado recientemente.';
            }
        }
    }
    
    // Caso 4: Prospecto sin información de contacto
    if (!prospect.phone || prospect.phone.trim() === '') {
        result.warnings.push('sin_telefono');
        if (!result.message) {
            result.message = '⚠️ Este prospecto no tiene número de teléfono registrado.';
        }
    }
    
    return result;
};

/**
 * Muestra advertencias contextuales en el modal de reagendamiento
 */
const showContextualWarning = (validationResult, prospect) => {
    // Buscar o crear el contenedor de advertencias
    let warningContainer = document.getElementById('reschedule-warning-container');
    if (!warningContainer) {
        warningContainer = document.createElement('div');
        warningContainer.id = 'reschedule-warning-container';
        warningContainer.className = 'mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg';
        
        // Insertar antes del input de fecha
        const dateInputContainer = elements.rescheduleDateInput?.parentElement;
        if (dateInputContainer) {
            dateInputContainer.parentElement.insertBefore(warningContainer, dateInputContainer);
        }
    }
    
    // Generar mensaje de advertencia
    let warningHTML = '<div class="flex items-start space-x-2">';
    warningHTML += '<i data-lucide="alert-triangle" class="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"></i>';
    warningHTML += '<div class="text-sm text-yellow-800">';
    
    if (validationResult.warnings.includes('sin_contacto_previo')) {
        warningHTML += '<p class="font-medium mb-1">⚠️ Sin contacto previo</p>';
        warningHTML += '<p class="mb-2">Este prospecto no tiene contacto ni seguimiento documentado. Se recomienda hacer contacto antes de reagendar.</p>';
    }
    
    if (validationResult.warnings.includes('sin_seguimiento_documentado')) {
        warningHTML += '<p class="font-medium mb-1">⚠️ Sin seguimiento documentado</p>';
        warningHTML += '<p class="mb-2">El prospecto está marcado como "Interesado" pero no tiene seguimiento registrado.</p>';
    }
    
    if (validationResult.warnings.includes('reagendamiento_frecuente')) {
        warningHTML += '<p class="font-medium mb-1">⚠️ Reagendamiento frecuente</p>';
        warningHTML += '<p class="mb-2">Este prospecto fue reagendado recientemente.</p>';
    }
    
    if (validationResult.warnings.includes('sin_telefono')) {
        warningHTML += '<p class="font-medium mb-1">⚠️ Sin información de contacto</p>';
        warningHTML += '<p class="mb-2">El prospecto no tiene número de teléfono registrado.</p>';
    }
    
    warningHTML += '</div></div>';
    
    warningContainer.innerHTML = warningHTML;
    warningContainer.style.display = 'block';
    
    // Inicializar iconos de Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Aplicar optimizaciones específicas para móviles
    applyMobileOptimizations();
};

/**
 * Aplica optimizaciones específicas para dispositivos móviles
 */
const applyMobileOptimizations = () => {
    const isMobile = window.innerWidth <= 768;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isMobile || isTouchDevice) {
        // Optimizar scroll en móviles
        const container = document.getElementById('status-flow-container');
        if (container) {
            container.style.webkitOverflowScrolling = 'touch';
            container.style.overflowX = 'hidden';
        }
        
        // Reducir animaciones en dispositivos de gama baja
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
            document.documentElement.style.setProperty('--animation-duration', '0.2s');
        }
    }
    
    // Listener para cambio de orientación
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            // Recrear el flujo visual después del cambio de orientación
            createStatusFlowVisualization();
        }, 100);
    });
    
    // Listener para cambio de tamaño de ventana
    window.addEventListener('resize', () => {
        let resizeTimeout;
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Recrear el flujo visual después del resize
            createStatusFlowVisualization();
        }, 250);
    });
};

/**
 * Muestra un modal de advertencia específico para reagendamiento
 */
const showRescheduleWarningModal = (message) => {
    return new Promise((resolve) => {
        // Crear modal temporal
        const modalHTML = `
            <div id="reschedule-warning-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-modalSlideIn">
                    <div class="p-6">
                        <div class="flex items-center mb-4">
                            <div class="flex-shrink-0">
                                <i data-lucide="alert-triangle" class="w-8 h-8 text-yellow-500"></i>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-lg font-medium text-gray-900">Confirmar Reagendamiento</h3>
                            </div>
                        </div>
                        <div class="mb-6">
                            <p class="text-sm text-gray-600 whitespace-pre-line">${message}</p>
                            <p class="text-sm text-gray-600 mt-3 font-medium">¿Deseas continuar con el reagendamiento?</p>
                        </div>
                        <div class="flex justify-end space-x-3">
                            <button id="reschedule-warning-cancel" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                                Cancelar
                            </button>
                            <button id="reschedule-warning-continue" class="px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">
                                Continuar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Inicializar iconos
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Event listeners
        const modal = document.getElementById('reschedule-warning-modal');
        const cancelBtn = document.getElementById('reschedule-warning-cancel');
        const continueBtn = document.getElementById('reschedule-warning-continue');
        
        const closeModal = () => {
            modal.remove();
        };
        
        cancelBtn.addEventListener('click', () => {
            resolve(false);
            closeModal();
        });
        
        continueBtn.addEventListener('click', () => {
            resolve(true);
            closeModal();
        });
        
        // Cerrar al hacer clic fuera del modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                resolve(false);
                closeModal();
            }
        });
        
        // Cerrar con Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                resolve(false);
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
};

/**
 * Calcula estadísticas de reagendamiento
 */
const calculateRescheduleStatistics = () => {
    const prospectsWithReschedule = allProspects.filter(p => p.reagendadoPara);
    const prospectsWithoutFollowUp = prospectsWithReschedule.filter(p => 
        !p.followUpNotes || p.followUpNotes.length === 0
    );
    
    return {
        totalRescheduled: prospectsWithReschedule.length,
        withoutFollowUp: prospectsWithoutFollowUp.length,
        withFollowUp: prospectsWithReschedule.length - prospectsWithoutFollowUp.length,
        percentageWithoutFollowUp: prospectsWithReschedule.length > 0 
            ? ((prospectsWithoutFollowUp.length / prospectsWithReschedule.length) * 100).toFixed(1)
            : 0
    };
};

/**
 * Actualiza las estadísticas de reagendamiento en el dashboard
 */
const updateRescheduleStatistics = (stats) => {
    // Buscar elementos para mostrar estadísticas (si existen)
    const rescheduleStatsContainer = document.getElementById('reschedule-stats-container');
    if (rescheduleStatsContainer) {
        rescheduleStatsContainer.innerHTML = `
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="bg-blue-50 p-3 rounded-lg">
                    <div class="text-sm text-blue-600 font-medium">Total Reagendados</div>
                    <div class="text-2xl font-bold text-blue-800">${stats.totalRescheduled}</div>
                </div>
                <div class="bg-yellow-50 p-3 rounded-lg">
                    <div class="text-sm text-yellow-600 font-medium">Sin Seguimiento</div>
                    <div class="text-2xl font-bold text-yellow-800">${stats.withoutFollowUp}</div>
                </div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
                <div class="text-sm text-gray-600">Prospectos reagendados sin seguimiento previo: ${stats.percentageWithoutFollowUp}%</div>
            </div>
        `;
    }
};

/**
 * Maneja la confirmación del reagendamiento - VERSIÓN SIMPLIFICADA
 */
const handleRescheduleConfirm = async () => {
    // Validaciones básicas
    if (!currentProspectIdForModal) {
        showToast('No hay prospecto seleccionado', 'error');
        return;
    }
    
    const selectedDate = elements.rescheduleDateInput?.value?.trim();
    if (!selectedDate) {
        showToast('Por favor selecciona una fecha', 'error');
        return;
    }
    
    // Obtener el prospecto actual
    const prospect = allProspects.find(p => p.id === currentProspectIdForModal);
    if (!prospect) {
        showToast('Prospecto no encontrado', 'error');
        return;
    }
    
    // VALIDACIONES DE CONTEXTO
    const validationResult = validateRescheduleContext(prospect);
    if (!validationResult.isValid) {
        // Mostrar advertencia y preguntar si continuar
        const shouldContinue = await showRescheduleWarningModal(validationResult.message);
        if (!shouldContinue) {
            return;
        }
    }
    
    try {
        // 1. ACTUALIZAR EN FIRESTORE
        const prospectRef = doc(db, 'prospects', currentProspectIdForModal);
        const updateData = {
            reagendadoPara: selectedDate,
            status: 'Seguimiento agendado',
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        
        // Si no hay seguimiento previo, crear uno automáticamente
        if (!prospect.followUpNotes || prospect.followUpNotes.length === 0) {
            const autoNote = {
                date: new Date().toISOString().split('T')[0],
                type: 'reagendamiento_directo',
                notes: `Reagendamiento directo sin contacto previo para ${selectedDate}`,
                user: currentUserName || 'Sistema'
            };
            updateData.followUpNotes = [autoNote];
        }
        
        await updateDoc(prospectRef, updateData);
        
        // 2. ACTUALIZAR ARRAY LOCAL INMEDIATAMENTE
        updateProspectInLocalArray(currentProspectIdForModal, updateData);
        
        // 3. CERRAR MODALES
        hideRescheduleModal();
        if (elements.detailModal) {
            elements.detailModal.classList.add('hidden');
        }
        
        // 4. ACTUALIZAR UI
        forceUIUpdate();
        
        // 5. MOSTRAR CONFIRMACIÓN
        showToast('Seguimiento reagendado exitosamente', 'success');
        
    } catch (error) {
        console.error('Error al reagendar:', error);
        showToast('Error al reagendar: ' + error.message, 'error');
    }
};

/**
 * Envía mensaje de WhatsApp desde el modal de seguimiento
 */
const sendWhatsAppMessageFromFollowUp = (prospect) => {
    // Obtener el mensaje del textarea
    const message = elements.whatsappMessage?.value?.trim();
    
    if (!message) {
        showToast('El mensaje no puede estar vacío', 'error');
        return;
    }

    // Usar la nueva función de formateo que siempre agrega 521
    const cleanPhone = formatPhoneForWhatsApp(prospect.phone);
    
    if (!cleanPhone) {
        showToast('Número de teléfono inválido', 'error');
        return;
    }

    console.log('🚀 Iniciando envío de WhatsApp desde seguimiento...');
    console.log('📱 Número final para WhatsApp:', cleanPhone);
    console.log('💬 Mensaje a enviar:', message);

    try {
        // MÉTODO SIMPLIFICADO Y COMPATIBLE CON MÓVIL
        // Usar el enlace estándar de WhatsApp Web que funciona en todos los dispositivos
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        
        console.log('📱 URL de WhatsApp generada:', whatsappUrl);
        
        // Abrir en nueva ventana/pestaña
        window.open(whatsappUrl, '_blank');
        
        // Ocultar el área de mensaje de WhatsApp
        const whatsappMessageArea = document.getElementById('whatsappMessageArea');
        if (whatsappMessageArea) {
            whatsappMessageArea.classList.add('hidden');
        }
        
        showToast('Abriendo WhatsApp...', 'success');
        
    } catch (error) {
        console.error('❌ Error al enviar mensaje por WhatsApp:', error);
        showToast('Error al generar el enlace de WhatsApp', 'error');
    }
};

/**
 * Muestra el modal de edición de prospecto y llena los campos
 */
const showEditProspectModal = (prospectId) => {
    const prospect = allProspects.find(p => p.id === prospectId);
    if (!prospect) {
        showToast('Prospecto no encontrado', 'error');
        return;
    }
    currentProspectIdForModal = prospectId;
    if (elements.editBusinessName) elements.editBusinessName.value = prospect.businessName || '';
    if (elements.editContactPerson) elements.editContactPerson.value = prospect.contactPerson || '';
    if (elements.editEmail) elements.editEmail.value = prospect.email || '';
    if (elements.editPhone) elements.editPhone.value = prospect.phone || '';
    if (elements.editClassification) elements.editClassification.value = prospect.classification || '';
    if (elements.editOtherClassification) elements.editOtherClassification.value = '';
    if (elements.editObservations) elements.editObservations.value = prospect.observations || '';
    if (elements.editProspectModal) elements.editProspectModal.classList.remove('hidden');
};

/**
 * Maneja el guardado de la edición de prospecto
 */
const handleEditProspectSave = async (event) => {
    event.preventDefault();
    if (!currentProspectIdForModal) {
        showToast('No hay prospecto seleccionado', 'error');
        return;
    }
    const formData = new FormData(event.target);
    const updateData = {
        businessName: formData.get('businessName').trim(),
        contactPerson: formData.get('contactPerson').trim(),
        email: formData.get('email').trim(),
        phone: formData.get('phone').trim(),
        classification: formData.get('classification'),
        observations: formData.get('observations').trim(),
        lastUpdated: new Date().toISOString().split('T')[0]
    };
    // Validar email
    if (!isValidEmail(updateData.email)) {
        showToast('Por favor ingresa un email válido', 'error');
        return;
    }
    // Validar teléfono
    if (!updateData.phone.match(/[\d\s\-\+\(\)]{8,}/)) {
        showToast('Por favor ingresa un número de teléfono válido', 'error');
        return;
    }
    // Manejo de clasificación "Otro"
    if (updateData.classification === 'Otro') {
        const otherClassification = formData.get('otherClassification').trim();
        if (!otherClassification) {
            showToast('Por favor especifica la clasificación', 'error');
            return;
        }
        updateData.classification = otherClassification;
    }
    const saveButton = event.submitter;
    const originalText = saveButton.innerHTML;
    showLoading(saveButton, 'Guardando...');
    try {
        const prospectRef = doc(db, 'prospects', currentProspectIdForModal);
        await updateDoc(prospectRef, updateData);
        showToast('Prospecto actualizado exitosamente', 'success');
        if (elements.editProspectModal) elements.editProspectModal.classList.add('hidden');
    } catch (error) {
        console.error('Error al actualizar prospecto:', error);
        showToast('Error al actualizar prospecto: ' + error.message, 'error');
    } finally {
        hideLoading(saveButton, originalText);
    }
};

// Listeners para el modal de edición
if (elements.editProspectForm) {
    elements.editProspectForm.addEventListener('submit', handleEditProspectSave);
}
if (elements.editProspectCloseBtn) {
    elements.editProspectCloseBtn.addEventListener('click', () => {
        if (elements.editProspectModal) elements.editProspectModal.classList.add('hidden');
    });
}
if (elements.editProspectCancelBtn) {
    elements.editProspectCancelBtn.addEventListener('click', () => {
        if (elements.editProspectModal) elements.editProspectModal.classList.add('hidden');
    });
}
// Mostrar modal de edición desde el área de acciones
if (elements.editProspectBtn) {
    elements.editProspectBtn.addEventListener('click', () => {
        if (currentProspectIdForModal) showEditProspectModal(currentProspectIdForModal);
    });
} 

/**
 * Muestra el modal de confirmación de correo
 */
const showEmailConfirmModal = (prospect) => {
    if (elements.emailConfirmModal && elements.emailConfirmBusinessName && elements.emailConfirmEmail && elements.emailConfirmContact) {
        elements.emailConfirmBusinessName.textContent = prospect.businessName || 'N/A';
        elements.emailConfirmEmail.textContent = prospect.email || 'N/A';
        elements.emailConfirmContact.textContent = prospect.contactPerson || 'N/A';
        elements.emailConfirmModal.classList.remove('hidden');
    }
};

/**
 * Oculta el modal de confirmación de correo
 */
const hideEmailConfirmModal = () => {
    if (elements.emailConfirmModal) {
        elements.emailConfirmModal.classList.add('hidden');
    }
};

/**
 * Maneja la confirmación del envío de correo
 */
const handleEmailConfirm = async (prospectId) => {
    try {
        const prospectRef = doc(db, 'prospects', prospectId);
        const currentDate = new Date().toISOString().split('T')[0];
        
        // Actualizar el prospecto: cambiar estado y agregar fecha de envío de correo
        await updateDoc(prospectRef, {
            status: 'En Prospección',
            sentEmailDate: currentDate,
            lastUpdated: currentDate
        });
        
        showToast('Correo confirmado. Prospecto movido a prospección.', 'success');
        hideEmailConfirmModal();
        
        // Recargar los datos
        await loadProspects();
        
    } catch (error) {
        console.error('Error al confirmar correo:', error);
        showToast('Error al confirmar correo: ' + error.message, 'error');
    }
};

/**
 * Crea y muestra el flujo visual de estatus como línea de tiempo dinámica
 */
const createStatusFlowVisualization = () => {
    const container = document.getElementById('status-flow-container');
    if (!container) return;

    // Ordenar estatus por el campo 'order'
    const sortedStatuses = Object.entries(STATUS_FLOW)
        .sort(([,a], [,b]) => a.order - b.order);

    let html = `
        <div class="material-flow-container">
            <div class="material-flow-header">
                <div class="material-header-content">
                    <div class="material-header-icon">
                        <i data-lucide="git-branch"></i>
                    </div>
                    <div class="material-header-text">
                        <h3 class="material-title">Flujo de Prospección CRM</h3>
                        <p class="material-subtitle">Proceso de gestión de prospectos y estados</p>
                    </div>
                </div>
            </div>
            <div class="material-flow-content">
    `;

    // Crear tarjetas Material Design
    sortedStatuses.forEach(([status, info], index) => {
        const isLast = index === sortedStatuses.length - 1;
        const isFirst = index === 0;
        const isActive = info.actions.length > 0;
        
        html += `
            <div class="material-card ${isFirst ? 'material-start' : ''} ${isLast ? 'material-end' : ''} ${isActive ? 'material-active' : 'material-inactive'}" data-status="${status}" style="--status-color: ${info.color}; --status-color-dark: ${getDarkerColor(info.color)}">
                <div class="material-card-header">
                    <div class="material-card-icon">
                        <i data-lucide="${getStatusIcon(status)}"></i>
                    </div>
                    <div class="material-card-title">${info.name}</div>
                    <div class="material-card-badge">${index + 1}</div>
                </div>
                <div class="material-card-body">
                    <div class="material-card-description">
                        ${info.description}
                    </div>
                    ${info.nextStatuses.length > 0 ? `
                        <div class="material-card-actions">
                            <div class="material-actions-header">
                                <span class="material-actions-title">Transiciones disponibles</span>
                            </div>
                            <div class="material-actions-list">
                                ${info.nextStatuses.map(nextStatus => `
                                    <div class="material-action-item">
                                        <div class="material-action-icon">
                                            <img src="assets/images/logo pequeño.png" alt="Logo" class="transition-logo">
                                        </div>
                                        <span class="material-action-text">${nextStatus}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : `
                        <div class="material-card-actions">
                            <div class="material-actions-header">
                                <span class="material-actions-title">Estado final</span>
                            </div>
                            <div class="material-final-state">
                                <i data-lucide="check-circle"></i>
                                <span>Proceso completado</span>
                            </div>
                        </div>
                    `}
                </div>
                ${!isLast ? '<div class="material-card-connector"></div>' : ''}
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    container.innerHTML = html;
    
    // Agregar estilos CSS Material Design
    if (!document.getElementById('material-flow-styles')) {
        const style = document.createElement('style');
        style.id = 'material-flow-styles';
        style.textContent = `
            .material-flow-container {
                background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
                border-radius: 24px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0,0,0,0.07), 0 12px 24px rgba(0,0,0,0.12);
                border: 1px solid rgba(220, 38, 38, 0.1);
            }
            
            .material-flow-header {
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);
                padding: 2.5rem 2rem;
                color: white;
                position: relative;
                overflow: hidden;
            }
            
            .material-flow-header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
                animation: shimmer 3s ease-in-out infinite;
            }
            
            .material-header-content {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .material-header-icon {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%);
                width: 64px;
                height: 64px;
                border-radius: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }
            
            .material-header-icon i {
                width: 28px;
                height: 28px;
                color: white;
            }
            
            .material-header-text {
                flex: 1;
            }
            
            .material-title {
                font-size: 1.75rem;
                font-weight: 700;
                margin: 0 0 0.5rem 0;
                letter-spacing: -0.025em;
            }
            
            .material-subtitle {
                font-size: 1rem;
                opacity: 0.9;
                margin: 0;
                font-weight: 400;
            }
            
            .material-flow-content {
                padding: 2rem;
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }
            
            .material-card {
                background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.12);
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                border: 1px solid rgba(0, 0, 0, 0.05);
            }
            
            .material-card:hover {
                transform: translateY(-8px) scale(1.02);
                box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 16px 48px rgba(0,0,0,0.16);
                border-color: rgba(220, 38, 38, 0.2);
            }
            
            .material-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #dc2626, #b91c1c, #991b1b);
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .material-card:hover::before {
                opacity: 1;
            }
            
            .material-card-header {
                padding: 2rem 1.5rem;
                color: white;
                display: flex;
                align-items: center;
                gap: 1.25rem;
                position: relative;
                background: linear-gradient(135deg, var(--status-color, #dc2626) 0%, var(--status-color-dark, #b91c1c) 100%);
            }
            
            .material-card-icon {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%);
                width: 56px;
                height: 56px;
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.25);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                transition: all 0.3s ease;
            }
            
            .material-card:hover .material-card-icon {
                transform: scale(1.1) rotate(5deg);
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
            }
            
            .material-card-icon i {
                width: 24px;
                height: 24px;
                color: white;
            }
            
            .material-card-title {
                flex: 1;
                font-size: 1.25rem;
                font-weight: 600;
                letter-spacing: -0.025em;
            }
            
            .material-card-badge {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 100%);
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1rem;
                font-weight: 800;
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                transition: all 0.3s ease;
            }
            
            .material-card:hover .material-card-badge {
                transform: scale(1.15);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
            }
            
            .material-card-body {
                padding: 1.5rem;
            }
            
            .material-card-description {
                color: #374151;
                font-size: 0.95rem;
                line-height: 1.6;
                margin-bottom: 1.5rem;
                font-weight: 400;
            }
            
            .material-card-actions {
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                border-radius: 16px;
                padding: 1.5rem;
                border: 1px solid rgba(226, 232, 240, 0.8);
                box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
                position: relative;
                overflow: hidden;
            }
            
            .material-card-actions::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: linear-gradient(90deg, #dc2626, #b91c1c, #991b1b);
                opacity: 0.3;
            }
            
            .material-actions-header {
                margin-bottom: 1rem;
            }
            
            .material-actions-title {
                font-size: 0.875rem;
                font-weight: 600;
                color: #475569;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            
            .material-actions-list {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            
            .material-action-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 1rem;
                background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
                border-radius: 12px;
                border: 1px solid rgba(226, 232, 240, 0.8);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                position: relative;
                overflow: hidden;
            }
            
            .material-action-item::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(220, 38, 38, 0.1), transparent);
                transition: left 0.5s ease;
            }
            
            .material-action-item:hover {
                background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
                border-color: #dc2626;
                transform: translateX(8px) scale(1.02);
                box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
            }
            
            .material-action-item:hover .material-action-icon {
                animation: logoBounce 0.6s ease-in-out;
            }
            
            .material-action-item:hover::before {
                left: 100%;
            }
            
            .material-action-icon {
                color: #dc2626;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .material-action-icon i {
                width: 16px;
                height: 16px;
            }
            
            .transition-logo {
                width: 20px;
                height: 20px;
                object-fit: contain;
                filter: brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%);
                transition: all 0.3s ease;
            }
            
            .material-action-item:hover .transition-logo {
                transform: scale(1.2) rotate(5deg);
                filter: brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(120%) contrast(97%);
            }
            
            .material-action-text {
                font-size: 0.875rem;
                font-weight: 500;
                color: #374151;
            }
            
            .material-final-state {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                color: #059669;
                font-weight: 500;
            }
            
            .material-final-state i {
                width: 20px;
                height: 20px;
            }
            
            .material-card-connector {
                position: absolute;
                bottom: -2rem;
                left: 50%;
                transform: translateX(-50%);
                width: 3px;
                height: 2rem;
                background: linear-gradient(180deg, #dc2626, #b91c1c, #991b1b, #e5e7eb);
                z-index: 1;
                border-radius: 2px;
                box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
            }
            
            .material-card-connector::after {
                content: '';
                position: absolute;
                bottom: -6px;
                left: -6px;
                width: 0;
                height: 0;
                border-left: 7px solid transparent;
                border-right: 7px solid transparent;
                border-top: 12px solid #e5e7eb;
                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
            }
            
            .material-start .material-card-header {
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);
            }
            
            .material-end .material-card-header {
                background: linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%);
            }
            
            .material-active {
                border-left: 4px solid #dc2626;
                box-shadow: inset 4px 0 0 #dc2626, 0 2px 8px rgba(220, 38, 38, 0.1);
            }
            
            .material-inactive {
                border-left: 4px solid #d1d5db;
                opacity: 0.85;
                filter: grayscale(0.3);
            }
            
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            
            @keyframes logoBounce {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.3) rotate(10deg); }
            }
            
            /* Mejoras para dispositivos táctiles */
            @media (hover: none) and (pointer: coarse) {
                .material-card:hover {
                    transform: none;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.12);
                }
                
                .material-card:active {
                    transform: translateY(-2px) scale(1.01);
                    box-shadow: 0 4px 16px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.16);
                }
                
                .material-action-item:hover {
                    transform: none;
                    background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
                }
                
                .material-action-item:active {
                    transform: translateX(4px) scale(1.01);
                    background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
                    border-color: #dc2626;
                }
                
                .material-card-icon:hover {
                    transform: none;
                }
                
                .material-card-icon:active {
                    transform: scale(1.05) rotate(2deg);
                }
                
                .material-card-badge:hover {
                    transform: none;
                }
                
                .material-card-badge:active {
                    transform: scale(1.1);
                }
            }
            
            /* Optimizaciones para pantallas pequeñas */
            @media (max-width: 480px) {
                .material-card {
                    min-height: auto;
                }
                
                .material-card-description {
                    line-height: 1.4;
                }
                
                .material-action-item {
                    min-height: 44px; /* Tamaño mínimo para toque */
                }
                
                .material-action-icon {
                    min-width: 20px;
                    min-height: 20px;
                }
            }
            
            /* Estilos para el modal de confirmación */
            .confirm-modal {
                z-index: 9999 !important;
                background-color: rgba(0, 0, 0, 0.8);
            }
            
            .confirm-modal .modal-content {
                animation: modalSlideIn 0.3s ease-out;
                max-width: 90vw;
                margin: 2rem auto;
            }
            
            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-50px) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            .modal-show {
                animation: modalFadeIn 0.2s ease-out;
            }
            
            @keyframes modalFadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
            
            /* Responsive Design - Mobile First */
            @media (max-width: 1024px) {
                .material-flow-container {
                    margin: 0 -0.5rem;
                    border-radius: 16px;
                }
                
                .material-flow-header {
                    padding: 1.5rem 1rem;
                }
                
                .material-header-content {
                    flex-direction: column;
                    text-align: center;
                    gap: 0.75rem;
                }
                
                .material-header-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 16px;
                }
                
                .material-header-icon i {
                    width: 20px;
                    height: 20px;
                }
                
                .material-title {
                    font-size: 1.25rem;
                }
                
                .material-subtitle {
                    font-size: 0.875rem;
                }
                
                .material-flow-content {
                    padding: 1rem 0.75rem;
                    gap: 1rem;
                }
                
                .material-card {
                    border-radius: 16px;
                    margin: 0 0.5rem;
                }
                
                .material-card-header {
                    padding: 1.25rem 1rem;
                    gap: 0.75rem;
                }
                
                .material-card-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                }
                
                .material-card-icon i {
                    width: 20px;
                    height: 20px;
                }
                
                .material-card-title {
                    font-size: 1rem;
                }
                
                .material-card-badge {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    font-size: 0.875rem;
                }
                
                .material-card-body {
                    padding: 1rem;
                }
                
                .material-card-description {
                    font-size: 0.875rem;
                    margin-bottom: 1rem;
                }
                
                .material-card-actions {
                    padding: 1rem;
                    border-radius: 12px;
                }
                
                .material-actions-title {
                    font-size: 0.75rem;
                }
                
                .material-actions-list {
                    gap: 0.5rem;
                }
                
                .material-action-item {
                    padding: 0.75rem;
                    gap: 0.5rem;
                }
                
                .material-action-text {
                    font-size: 0.75rem;
                }
                
                .transition-logo {
                    width: 16px;
                    height: 16px;
                }
                
                .material-card-connector {
                    display: none;
                }
            }
            
            @media (max-width: 640px) {
                .material-flow-container {
                    margin: 0 -0.25rem;
                    border-radius: 12px;
                }
                
                .material-flow-header {
                    padding: 1rem 0.75rem;
                }
                
                .material-header-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                }
                
                .material-header-icon i {
                    width: 18px;
                    height: 18px;
                }
                
                .material-title {
                    font-size: 1.125rem;
                }
                
                .material-subtitle {
                    font-size: 0.8rem;
                }
                
                .material-flow-content {
                    padding: 0.75rem 0.5rem;
                    gap: 0.75rem;
                }
                
                .material-card {
                    border-radius: 12px;
                    margin: 0 0.25rem;
                }
                
                .material-card-header {
                    padding: 1rem 0.75rem;
                    gap: 0.5rem;
                }
                
                .material-card-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                }
                
                .material-card-icon i {
                    width: 18px;
                    height: 18px;
                }
                
                .material-card-title {
                    font-size: 0.9rem;
                }
                
                .material-card-badge {
                    width: 28px;
                    height: 28px;
                    border-radius: 6px;
                    font-size: 0.75rem;
                }
                
                .material-card-body {
                    padding: 0.75rem;
                }
                
                .material-card-description {
                    font-size: 0.8rem;
                    margin-bottom: 0.75rem;
                }
                
                .material-card-actions {
                    padding: 0.75rem;
                    border-radius: 10px;
                }
                
                .material-actions-title {
                    font-size: 0.7rem;
                }
                
                .material-action-item {
                    padding: 0.5rem;
                    gap: 0.4rem;
                }
                
                .material-action-text {
                    font-size: 0.7rem;
                }
                
                .transition-logo {
                    width: 14px;
                    height: 14px;
                }
            }
            
            @media (max-width: 480px) {
                .material-flow-container {
                    margin: 0;
                    border-radius: 8px;
                }
                
                .material-flow-header {
                    padding: 0.75rem 0.5rem;
                }
                
                .material-header-content {
                    gap: 0.5rem;
                }
                
                .material-header-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                }
                
                .material-header-icon i {
                    width: 16px;
                    height: 16px;
                }
                
                .material-title {
                    font-size: 1rem;
                }
                
                .material-subtitle {
                    font-size: 0.75rem;
                }
                
                .material-flow-content {
                    padding: 0.5rem 0.25rem;
                    gap: 0.5rem;
                }
                
                .material-card {
                    border-radius: 8px;
                    margin: 0;
                }
                
                .material-card-header {
                    padding: 0.75rem 0.5rem;
                    gap: 0.4rem;
                }
                
                .material-card-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                }
                
                .material-card-icon i {
                    width: 16px;
                    height: 16px;
                }
                
                .material-card-title {
                    font-size: 0.85rem;
                }
                
                .material-card-badge {
                    width: 24px;
                    height: 24px;
                    border-radius: 4px;
                    font-size: 0.7rem;
                }
                
                .material-card-body {
                    padding: 0.5rem;
                }
                
                .material-card-description {
                    font-size: 0.75rem;
                    margin-bottom: 0.5rem;
                }
                
                .material-card-actions {
                    padding: 0.5rem;
                    border-radius: 8px;
                }
                
                .material-actions-title {
                    font-size: 0.65rem;
                }
                
                .material-actions-list {
                    gap: 0.3rem;
                }
                
                .material-action-item {
                    padding: 0.4rem;
                    gap: 0.3rem;
                }
                
                .material-action-text {
                    font-size: 0.65rem;
                }
                
                .transition-logo {
                    width: 12px;
                    height: 12px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Inicializar iconos de Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

/**
 * Obtiene el icono apropiado para cada estatus
 */
const getStatusIcon = (status) => {
    const iconMap = {
        'Pendiente de Correo': 'mail',
        'En Prospección': 'users',
        'Interesado': 'star',
        'Seguimiento agendado': 'calendar',
        'No contesta': 'phone-off',
        'Rechazado': 'x-circle',
        'Convertido a cliente': 'check-circle',
        'Ya es nuestro cliente': 'award'
    };
    return iconMap[status] || 'circle';
};

/**
 * Obtiene una versión más oscura del color para gradientes
 */
const getDarkerColor = (color) => {
    // Convertir hex a RGB y oscurecer
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Oscurecer en un 30%
    const darkerR = Math.max(0, r - (r * 0.3));
    const darkerG = Math.max(0, g - (g * 0.3));
    const darkerB = Math.max(0, b - (b * 0.3));
    
    return `rgb(${Math.round(darkerR)}, ${Math.round(darkerG)}, ${Math.round(darkerB)})`;
};

/**
 * Determina si un estatus es considerado activo (permite acciones de seguimiento)
 */
const isActiveStatus = (status) => {
    const statusInfo = STATUS_FLOW[status];
    return statusInfo && statusInfo.actions.includes('seguimiento');
};

/**
 * Determina si un estatus permite reagendamiento
 */
const allowsReschedule = (status) => {
    const statusInfo = STATUS_FLOW[status];
    return statusInfo && statusInfo.actions.includes('reagendar');
};

/**
 * Obtiene los estatus válidos a los que se puede transicionar desde un estatus actual
 */
const getValidNextStatuses = (currentStatus) => {
    const statusInfo = STATUS_FLOW[currentStatus];
    return statusInfo ? statusInfo.nextStatuses : [];
};

/**
 * Actualiza las opciones del selector de resultados de contacto según el estatus actual
 * Ahora permite guardar solo notas sin cambiar estatus
 */
const updateContactResultOptions = (currentStatus) => {
    const contactResultSelect = document.getElementById('contactResult');
    if (!contactResultSelect) return;

    // Limpiar opciones existentes
    contactResultSelect.innerHTML = '<option value="">Selecciona un resultado (opcional)</option>';

    // Obtener estatus válidos para la transición
    const validNextStatuses = getValidNextStatuses(currentStatus);
    
    // Agregar opciones válidas
    validNextStatuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        contactResultSelect.appendChild(option);
    });

    // Si no hay estatus válidos, mostrar mensaje pero permitir guardar solo notas
    if (validNextStatuses.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No hay transiciones válidas disponibles - Solo notas';
        option.disabled = true;
        contactResultSelect.appendChild(option);
    }

    // Agregar nota informativa
    const infoOption = document.createElement('option');
    infoOption.value = '';
    infoOption.textContent = '💡 Puedes guardar solo notas sin cambiar el estatus';
    infoOption.disabled = true;
    infoOption.style.fontStyle = 'italic';
    infoOption.style.color = '#6b7280';
    contactResultSelect.appendChild(infoOption);
};



