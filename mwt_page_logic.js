// mwt_page_logic.js

document.addEventListener('DOMContentLoaded', () => {
    const mainNavLinks = document.querySelectorAll('.bg-zwift-card > .container > div:nth-child(2) a');
    const sidebarLinks = document.querySelectorAll('#sidebar .sidebar-link');
    const allLinks = [...mainNavLinks, ...sidebarLinks];

    const sections = document.querySelectorAll('header[id], section[id]');

    // Smooth scrolling for all internal links
    allLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const hash = this.hash;
            if (hash) {
                e.preventDefault();
                const targetElement = document.querySelector(hash);
                if (targetElement) {
                    history.pushState(null, null, hash); // Update URL hash without jumping
                    window.scrollTo({
                        top: targetElement.offsetTop - 80, // Adjust for fixed header if any
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Intersection Observer for active link highlighting
    const observerOptions = {
        root: null, // viewport
        rootMargin: '-50% 0px -50% 0px', // Trigger when section is in the middle 50% of the viewport
        threshold: 0 // As soon as target enters/leaves root
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentSectionId = entry.target.id;
                
                // Remove active classes from all links
                allLinks.forEach(link => {
                    link.classList.remove('text-zwift-orange', 'font-bold');
                    link.classList.add('hover:text-zwift-orange'); // Add hover back if removed
                });

                // Add active class to corresponding main nav link
                const mainNavLink = document.querySelector(`#nav-${currentSectionId}`);
                if (mainNavLink) {
                    mainNavLink.classList.add('text-zwift-orange', 'font-bold');
                    mainNavLink.classList.remove('hover:text-zwift-orange');
                }

                // Add active class to corresponding sidebar link
                const sidebarNavLink = document.querySelector(`#sidebar a[href="#${currentSectionId}"]`);
                if (sidebarNavLink) {
                    sidebarNavLink.classList.add('text-zwift-orange', 'font-bold');
                    sidebarNavLink.classList.remove('hover:text-zwift-orange');
                }
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    // Handle initial load - check hash in URL
    if (window.location.hash) {
        const initialTarget = document.querySelector(window.location.hash);
        if (initialTarget) {
            window.scrollTo({
                top: initialTarget.offsetTop - 80, // Adjust for fixed header
                behavior: 'smooth'
            });
        }
    }
});
