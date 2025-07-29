// --- Botón de acceso masivo a WhatsApp ---
document.addEventListener('DOMContentLoaded', function () {
  const btn = document.getElementById('whatsapp-massive-button');
  if (btn) {
    btn.addEventListener('click', function () {
      window.location.href = './whatsapp-massive.html';
    });
  }

  // --- Fondo Matrix: inicialización global ---
  // const matrixCanvas = document.getElementById('interactive-bg');
  // if (matrixCanvas) {
  //     if (typeof window.startMatrix === 'function') {
  //         window.startMatrix();
  //     } else if (typeof startMatrix === 'function') {
  //         startMatrix();
  //     }
  // }

  // --- Inicializar Lucide Icons ---
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // --- Reparación: Eliminar llamada temprana a loadProspects() ---
  // La carga de prospectos solo debe ocurrir tras la autenticación (onAuthStateChanged)
});
// Importa las funciones necesarias de los SDKs de Firebase (v11.6.1)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, doc, onSnapshot, query, where, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

// Usuarios de demostración para pruebas (estructura simplificada)
const DEMO_USERS = {
    'admin@demo.com': { role: 'admin', name: 'MVGN Admin', uid: 'demo-admin-uid' },
    'prospector@demo.com': { role: 'prospector', name: 'Demo Prospector', uid: 'demo-prospector-uid' },
    'nicolas@pietrafina.com': { role: 'prospector', name: 'Nicolás Capetillo', uid: 'nicolas-demo-uid' },
    'francisco@pietrafina.com': { role: 'prospector', name: 'Francisco Capetillo', uid: 'francisco-demo-uid' }
};

// UIDs reales de usuarios clave
const ADMIN_UIDS = [
  "kRTRRDQ9k9hFzSqy1rDkMDtvaav2", // Administrador
  "Wv1BcMQlQreQ3doUPccObJdX6cS2", // Nicolás Capetillo
  "demo-admin-uid"
];
const NICOLAS_UID = 'Wv1BcMQlQreQ3doUPccObJdX6cS2';
const FRANCISCO_UID = 'n4WFgGtOtDQwYaV9QXy16bDvYE32';

/**
 * Obtiene el rol y nombre de un usuario basado en su UID.
 */
const getUserRoleAndName = (uid) => {
    // Buscar el nombre real del usuario si está en DEMO_USERS
    for (const email in DEMO_USERS) {
        if (DEMO_USERS[email].uid === uid) {
            return { role: 'admin', name: DEMO_USERS[email].name };
        }
    }
    // Si no está en DEMO_USERS, devolver 'admin' y UID como nombre
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
    detailReagendadoParaContainer: document.getElementById('detail-reagendadoPara-container'),
    detailReagendadoPara: document.getElementById('detail-reagendadoPara'),
    prospectorActionArea: document.getElementById('prospector-action-area'),
    followUpNotesInput: document.getElementById('followUpNotes'),
    contactResultSelect: document.getElementById('contactResult'),
    whatsappMessageArea: document.getElementById('whatsappMessageArea'),
whatsappMessage: document.getElementById('whatsappMessage'),
whatsappConfirmSendBtn: document.getElementById('whatsappConfirmSendBtn'),
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

// --- Autenticación de demostración para pruebas ---
const handleDemoLogin = async (email, password) => {
    if (email in DEMO_USERS && password === 'demo123') {
        const demoUser = DEMO_USERS[email];
        currentUser = { uid: demoUser.uid, email: email };
        currentUserId = demoUser.uid;
        const userInfo = getUserRoleAndName(currentUserId);
        currentUserName = userInfo.name;
        currentUserRole = userInfo.role;

        elements.onlineStatusIndicator.classList.remove('is-offline');
        elements.onlineStatusIndicator.classList.add('is-online');
        elements.onlineStatusIndicator.querySelector('i').className = 'fas fa-wifi mr-1';
        elements.onlineStatusIndicator.querySelector('span').textContent = 'Online';

        elements.authStatusDiv.innerHTML = `
            <span class="px-3 py-1" style="background-color: var(--primary-500); color: white; border-radius: var(--radius-full); font-size: 0.75rem; display: flex; align-items: center; box-shadow: var(--shadow-sm);">
                <i class="fas fa-circle mr-2" style="color: white; font-size: 0.5rem;"></i> ${getGreetingTime()} ${currentUserName} <span class="ml-2" style="color: var(--primary-100); font-size: 0.65rem;">(DEMO)</span>
            </span>
        `;

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

        loadProspects();
        return true;
    }
    return false;
};

// --- Manejo de autenticación y roles ---
onAuthStateChanged(auth, async (user) => {
    console.log("onAuthStateChanged activado. Usuario:", user ? user.uid : "null");
    if (user) {
        currentUser = user;
        currentUserId = user.uid;
        const userInfo = getUserRoleAndName(currentUserId);
        currentUserName = userInfo.name;
        currentUserRole = userInfo.role;

        elements.onlineStatusIndicator.classList.remove('is-offline');
        elements.onlineStatusIndicator.classList.add('is-online');
        elements.onlineStatusIndicator.querySelector('i').className = 'fas fa-circle mr-1';
        elements.onlineStatusIndicator.querySelector('span').textContent = 'Online';

        elements.authStatusDiv.innerHTML = `
            <span class="px-3 py-1" style="background-color: var(--primary-500); color: white; border-radius: var(--radius-full); font-size: 0.75rem; display: flex; align-items: center; box-shadow: var(--shadow-sm);">
                <i class="fas fa-circle mr-2" style="color: white; font-size: 0.5rem;"></i> ${getGreetingTime()} ${currentUserName}
            </span>
        `;

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
        } else {
            showToast("Tu cuenta no tiene un rol asignado. Contacta al administrador.", 'error');
            elements.loginErrorMessage.textContent = "Tu cuenta no tiene un rol asignado. Contacta al administrador.";
            elements.loginErrorMessage.classList.remove('hidden');
        }

        loadProspects();
    } else {
        currentUser = null;
        currentUserId = null;
        currentUserRole = null;
        currentUserName = "Desconectado";
        elements.authStatusDiv.innerHTML = '';
        
        elements.onlineStatusIndicator.classList.remove('is-online');
        elements.onlineStatusIndicator.classList.add('is-offline');
        elements.onlineStatusIndicator.querySelector('i').className = 'fas fa-circle mr-1';
        elements.onlineStatusIndicator.querySelector('span').textContent = 'Offline';

        elements.loginFormContainer.classList.remove('hidden');
        elements.roleSelectionButtons.classList.add('hidden');
        elements.loginErrorMessage.classList.add('hidden');
        showScreen('login');
    }
});

// Envío del formulario de inicio de sesión
elements.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    elements.loginErrorMessage.classList.add('hidden');

    const email = elements.loginEmailInput.value.trim();
    const password = elements.loginPasswordInput.value.trim();

    if (!email || !password) {
        showToast("Por favor, ingresa tu correo y contraseña.", 'warning');
        return;
    }

    if (await handleDemoLogin(email, password)) {
        return;
    }

    const loginButton = e.submitter;
    const originalButtonText = loginButton.innerHTML;
    showLoading(loginButton, 'Iniciando Sesión...');

    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("Usuario conectado:", auth.currentUser.uid);
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
            errorMessage = "Credenciales inválidas. Prueba con las credenciales de demo.";
        }
        showToast(errorMessage, 'error');
        elements.loginErrorMessage.textContent = errorMessage;
        elements.loginErrorMessage.classList.remove('hidden');
    } finally {
        hideLoading(loginButton, originalButtonText);
    }
});

// Funcionalidad de cierre de sesión
elements.logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log("Usuario desconectado");
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        showToast('Error al cerrar sesión', 'error');
    }
});

// --- Navegación entre pantallas ---
const showScreen = (screenName) => {
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
            break;
        case 'prospector':
            elements.prospectorScreen.classList.remove('hidden');
            break;
        case 'archive':
            elements.archiveScreen.classList.remove('hidden');
            break;
    }
    enhanceNavigation();
};

// Event listeners para botones de selección de rol
elements.adminButton.addEventListener('click', () => {
    if (currentUserRole === 'admin') {
        showScreen('admin');
        checkAndExpireProspects();
    } else {
        showCustomModal('Permiso Denegado', 'Esta acción es solo para administradores.', false);
    }
});

elements.prospectorButton.addEventListener('click', () => {
    if (currentUserRole === 'prospector' || currentUserRole === 'admin') {
        showScreen('prospector');
        checkAndExpireProspects();
    } else {
        showCustomModal('Permiso Denegado', 'No tienes permisos para acceder a esta sección.', false);
    }
});

elements.archiveButton.addEventListener('click', () => {
    if (currentUserRole === 'prospector' || currentUserRole === 'admin') {
        showScreen('archive');
        renderArchiveCards();
    } else {
        showCustomModal('Permiso Denegado', 'No tienes permisos para acceder a esta sección.', false);
    }
});

