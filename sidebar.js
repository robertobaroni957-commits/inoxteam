/* ====================================
   FILE: sidebar.js
   ==================================== */

(function() {
    const sidebar = document.getElementById('sidebar');
    const toggleButton = document.getElementById('menu-toggle');
    const overlay = document.getElementById('sidebar-overlay');
    const menuIconOpen = document.getElementById('menu-icon-open');
    const menuIconClose = document.getElementById('menu-icon-close');
    const body = document.body;

    if (!sidebar || !toggleButton) return;

    const openSidebar = () => {
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
        // Aggiungo le classi per rendere visibile e cliccabile l'overlay
        // NOTA: 'opacity-50' è una classe Tailwind che deve essere definita nel tuo setup!
        overlay.classList.add('opacity-50', 'pointer-events-auto'); 
        overlay.classList.remove('pointer-events-none');
        body.classList.add('no-scroll');
        menuIconOpen.classList.add('hidden');
        menuIconClose.classList.remove('hidden');
    };

    const closeSidebar = () => {
        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('-translate-x-full');
        // Rimuovo le classi per nascondere e rendere non cliccabile l'overlay
        overlay.classList.remove('opacity-50', 'pointer-events-auto');
        overlay.classList.add('pointer-events-none');
        body.classList.remove('no-scroll');
        menuIconOpen.classList.remove('hidden');
        menuIconClose.classList.add('hidden');
    };

    toggleButton.addEventListener('click', () => {
        if (sidebar.classList.contains('translate-x-0')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    overlay.addEventListener('click', closeSidebar);

    document.querySelectorAll('#sidebar a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 1024) closeSidebar();
        });
    });

    window.addEventListener('resize', () => {
        // Chiude la sidebar quando si passa alla visualizzazione desktop
        if (window.innerWidth >= 1024) closeSidebar();
    });
})();