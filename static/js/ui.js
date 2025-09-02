/**
 * Módulo para gestionar la interfaz de usuario
 */
import CONFIG from './config.js';
import { showNotification } from './notifications.js';
import Tutorial from './tutorial.js';

const UI = {
    /**
     * Cambia la sección activa en el dashboard
     * @param {string} targetSection - ID de la sección a activar
     */
    changeActiveSection: function(targetSection) {
        if (!targetSection) return;
        
        console.log('🔄 UI: Cambiando a sección:', targetSection);
        
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
            section.style.display = 'none';
        });
        
        const targetElement = document.getElementById(targetSection);
        if (targetElement) {
            targetElement.classList.add('active');
            targetElement.style.display = 'block';
            
            // Disparar evento personalizado
            const event = new CustomEvent('sectionChanged', { 
                detail: { section: targetSection } 
            });
            document.dispatchEvent(event);
            console.log('✅ UI: Sección cambiada a:', targetSection);
        } else {
            console.warn('⚠️ UI: Sección no encontrada:', targetSection);
        }
    },
    
    /**
     * Activa o desactiva el modo oscuro
     * @param {boolean} [enabled] - Si se proporciona, establece el modo oscuro a este valor
     * @returns {boolean} - Estado final del modo oscuro
     */
    toggleDarkMode: function(enabled) {
    // Determinar estado si no se especifica
    if (enabled === undefined) {
        enabled = !document.body.classList.contains('dark-mode');
    }
    
    console.log(`🌙 Cambiando a modo ${enabled ? 'oscuro' : 'claro'}`);
    
    // Aplicar/remover clase CSS
    if (enabled) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    // Sincronizar ambos controles
    this.syncDarkModeControls(enabled);
    
    // Guardar preferencia
    this.saveDarkModePreference(enabled);
    
    return enabled;
},

/**
 * ✅ NUEVA FUNCIÓN: Sincronizar ambos controles
 */
