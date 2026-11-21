import { auth, getAppDisplayName } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

function renderUser(user) {
    const name = user ? getAppDisplayName(user) : 'Sin sesión';
    for (const id of ['sidebar-user-name', 'user-name-display']) {
        const element = document.getElementById(id);
        if (element) element.textContent = name;
    }
    const avatar = document.getElementById('user-avatar-initials');
    if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
    try {
        if (user) sessionStorage.setItem('pf_currentUserName', name);
        else sessionStorage.removeItem('pf_currentUserName');
    } catch {}
}

document.addEventListener('DOMContentLoaded', () => {
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const pageOverlay = document.querySelector('.page-overlay');
    const logoutBtn = document.getElementById('logout-btn');
    const body = document.body;

    // --- Funcionalidad del Sidebar ---
    const toggleSidebar = () => {
        body.classList.toggle('sidebar-open');
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
    if (pageOverlay) {
        pageOverlay.addEventListener('click', () => {
            if (body.classList.contains('sidebar-open')) toggleSidebar();
        });
    }

    // --- Marcar Link Activo ---
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        const href = link.getAttribute('href') || '';
        if (href === currentPage) {
            link.classList.add('bg-gray-100', 'text-gray-900');
            link.classList.remove('text-gray-600');
        } else {
            link.classList.add('text-gray-600');
            link.classList.remove('bg-gray-100', 'text-gray-900');
        }
    });

    // Firebase may resolve after DOMContentLoaded: update when auth is ready.
    onAuthStateChanged(auth, renderUser);

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