// Event listeners para botones de navegación entre pantallas
elements.navToProspectorFromAdminBtn.addEventListener('click', () => showScreen('prospector'));
elements.navToAdminFromProspectorBtn.addEventListener('click', () => {
    if (currentUserRole === 'admin') {
        showScreen('admin');
    } else {
        showCustomModal('Permiso Denegado', 'Solo los administradores pueden acceder a la gestión de base de datos.', false);
    }
});
elements.navToArchiveFromAdminBtn.addEventListener('click', () => {
    if (currentUserRole === 'admin') {
        showScreen('archive');
        renderArchiveCards();
    } else {
        showCustomModal('Permiso Denegado', 'No tienes permisos para acceder a esta sección.', false);
    }
});
elements.navToArchiveFromProspectorBtn.addEventListener('click', () => {
    if (currentUserRole === 'prospector' || currentUserRole === 'admin') {
        showScreen('archive');
        renderArchiveCards();
    } else {
        showCustomModal('Permiso Denegado', 'No tienes permisos para acceder a esta sección.', false);
    }
});

elements.backToRoleSelectionAdminBtn.addEventListener('click', () => showScreen('login'));
elements.backToRoleSelectionProspectorBtn.addEventListener('click', () => showScreen('login'));
elements.backToRoleSelectionArchiveBtn.addEventListener('click', () => showScreen('login'));

// --- Formulario para añadir prospecto ---
elements.classificationSelect.addEventListener('change', function() {
    if (this.value === 'Otro') {
        elements.otherClassificationContainer.classList.remove('hidden');
        elements.otherClassificationInput.required = true;
    } else {
        elements.otherClassificationContainer.classList.add('hidden');
        elements.otherClassificationInput.required = false;
        elements.otherClassificationInput.value = '';
    }
});

elements.addProspectForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUserId) {
        showToast('Usuario no autenticado. Por favor, intenta de nuevo', 'error');
        return;
    }

    const formData = new FormData(e.target);
    const businessName = formData.get('businessName').trim();
    const contactPerson = formData.get('contactPerson').trim();
    const email = formData.get('email').trim();
    const phone = formData.get('phone').trim();
    let classification = formData.get('classification');
    const otherClassification = formData.get('otherClassification') ? formData.get('otherClassification').trim() : '';
    const observations = formData.get('observations') ? formData.get('observations').trim() : '';

    if (classification === 'Otro' && otherClassification) {
        classification = otherClassification;
    }

    if (!businessName || !email || !phone || !classification) {
        showToast('Por favor, completa todos los campos obligatorios', 'warning');
        return;
    }

    if (!isValidEmail(email)) {
        showToast('Por favor, ingresa un correo electrónico válido', 'warning');
        return;
    }
    if (!isValidPhone(phone)) {
        showToast('Por favor, ingresa un número de teléfono válido (ej. +521234567890)', 'warning');
        return;
    }

    const submitButton = e.submitter;
    const originalButtonText = submitButton.innerHTML;
    showLoading(submitButton, 'Añadiendo...');

    try {

        const newProspect = {
            businessName,
            contactPerson: contactPerson || null,
            email,
            phone,
            classification,
            observations,
            status: 'Pendiente de Correo',
            adminUserId: currentUserId,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString().split('T')[0],
            internalNotes: '',
            followUpNotes: [],
            contactResult: null,
            assignedTo: null,
            assignedByName: null,
            adminFinalReviewNeeded: false,
            reagendadoPara: null,
            isClient: false // Nuevo campo para marcar si es cliente
        };

        // Validación de duplicados por nombre o teléfono, y bloqueo si ya es cliente
        const q1 = query(collection(db, 'prospects'), where('businessName', '==', businessName));
        const q2 = query(collection(db, 'prospects'), where('phone', '==', phone));
        const [nameSnap, phoneSnap] = await Promise.all([getDocs(q1), getDocs(q2)]);
        let isClientDuplicate = false;
        nameSnap.forEach(doc => { if (doc.data().isClient) isClientDuplicate = true; });
        phoneSnap.forEach(doc => { if (doc.data().isClient) isClientDuplicate = true; });
        if (isClientDuplicate) {
            showToast('Este contacto ya es cliente de Pietra Fina. No se puede volver a ingresar.', 'error');
            hideLoading(submitButton, originalButtonText);
            return;
        }
        if (!nameSnap.empty) {
            showToast('Ya existe un prospecto con ese nombre de empresa.', 'error');
            hideLoading(submitButton, originalButtonText);
            return;
        }
        if (!phoneSnap.empty) {
            showToast('Ya existe un prospecto con ese número de teléfono.', 'error');
            hideLoading(submitButton, originalButtonText);
            return;
        }
        await addDoc(collection(db, 'prospects'), newProspect);
        showToast('Prospecto añadido exitosamente', 'success');
        elements.addProspectForm.reset();
        elements.otherClassificationContainer.classList.add('hidden');
        elements.otherClassificationInput.required = false;
    } catch (e) {
        console.error("Error al añadir documento:", e);
        showToast(`Error al añadir prospecto: ${e.message}`, 'error');
    } finally {
        hideLoading(submitButton, originalButtonText);
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

            fetchedProspects.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                return dateB.getTime() - dateA.getTime();
            });

            allProspects = fetchedProspects;

            console.log(`Total prospectos cargados:`, allProspects.length);
            renderAdminCards();
            renderProspectorCards();
            renderArchiveCards();
            updateProspectingResultsSummary();
            updateDashboard();
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
 * Retorna la clase CSS para el badge de estado de un prospecto.
 */
const getStatusBadgeClass = (status) => {
    switch (status) {
        case 'Pendiente de Correo': return 'status-badge pending-email';
        case 'En Prospección': return 'status-badge in-prospecting';
        case 'Pendiente de Validación': return 'status-badge pending-validation';
        case 'Interesado': return 'status-badge interesado';
        case 'No contesta': return 'status-badge no-answer';
        case 'Rechazado': return 'status-badge rejected';
        case 'Seguimiento agendado': return 'status-badge rescheduled';
        case 'Reactivar Contacto': return 'status-badge reactivate';
        // case 'Revisión Admin Pendiente': return 'status-badge admin-review-pending'; // Eliminado del flujo
        case 'Completado': return 'status-badge completed';
        default: return 'status-badge';
    }
};

/**
 * Genera el HTML para una tarjeta de prospecto.
 */

