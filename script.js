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
});

// Importa las funciones necesarias de los SDKs de Firebase (v11.6.1)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword, browserLocalPersistence, setPersistence } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
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

// Variables para el calendario semanal
let currentWeekStart = null;
let selectedCalendarDate = null;
let filteredProspects = [];

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
    whatsappCancelBtn: document.getElementById('whatsappCancelBtn'),
    whatsappModal: document.getElementById('whatsapp-modal'),
    whatsappModalClose: document.getElementById('whatsapp-modal-close'),
    whatsappModalMessage: document.getElementById('whatsapp-modal-message'),
    whatsappModalSendBtn: document.getElementById('whatsapp-modal-send-btn'),
    whatsappModalCancelBtn: document.getElementById('whatsapp-modal-cancel-btn'),
    whatsappValidatedBtn: document.getElementById('whatsapp-validated-btn'),
    whatsappNoWhatsappBtn: document.getElementById('whatsapp-no-whatsapp-btn'),
    validateAllWhatsappBtn: document.getElementById('validate-all-whatsapp-btn'),
    validateAllWhatsappProspectorBtn: document.getElementById('validate-all-whatsapp-prospector-btn'),
    refreshDataBtn: document.getElementById('refresh-data-btn'),
    refreshDataProspectorBtn: document.getElementById('refresh-data-prospector-btn'),
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

    const loginButton = e.submitter;
    const originalButtonText = loginButton.innerHTML;
    showLoading(loginButton, 'Iniciando Sesión...');

    try {
        // Configurar persistencia local primero
        await setPersistence(auth, browserLocalPersistence);
        
        // Intentar login demo primero
        if (await handleDemoLogin(email, password)) {
            return;
        }

        // Si no es demo, intentar login normal
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

// Event listeners para botones de selección de rol
elements.adminButton.addEventListener('click', () => {
    if (currentUserRole === 'admin') {
        showScreen('admin');
        checkAndExpireProspects();
    } else {
        showToast('Permiso Denegado', 'Esta acción es solo para administradores.', 'error');
    }
});

elements.prospectorButton.addEventListener('click', () => {
    if (currentUserRole === 'prospector' || currentUserRole === 'admin') {
        showScreen('prospector');
        checkAndExpireProspects();
    } else {
        showToast('Permiso Denegado', 'No tienes permisos para acceder a esta sección.', 'error');
    }
});

elements.archiveButton.addEventListener('click', () => {
    if (currentUserRole === 'prospector' || currentUserRole === 'admin') {
        showScreen('archive');
    } else {
        showToast('Permiso Denegado', 'No tienes permisos para acceder a esta sección.', 'error');
    }
});

// Event listeners para botones de navegación entre pantallas
elements.navToProspectorFromAdminBtn.addEventListener('click', () => showScreen('prospector'));
elements.navToAdminFromProspectorBtn.addEventListener('click', () => {
    if (currentUserRole === 'admin') {
        showScreen('admin');
    } else {
        showToast('Permiso Denegado', 'Solo los administradores pueden acceder a la gestión de base de datos.', 'error');
    }
});
elements.navToArchiveFromAdminBtn.addEventListener('click', () => {
    if (currentUserRole === 'admin') {
        showScreen('archive');
    } else {
        showToast('Permiso Denegado', 'No tienes permisos para acceder a esta sección.', 'error');
    }
});
elements.navToArchiveFromProspectorBtn.addEventListener('click', () => {
    if (currentUserRole === 'prospector' || currentUserRole === 'admin') {
        showScreen('archive');
    } else {
        showToast('Permiso Denegado', 'No tienes permisos para acceder a esta sección.', 'error');
    }
});

elements.backToRoleSelectionAdminBtn.addEventListener('click', () => showScreen('login'));
elements.backToRoleSelectionProspectorBtn.addEventListener('click', () => showScreen('login'));
elements.backToRoleSelectionArchiveBtn.addEventListener('click', () => showScreen('login'));

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
            
            // Validar automáticamente números de WhatsApp para prospectos nuevos
            validateNewProspectsWhatsApp();
            
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
    switch (status) {
        case 'Pendiente de Correo': return 'status-badge pending-email';
        case 'En Prospección': return 'status-badge in-prospecting';
        case 'Pendiente de Validación': return 'status-badge pending-validation';
        case 'Interesado': return 'status-badge interesado';
        case 'No contesta': return 'status-badge no-answer';
        case 'Rechazado': return 'status-badge rejected';
        case 'Seguimiento agendado': return 'status-badge rescheduled';
        case 'Reactivar Contacto': return 'status-badge reactivate';
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
    if (prospect.reagendadoPara && prospect.status === 'Seguimiento reagendado') {
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
      whatsappTag = `<span class="whatsapp-tag whatsapp-tag-validated">VALIDADA</span>`;
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
          ${prospect.phone}
          <div class="flex items-center gap-2">
            ${whatsappTag}
            <button class="whatsapp-status-toggle" data-prospect-id="${prospect.id}" title="Cambiar estado de WhatsApp">
              <i data-lucide="edit-3" class="w-3 h-3 text-gray-500 hover:text-blue-600"></i>
            </button>
          </div>
        </div>
        <div class="card-date"><span class="label">${fechaLabel}</span> ${fecha}</div>
        <div class="card-actions">
          <button data-id="${prospect.id}" class="btn btn-whatsapp whatsapp-btn"><i data-lucide="message-circle" class="w-4 h-4 mr-2"></i> WhatsApp</button>
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
            const dueDate = addBusinessDays(today, 7).toISOString().split('T')[0];
            updateData.prospectingDueDate = dueDate;
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
        pendienteValidacion: allProspects.filter(p => p.status === 'Pendiente de Validación').length
    };

    const conversionRateValue = counts.total > 0 ? ((counts.interesado / counts.total) * 100).toFixed(1) : 0;

    if (elements.totalProspectsCount) elements.totalProspectsCount.textContent = counts.total;
    if (elements.enProspeccionCount) elements.enProspeccionCount.textContent = counts.enProspeccion + counts.pendienteValidacion;
    if (elements.interesadoCount) elements.interesadoCount.textContent = counts.interesado;
    if (elements.conversionRate) elements.conversionRate.textContent = `${conversionRateValue}%`;
};

// --- Gráficos del Dashboard ---
const updateDashboard = () => {
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
    if (elements.detailProspectingDueDate) elements.detailProspectingDueDate.textContent = formatDate(prospect.prospectingDueDate);
    if (elements.detailContactedBy) elements.detailContactedBy.textContent = prospect.assignedByName || 'No asignado';
    if (elements.detailObservations) elements.detailObservations.textContent = prospect.observations || 'Sin observaciones';

    // Mostrar días restantes
    if (elements.detailRemainingDays) {
        elements.detailRemainingDays.textContent = getRemainingBusinessDays(prospect.prospectingDueDate, prospect.reagendadoPara);
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

    // Mostrar áreas de acción según el rol y estado
    showModalActionAreas(prospect);

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

    // Mostrar área de prospector si está en prospección
    if ((prospect.status === 'En Prospección' || prospect.status === 'Seguimiento agendado') && 
        (currentUserRole === 'prospector' || currentUserRole === 'admin')) {
        if (elements.prospectorActionArea) elements.prospectorActionArea.classList.remove('hidden');
    }

    // Mostrar área de reagendamiento si el usuario puede reagendar
    if (canUserReschedule(currentUserId, currentUserRole, currentUserName)) {
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
        // Limpiar el número de teléfono (remover espacios, guiones, etc.)
        const cleanNumber = phoneNumber.replace(/\D/g, '');
        
        // Si el número no tiene código de país, asumir México (+52)
        let formattedNumber = cleanNumber;
        if (!cleanNumber.startsWith('52') && cleanNumber.length === 10) {
            formattedNumber = '52' + cleanNumber;
        } else if (cleanNumber.length === 10) {
            formattedNumber = '52' + cleanNumber;
        }
        
        // Verificar formato básico del número
        const isValidFormat = formattedNumber.length >= 12 && formattedNumber.length <= 15;
        
        if (!isValidFormat) {
            return false;
        }
        
        // Llamar al microservicio de WhatsApp
        const response = await fetch(`http://localhost:3000/check-whatsapp/${formattedNumber}`);
        
        if (!response.ok) {
            console.error('Error en la respuesta del microservicio:', response.status);
            return false;
        }
        
        const data = await response.json();
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
 * Valida automáticamente prospectos nuevos que no tienen validación de WhatsApp
 */
const validateNewProspectsWhatsApp = async () => {
    try {
        // Filtrar prospectos que no tienen validación de WhatsApp
        const prospectsToValidate = allProspects.filter(p => 
            p.phone && p.whatsappValidated === undefined
        );
        
        if (prospectsToValidate.length === 0) {
            return; // No hay prospectos para validar
        }
        
        console.log(`Validando automáticamente ${prospectsToValidate.length} prospectos nuevos...`);
        
        // Validar solo los primeros 5 prospectos para no sobrecargar
        const prospectsToProcess = prospectsToValidate.slice(0, 5);
        
        for (const prospect of prospectsToProcess) {
            try {
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
                
                // Pequeña pausa entre validaciones
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(`Error validando prospecto ${prospect.id}:`, error);
                // Continuar con el siguiente prospecto
            }
        }
        
        console.log('Validación automática completada');
        
    } catch (error) {
        console.error('Error en validación automática de prospectos nuevos:', error);
    }
};

/**
 * Función para hacer solo refresh de datos sin verificación de WhatsApp
 */
const refreshDataOnly = async () => {
    try {
        showToast('🔄 Actualizando datos desde la base de datos...', 'info');
        
        const success = await refreshProspectsFromDatabase();
        
        if (success) {
            showToast('✅ Datos actualizados correctamente desde la base de datos', 'success');
        } else {
            showToast('❌ Error al actualizar datos', 'error');
        }
        
    } catch (error) {
        console.error('Error en refresh de datos:', error);
        showToast('❌ Error al actualizar datos', 'error');
    }
};

/**
 * Muestra modal de confirmación manual para WhatsApp
 */
const showWhatsAppConfirmationModal = (prospect) => {
    const modalTitle = 'Confirmar Estado de WhatsApp';
    const modalMessage = `
        <div class="text-center">
            <p class="mb-4">Número: <strong>${prospect.phone}</strong></p>
            <p class="mb-4">¿Este número tiene WhatsApp disponible?</p>
            <div class="flex justify-center gap-4 mt-6">
                <button id="confirm-whatsapp-yes" class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <i class="fas fa-check mr-2"></i> Sí, tiene WhatsApp
                </button>
                <button id="confirm-whatsapp-no" class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    <i class="fas fa-times mr-2"></i> No tiene WhatsApp
                </button>
            </div>
        </div>
    `;
    
    showConfirmModal(
        modalTitle,
        modalMessage,
        null, // No action needed, buttons will handle it
        'Cancelar',
        'btn-secondary'
    );
    
    // Agregar event listeners a los botones
    setTimeout(() => {
        const yesBtn = document.getElementById('confirm-whatsapp-yes');
        const noBtn = document.getElementById('confirm-whatsapp-no');
        
        if (yesBtn) {
            yesBtn.onclick = () => {
                updateWhatsAppStatus(prospect.id, true);
                hideConfirmModal();
            };
        }
        
        if (noBtn) {
            noBtn.onclick = () => {
                updateWhatsAppStatus(prospect.id, false);
                hideConfirmModal();
            };
        }
    }, 100);
};

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
        elements.whatsappValidatedBtn.innerHTML = '<i class="fas fa-check mr-1"></i> VALIDADO';
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
    message += `Adjunto el material previamente acordado:\n\n`;
    
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
            message += `*${material.name}*\n${material.url}\n\n`;
        });
    }
    
    message += `Quedo atento a sus comentarios.\n\n`;
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

    // Limpiar y formatear número de teléfono
    const phoneNumber = prospect.phone.replace(/\D/g, '');
    
    // Validar que el número tenga al menos 10 dígitos
    if (phoneNumber.length < 10) {
        showToast('Número de teléfono inválido', 'error');
        return;
    }
    
    // Formatear según las reglas de México
    let cleanPhone = phoneNumber;
    if (phoneNumber.startsWith('52') && phoneNumber.length >= 12) {
        // Ya tiene código de país México (52)
        cleanPhone = phoneNumber;
    } else if (phoneNumber.length === 10) {
        // Número de 10 dígitos, agregar código de país México
        cleanPhone = '52' + phoneNumber;
    } else if (phoneNumber.length === 11 && phoneNumber.startsWith('1')) {
        // Número con 1 al inicio (formato antiguo), remover el 1 y agregar 52
        cleanPhone = '52' + phoneNumber.substring(1);
    } else if (phoneNumber.length === 12 && phoneNumber.startsWith('521')) {
        // Formato 521XXXXXXXXX, mantener como está
        cleanPhone = phoneNumber;
    }

    console.log('🚀 Iniciando envío de WhatsApp...');
    console.log('📱 Número final para WhatsApp:', cleanPhone);
    console.log('💬 Mensaje a enviar:', message);

    // ESTRATEGIA UNIFICADA: SIEMPRE intentar abrir la app nativa de WhatsApp
    console.log('🚀 ESTRATEGIA UNIFICADA: Intentando abrir app nativa de WhatsApp en todos los dispositivos');
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    console.log('🍎 Es iOS:', isIOS);

    try {
        // ESTRATEGIA UNIFICADA: Intentar app nativa en todos los dispositivos
        console.log('📱 Intentando abrir app nativa de WhatsApp...');
        
        let whatsappUrl = '';
        if (isIOS) {
            // Para iOS, usar whatsapp://send
            whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
            console.log('🍎 iOS detectado - usando whatsapp://send');
        } else {
            // Para Android y otros, usar intent:// para abrir la app nativa
            whatsappUrl = `intent://send/${cleanPhone}#Intent;scheme=smsto;package=com.whatsapp;S.sms_body=${encodeURIComponent(message)};end`;
            console.log('🤖 Android/otros detectado - usando intent:// para app nativa');
        }

        // Intentar abrir la app nativa
        window.location.href = whatsappUrl;
        
        // Esperar un poco para ver si la app se abre
        setTimeout(() => {
            // Si la página sigue visible, la app no se abrió
            if (!document.hidden) {
                console.warn('⚠️ App de WhatsApp no se abrió, copiando mensaje al portapapeles');
                navigator.clipboard.writeText(message).then(() => {
                    showToast('Mensaje copiado al portapapeles. Pégalo en WhatsApp.', 'info');
                }).catch(err => {
                    console.error('Error al copiar al portapapeles:', err);
                    showToast('Error al copiar mensaje al portapapeles', 'error');
                });
            } else {
                console.log('✅ App de WhatsApp abierta exitosamente');
            }
        }, 1500);
        
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
        elements.confirmModal.classList.remove('hidden');
    }
};