syncDarkModeControls: function(enabled) {
    // Actualizar checkbox en configuración
    const configToggle = document.getElementById('dark-theme-toggle');
    if (configToggle) {
        configToggle.checked = enabled;
    }
    
    // Actualizar icono del header
    const headerToggle = document.getElementById('dark-mode-toggle');
    if (headerToggle) {
        const icon = headerToggle.querySelector('i');
        if (icon) {
            icon.className = enabled ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
    
    console.log(`🔄 Controles sincronizados: ${enabled ? 'oscuro' : 'claro'}`);
},

/**
 * ✅ NUEVA FUNCIÓN: Guardar preferencia de forma inteligente
 */
saveDarkModePreference: function(enabled) {
    try {
        // Verificar si Auth está disponible y hay usuario autenticado
        const isAuthAvailable = typeof Auth !== 'undefined' && Auth !== null;
        const currentUser = isAuthAvailable ? Auth.currentUser : null;
        
        if (currentUser && currentUser.email) {
            // Usuario autenticado: guardar con su email
            const userThemeKey = `${CONFIG.STORAGE_KEYS.THEME}_${currentUser.email}`;
            localStorage.setItem(userThemeKey, enabled.toString());
            console.log(`💾 Tema guardado para usuario: ${currentUser.email}`);
        } else {
            // Sin autenticación: guardar temporal
            localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, enabled.toString());
            console.log(`💾 Tema guardado temporalmente`);
        }
    } catch (error) {
        console.error('❌ Error al guardar preferencia de tema:', error);
    }
},
    
    /**
     * Cambia el color primario de la interfaz
     * @param {string} color - Color en formato hexadecimal (#RRGGBB)
     */
    changePrimaryColor: function(color) {
    if (!color) {
        console.warn('⚠️ Color no especificado');
        return;
    }
    
    try {
        // Cambiar variables CSS (esto siempre funciona)
        document.documentElement.style.setProperty('--primary-color', color);
        document.documentElement.style.setProperty('--primary-dark', this.darkenColor(color, 20));
        document.documentElement.style.setProperty('--primary-light', this.lightenColor(color, 80));
        
        // ✅ SOLUCIÓN: Verificar Auth de forma defensiva
        const isAuthAvailable = typeof Auth !== 'undefined' && Auth !== null;
        const isAuthenticated = isAuthAvailable && typeof Auth.isAuthenticated === 'function' ? Auth.isAuthenticated() : false;
        
        if (isAuthAvailable && isAuthenticated) {
            const currentUser = Auth.currentUser;
            if (currentUser && currentUser.email) {
                const userColorKey = `${CONFIG.STORAGE_KEYS.PRIMARY_COLOR}_${currentUser.email}`;
                localStorage.setItem(userColorKey, color);
                console.log(`🎨 Color ${color} guardado para usuario: ${currentUser.email}`);
            }
        } else {
            // Si no hay Auth disponible, usar localStorage básico (temporal)
            localStorage.setItem(CONFIG.STORAGE_KEYS.PRIMARY_COLOR, color);
            console.log(`🎨 Color ${color} guardado temporalmente`);
        }
        
        // Actualizar selección de botones de colores
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
            const input = option.querySelector('input');
            if (input && input.value === color) {
                option.classList.add('selected');
                input.checked = true;
            }
        });
        
    } catch (error) {
        console.error('❌ Error al cambiar color primario:', error);
    }
},

    /**
     * Carga las preferencias de tema guardadas
     */
    loadSavedTheme: function() {
    console.log('📥 Cargando configuraciones de tema...');
    
    try {
        let savedTheme = null;
        let savedColor = null;
        
        // Verificar si Auth está disponible
        const isAuthAvailable = typeof Auth !== 'undefined' && Auth !== null;
        const currentUser = isAuthAvailable ? Auth.currentUser : null;
        
        if (currentUser && currentUser.email) {
            // Usuario autenticado: cargar configuración específica
            const userThemeKey = `${CONFIG.STORAGE_KEYS.THEME}_${currentUser.email}`;
            const userColorKey = `${CONFIG.STORAGE_KEYS.PRIMARY_COLOR}_${currentUser.email}`;
            
            savedTheme = localStorage.getItem(userThemeKey);
            savedColor = localStorage.getItem(userColorKey);
            
            console.log(`👤 Cargando configuración para: ${currentUser.email}`);
        } else {
            // Sin usuario: cargar configuración temporal o por defecto
            savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
            savedColor = localStorage.getItem(CONFIG.STORAGE_KEYS.PRIMARY_COLOR);
            
            console.log('🌐 Cargando configuración temporal');
        }
        
        // Aplicar tema
        const isDarkMode = savedTheme === 'true';
        this.toggleDarkMode(isDarkMode);
        
        // Aplicar color primario
        if (savedColor && this.isValidColor(savedColor)) {
            this.changePrimaryColor(savedColor);
        } else {
            this.changePrimaryColor(CONFIG.DEFAULTS.PRIMARY_COLOR);
        }
        
        console.log(`✅ Tema cargado: ${isDarkMode ? 'oscuro' : 'claro'}, Color: ${savedColor || 'default'}`);
        
    } catch (error) {
        console.error('❌ Error al cargar configuraciones:', error);
        this.resetUIToDefault();
    }
},

/**
 * Validar si un color es válido
 * Agregar al objeto UI
 */
isValidColor: function(color) {
    if (!color || typeof color !== 'string') return false;
    
    // Verificar formato hexadecimal
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexPattern.test(color);
},

/**
 * ✅ NUEVA FUNCIÓN: Limpiar configuraciones de usuario específico
 * Agregar al objeto UI
 */