const createProspectCardHTML = (prospect, isAdminView = false, isArchiveView = false) => {
    const effectiveDueDate = prospect.reagendadoPara || prospect.prospectingDueDate;
    
    // --- Campana de alerta mejorada con icono outline ---
    // let bellHTML = '';
    // if (prospect.reagendadoPara) {
    //     const today = new Date();
    //     today.setHours(0,0,0,0);
    //     const reagDate = new Date(prospect.reagendadoPara);
    //     reagDate.setHours(0,0,0,0);
    //     const diffDays = Math.floor((today - reagDate) / (1000*60*60*24));
    //     if (diffDays === 0 || diffDays === 1) {
    //         bellHTML = `<i data-lucide="bell" class="w-4 h-4 text-red-600 mr-2" title="Reagendado para hoy o ayer"></i>`;
    //     }
    // }

    // --- Información de reagendamiento ---
    let reagendadoInfo = '';
    if (prospect.reagendadoPara && prospect.status === 'Seguimiento reagendado') {
        reagendadoInfo = `
            <div class="flex items-center text-sm text-gray-600 mt-1">
                <i data-lucide="calendar" class="w-4 h-4 mr-1"></i>
                <span>Reagendado para: ${formatDate(prospect.reagendadoPara)}</span>
            </div>
        `;
    }

    // Estética mejorada para "YA ES NUESTRO CLIENTE"
    let clientBadge = '';
    if (isArchiveView && prospect.isClient && prospect.contactResult === 'Ya es nuestro cliente') {
        clientBadge = `
          <span class="inline-flex items-center bg-green-50 text-green-700 border border-green-200 text-xs rounded-md px-2 py-1 ml-2 font-medium">
            <i data-lucide="user-check" class="w-3 h-3 mr-1"></i>
            Ya es nuestro cliente
          </span>`;
    } else if (isArchiveView && prospect.contactResult === 'Convertido a cliente') {
        clientBadge = `<span class="bg-green-600 text-white text-xs rounded-lg px-3 py-1 ml-2 font-semibold">CLIENTE CONVERTIDO</span>`;
    }

    // Tarjeta mejorada con mejor diseño y botón de WhatsApp
    let whatsappButton = '';
    if (prospect.phone) {
        whatsappButton = `
            <button data-id="${prospect.id}" class="whatsapp-btn bg-green-600 text-white border border-green-600 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-green-700 transition-colors duration-200 flex items-center">
                <i data-lucide="message-circle" class="w-4 h-4 mr-1"></i>
                WhatsApp
            </button>
        `;
    }

    // Campana de alerta si reagendado para hoy o un día antes
    let bellHTML = '';
    if (prospect.reagendadoPara) {
        const today = new Date();
        today.setHours(0,0,0,0);
        const reagDate = new Date(prospect.reagendadoPara);
        reagDate.setHours(0,0,0,0);
        const diffDays = Math.floor((reagDate - today) / (1000*60*60*24));
        if (diffDays === 0 || diffDays === -1) {
            bellHTML = `<i data-lucide="bell" class="w-4 h-4 text-yellow-500 mr-1" title="Reagendación próxima"></i>`;
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

    // Tarjeta rectangular, limpia y mobile first
    let fecha = prospect.reagendadoPara ? formatDate(prospect.reagendadoPara) : formatDate(prospect.sentEmailDate);
    let fechaLabel = prospect.reagendadoPara ? 'Reagendación:' : 'Enviado:';
    let compactHTML = `
      <div class="prospect-card">
        <div class="card-header">
          <div class="card-title">${bellHTML}${prospect.businessName}</div>
          ${statusTag}
        </div>
        ${prospect.contactPerson ? `<div class="card-encargado">${prospect.contactPerson}</div>` : ''}
        <div class="card-contact">${prospect.phone}</div>
        <div class="card-date"><span class="label">${fechaLabel}</span> ${fecha}</div>
        <div class="card-actions">
          <button data-id="${prospect.id}" class="btn btn-whatsapp whatsapp-btn"><i data-lucide="message-circle" class="w-4 h-4 mr-2"></i> WhatsApp</button>
          <button data-id="${prospect.id}" class="btn btn-detail view-details-btn">Ver Detalle</button>
        </div>
      </div>
    `;

    // Versión extendida (al hacer clic en Ver Detalle)
    // Aquí puedes reutilizar el bloque anterior, pero mostrando toda la info y acciones
    // ...

    return compactHTML;
};

/**
 * Renderiza las tarjetas de prospectos para la vista de administrador, aplicando filtros.
 */
const renderAdminCards = () => {
    if (currentUserRole !== 'admin') return;
    console.log("Renderizando Tarjetas de Administración.");

    const filterStatus = elements.statusFilter.value;
    const filterDate = elements.dateFilter.value;
    const searchTerm = elements.searchFilter.value.toLowerCase();

    const filteredProspects = allProspects.filter(p => {
        const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
        const matchesDate = !filterDate || (p.sentEmailDate && p.sentEmailDate.startsWith(filterDate));
        const matchesSearch = !searchTerm || p.businessName.toLowerCase().includes(searchTerm) || (p.contactPerson && p.contactPerson.toLowerCase().includes(searchTerm));
        return matchesStatus && matchesDate && matchesSearch;
    });

    elements.adminProspectsCardsContainer.innerHTML = '';
    if (filteredProspects.length === 0) {
        elements.adminNoProspectsDiv.classList.remove('hidden');
    } else {
        elements.adminNoProspectsDiv.classList.add('hidden');
        filteredProspects.forEach(prospect => {
            elements.adminProspectsCardsContainer.insertAdjacentHTML('beforeend', createProspectCardHTML(prospect, true));
        });

        // Re-adjuntar event listeners para los botones recién creados en las tarjetas
        attachAdminCardEventListeners();
    }
    
    // Reinicializar Lucide Icons para el contenido dinámico
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    addEntryAnimations();
    addHoverEffects();
};

/**
 * Adjunta event listeners a los botones de las tarjetas de administrador
 */
const attachAdminCardEventListeners = () => {
    document.querySelectorAll('.confirm-email-btn').forEach(button => {
        button.onclick = (event) => {
            const prospectId = event.currentTarget.dataset.id;
            showCustomModal('Confirmar Envío de Correo', '¿Estás seguro de que deseas marcar este prospecto como "Correo Enviado" y empezar el período de prospección?', true, async (confirmBtn) => {
                const originalButtonText = confirmBtn.innerHTML;
                showLoading(confirmBtn, 'Enviando...');
                try {
                    await updateProspectStatus(prospectId, 'En Prospección');
                } finally {
                    hideLoading(confirmBtn, originalButtonText);
                }
            });
        };
    });
    
    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.onclick = (event) => {
            const prospectId = event.currentTarget.dataset.id;
            console.log('Ver detalles clicked para prospect:', prospectId);
            showProspectDetailsModal(prospectId);
        };
    });
    
    // Event listeners para botones de WhatsApp
    document.querySelectorAll('.whatsapp-btn').forEach(button => {
        button.onclick = (event) => {
            const prospectId = event.currentTarget.dataset.id;
            console.log('WhatsApp clicked para prospect:', prospectId);
            showWhatsAppModal(prospectId);
        };
    });
    
    document.querySelectorAll('.edit-prospect-admin-btn').forEach(button => {
        button.onclick = (event) => {
            const prospectId = event.currentTarget.dataset.id;
            showEditProspectModal(prospectId);
        };
    });
    
    document.querySelectorAll('.validate-prospect-btn').forEach(button => {
        button.onclick = (event) => {
            const prospectId = event.currentTarget.dataset.id;
            showValidationModal(prospectId);
        };
    });
    
    document.querySelectorAll('.reactivate-contact-btn').forEach(button => {
        button.onclick = (event) => {
            const prospectId = event.currentTarget.dataset.id;
            showCustomModal('Reactivar Contacto', '¿Estás seguro de que deseas reactivar este prospecto y devolverlo al estatus "En Prospección"?', true, async (confirmBtn) => {
                const originalButtonText = confirmBtn.innerHTML;
                showLoading(confirmBtn, 'Reactivando...');
                try {
                    await reactivateProspect(prospectId);
                } finally {
                    hideLoading(confirmBtn, originalButtonText);
                }
            });
        };
    });
    
    document.querySelectorAll('.admin-review-complete-btn').forEach(button => {
        button.onclick = (event) => {
            const prospectId = event.currentTarget.dataset.id;
            showCustomModal('Completar Revisión', '¿Estás seguro de que la revisión del administrador está completa y deseas finalizar este prospecto?', true, async (confirmBtn) => {
                const originalButtonText = confirmBtn.innerHTML;
                showLoading(confirmBtn, 'Completando...');
                try {
                    await updateProspectStatus(prospectId, 'Completado');
                    await updateDoc(doc(db, 'prospects', prospectId), {
                        adminFinalReviewNeeded: false
                    });
                } finally {
                    hideLoading(confirmBtn, originalButtonText);
                }
            });
        };
    });
};

const MATERIALS = [
  {
    name: 'CATÁLOGO DE PRODUCTOS',
    url: 'http://bit.ly/3IbX56b'
  },
  {
    name: 'LOOKBOOK DE OBRAS',
    url: 'https://bit.ly/4kj5TnW'
  },
  {
    name: 'SELECCIÓN DE MATERIALES PREMIUM',
    url: 'https://bit.ly/4etgonw'
  }
];

