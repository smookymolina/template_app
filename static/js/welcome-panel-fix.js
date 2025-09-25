/**
 * Fix para paneles de bienvenida - Asegurar visibilidad del texto
 * Corrige problemas de contraste en dispositivos móviles y modo oscuro
 */

const WelcomePanelFix = {
    init() {
        this.applyFixes();
        this.setupObserver();

        // Aplicar fixes cuando cambie el modo oscuro
        document.addEventListener('darkModeToggled', () => {
            setTimeout(() => this.applyFixes(), 100);
        });
    },

    applyFixes() {
        const panels = document.querySelectorAll('.admin-welcome, .gerente-welcome, .asesor-welcome');

        panels.forEach(panel => {
            this.fixPanelVisibility(panel);
        });
    },

    fixPanelVisibility(panel) {
        if (!panel) return;

        const isDarkMode = document.body.classList.contains('dark-mode');
        const isMobile = window.innerWidth <= 576;

        // Obtener elementos de texto
        const title = panel.querySelector('h4');
        const description = panel.querySelector('p');

        // Aplicar estilos basados en condiciones
        if (isMobile) {
            this.applyMobileStyles(panel, title, description, isDarkMode);
        } else {
            this.applyDesktopStyles(panel, title, description, isDarkMode);
        }

        // Forzar repaint
        panel.style.display = 'none';
        panel.offsetHeight; // Trigger reflow
        panel.style.display = '';
    },

    applyMobileStyles(panel, title, description, isDarkMode) {
        const panelType = this.getPanelType(panel);

        if (isDarkMode) {
            // Modo oscuro móvil
            panel.style.setProperty('background', 'rgba(30, 30, 44, 0.95)', 'important');
            panel.style.setProperty('color', '#e9ecef', 'important');
            panel.style.setProperty('border', `2px solid ${this.getPanelColor(panelType)}`, 'important');
        } else {
            // Modo claro móvil
            panel.style.setProperty('background', '#f8f9fa', 'important');
            panel.style.setProperty('color', '#333', 'important');
            panel.style.setProperty('border', `2px solid ${this.getPanelColor(panelType)}`, 'important');
        }

        // Asegurar visibilidad del texto
        if (title) {
            title.style.setProperty('color', 'inherit', 'important');
            title.style.setProperty('font-weight', '600', 'important');
        }

        if (description) {
            description.style.setProperty('color', 'inherit', 'important');
            description.style.setProperty('opacity', '0.85', 'important');
        }
    },

    applyDesktopStyles(panel, title, description, isDarkMode) {
        const panelType = this.getPanelType(panel);
        const gradient = this.getPanelGradient(panelType);

        // Restaurar gradiente original para desktop
        panel.style.setProperty('background', gradient, 'important');
        panel.style.setProperty('color', 'white', 'important');
        panel.style.setProperty('border', '2px solid transparent', 'important');

        // Texto blanco para desktop
        if (title) {
            title.style.setProperty('color', 'white', 'important');
            title.style.setProperty('font-weight', '600', 'important');
        }

        if (description) {
            description.style.setProperty('color', 'white', 'important');
            description.style.setProperty('opacity', '0.95', 'important');
        }
    },

    getPanelType(panel) {
        if (panel.classList.contains('admin-welcome')) return 'admin';
        if (panel.classList.contains('gerente-welcome')) return 'gerente';
        if (panel.classList.contains('asesor-welcome')) return 'asesor';
        return 'admin';
    },

    getPanelColor(type) {
        const colors = {
            'admin': '#007bff',
            'gerente': '#f59e0b',
            'asesor': '#28a745'
        };
        return colors[type] || colors.admin;
    },

    getPanelGradient(type) {
        const gradients = {
            'admin': 'linear-gradient(135deg, #007bff, #0056b3)',
            'gerente': 'linear-gradient(135deg, #f59e0b, #d97706)',
            'asesor': 'linear-gradient(135deg, #28a745, #20c997)'
        };
        return gradients[type] || gradients.admin;
    },

    setupObserver() {
        // Observar cambios en el DOM para aplicar fixes a nuevos paneles
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        const panels = node.matches?.('.admin-welcome, .gerente-welcome, .asesor-welcome')
                            ? [node]
                            : node.querySelectorAll?.('.admin-welcome, .gerente-welcome, .asesor-welcome') || [];

                        panels.forEach(panel => this.fixPanelVisibility(panel));
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => WelcomePanelFix.init());
} else {
    WelcomePanelFix.init();
}

// También aplicar en resize
window.addEventListener('resize', () => {
    clearTimeout(window.welcomePanelResizeTimeout);
    window.welcomePanelResizeTimeout = setTimeout(() => {
        WelcomePanelFix.applyFixes();
    }, 150);
});

export default WelcomePanelFix;