clearUserSpecificConfigurations: function(userEmail) {
    if (!userEmail) {
        console.warn('⚠️ Email de usuario no especificado para limpiar configuraciones');
        return;
    }
    
    console.log(`🧹 Limpiando configuraciones específicas para: ${userEmail}`);
    
    const userKeys = [
        `${CONFIG.STORAGE_KEYS.THEME}_${userEmail}`,
        `${CONFIG.STORAGE_KEYS.PRIMARY_COLOR}_${userEmail}`,
        `user_preferences_${userEmail}`,
        `dashboard_layout_${userEmail}`
    ];
    
    userKeys.forEach(key => {
        try {
            localStorage.removeItem(key);
            console.log(`📦 Configuración eliminada: ${key}`);
        } catch (error) {
            console.warn(`⚠️ Error al eliminar ${key}:`, error);
        }
    });
    
    console.log(`✅ Configuraciones limpiadas para: ${userEmail}`);
},

/**
 * ✅ NUEVA FUNCIÓN: Inicializar configuraciones para nuevo usuario
 * Agregar al objeto UI
 */
initializeForUser: function(usuario) {
    if (!usuario || !usuario.email) {
        console.warn('⚠️ Usuario no válido para inicializar configuraciones');
        return;
    }
    
    console.log(`⚙️ Inicializando configuraciones para: ${usuario.email}`);
    
    // Primero resetear a valores por defecto
    this.resetUIToDefault();
    
    // Luego cargar configuraciones específicas del usuario (si existen)
    this.loadSavedTheme();
    
    // Configurar elementos específicos según rol
    const userRole = usuario.rol || 'asesor';
    if (userRole === 'admin') {
        // Configuraciones específicas para admin
        document.body.classList.add('admin-view');
        console.log('👑 Configuraciones de admin aplicadas');
    } else {
        // Configuraciones específicas para asesor
        document.body.classList.add('asesor-view');
        console.log('👤 Configuraciones de asesor aplicadas');
    }
    
    console.log(`✅ Configuraciones inicializadas para: ${usuario.email}`);
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
 * Resetea UI a configuración por defecto
 * Agregar al objeto UI
 */
resetUIToDefault: function() {
    console.log('🎨 Reseteando UI a configuración por defecto...');
    
    try {
        // 1. Resetear variables CSS a valores por defecto
        const defaultColor = (typeof CONFIG !== 'undefined' && CONFIG.DEFAULTS) ? 
                            CONFIG.DEFAULTS.PRIMARY_COLOR : '#007bff';
        
        document.documentElement.style.setProperty('--primary-color', defaultColor);
        document.documentElement.style.setProperty('--primary-dark', this.darkenColor(defaultColor, 20));
        document.documentElement.style.setProperty('--primary-light', this.lightenColor(defaultColor, 80));
        
        // 2. Remover modo oscuro
        document.body.classList.remove('dark-mode');
        
        // 3. Resetear selecciones de colores
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // 4. Seleccionar color por defecto
        const defaultColorOption = document.querySelector(`input[name="primary-color"][value="${defaultColor}"]`);
        if (defaultColorOption) {
            defaultColorOption.parentElement.classList.add('selected');
            defaultColorOption.checked = true;
        }
        
        // 5. Resetear toggle de tema oscuro
        const darkThemeToggle = document.getElementById('dark-theme-toggle');
        if (darkThemeToggle) {
            darkThemeToggle.checked = false;
        }
        
        // 6. Resetear otros toggles de configuración
        const configToggles = document.querySelectorAll('#email-notifications, #interview-reminders');
        configToggles.forEach(toggle => {
            if (toggle) toggle.checked = true; // Valores por defecto activados
        });
        
        console.log('✅ UI reseteada a configuración por defecto');
        
    } catch (error) {
        console.error('❌ Error al resetear UI:', error);
    }
},

/**
 * ✅ NUEVA FUNCIÓN: Inicialización diferida cuando Auth esté disponible
 * AGREGAR al objeto UI
 */
initializeWithAuth: function() {
    console.log('⚙️ Inicializando UI con Auth disponible...');
    
    // Verificar que Auth esté realmente disponible
    if (typeof Auth === 'undefined' || !Auth) {
        console.warn('⚠️ Auth aún no está disponible para inicializar UI');
        return false;
    }
    
    try {
        // Ahora sí podemos cargar configuraciones por usuario
        this.loadSavedTheme();
        
        // Configurar eventos que requieren Auth
        this.initAuthDependentEvents();
        
        console.log('✅ UI inicializada con Auth');
        return true;
        
    } catch (error) {
        console.error('❌ Error al inicializar UI con Auth:', error);
        return false;
    }
},

/**
 * ✅ NUEVA FUNCIÓN: Eventos que dependen de Auth
 * AGREGAR al objeto UI
 */
initAuthDependentEvents: function() {
    console.log('🔧 Inicializando eventos dependientes de Auth...');
    
    // Toggle modo oscuro con validación de Auth
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        // Remover listeners anteriores para evitar duplicados
        darkModeToggle.removeEventListener('click', this._darkModeHandler);
        
        // Crear handler con validación
        this._darkModeHandler = () => {
            if (typeof Auth !== 'undefined' && Auth.isAuthenticated && Auth.isAuthenticated()) {
                this.toggleDarkMode();
            } else {
                console.warn('⚠️ Debe autenticarse para cambiar el tema');
                darkModeToggle.checked = !darkModeToggle.checked; // Revertir cambio
            }
        };
        
        darkModeToggle.addEventListener('click', this._darkModeHandler);
    }
    
    console.log('✅ Eventos dependientes de Auth inicializados');
},