const showWhatsAppModal = (prospectId) => {
    const prospect = allProspects.find(p => p.id === prospectId);
    if (!prospect) {
        showToast('Prospecto no encontrado', 'error');
        return;
    }

    // Modal HTML con selector de materiales
    let modalHTML = `
        <div id="whatsapp-modal-overlay" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-playfair font-bold text-gray-900">
                        <i data-lucide="message-circle" class="w-5 h-5 mr-2 text-green-600"></i>
                        Enviar por WhatsApp
                    </h3>
                    <button id="close-whatsapp-modal" class="text-gray-400 hover:text-gray-600">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <div class="mb-4">
                    <p class="text-sm text-gray-600 mb-2">Prospecto: <strong>${prospect.businessName}</strong></p>
                    <p class="text-sm text-gray-600 mb-4">Teléfono: <strong>${prospect.phone}</strong></p>
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Seleccionar materiales a enviar:</label>
                    <div id="materials-checkbox-container-modal" class="space-y-2">
                        ${MATERIALS.map((mat, i) => `
                            <label class="flex items-center gap-2">
                                <input type="checkbox" class="material-checkbox-modal" value="${i}" checked>
                                <span>${mat.name}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Mensaje personalizado:</label>
                    <textarea id="whatsapp-message" rows="8" class="w-full border border-gray-300 rounded-lg p-3 text-sm font-mono resize-none"></textarea>
                </div>
                <div class="flex justify-end space-x-3">
                    <button id="cancel-whatsapp" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-inter">
                        Cancelar
                    </button>
                    <button id="send-whatsapp" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-inter flex items-center">
                        <i data-lucide="message-circle" class="w-4 h-4 mr-2"></i>
                        Enviar WhatsApp
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const whatsappModal = document.getElementById('whatsapp-modal-overlay');

    // Reinicializar iconos
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Generar mensaje inicial
    function getSelectedMaterials() {
        const checks = document.querySelectorAll('.material-checkbox-modal:checked');
        return Array.from(checks).map(c => MATERIALS[parseInt(c.value)]);
    }
    function generateMessage() {
        const mats = getSelectedMaterials();
        return `Hola ${prospect.contactPerson || prospect.businessName},\n\nTe comparto el material promocional de Pietra Fina:\n\n${mats.map(m => `• ${m.name}: ${m.url}`).join('\n')}\n\n¿Te gustaría que agendemos una cita para revisar los materiales en detalle?\n\nSaludos,\nEquipo Pietra Fina`;
    }
    const textarea = document.getElementById('whatsapp-message');
    textarea.value = generateMessage();
    document.querySelectorAll('.material-checkbox-modal').forEach(cb => {
        cb.onchange = () => {
            textarea.value = generateMessage();
        };
    });

    // Event listeners
    document.getElementById('close-whatsapp-modal').onclick = () => {
        whatsappModal.remove();
    };
    document.getElementById('cancel-whatsapp').onclick = () => {
        whatsappModal.remove();
    };
    document.getElementById('send-whatsapp').onclick = () => {
        const message = textarea.value;
        const phoneNumber = prospect.phone.replace(/\D/g, '');
        // Priorizar la app de WhatsApp en móviles
        let whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        // Detectar si es escritorio para usar WhatsApp Web como fallback
        const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
        if (!isMobile) {
            whatsappUrl = `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
        }
        window.open(whatsappUrl, '_blank');
        whatsappModal.remove();
        showToast(isMobile ? 'Abriendo WhatsApp...' : 'Abriendo WhatsApp Web...', 'success');
    };
};

/**
 * Muestra un modal para validar la prospección de un prospecto.
 */
const showValidationModal = (prospectId) => {
    const prospect = allProspects.find(p => p.id === prospectId);
    if (!prospect) {
        showToast('Prospecto no encontrado', 'error');
        return;
    }

    const validationOptions = [
        { value: 'Interesado', label: 'Éxito - Cliente Interesado' },
        { value: 'No contesta', label: 'Sin Éxito - No Contesta' },
        { value: 'Rechazado', label: 'Sin Éxito - Rechazado' },
        { value: 'Seguimiento agendado', label: 'Reprogramar - Seguimiento Agendado' },
        { value: 'En Prospección', label: 'Enviar Material - Continuar Prospección' }
    ];

    let modalHTML = `
        <div id="validation-modal-overlay" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 class="text-lg font-playfair font-bold mb-4">Validar Prospección: ${prospect.businessName}</h3>
                <p class="text-sm font-inter text-gray-600 mb-4">Selecciona el resultado de la prospección:</p>
                <div class="space-y-2 mb-4 font-inter">
    `;

    validationOptions.forEach(option => {
        modalHTML += `
            <label class="flex items-center">
                <input type="radio" name="validationResult" value="${option.value}" class="mr-2">
                <span>${option.label}</span>
            </label>
        `;
    });

    modalHTML += `
                </div>
                <div class="flex justify-end space-x-2">
                    <button id="cancelValidation" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 font-inter">Cancelar</button>
                    <button id="confirmValidation" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-inter">Confirmar</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const validationModal = document.getElementById('validation-modal-overlay');

    document.getElementById('cancelValidation').onclick = () => {
        validationModal.remove();
    };

    document.getElementById('confirmValidation').onclick = async (event) => {
        const selectedResult = document.querySelector('input[name="validationResult"]:checked');
        if (!selectedResult) {
            showToast('Por favor selecciona un resultado', 'warning');
            return;
        }

        const confirmButton = event.currentTarget;
        const originalButtonText = confirmButton.innerHTML;
        showLoading(confirmButton, 'Validando...');

        try {
            await updateProspectStatus(prospectId, selectedResult.value);
            await updateDoc(doc(db, 'prospects', prospectId), {
                validatedBy: { uid: currentUserId, name: currentUserName },
                validatedAt: new Date().toISOString()
            });
            showToast('Prospección validada correctamente', 'success');
            validationModal.remove();
        } catch (error) {
            console.error('Error al validar prospecto:', error);
            showToast('Error al validar la prospección', 'error');
        } finally {
            hideLoading(confirmButton, originalButtonText);
        }
    };
};

// Event listeners para filtros en la vista de administrador
elements.statusFilter.addEventListener('change', renderAdminCards);
elements.dateFilter.addEventListener('change', renderAdminCards);
elements.searchFilter.addEventListener('input', renderAdminCards);

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
            const dueDate = addBusinessDays(today, 7).toISOString().split('T')[0];
            updateData.prospectingDueDate = dueDate;
            updateData.reagendadoPara = null;
        }

        await updateDoc(prospectRef, updateData);
        showToast(`Estado del prospecto actualizado a "${newStatus}"`, 'success');
    }
    catch (e) {
        console.error("Error al actualizar documento:", e);
        showToast(`Error al actualizar el estado: ${e.message}`, 'error');
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
        const dueDate = addBusinessDays(today, 7).toISOString().split('T')[0];

        await updateDoc(prospectRef, {
            status: 'En Prospección',
            sentEmailDate: today.toISOString().split('T')[0],
            prospectingDueDate: dueDate,
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
        elements.detailModal.classList.add('hidden');
    } catch (e) {
        console.error("Error al eliminar prospecto:", e);
        showToast(`Error al eliminar prospecto: ${e.message}`, 'error');
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
        pendienteValidacion: allProspects.filter(p => p.status === 'Pendiente de Validación').length
    };

    const conversionRateValue = counts.total > 0 ? ((counts.interesado / counts.total) * 100).toFixed(1) : 0;

    elements.totalProspectsCount.textContent = counts.total;
    elements.enProspeccionCount.textContent = counts.enProspeccion + counts.pendienteValidacion;
    elements.interesadoCount.textContent = counts.interesado;
    elements.conversionRate.textContent = `${conversionRateValue}%`;
};

/**
 * Renderiza las tarjetas de prospectos para la vista de prospector.
 */
const renderProspectorCards = () => {
    if (currentUserRole !== 'prospector' && currentUserRole !== 'admin') return;
    console.log("Renderizando Tarjetas de Prospector.");

    const today = new Date();
    const startOfWeek = getStartOfWeek(today).toISOString().split('T')[0];
    const endOfWeek = getEndOfWeek(today).toISOString().split('T')[0];

    const assignedProspects = allProspects.filter(p => {
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
    }).sort((a, b) => {
        const dateA = a.reagendadoPara ? new Date(a.reagendadoPara) : (a.prospectingDueDate ? new Date(a.prospectingDueDate) : new Date(0));
        const dateB = b.reagendadoPara ? new Date(b.reagendadoPara) : (b.prospectingDueDate ? new Date(b.prospectingDueDate) : new Date(0));

        if (dateA.getTime() === dateB.getTime()) {
            const createdAtA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const createdAtB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return createdAtB.getTime() - createdAtA.getTime();
        }
        return dateA.getTime() - dateB.getTime();
    });

    elements.prospectorProspectsCardsContainer.innerHTML = '';
    if (assignedProspects.length === 0) {
        elements.prospectorNoProspectsDiv.classList.remove('hidden');
    } else {
        elements.prospectorNoProspectsDiv.classList.add('hidden');
        assignedProspects.forEach(prospect => {
            elements.prospectorProspectsCardsContainer.insertAdjacentHTML('beforeend', createProspectCardHTML(prospect, false));
        });

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

/**
 * Adjunta event listeners a los botones de las tarjetas de prospector
 */
const attachProspectorCardEventListeners = () => {
    document.querySelectorAll('.assign-prospect-btn').forEach(button => {
        button.onclick = (event) => {
            const prospectId = event.currentTarget.dataset.id;
            const originalButtonText = event.currentTarget.innerHTML;
            showLoading(event.currentTarget, 'Asignando...');
            try {
                assignProspectToSelf(prospectId);
            } finally {
                hideLoading(event.currentTarget, originalButtonText);
            }
        };
    });
    
    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.onclick = (event) => {
            const prospectId = event.currentTarget.dataset.id;
            console.log('Ver detalles clicked para prospect:', prospectId);
            showProspectDetailsModal(prospectId);
        };
    });
    
    // Event listeners para botones de WhatsApp
    document.querySelectorAll('.whatsapp-btn').forEach(button => {
        button.onclick = (event) => {
            const prospectId = event.currentTarget.dataset.id;
            console.log('WhatsApp clicked para prospect:', prospectId);
            showWhatsAppModal(prospectId);
        };
    });
};

/**
 * Renderiza las tarjetas de prospectos para la vista de archivo, aplicando filtros.
 */
const renderArchiveCards = () => {
    if (currentUserRole !== 'admin' && currentUserRole !== 'prospector') return;
    console.log("Renderizando Tarjetas de Archivo.");


    // NUEVO: Eliminar "Revisión Admin Pendiente" del flujo y del filtro (ya no se usa en ningún lado)
    const finalStatuses = ['Interesado', 'No contesta', 'Rechazado', 'Completado', 'Convertido'];
    const filterStatus = elements.archiveStatusFilter.value;
    const searchTerm = elements.archiveSearchFilter.value.toLowerCase();

    // Mostrar en archivo solo los que realmente están en estatus final o cliente, NO los que están en prospección
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

    elements.archiveProspectsCardsContainer.innerHTML = '';
    if (archivedProspects.length === 0) {
        elements.archiveNoProspectsDiv.classList.remove('hidden');
    } else {
        elements.archiveNoProspectsDiv.classList.add('hidden');
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
    
    // Reinicializar Lucide Icons para el contenido dinámico
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    addEntryAnimations();
    addHoverEffects();
};

// Event listeners para filtros en la vista de archivo
elements.archiveStatusFilter.addEventListener('change', renderArchiveCards);
elements.archiveSearchFilter.addEventListener('input', renderArchiveCards);

/**
 * Asigna un prospecto al usuario actual (prospector) y lo mueve a la vista de detalles.
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
        showProspectDetailsModal(prospectId);
    } catch (e) {
        console.error("Error al asignar prospecto:", e);
        showToast(`Error al asignar prospecto: ${e.message}`, 'error');
    }
};

/**
 * Revisa y actualiza el estado de los prospectos 'En Prospección' si su fecha límite ha vencido.
 */
const checkAndExpireProspects = async () => {
    if (!currentUserId) return;

    const today = new Date().toISOString().split('T')[0];
    const prospectsToUpdate = allProspects.filter(p =>
        p.status === 'En Prospección' && p.prospectingDueDate && p.prospectingDueDate < today &&
        !(p.assignedTo === NICOLAS_UID || p.assignedTo === FRANCISCO_UID)
    );

    for (const prospect of prospectsToUpdate) {
        try {
            console.log(`Moviendo prospecto vencido ${prospect.id} a 'Reactivar Contacto'.`);
            const prospectRef = doc(db, 'prospects', prospect.id);
            await updateDoc(prospectRef, {
                status: 'Reactivar Contacto',
                lastUpdated: new Date().toISOString().split('T')[0]
            });
            console.log(`Prospecto ${prospect.id} movido a 'Reactivar Contacto' por vencimiento.`);
        } catch (e) {
            console.error(`Error al mover prospecto ${prospect.id} a 'Reactivar Contacto':`, e);
        }
    }
};

// --- Lógica del modal de detalles y seguimiento de prospectos ---

/**
 * Muestra el modal de detalles de un prospecto específico.
 */
const showProspectDetailsModal = (prospectId) => {
    console.log('showProspectDetailsModal called with ID:', prospectId);
    
    currentProspectIdForModal = prospectId;
    const prospect = allProspects.find(p => p.id === prospectId);

    if (!prospect) {
        console.error('Prospecto no encontrado:', prospectId);
        showToast('Prospecto no encontrado', 'error');
        return;
    }

    console.log('Mostrando detalles para:', prospect);

    // Populate modal data - CAMPOS OPTIMIZADOS
    elements.detailBusinessName.textContent = prospect.businessName;
    elements.detailContactPerson.textContent = prospect.contactPerson || 'N/A';
    elements.detailEmail.textContent = prospect.email;
    elements.detailPhone.textContent = prospect.phone;
    elements.detailClassification.textContent = prospect.classification;
    elements.detailSentEmailDate.textContent = formatDate(prospect.sentEmailDate);
    elements.detailProspectingDueDate.textContent = formatDate(prospect.prospectingDueDate);
    elements.detailObservations.textContent = prospect.observations || 'Ninguna';

    if (prospect.reagendadoPara) {
        elements.detailReagendadoPara.textContent = formatDate(prospect.reagendadoPara);
        elements.detailReagendadoParaContainer.classList.remove('hidden');
    } else {
        elements.detailReagendadoPara.textContent = '';
        elements.detailReagendadoParaContainer.classList.add('hidden');
    }

    initializeCallButton(prospect.phone);

    // Show/hide admin actions
    if (currentUserRole === 'admin') {
        elements.adminActionsArea.classList.remove('hidden');
        elements.editProspectActionArea.classList.remove('hidden');
        elements.deleteProspectBtn.onclick = () => {
            showCustomModal('Eliminar Prospecto', '¿Estás seguro de que quieres eliminar este prospecto permanentemente? Esta acción no se puede deshacer.', true, async (confirmBtn) => {
                await deleteProspect(prospectId);
            });
        };
        elements.editProspectBtn.onclick = () => {
            showEditProspectModal(prospectId);
        };

        // --- Botón "Campaña de contacto enviada" para admin y Nicolás Capetillo, solo si status es "Pendiente de Correo" ---
        // Evitar duplicados: eliminar si ya existe
        const existingBtn = document.getElementById('contact-campaign-sent-btn');
        if (existingBtn) existingBtn.remove();

        // Mostrar para admin (UID en ADMIN_UIDS) y Nicolás Capetillo (NICOLAS_UID)
        const isAdminUID = ADMIN_UIDS.includes(currentUserId);
        const isNicolas = currentUserId === NICOLAS_UID;
        if ((isAdminUID || isNicolas) && prospect.status === 'Pendiente de Correo') {
            const btn = document.createElement('button');
            btn.id = 'contact-campaign-sent-btn';
            btn.type = 'button';
            btn.className = 'action-btn bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 mt-2';
            btn.style.width = '100%';
            btn.innerHTML = '<i data-lucide="send" class="w-4 h-4"></i> Campaña de contacto enviada';
            btn.onclick = async (event) => {
                const originalText = btn.innerHTML;
                showLoading(btn, 'Actualizando...');
                try {
                    await updateProspectStatus(prospect.id, 'En Prospección');
                    showToast('Prospecto movido a "En Prospección"', 'success');
                    elements.detailModal.classList.add('hidden');
                } catch (e) {
                    showToast('Error al actualizar el estado', 'error');
                } finally {
                    hideLoading(btn, originalText);
                }
            };
            elements.adminActionsArea.appendChild(btn);
        }
    } else {
        elements.adminActionsArea.classList.add('hidden');
        elements.editProspectActionArea.classList.add('hidden');
        // Si no es admin, asegurarse de eliminar el botón si existe
        const existingBtn = document.getElementById('contact-campaign-sent-btn');
        if (existingBtn) existingBtn.remove();
    }

    // Permitir reagendar desde archivo de prospección sin importar el estatus
    if (canUserReschedule(currentUserId, currentUserRole, currentUserName) && (currentUserRole === 'admin' || currentUserRole === 'prospector')) {
        elements.rescheduleActionArea.classList.remove('hidden');
        elements.rescheduleFollowUpBtn.onclick = () => {
            elements.rescheduleModal.classList.remove('hidden');
            initDatepicker(elements.rescheduleDateInput);
        };
    } else {
        elements.rescheduleActionArea.classList.add('hidden');
    }

    // Show/hide prospector action area
    if (currentUserRole === 'admin' || (currentUserRole === 'prospector' && prospect.assignedTo === currentUserId && (prospect.status === 'En Prospección' || prospect.status === 'Seguimiento agendado'))) {
        elements.prospectorActionArea.classList.remove('hidden');
        elements.followUpNotesInput.value = '';
        elements.contactResultSelect.value = '';

        if (prospect.followUpNotes && prospect.followUpNotes.length > 0) {
            elements.followUpNotesInput.value = prospect.followUpNotes[prospect.followUpNotes.length - 1].notes;
        }
        if (prospect.contactResult) {
            elements.contactResultSelect.value = prospect.contactResult;
        }
    } else {
        elements.prospectorActionArea.classList.add('hidden');
    }

    // Show the modal
    console.log('Mostrando modal de detalles');
    elements.detailModal.classList.remove('hidden');
    
    // Force reflow and focus
    elements.detailModal.offsetHeight;
    elements.detailModal.focus();
    
    // Reinicializar Lucide Icons para el contenido dinámico
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    console.log('Modal de detalles mostrado');
};

// Modal close handlers
elements.detailCloseBtn.addEventListener('click', () => {
    console.log('Cerrando modal de detalles');
    elements.detailModal.classList.add('hidden');
});

// Close modal when clicking outside
elements.detailModal.addEventListener('click', (e) => {
    if (e.target === elements.detailModal) {
        console.log('Cerrando modal por click fuera');
        elements.detailModal.classList.add('hidden');
    }
});

// Reschedule modal handlers
const rescheduleCancelBtnClickHandler = () => elements.rescheduleModal.classList.add('hidden');
elements.rescheduleCancelBtn.addEventListener('click', rescheduleCancelBtnClickHandler);

const rescheduleConfirmBtnClickHandler = async (event) => {
    const selectedDate = elements.rescheduleDateInput.value;
    if (!selectedDate) {
        showToast('Por favor, selecciona una fecha para reagendar', 'warning');
        return;
    }

    const prospectId = currentProspectIdForModal;
    if (!prospectId) {
        showToast('No se ha seleccionado ningún prospecto para reagendar', 'error');
        return;
    }

    const confirmButton = event.currentTarget;
    const originalButtonText = confirmButton.innerHTML;
    showLoading(confirmButton, 'Reagendando...');

    try {
        const prospectRef = doc(db, 'prospects', prospectId);
        await updateDoc(prospectRef, {
            reagendadoPara: selectedDate,
            status: 'Seguimiento agendado',
            prospectingDueDate: null,
            lastUpdated: new Date().toISOString().split('T')[0]
        });
        showToast(`¡Operación exitosa! Seguimiento reagendado para el ${formatDate(selectedDate)}.`, 'success');
        elements.rescheduleModal.classList.add('hidden');
        elements.detailModal.classList.add('hidden');
    }
    catch (e) {
        console.error("Error reagendando seguimiento:", e);
        showToast(`Error al reagendar seguimiento: ${e.message}`, 'error');
    } finally {
        hideLoading(confirmButton, originalButtonText);
    }
};
elements.rescheduleConfirmBtn.addEventListener('click', rescheduleConfirmBtnClickHandler);

/**
 * Inicializa el botón de llamada con un número de teléfono.
 */
const initializeCallButton = (phoneNumber) => {
    const callButton = document.getElementById('call-button');
    if (phoneNumber) {
        callButton.href = `tel:${phoneNumber}`;
        callButton.classList.remove('hidden');
    } else {
        callButton.classList.add('hidden');
    }
};

const saveFollowUpBtnClickHandler = async (event) => {
    const prospectId = currentProspectIdForModal;
    const newFollowUpNote = elements.followUpNotesInput.value.trim();
    let newContactResult = elements.contactResultSelect.value;

    if (!prospectId) {
        showToast('No se ha seleccionado ningún prospecto', 'error');
        return;
    }
    if (!newContactResult) {
        showToast('Por favor, selecciona un resultado de contacto', 'warning');
        return;
    }
    if (!currentUserId) {
        showToast('Usuario no autenticado. Por favor, intenta de nuevo', 'error');
        return;
    }

    const saveButton = event.currentTarget;
    const originalButtonText = saveButton.innerHTML;
    showLoading(saveButton, 'Guardando...');

    try {
        const prospectData = allProspects.find(p => p.id === prospectId);
        if (!prospectData) {
            showToast('No se pudo encontrar el prospecto para guardar el seguimiento', 'error');
            return;
        }

        const prospectRef = doc(db, 'prospects', prospectId);
        let updatedFollowUpNotes = prospectData.followUpNotes || [];

        if (newFollowUpNote) {
            updatedFollowUpNotes.push({
                notes: newFollowUpNote,
                timestamp: new Date().toISOString(),
                by: { uid: currentUserId, name: currentUserName }
            });
        }

        // NUEVO FLUJO: Si es "Ya es nuestro cliente" o "Convertido a cliente", va directo a archivo con etiqueta adecuada
        let finalStatus = 'Completado';
        let isClientFlag = false;
        if (newContactResult === 'Ya es nuestro cliente') {
            finalStatus = 'Completado';
            isClientFlag = true;
        } else if (newContactResult === 'Convertido a cliente') {
            finalStatus = 'Convertido a cliente';
            isClientFlag = true;
        } else if ([ 'Interesado', 'No contesta', 'Rechazado' ].includes(newContactResult)) {
            finalStatus = newContactResult;
        }
        await updateDoc(prospectRef, {
            contactResult: newContactResult,
            status: finalStatus,
            followUpNotes: updatedFollowUpNotes,
            contactedBy: { uid: currentUserId, name: currentUserName },
            pendingValidationResult: null,
            lastUpdated: new Date().toISOString().split('T')[0],
            prospectingDueDate: null,
            sentEmailDate: null,
            reagendadoPara: null,
            ...(isClientFlag ? { isClient: true } : {})
        });

        // NUEVO: Cerrar el modal y mostrar solo la notificación de archivado, sin referencia a validación
        showToast('Seguimiento guardado y prospecto archivado.', 'success');
        elements.detailModal.classList.add('hidden');
    }
    catch (e) {
        console.error("Error al guardar seguimiento:", e);
        showToast(`Error al guardar el seguimiento: ${e.message}`, 'error');
    } finally {
        hideLoading(saveButton, originalButtonText);
    }
};
elements.saveFollowUpBtn.addEventListener('click', saveFollowUpBtnClickHandler);

// --- Funcionalidad de Edición de Prospecto ---
/**
 * Muestra el modal de edición de prospecto y precarga sus datos.
 */
const showEditProspectModal = (prospectId) => {
    currentProspectIdForModal = prospectId;
    const prospect = allProspects.find(p => p.id === prospectId);

    if (!prospect) {
        showToast('Prospecto no encontrado para edición', 'error');
        return;
    }

    elements.editBusinessName.value = prospect.businessName || '';
    elements.editContactPerson.value = prospect.contactPerson || '';
    elements.editEmail.value = prospect.email || '';
    elements.editPhone.value = prospect.phone || '';
    elements.editClassification.value = prospect.classification || '';
    elements.editObservations.value = prospect.observations || '';

    const standardClassifications = ['Despacho de Arquitectos', 'Diseño de Interiores', 'Constructoras', 'Distribuidores de acabados', 'Mueblerías', 'Showrooms de Baños / Cocinas', 'Hoteles / Desarrolladores de Hospitalidad', 'Cruceros / Espacios Comerciales de Lujo', 'Pisos y Recubrimientos', 'Corporativos / Oficinas', 'Proyectos Holísticos / Wellness'];
    if (prospect.classification && !standardClassifications.includes(prospect.classification)) {
        elements.editClassification.value = 'Otro';
        elements.editOtherClassificationContainer.classList.remove('hidden');
        elements.editOtherClassification.value = prospect.classification;
        elements.editOtherClassification.required = true;
    } else {
        elements.editOtherClassificationContainer.classList.add('hidden');
        elements.editOtherClassification.value = '';
        elements.editOtherClassification.required = false;
    }

    elements.editClassification.onchange = function() {
        if (this.value === 'Otro') {
            elements.editOtherClassificationContainer.classList.remove('hidden');
            elements.editOtherClassification.required = true;
        } else {
            elements.editOtherClassificationContainer.classList.add('hidden');
            elements.editOtherClassification.required = false;
            elements.editOtherClassification.value = '';
        }
    };

    elements.detailModal.classList.add('hidden');
    elements.editProspectModal.classList.remove('hidden');
};

elements.editProspectCloseBtn.addEventListener('click', () => elements.editProspectModal.classList.add('hidden'));
elements.editProspectCancelBtn.addEventListener('click', () => elements.editProspectModal.classList.add('hidden'));

elements.editProspectForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const prospectId = currentProspectIdForModal;
    if (!prospectId) {
        showToast('Error: No hay prospecto seleccionado para editar.', 'error');
        return;
    }

    const formData = new FormData(e.target);
    const updatedBusinessName = formData.get('businessName').trim();
    const updatedContactPerson = formData.get('contactPerson').trim();
    const updatedEmail = formData.get('email').trim();
    const updatedPhone = formData.get('phone').trim();
    let updatedClassification = formData.get('classification');
    const updatedOtherClassification = formData.get('otherClassification') ? formData.get('otherClassification').trim() : '';
    const updatedObservations = formData.get('observations') ? formData.get('observations').trim() : '';

    if (updatedClassification === 'Otro' && updatedOtherClassification) {
        updatedClassification = updatedOtherClassification;
    }

    if (!updatedBusinessName || !updatedEmail || !updatedPhone || !updatedClassification) {
        showToast('Por favor, completa todos los campos obligatorios para la edición', 'warning');
        return;
    }
    if (!isValidEmail(updatedEmail)) {
        showToast('Por favor, ingresa un correo electrónico válido', 'warning');
        return;
    }
    if (!isValidPhone(updatedPhone)) {
        showToast('Por favor, ingresa un número de teléfono válido (ej. +521234567890)', 'warning');
        return;
    }

    const saveButton = e.submitter;
    const originalButtonText = saveButton.innerHTML;
    showLoading(saveButton, 'Guardando Cambios...');

    try {
        const prospectRef = doc(db, 'prospects', prospectId);
        await updateDoc(prospectRef, {
            businessName: updatedBusinessName,
            contactPerson: updatedContactPerson || null,
            email: updatedEmail,
            phone: updatedPhone,
            classification: updatedClassification,
            observations: updatedObservations,
            lastUpdated: new Date().toISOString().split('T')[0]
        });
        showToast('¡Prospecto actualizado exitosamente!', 'success');
        elements.editProspectModal.classList.add('hidden');
    } catch (error) {
        console.error('Error al actualizar prospecto:', error);
        showToast(`Error al actualizar prospecto: ${error.message}`, 'error');
    } finally {
        hideLoading(saveButton, originalButtonText);
    }
});

