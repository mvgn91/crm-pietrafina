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

    // --- Poblar Información de Usuario ---
    // Se asume que el nombre de usuario se guarda en sessionStorage al hacer login
    const userName = sessionStorage.getItem('pf_currentUserName') || 'Usuario';
    const sidebarUserName = document.getElementById('sidebar-user-name');
    const userAvatar = document.getElementById('user-avatar-initials');

    if (sidebarUserName) {
        sidebarUserName.textContent = userName;
    }
    if (userAvatar && userName && userName !== 'Usuario') {
        userAvatar.textContent = userName.charAt(0).toUpperCase();
    }
    
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