/**
 * Limpia todas las configuraciones guardadas
 * Agregar al objeto UI
 */
clearStoredConfigurations: function() {
    console.log('🗑️ Limpiando configuraciones almacenadas...');
    
    const configKeys = [
        CONFIG.STORAGE_KEYS.THEME,
        CONFIG.STORAGE_KEYS.PRIMARY_COLOR,
        CONFIG.STORAGE_KEYS.CALENDAR_EVENTS,
        'user_preferences',
        'dashboard_layout',
        'sidebar_collapsed',
        'notification_settings',
        'last_section_visited'
    ];
    
    configKeys.forEach(key => {
        try {
            localStorage.removeItem(key);
            console.log(`📦 Configuración eliminada: ${key}`);
        } catch (error) {
            console.warn(`⚠️ No se pudo eliminar ${key}:`, error);
        }
    });
    
    console.log('✅ Configuraciones almacenadas limpiadas');
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
    console.log('🔧 Inicializando eventos comunes de UI...');
    
    // ✅ CORRECCIÓN: Manejar AMBOS toggles de dark mode
    this.initDarkModeToggles();
    
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
    
    console.log('✅ Eventos comunes de UI inicializados');
},

/**
 * ✅ NUEVA FUNCIÓN: Inicializar todos los toggles de dark mode
 */