// --- Inicialización de Flatpickr (Selector de fechas) ---
const initDatepicker = (inputElement) => {
    if (typeof flatpickr === 'function') {
        flatpickr(inputElement, {
            dateFormat: "Y-m-d",
            minDate: "today",
            locale: {
                weekdays: {
                    shorthand: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
                    longhand: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
                },
                months: {
                    shorthand: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
                    longhand: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
                },
                ordinal: () => {
                    return "";
                },
                firstDayOfWeek: 1,
                rangeSeparator: " a ",
                scrollTitle: "Desplácese para cambiar",
                toggleTitle: "Haga clic para alternar",
                amPM: ["AM", "PM"],
                yearAriaLabel: "Año",
                time_24hr: true,
            },
            enable: [
                function(date) {
                    return (date.getDay() !== 0 && date.getDay() !== 6);
                }
            ]
        });
    } else {
        console.warn("Flatpickr no está cargado. El selector de fechas no se inicializará.");
    }
};

// --- Modal personalizado para alertas/confirmaciones ---
let confirmActionCallback = null;

const showCustomModal = (title, message, isConfirm, callback = null) => {
    elements.confirmModalTitle.textContent = title;
    elements.confirmModalMessage.textContent = message;

    if (isConfirm) {
        elements.confirmActionBtn.classList.remove('hidden');
        elements.confirmActionBtn.textContent = 'Confirmar';
        confirmActionCallback = callback;
        elements.confirmActionBtn.onclick = async () => {
            elements.confirmModal.classList.add('hidden');
            if (confirmActionCallback) {
                await confirmActionCallback(elements.confirmActionBtn);
                confirmActionCallback = null;
            }
        };
        elements.confirmCancelBtn.textContent = 'Cancelar';
    } else {
        elements.confirmActionBtn.classList.add('hidden');
        elements.confirmCancelBtn.textContent = 'Cerrar';
        elements.confirmCancelBtn.onclick = () => {
            elements.confirmModal.classList.add('hidden');
            confirmActionCallback = null;
        };
    }
    elements.confirmModal.classList.remove('hidden');
};

