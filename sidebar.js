(function() {
    const sidebar = document.getElementById('sidebar');
    const toggleButton = document.getElementById('menu-toggle');
    const overlay = document.getElementById('sidebar-overlay');
    const menuIconOpen = document.getElementById('menu-icon-open');
    const menuIconClose = document.getElementById('menu-icon-close');
    const body = document.body;

    if (!sidebar || !toggleButton) return;

    const openSidebar = () => {
        sidebar.classList.add('sidebar-open');
        overlay.classList.add('opacity-50', 'pointer-events-auto');
        overlay.classList.remove('pointer-events-none');
        body.classList.add('no-scroll');
        menuIconOpen.classList.add('hidden');
        menuIconClose.classList.remove('hidden');
    };

    const closeSidebar = () => {
        sidebar.classList.remove('sidebar-open');
        overlay.classList.remove('opacity-50', 'pointer-events-auto');
        overlay.classList.add('pointer-events-none');
        body.classList.remove('no-scroll');
        menuIconOpen.classList.remove('hidden');
        menuIconClose.classList.add('hidden');
    };

    // Toggle intelligente
    toggleButton.addEventListener('click', () => {
        if (sidebar.classList.contains('sidebar-open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    // Chiudi cliccando sull'overlay
    overlay.addEventListener('click', closeSidebar);

    // Chiudi dopo un click nella sidebar
    document.querySelectorAll('#sidebar a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 1024) closeSidebar();
        });
    });

    // Reset su desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) closeSidebar();
    });
})();
