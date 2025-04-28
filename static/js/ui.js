/**
 * Módulo para gestionar la interfaz de usuario
 */
import CONFIG from './config.js';
import { showNotification } from './notifications.js';

const UI = {
    /**
     * Cambia la sección activa en el dashboard
     * @param {string} targetSection - ID de la sección a activar
     */
    changeActiveSection: function(targetSection) {
        if (!targetSection) return;
        
        // Actualizar tab activa
        const navItems = document.querySelectorAll('.dashboard-nav li');
        navItems.forEach(li => {
            li.classList.remove('active');
            const link = li.querySelector(`[data-section="${targetSection}"]`);
            if (link) {
                li.classList.add('active');
            }
        });
        
        // Actualizar sección visible
        const sections = document.querySelectorAll('.dashboard-content-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        const targetElement = document.getElementById(targetSection);
        if (targetElement) {
            targetElement.classList.add('active');
            // Disparar evento personalizado
            const event = new CustomEvent('sectionChanged', { 
                detail: { section: targetSection } 
            });
            document.dispatchEvent(event);
        }
    },
    
    /**
     * Activa o desactiva el modo oscuro
     * @param {boolean} [enabled] - Si se proporciona, establece el modo oscuro a este valor
     * @returns {boolean} - Estado final del modo oscuro
     */
    toggleDarkMode: function(enabled) {
        if (enabled === undefined) {
            enabled = !document.body.classList.contains('dark-mode');
        }
        
        if (enabled) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        // Guardar preferencia
        localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, enabled);
        
        // Actualizar switch en configuración
        const darkThemeToggle = document.getElementById('dark-theme-toggle');
        if (darkThemeToggle) {
            darkThemeToggle.checked = enabled;
        }
        
        return enabled;
    },
    
    /**
     * Cambia el color primario de la interfaz
     * @param {string} color - Color en formato hexadecimal (#RRGGBB)
     */
    changePrimaryColor: function(color) {
        if (!color) return;
        
        // Cambiar variables CSS
        document.documentElement.style.setProperty('--primary-color', color);
        document.documentElement.style.setProperty('--primary-dark', this.darkenColor(color, 20));
        document.documentElement.style.setProperty('--primary-light', this.lightenColor(color, 80));
        
        // Guardar preferencia
        localStorage.setItem(CONFIG.STORAGE_KEYS.PRIMARY_COLOR, color);
        
        // Actualizar selección de botones de colores
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
            const input = option.querySelector('input');
            if (input && input.value === color) {
                option.classList.add('selected');
            }
        });
    },
    
    /**
     * Carga las preferencias de tema guardadas
     */
    loadSavedTheme: function() {
        // Cargar modo oscuro
        const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
        if (savedTheme === 'true') {
            this.toggleDarkMode(true);
        }
        
        // Cargar color primario
        const savedColor = localStorage.getItem(CONFIG.STORAGE_KEYS.PRIMARY_COLOR);
        if (savedColor) {
            this.changePrimaryColor(savedColor);
        }
    },
    
    /**
     * Oscurece un color hexadecimal
     * @param {string} hex - Color en formato hexadecimal
     * @param {number} percent - Porcentaje de oscurecimiento (0-100)
     * @returns {string} - Color oscurecido
     */
    darkenColor: function(hex, percent) {
        try {
            if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || hex.length !== 7) {
                return CONFIG.DEFAULTS.PRIMARY_DARK;
            }
            
            // Convertir a RGB
            let r = parseInt(hex.substring(1, 3), 16);
            let g = parseInt(hex.substring(3, 5), 16);
            let b = parseInt(hex.substring(5, 7), 16);
            
            // Aplicar porcentaje de oscurecimiento
            r = Math.max(0, Math.floor(r * (100 - percent) / 100));
            g = Math.max(0, Math.floor(g * (100 - percent) / 100));
            b = Math.max(0, Math.floor(b * (100 - percent) / 100));
            
            // Convertir de vuelta a hex
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        } catch (error) {
            console.error('Error al oscurecer color:', error);
            return CONFIG.DEFAULTS.PRIMARY_DARK;
        }
    },
    
    /**
     * Aclara un color hexadecimal
     * @param {string} hex - Color en formato hexadecimal
     * @param {number} percent - Porcentaje de aclaramiento (0-100)
     * @returns {string} - Color aclarado
     */
    lightenColor: function(hex, percent) {
        try {
            if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || hex.length !== 7) {
                return CONFIG.DEFAULTS.PRIMARY_LIGHT;
            }
            
            // Convertir a RGB
            let r = parseInt(hex.substring(1, 3), 16);
            let g = parseInt(hex.substring(3, 5), 16);
            let b = parseInt(hex.substring(5, 7), 16);
            
            // Aplicar porcentaje de aclaramiento
            r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
            g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
            b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));
            
            // Convertir de vuelta a hex
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        } catch (error) {
            console.error('Error al aclarar color:', error);
            return CONFIG.DEFAULTS.PRIMARY_LIGHT;
        }
    },
    
    /**
     * Muestra un modal
     * @param {string} modalId - ID del modal a mostrar
     */
    showModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            
            // Añadir evento para cerrar al hacer clic fuera o en botón cerrar
            const closeButtons = modal.querySelectorAll('.close-modal, .close-btn');
            closeButtons.forEach(button => {
                button.onclick = () => this.closeModal(modalId);
            });
            
            // Cerrar al hacer clic fuera del contenido
            modal.onclick = (event) => {
                if (event.target === modal) {
                    this.closeModal(modalId);
                }
            };
            
            // Disparar evento
            modal.dispatchEvent(new CustomEvent('modalOpened'));
        }
    },
    
    /**
     * Cierra un modal
     * @param {string} modalId - ID del modal a cerrar
     */
    closeModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            
            // Disparar evento
            modal.dispatchEvent(new CustomEvent('modalClosed'));
        }
    },
    
    /**
     * Muestra un modal de confirmación
     * @param {Object} options - Opciones del modal
     * @param {string} options.title - Título del modal
     * @param {string} options.message - Mensaje a mostrar
     * @param {string} options.confirmText - Texto del botón de confirmación
     * @param {string} options.cancelText - Texto del botón de cancelación
     * @param {string} options.confirmButtonClass - Clase CSS para el botón de confirmación
     * @param {Function} options.onConfirm - Función a ejecutar al confirmar
     * @param {Function} options.onCancel - Función a ejecutar al cancelar
     */
    showConfirmModal: function(options) {
        const modalId = 'confirm-modal';
        const modal = document.getElementById(modalId);
        
        if (!modal) return;
        
        // Configurar contenido
        const title = modal.querySelector('#confirm-title');
        const message = modal.querySelector('#confirm-message');
        const confirmBtn = modal.querySelector('#confirm-action-btn');
        const cancelBtn = modal.querySelector('.btn-secondary');
        
        if (title) title.textContent = options.title || 'Confirmar acción';
        if (message) message.textContent = options.message || '¿Estás seguro de realizar esta acción?';
        
        if (confirmBtn) {
            confirmBtn.textContent = options.confirmText || 'Confirmar';
            confirmBtn.className = options.confirmButtonClass || 'btn-danger';
            
            // Configurar acción al confirmar
            confirmBtn.onclick = () => {
                if (typeof options.onConfirm === 'function') {
                    options.onConfirm();
                }
                this.closeModal(modalId);
            };
        }
        
        if (cancelBtn) {
            cancelBtn.textContent = options.cancelText || 'Cancelar';
            
            // Configurar acción al cancelar
            cancelBtn.onclick = () => {
                if (typeof options.onCancel === 'function') {
                    options.onCancel();
                }
                this.closeModal(modalId);
            };
        }
        
        // Mostrar modal
        this.showModal(modalId);
    },
    
    /**
     * Crea un elemento para mostrar un badge de estado
     * @param {string} estado - Estado a mostrar
     * @param {Array} estados - Lista de estados posibles con sus clases
     * @returns {HTMLElement} - Elemento span con el badge
     */
    createBadge: function(estado, estados = CONFIG.ESTADOS_RECLUTA) {
        const estadoObj = estados.find(e => e.value === estado) || { 
            value: estado, 
            label: estado, 
            badgeClass: 'badge-secondary' 
        };
        
        const badge = document.createElement('span');
        badge.className = `badge ${estadoObj.badgeClass}`;
        badge.textContent = estadoObj.label;
        
        return badge;
    },
    
    /**
     * Formatea una fecha
     * @param {string|Date} date - Fecha a formatear
     * @param {string} format - Formato deseado ('short', 'medium', 'long')
     * @returns {string} - Fecha formateada
     */
    formatDate: function(date, format = 'short') {
        if (!date) return 'N/A';
        
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        
        // Verificar si es una fecha válida
        if (isNaN(dateObj.getTime())) return 'Fecha inválida';
        
        const options = { 
            short: { day: '2-digit', month: '2-digit', year: 'numeric' },
            medium: { day: '2-digit', month: 'short', year: 'numeric' },
            long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
            time: { hour: '2-digit', minute: '2-digit' },
            datetime: { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
        };
        
        return dateObj.toLocaleDateString('es-ES', options[format] || options.short);
    },
    
    /**
     * Inicializa eventos para elementos comunes de la interfaz
     */
    initCommonEvents: function() {
        // Toggle dropdown de perfil
        const profileDropdownBtn = document.getElementById('profile-dropdown-button');
        if (profileDropdownBtn) {
            profileDropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = document.getElementById('profile-dropdown-content');
                if (dropdown) {
                    dropdown.classList.toggle('show');
                }
            });
        }
        
        // Cerrar dropdowns al hacer clic fuera
        document.addEventListener('click', (e) => {
            const dropdowns = document.querySelectorAll('.dropdown-content.show');
            dropdowns.forEach(dropdown => {
                if (!dropdown.parentElement.contains(e.target)) {
                    dropdown.classList.remove('show');
                }
            });
        });
        
        // Toggle modo oscuro
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        }
        
        // Toggle visibilidad de contraseña
        const togglePasswordBtns = document.querySelectorAll('.toggle-password');
        togglePasswordBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const input = this.closest('.input-icon-wrapper').querySelector('input');
                const icon = this.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    input.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
        });
        
        // Cerrar notificaciones
        const notificationCloseBtn = document.getElementById('notification-close');
        if (notificationCloseBtn) {
            notificationCloseBtn.addEventListener('click', () => {
                const notification = document.getElementById('notification');
                if (notification) {
                    notification.classList.remove('show');
                }
            });
        }
    },
    
    /**
     * Inicializa eventos para navegación entre secciones
     */
    initNavigation: function() {
        const navLinks = document.querySelectorAll('.dashboard-nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = link.getAttribute('data-section');
                this.changeActiveSection(targetSection);
            });
        });
    },
    
    /**
     * Inicializa selectores de colores en la configuración
     */
    initColorSelectors: function() {
        const colorOptions = document.querySelectorAll('input[name="primary-color"]');
        colorOptions.forEach(option => {
            option.addEventListener('change', () => {
                this.changePrimaryColor(option.value);
            });
        });
    }
};

export default UI;