elements.confirmCancelBtn.addEventListener('click', () => {
    elements.confirmModal.classList.add('hidden');
    confirmActionCallback = null;
});

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

// --- Gráficos del Dashboard ---
const updateDashboard = () => {
    // Mostrar dashboard para todos los roles (admin y prospector)
    console.log("Actualizando gráficos del dashboard.");

    const statusCounts = {
        'Pendiente de Correo': allProspects.filter(p => p.status === 'Pendiente de Correo').length,
        'En Prospección': allProspects.filter(p => p.status === 'En Prospección').length,
        'Interesado': allProspects.filter(p => p.status === 'Interesado').length,
        'No contesta': allProspects.filter(p => p.status === 'No contesta').length,
        'Rechazado': allProspects.filter(p => p.status === 'Rechazado').length,
        'Seguimiento agendado': allProspects.filter(p => p.status === 'Seguimiento agendado').length,
        'Reactivar Contacto': allProspects.filter(p => p.status === 'Reactivar Contacto').length,
        'Completado': allProspects.filter(p => p.status === 'Completado').length,
        'Cliente convertido': allProspects.filter(p => (p.status === 'Convertido a cliente' || p.contactResult === 'Convertido a cliente') && p.isClient).length,
        'Ya es nuestro cliente': allProspects.filter(p => p.contactResult === 'Ya es nuestro cliente' && p.isClient).length
    };

    const statusCtx = document.getElementById('statusChart').getContext('2d');
    if (statusChart) {
        statusChart.destroy();
    }
    // Fallback colors if CSS variables are missing
    const getColor = (cssVar, fallback) => {
        const val = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
        return val || fallback;
    };
    statusChart = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: [
                    getColor('--gray-900', '#1e293b'),
                    getColor('--primary-500', '#ef4444'),
                    getColor('--gray-600', '#64748b'),
                    getColor('--success-500', '#22c55e'),
                    getColor('--warning-500', '#f59e42'),
                    getColor('--info-500', '#3b82f6'),
                    getColor('--primary-700', '#b91c1c'),
                    getColor('--gray-800', '#334155'),
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución por Estatus',
                    color: getColor('--gray-900', '#1e293b')
                },
                legend: {
                    labels: {
                        color: getColor('--gray-800', '#334155')
                    }
                }
            }
        }
    });

    const conversionCtx = document.getElementById('conversionChart').getContext('2d');
    if (conversionChart) {
        conversionChart.destroy();
    }
    const totalContacted = allProspects.filter(p =>
        ['Interesado', 'No contesta', 'Rechazado', 'Completado', 'Convertido a cliente'].includes(p.status) || ['Ya es nuestro cliente', 'Convertido a cliente'].includes(p.contactResult)
    ).length;
    const unsuccessful = statusCounts['No contesta'] + statusCounts['Rechazado'];

    conversionChart = new Chart(conversionCtx, {
        type: 'bar',
        data: {
            labels: ['Cliente convertido', 'Ya es nuestro cliente', 'Sin Éxito', 'En Proceso'],
            datasets: [{
                label: 'Cantidad',
                data: [
                    statusCounts['Cliente convertido'],
                    statusCounts['Ya es nuestro cliente'],
                    unsuccessful,
                    allProspects.length - totalContacted
                ],
                backgroundColor: [
                    '#22c55e', // verde para convertido
                    '#16a34a', // verde más oscuro para ya es nuestro cliente
                    getColor('--primary-500', '#ef4444'),
                    getColor('--gray-600', '#64748b')
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Resultados de Prospección',
                    color: getColor('--gray-900', '#1e293b')
                },
                legend: {
                    labels: {
                        color: getColor('--gray-800', '#334155')
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getColor('--gray-800', '#334155')
                    },
                    grid: {
                        color: getColor('--gray-200', '#e5e7eb')
                    }
                },
                x: {
                    ticks: {
                        color: getColor('--gray-800', '#334155')
                    },
                    grid: {
                        color: getColor('--gray-200', '#e5e7eb')
                    }
                }
            }
        }
    });
};