initDarkModeToggles: function() {
    console.log('🌙 Inicializando toggles de dark mode...');
    
    // 1. Button del header (sin Auth requerida)
    const headerToggle = document.getElementById('dark-mode-toggle');
    if (headerToggle) {
        headerToggle.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🌙 Click en toggle header');
            this.toggleDarkMode();
        });
        console.log('✅ Header dark mode toggle configurado');
    }
    
    // 2. Checkbox de configuración (con Auth opcional)
    const configToggle = document.getElementById('dark-theme-toggle');
    if (configToggle) {
        configToggle.addEventListener('change', (e) => {
            console.log('🌙 Change en toggle config:', e.target.checked);
            this.toggleDarkMode(e.target.checked);
        });
        console.log('✅ Config dark mode toggle configurado');
    }
    
    console.log('✅ Todos los toggles de dark mode configurados');
},

    
    /**
     * Inicializa eventos para navegación entre secciones
     */
    initNavigation: function() {
        console.log('🧭 UI: Inicializando navegación...');
        const navLinks = document.querySelectorAll('.dashboard-nav a, [data-section]');
        console.log(`📋 UI: Encontrados ${navLinks.length} enlaces de navegación`);
        
        navLinks.forEach((link, index) => {
            const targetSection = link.getAttribute('data-section');
            if (targetSection) {
                console.log(`📋 UI: Configurando enlace ${index + 1}: ${targetSection}`);
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('🖱️ UI: Click detectado en enlace:', targetSection);
                    
                    // LLAMAR A LA FUNCIÓN GLOBAL DE MAIN.JS QUE CONTROLA LAS SECCIONES Y TUTORIALES
                    if (window.showSection) {
                        console.log('✅ UI: Usando window.showSection');
                        window.showSection(targetSection);
                    } else {
                        // Fallback por si main.js no está cargado o showSection no está disponible
                        console.warn('⚠️ UI: window.showSection no encontrada, usando fallback');
                        this.changeActiveSection(targetSection);
                    }
                });
            }
        });
        
        console.log('✅ UI: Navegación inicializada correctamente');
    },
    
    /**
     * Inicializa selectores de colores en la configuración
     */
    initColorSelectors: function() {
    console.log('🎨 Inicializando selectores de colores...');
    
    const colorOptions = document.querySelectorAll('input[name="primary-color"]');
    colorOptions.forEach(option => {
        option.addEventListener('change', () => {
            const isAuthAvailable = typeof Auth !== 'undefined' && Auth !== null;
            const isAuthenticated = isAuthAvailable && typeof Auth.isAuthenticated === 'function' ? Auth.isAuthenticated() : false;
            
            if (isAuthenticated) {
                this.changePrimaryColor(option.value);
            } else {
                console.log('ℹ️ Cambiando color sin autenticación (temporal)');
                this.changePrimaryColor(option.value);
            }
            // Deseleccionar el input de color personalizado si se elige una opción predefinida
            const customColorInput = document.getElementById('custom-primary-color');
            if (customColorInput) {
                customColorInput.value = option.value; // Sincronizar el valor
            }
        });
    });

    const customColorInput = document.getElementById('custom-primary-color');
    if (customColorInput) {
        customColorInput.addEventListener('input', (event) => { // Usar 'input' para cambios en tiempo real
            const newColor = event.target.value;
            const isAuthAvailable = typeof Auth !== 'undefined' && Auth !== null;
            const isAuthenticated = isAuthAvailable && typeof Auth.isAuthenticated === 'function' ? Auth.isAuthenticated() : false;

            if (isAuthenticated) {
                this.changePrimaryColor(newColor);
            } else {
                console.log('ℹ️ Cambiando color personalizado sin autenticación (temporal)');
                this.changePrimaryColor(newColor);
            }
            // Deseleccionar los radio buttons cuando se usa el selector de color personalizado
            colorOptions.forEach(option => {
                option.checked = false;
                option.parentElement.classList.remove('selected');
            });
        });
    }
    
    console.log('✅ Selectores de colores inicializados');
}
};

// Exponer globalmente para compatibilidad
window.UI = UI;

export default UI;

// ✅ FUNCIÓN DE TESTING - Agregar al final de ui.js
window.testDarkMode = function() {
    console.log('🧪 === TESTING DARK MODE ===');
    
    const headerToggle = document.getElementById('dark-mode-toggle');
    const configToggle = document.getElementById('dark-theme-toggle');
    const body = document.body;
    
    console.log('🔍 Elementos encontrados:');
    console.log('Header toggle:', !!headerToggle);
    console.log('Config toggle:', !!configToggle);
    console.log('Modo oscuro actual:', body.classList.contains('dark-mode'));
    
    if (headerToggle) {
        console.log('🔄 Testeando toggle...');
        UI.toggleDarkMode();
        
        setTimeout(() => {
            const isNowDark = body.classList.contains('dark-mode');
            console.log('✅ Resultado:', isNowDark ? 'MODO OSCURO' : 'MODO CLARO');
            
            // Test de sincronización
            if (configToggle) {
                console.log('🔄 Estado checkbox:', configToggle.checked);
                console.log('🎯 Sincronización:', configToggle.checked === isNowDark ? 'OK' : 'ERROR');
            }
        }, 100);
    } else {
        console.error('❌ Botón de toggle no encontrado');
    }
};