/**
 * Oculta el modal de confirmación
 */
const hideConfirmModal = () => {
    if (elements.confirmModal) {
        elements.confirmModal.classList.add('hidden');
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
    
    // Cerrar modales al hacer clic fuera
    [elements.detailModal, elements.confirmModal, elements.whatsappModal].forEach(modal => {
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
    
    if (elements.validateAllWhatsappProspectorBtn) {
        elements.validateAllWhatsappProspectorBtn.addEventListener('click', () => {
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
    
    if (elements.refreshDataProspectorBtn) {
        elements.refreshDataProspectorBtn.addEventListener('click', () => {
            showConfirmModal(
                'Actualizar Datos',
                '¿Deseas actualizar todos los datos desde la base de datos? Esto refrescará la información de todos los prospectos.',
                refreshDataOnly,
                'Actualizar Datos',
                'btn-info'
            );
        });
    }
    
    // Event listeners para botones de cambio de estado de WhatsApp en las tarjetas
    document.addEventListener('click', (e) => {
        if (e.target.closest('.whatsapp-status-toggle')) {
            const button = e.target.closest('.whatsapp-status-toggle');
            const prospectId = button.getAttribute('data-prospect-id');
            const prospect = allProspects.find(p => p.id === prospectId);
            
            if (prospect) {
                showWhatsAppConfirmationModal(prospect);
            }
        }
    });
};

const addHoverEffects = () => {
    // Efectos de hover para tarjetas
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
};

/**
 * Muestra el modal de reagendamiento
 */
const showRescheduleModal = () => {
    if (elements.rescheduleModal) {
        elements.rescheduleModal.classList.remove('hidden');
        
        // Inicializar Flatpickr para el selector de fecha
        if (elements.rescheduleDateInput && typeof flatpickr !== 'undefined') {
            flatpickr(elements.rescheduleDateInput, {
                dateFormat: 'Y-m-d',
                minDate: new Date(),
                locale: 'es',
                allowInput: false
            });
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
};

/**
 * Maneja la confirmación del reagendamiento
 */
const handleRescheduleConfirm = async () => {
    if (!currentProspectIdForModal) {
        showToast('No hay prospecto seleccionado', 'error');
        return;
    }
    
    const selectedDate = elements.rescheduleDateInput?.value;
    if (!selectedDate) {
        showToast('Por favor selecciona una fecha', 'error');
        return;
    }
    
    try {
        const prospectRef = doc(db, 'prospects', currentProspectIdForModal);
        await updateDoc(prospectRef, {
            reagendadoPara: selectedDate,
            status: 'Seguimiento agendado',
            lastUpdated: new Date().toISOString().split('T')[0]
        });
        
        showToast('Seguimiento reagendado exitosamente', 'success');
        hideRescheduleModal();
        
        // Actualizar calendario si está en la pantalla de prospección
        if (currentUserRole === 'prospector' || currentUserRole === 'admin') {
            renderProspectingCalendar();
        }
        
    } catch (error) {
        console.error('Error al reagendar:', error);
        showToast('Error al reagendar: ' + error.message, 'error');
    }
};

/**
 * Maneja el guardado del seguimiento
 */
const handleSaveFollowUp = async () => {
    if (!currentProspectIdForModal) {
        showToast('No hay prospecto seleccionado', 'error');
        return;
    }
    
    const followUpNotes = elements.followUpNotes?.value?.trim();
    const contactResult = elements.contactResult?.value;
    
    if (!contactResult) {
        showToast('Por favor selecciona un resultado del contacto', 'error');
        return;
    }
    
    try {
        const prospectRef = doc(db, 'prospects', currentProspectIdForModal);
        const updateData = {
            status: contactResult,
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        
        if (followUpNotes) {
            updateData.followUpNotes = followUpNotes;
        }
        
        // Si el resultado es "Seguimiento agendado", mantener la fecha de reagendamiento
        if (contactResult !== 'Seguimiento agendado') {
            updateData.reagendadoPara = null;
        }
        
        await updateDoc(prospectRef, updateData);
        
        showToast('Seguimiento guardado exitosamente', 'success');
        
        // Cerrar modal de detalles
        if (elements.detailModal) {
            elements.detailModal.classList.add('hidden');
        }
        
        // Actualizar calendario si está en la pantalla de prospección
        if (currentUserRole === 'prospector' || currentUserRole === 'admin') {
            renderProspectingCalendar();
        }
        
    } catch (error) {
        console.error('Error al guardar seguimiento:', error);
        showToast('Error al guardar seguimiento: ' + error.message, 'error');
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