// ===== MEJORAS VISUALES ADICIONALES =====

const addHoverEffects = () => {
    requestAnimationFrame(() => {
        document.querySelectorAll('.prospect-card').forEach(card => {
            if (!card.dataset.hoverListener) {
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-8px) scale(1.02)';
                    this.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
                });
                
                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0) scale(1)';
                    this.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                });
                card.dataset.hoverListener = 'true';
            }
        });
        
        document.querySelectorAll('.btn-primary').forEach(button => {
            if (!button.dataset.hoverListener) {
                button.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-3px)';
                    this.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                });
                
                button.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                });
                button.dataset.hoverListener = 'true';
            }
        });
    });
};

const addEntryAnimations = () => {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.remove('is-animating');
                entry.target.classList.add('animate-fadeIn');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.prospect-card, .chart-container, #admin-screen > div:not([id="login-form-container"]):not([id="role-selection-buttons"])').forEach(el => {
        if (!el.classList.contains('animate-fadeIn')) {
            el.classList.add('is-animating');
            observer.observe(el);
        }
    });
};

const enhanceVisualFeedback = () => {
    document.querySelectorAll('button').forEach(button => {
        if (!button.dataset.rippleListener) {
            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple');
                
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
            button.dataset.rippleListener = 'true';
        }
    });
};

const enhanceNavigation = () => {
    const updateActiveNavigation = () => {
        document.querySelectorAll('[id*="nav-to"], [id*="button"]').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (!elements.loginScreen.classList.contains('hidden')) {
            // No hay botón activo en la pantalla de login
        } else if (!elements.adminScreen.classList.contains('hidden')) {
            elements.adminButton?.classList.add('active');
            elements.navToAdminFromProspectorBtn?.classList.add('active');
            elements.navToAdminFromArchiveBtn?.classList.add('active');
        } else if (!elements.prospectorScreen.classList.contains('hidden')) {
            elements.prospectorButton?.classList.add('active');
            elements.navToProspectorFromAdminBtn?.classList.add('active');
            elements.navToProspectorFromArchiveBtn?.classList.add('active');
        } else if (!elements.archiveScreen.classList.contains('hidden')) {
            elements.archiveButton?.classList.add('active');
            elements.navToArchiveFromAdminBtn?.classList.add('active');
            elements.navToArchiveFromProspectorBtn?.classList.add('active');
        }
    };
    
    const screenObserver = new MutationObserver(updateActiveNavigation);
    
    ['login-screen', 'admin-screen', 'prospector-screen', 'archive-screen'].forEach(screenId => {
        const screen = document.getElementById(screenId);
        if (screen) {
            screenObserver.observe(screen, { attributes: true, attributeFilter: ['class'] });
        }
    });

    updateActiveNavigation();
};

const addParallaxEffects = () => {
    let ticking = false;
    
    const updateParallax = () => {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.parallax-element');
        
        parallaxElements.forEach(element => {
            const speed = parseFloat(element.dataset.speed) || 0.5;
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
        
        ticking = false;
    };
    
    const requestTick = () => {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    };
    
    window.addEventListener('scroll', requestTick);
    requestTick();
};

const enhanceAccessibility = () => {
    document.body.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    document.body.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-navigation');
    });
    
    document.querySelectorAll('button:not([aria-label]), a:not([aria-label])').forEach(element => {
        if (element.textContent && element.textContent.trim() !== '') {
            element.setAttribute('aria-label', element.textContent.trim());
        } else if (element.querySelector('[class*="fa-"]') && element.querySelector('[class*="fa-"]').title) {
            element.setAttribute('aria-label', element.querySelector('[class*="fa-"]').title);
        }
    });
};

