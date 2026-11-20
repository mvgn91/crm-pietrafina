// dashboard-script.js

import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { subscribeToProspects } from "./api.js";
import { renderStatsCards, renderProspectsByStatusChart, renderProspectsOverTimeChart, renderProspectsStatus } from "./ui.js";

// Estado global para la data
let allProspects = [];
let prospectsUnsubscribe = null;
let prospectsListenerAlive = false;
let hasLoadedProspects = false;

/**
 * Procesa los datos de los prospectos para calcular las estadísticas clave.
 * @param {Array} prospects - El array de todos los prospectos.
 * @returns {Object} Un objeto con las estadísticas calculadas.
 */
function calculateStats(prospects) {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalProspects = prospects.length;
    
    const newThisMonth = prospects.filter(p => {
        const creationDate = new Date(p.creationDate);
        return creationDate >= firstDayOfMonth;
    }).length;

    const convertedProspects = prospects.filter(p => p.status.toLowerCase().includes('convertido')).length;

    const conversionRate = totalProspects > 0 ? ((convertedProspects / totalProspects) * 100).toFixed(1) : 0;

    return {
        totalProspects,
        newThisMonth,
        convertedProspects,
        conversionRate
    };
}


/**
 * Inicializa el Dashboard, suscribiéndose a los datos y renderizando los componentes.
 * Cierra la suscripción anterior antes de abrir una nueva para no acumular listeners.
 */
function initializeDashboard() {
    if (prospectsUnsubscribe) prospectsUnsubscribe();
    prospectsListenerAlive = true;
    if (!hasLoadedProspects) renderProspectsStatus("Cargando prospectos…");

    prospectsUnsubscribe = subscribeToProspects((prospects) => {
        prospectsListenerAlive = true;
        hasLoadedProspects = true;
        allProspects = prospects;

        // 1. Calcular y renderizar las tarjetas de estadísticas
        const stats = calculateStats(allProspects);
        renderStatsCards(stats);

        // 2. Renderizar la gráfica de prospectos por estatus
        renderProspectsByStatusChart(allProspects);
        
        // 3. Renderizar la gráfica de prospectos a lo largo del tiempo
        renderProspectsOverTimeChart(allProspects);
    }, handleProspectsError);
}

function handleProspectsError(error, info) {
    prospectsListenerAlive = false;
    const segundos = info?.retryInMs ? Math.ceil(info.retryInMs / 1000) : null;
    renderProspectsStatus(
        segundos
            ? `Sin conexión con el servidor. Reintentando en ${segundos} s…`
            : "Sin conexión con el servidor. Reintentando…",
        { isError: true },
    );
}

function reconnectDashboardIfNeeded() {
    if (!auth.currentUser) return;
    if (allProspects.length === 0 || !prospectsListenerAlive) initializeDashboard();
}

// Listener de autenticación para iniciar la app
onAuthStateChanged(auth, (user) => {
    if (user) {
        initializeDashboard();
    } else {
        if (prospectsUnsubscribe) prospectsUnsubscribe();
        prospectsUnsubscribe = null;
        prospectsListenerAlive = false;
        window.location.href = 'index.html';
    }
});

// Retomar la pestaña tras suspensión / pérdida de red: reconectar si hace falta.
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") reconnectDashboardIfNeeded();
});
window.addEventListener("online", reconnectDashboardIfNeeded);
