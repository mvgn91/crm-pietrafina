// dashboard-script.js

import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { subscribeToProspects } from "./api.js";
import { renderStatsCards, renderProspectsByStatusChart, renderProspectsOverTimeChart } from "./ui.js";

// Estado global para la data
let allProspects = [];

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
 */
function initializeDashboard() {
    subscribeToProspects((prospects) => {
        allProspects = prospects;
        
        // 1. Calcular y renderizar las tarjetas de estadísticas
        const stats = calculateStats(allProspects);
        renderStatsCards(stats);

        // 2. Renderizar la gráfica de prospectos por estatus
        renderProspectsByStatusChart(allProspects);
        
        // 3. Renderizar la gráfica de prospectos a lo largo del tiempo
        renderProspectsOverTimeChart(allProspects);
    });
}

// Listener de autenticación para iniciar la app
onAuthStateChanged(auth, (user) => {
    if (user) {
        initializeDashboard();
    } else {
        window.location.href = 'index.html';
    }
});