// Inicializar la aplicación cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    console.log("Contenido del DOM cargado. Inicializando aplicación.");
    // initInteractiveBackground(); // Eliminado - ahora usamos fondo estático tipo manus.im

    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(toastContainer);
    }
    
    setTimeout(() => {
        addHoverEffects();
        addEntryAnimations();
        enhanceVisualFeedback();
        enhanceNavigation();
        addParallaxEffects();
        enhanceAccessibility();
        
        console.log('🎨 Mejoras visuales aplicadas correctamente');
    }, 500);
});

// Helper para color de borde
function getStatusBadgeColor(status) {
  switch (status) {
    case 'Pendiente de Correo': return '#f59e0b';
    case 'En Prospección': return '#3b82f6';
    case 'Pendiente de Validación': return '#f59e0b';
    case 'Interesado': return '#10b981';
    case 'No contesta': return '#666666';
    case 'Rechazado': return '#dc2626';
    case 'Seguimiento agendado': return '#000000';
    case 'Reactivar Contacto': return '#ef4444';
    case 'Completado': return '#10b981';
    default: return '#ef4444';
  }


// --- Renderizar calendario semanal de reagendados ---
function renderProspectingCalendar() {
    const calendarGrid = document.getElementById('prospecting-calendar-grid');
    if (!calendarGrid) return;
    
    // Limpiar el grid
    calendarGrid.innerHTML = '';

    // Obtener inicio y fin de la semana actual
    const today = new Date();
    const startOfWeek = getStartOfWeek(today);
    const daysOfWeek = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(day.getDate() + i);
        daysOfWeek.push(day);
    }

    // Filtrar prospectos reagendados para esta semana
    const weekProspects = allProspects.filter(p =>
        p.status === 'Seguimiento agendado' && isWithinCurrentWeek(p.reagendadoPara)
    );

    // Agrupar prospectos por día
    const prospectsByDay = {};
    daysOfWeek.forEach(day => {
        const key = day.toISOString().split('T')[0];
        prospectsByDay[key] = [];
    });
    weekProspects.forEach(p => {
        const key = p.reagendadoPara;
        if (prospectsByDay[key]) {
            prospectsByDay[key].push(p);
        }
    });

    // Renderizar cada día
    daysOfWeek.forEach(day => {
        const key = day.toISOString().split('T')[0];
        const isToday = (new Date().toDateString() === day.toDateString());
        const dayName = day.toLocaleDateString('es-MX', { weekday: 'short' });
        const dayNum = day.getDate();
        const prospects = prospectsByDay[key] || [];
        let html = `<div class="calendar-day${isToday ? ' calendar-today' : ''}">
            <div class="calendar-day-header font-bold mb-2 flex items-center gap-2">
                <span>${dayName.charAt(0).toUpperCase() + dayName.slice(1)}</span>
                <span class="text-xs text-slate-500">${dayNum}</span>
                ${isToday ? '<span class="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded">Hoy</span>' : ''}
            </div>`;
        if (prospects.length === 0) {
            html += `<div class="text-slate-400 text-sm">Sin prospectos</div>`;
        } else {
            html += '<ul class="space-y-2">';
            prospects.forEach(p => {
                html += `<li>
                    <button class="calendar-prospect-btn w-full text-left bg-white border border-slate-200 rounded px-2 py-1 hover:bg-red-50 transition" data-id="${p.id}">
                        <span class="font-semibold">${p.businessName}</span><br>
                        <span class="text-xs text-slate-500">${p.contactPerson || ''}</span>
                    </button>
                </li>`;
            });
            html += '</ul>';
        }
        html += '</div>';
        calendarGrid.insertAdjacentHTML('beforeend', html);
    });

    // Listeners para abrir modal de detalles
    calendarGrid.querySelectorAll('.calendar-prospect-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const prospectId = btn.getAttribute('data-id');
            showProspectDetailsModal(prospectId);
        });
    });
}

// Llamar al renderizado del calendario después de renderProspectorCards
const originalRenderProspectorCards = renderProspectorCards;
renderProspectorCards = function() {
    originalRenderProspectorCards.apply(this, arguments);
    renderProspectingCalendar();
};

// --- Filtros y renderizado mejorado para la sección de prospección ---
function isBusinessDay(date) {
    const day = date.getDay();
    return day !== 0 && day !== 6;
}
function getLastNBusinessDays(n) {
    const days = [];
    let date = new Date();
    while (days.length < n) {
        if (isBusinessDay(date)) {
            days.push(date.toISOString().split('T')[0]);
        }
        date.setDate(date.getDate() - 1);
    }
    return days;
}
function isContactedThisMonth(prospect) {
    if (!prospect.followUpNotes || prospect.followUpNotes.length === 0) return false;
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return prospect.followUpNotes.some(note => {
        const noteDate = new Date(note.timestamp);
        return noteDate.getMonth() === month && noteDate.getFullYear() === year;
    }) || (prospect.contactResult && new Date(prospect.lastUpdated).getMonth() === month && new Date(prospect.lastUpdated).getFullYear() === year);
}
function isRecent(prospect, recentDays) {
    if (!prospect.createdAt) return false;
    const lastBusinessDays = getLastNBusinessDays(recentDays);
    const created = prospect.createdAt.split('T')[0];
    return lastBusinessDays.includes(created);
}
function isReagendadoEstaSemana(prospect) {
    return prospect.status === 'Seguimiento agendado' && isWithinCurrentWeek(prospect.reagendadoPara);
}
function isNoContactado(prospect) {
    // Considera no contactado si no tiene followUpNotes ni contactResult
    return (!prospect.followUpNotes || prospect.followUpNotes.length === 0) && !prospect.contactResult;
}

// Rediseño: renderProspectorCards separa reagendados de esta semana y no contactados
// Rediseño: renderProspectorCards separa reagendados de esta semana y no contactados
renderProspectorCards = function() {
    // Filtrar datos
    const filteredProspects = allProspects.filter(p => p.assignedTo === currentUserId || p.prospectorId === currentUserId);
    const reagendadosSemana = filteredProspects.filter(isReagendadoEstaSemana);
    const noContactados = filteredProspects.filter(isNoContactado);

    // Renderizar reagendados
    const reagendadosContainer = document.getElementById('prospector-reagendados-cards-container');
    const noReagendadosDiv = document.getElementById('prospector-no-reagendados');
    reagendadosContainer.innerHTML = '';
    if (reagendadosSemana.length > 0) {
        reagendadosSemana.forEach(prospect => {
            reagendadosContainer.insertAdjacentHTML('beforeend', createProspectCardHTML(prospect, false, false, true));
        });
        noReagendadosDiv.classList.add('hidden');
    } else {
        noReagendadosDiv.classList.remove('hidden');
    }

    // Renderizar no contactados
    const nocontactContainer = document.getElementById('prospector-nocontact-cards-container');
    const noNocontactDiv = document.getElementById('prospector-no-nocontact');
    nocontactContainer.innerHTML = '';
    if (noContactados.length > 0) {
        noContactados.forEach(prospect => {
            nocontactContainer.insertAdjacentHTML('beforeend', createProspectCardHTML(prospect, false, false, false));
        });
        noNocontactDiv.classList.add('hidden');
    } else {
        noNocontactDiv.classList.remove('hidden');
    }

    attachProspectorCardEventListeners();
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    addEntryAnimations();
    addHoverEffects();
    renderProspectingCalendar();
// End of renderProspectorCards override
// Modificar createProspectCardHTML para aceptar un cuarto parámetro (isReagendado) y aplicar la clase y etiqueta visual
const originalCreateProspectCardHTML = createProspectCardHTML;
createProspectCardHTML = function(prospect, isAdminView = false, isArchiveView = false, isReagendado = false) {
    let card = originalCreateProspectCardHTML(prospect, isAdminView, isArchiveView);
    if (isReagendado) {
        card = card.replace('prospect-card', 'prospect-card reagendado');
        card = card.replace('<div class="card-header">', '<div class="card-header"><span class="reagendado-label">REAGENDADO</span>');
    }
    return card;
};
// Mostrar/ocultar input de días recientes según filtro
const statusFilterEl = document.getElementById('prospectorStatusFilter');
const recentDaysContainer = document.getElementById('prospectorRecentDateContainer');
if (statusFilterEl && recentDaysContainer) {
    statusFilterEl.addEventListener('change', () => {
        if (statusFilterEl.value === 'recent') {
            recentDaysContainer.style.display = '';
        } else {
            recentDaysContainer.style.display = 'none';
        }
        renderProspectorCards();
    });
}
const recentDaysInput = document.getElementById('prospectorRecentDays');
if (recentDaysInput) {
    recentDaysInput.addEventListener('input', () => {
        renderProspectorCards();
    });
}
