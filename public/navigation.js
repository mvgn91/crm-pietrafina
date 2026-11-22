import { auth, getAppDisplayName } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

// La barra lateral debe mostrar nombre/correo reales, nunca "Cargando...".
// Se pinta de inmediato con el último nombre conocido y se corrige cuando
// Firebase resuelve la sesión (puede tardar más que DOMContentLoaded).
function renderUser(user, resolved = true) {
    const cached = (() => { try { return sessionStorage.getItem('pf_currentUserName') || ''; } catch { return ''; } })();
    const name = user
        ? getAppDisplayName(user) || user.email || cached || 'Sin sesión'
        : (cached || 'Sin sesión');
    const email = user?.email || '';
    for (const id of ['sidebar-user-name', 'user-name-display']) {
        const element = document.getElementById(id);
        if (element) element.textContent = name;
    }
    // El id del HTML es `user-initials` (antes se buscaba `user-avatar-initials`).
    const avatar = document.getElementById('user-initials') || document.getElementById('user-avatar-initials');
    if (avatar) avatar.textContent = (name || '?').charAt(0).toUpperCase();
    const role = document.getElementById('user-role-display');
    if (role) role.textContent = email;
    try {
        if (user) sessionStorage.setItem('pf_currentUserName', name);
        // El render inicial usa la caché; sólo la limpia Firebase cuando
        // confirma que no hay sesión (o el logout explícito).
        else if (resolved) sessionStorage.removeItem('pf_currentUserName');
    } catch {}
}

document.addEventListener('DOMContentLoaded', () => {
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const overlays = document.querySelectorAll('.page-overlay, #sidebar-overlay');
    const logoutBtn = document.getElementById('logout-btn');
    const body = document.body;

    // Nombre cacheado mientras llega la sesión: evita el "Cargando..." quieto.
    renderUser(null, false);

    // --- Funcionalidad del Sidebar ---
    const toggleSidebar = () => {
        body.classList.toggle('sidebar-open');
    };
    const closeSidebar = () => {
        body.classList.remove('sidebar-open');
    };

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    }
    if (menuToggleBtn) {
        menuToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    }
    // Cada vista usa un overlay distinto: unas `.page-overlay`, otras
    // `#sidebar-overlay`. Los dos deben cerrar el menú en móvil.
    overlays.forEach((overlay) => overlay.addEventListener('click', closeSidebar));

    // --- Marcar Link Activo ---
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        // Los href del sidebar llevan `./`; el pathname no. Sin quitar el
        // prefijo ningún enlace se marcaba como activo.
        const href = (link.getAttribute('href') || '').replace(/^\.\//, '');
        if (href === currentPage) {
            link.classList.add('bg-gray-100', 'text-gray-900');
            link.classList.remove('text-gray-600');
            link.setAttribute('aria-current', 'page');
        } else {
            link.classList.add('text-gray-600');
            link.classList.remove('bg-gray-100', 'text-gray-900');
            link.removeAttribute('aria-current');
        }
        // En móvil el menú se cierra al elegir una vista.
        link.addEventListener('click', closeSidebar);
    });

    // Firebase may resolve after DOMContentLoaded: update when auth is ready.
    onAuthStateChanged(auth, (user) => renderUser(user, true));

    // --- Lógica de Logout ---
    if (logoutBtn) {
         logoutBtn.addEventListener("click", () => {
            import("https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js")
                .then(authModule => {
                    import("./firebase.js").then(firebaseModule => {
                        authModule.signOut(firebaseModule.auth).then(() => {
                            // Limpiar datos de sesión antes de redirigir
                            sessionStorage.removeItem('pf_currentUserName');
                            window.location.href = "index.html";
                        });
                    });
                });
        });
    }

    // --- Inicializar Iconos ---
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});
