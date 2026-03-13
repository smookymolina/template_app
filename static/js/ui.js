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
     * ===================================================================
     * MÓDULO DE TEMA (MODO OSCURO)
     * Centraliza toda la lógica para el manejo del tema de la aplicación.
     * ===================================================================
     */
    theme: {
        headerToggle: null,
        settingsSlider: null,
        /**
         * Obtiene las claves de almacenamiento para el tema.
         * Prioriza la clave por usuario cuando está disponible.
         */
        getStorageKeys: function() {
            const keys = [CONFIG.STORAGE_KEYS.THEME];
            try {
                // Verificar si Auth está disponible globalmente
                const isAuthAvailable = typeof window.Auth !== 'undefined' && window.Auth?.currentUser?.email;
                if (isAuthAvailable) {
                    keys.unshift(`${CONFIG.STORAGE_KEYS.THEME}_${window.Auth.currentUser.email}`);
                }
            } catch (error) {
                console.warn('No se pudo resolver la clave de tema por usuario:', error);
            }
            return keys;
        },

        /**
         * Inicializa el sistema de temas.
         * Se llama una vez al cargar la página.
         */
        init: function() {
            console.log('🌙 Inicializando sistema de temas...');
            this.headerToggle = document.getElementById('dark-mode-toggle');
            this.settingsSlider = document.getElementById('dark-theme-slider');

            const savedTheme = this.load();
            this.apply(savedTheme);
            this.addEventListeners();
            
            // Escuchar cambios en la preferencia del sistema
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                // Solo aplicar si no hay una preferencia guardada explícitamente
                const keys = this.getStorageKeys();
                let hasExplicitPreference = false;
                for (const key of keys) {
                    if (localStorage.getItem(key) !== null) {
                        hasExplicitPreference = true;
                        break;
                    }
                }
                if (!hasExplicitPreference) {
                    this.apply(e.matches);
                }
            });
            
            console.log('✅ Sistema de temas inicializado.');
        },

        /**
         * Aplica el estado del tema (oscuro/claro) a la UI.
         * @param {boolean} isDark - True si el modo oscuro debe estar activado.
         */
        apply: function(isDark) {
            document.body.classList.toggle('dark-mode', isDark);
            document.documentElement.classList.toggle('dark-mode', isDark);
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
            this.updateControls(isDark);
            document.dispatchEvent(new CustomEvent('darkModeToggled', { detail: { isDark } }));
        },

        /**
         * Actualiza el estado visual de ambos controles de tema.
         * @param {boolean} isDark - El estado actual del tema.
         */
        updateControls: function(isDark) {
            if (this.headerToggle) {
                const icon = this.headerToggle.querySelector('i');
                if (icon) {
                    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
                }
            }
            if (this.settingsSlider) {
                this.settingsSlider.checked = isDark;
            }
            const legacyToggle = document.getElementById('dark-theme-toggle');
            if (legacyToggle) {
                legacyToggle.checked = isDark;
            }
        },

        /**
         * Alterna el tema actual, lo aplica y lo guarda.
         * Esta es la función que llaman los eventos.
         */
        toggle: function() {
            const isCurrentlyDark = document.body.classList.contains('dark-mode');
            const newThemeState = !isCurrentlyDark;
            
            console.log(`🌙 Cambiando a modo ${newThemeState ? 'oscuro' : 'claro'}`);
            this.apply(newThemeState);
            this.save(newThemeState);
        },

        /**
         * Guarda la preferencia en localStorage con cookie como fallback
         * (iOS Safari en modo privado bloquea localStorage).
         * @param {boolean} isDark
         */
        save: function(isDark) {
            const value = isDark.toString();
            const keys = this.getStorageKeys();

            // 1. Intentar localStorage (principal)
            try {
                keys.forEach(key => localStorage.setItem(key, value));
            } catch (e) {
                // localStorage bloqueado (modo privado, etc.) → usar cookie
            }

            // 2. Cookie como fallback universal (accesible incluso sin localStorage)
            try {
                const expires = new Date();
                expires.setFullYear(expires.getFullYear() + 1);
                document.cookie = `darkMode=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
            } catch (e) {
                console.warn('⚠️ No se pudo guardar tema en cookie:', e);
            }
        },

        /**
         * Lee cookie de tema como fallback cuando localStorage no está disponible.
         * @returns {string|null}
         */
        _cookieLoad: function() {
            try {
                const match = document.cookie.match(/(?:^|;\s*)darkMode=([^;]*)/);
                return match ? match[1] : null;
            } catch (e) {
                return null;
            }
        },

        /**
         * Carga la preferencia de tema desde localStorage, cookie o sistema.
         * @returns {boolean}
         */
        load: function() {
            // 1. Intentar localStorage
            try {
                const keys = this.getStorageKeys();
                for (const key of keys) {
                    const stored = localStorage.getItem(key);
                    if (stored !== null) {
                        return stored === 'true';
                    }
                }
            } catch (e) {
                // localStorage no disponible
            }

            // 2. Fallback: cookie
            const cookieVal = this._cookieLoad();
            if (cookieVal !== null) {
                return cookieVal === 'true';
            }

            // 3. Preferencia del sistema
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        },

        /**
         * Añade los event listeners a ambos controles.
         */
        addEventListeners: function() {
            if (this.headerToggle) {
                this.headerToggle.addEventListener('click', () => this.toggle());
            }
            if (this.settingsSlider) {
                this.settingsSlider.addEventListener('change', () => this.toggle());
            }
            const legacyToggle = document.getElementById('dark-theme-toggle');
            if (legacyToggle && legacyToggle !== this.settingsSlider) {
                legacyToggle.addEventListener('change', () => this.toggle());
            }
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

    // Notificar a otros módulos sobre el cambio de color
    document.dispatchEvent(new CustomEvent('primaryColorChanged', { detail: { color: color } }));
        
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
        
        const customColorInput = document.getElementById('custom-primary-color');
        if (customColorInput && this.isValidColor(color)) {
            customColorInput.value = color;
        }

    } catch (error) {
        console.error('❌ Error al cambiar color primario:', error);
    }
},

    /**
     * Cambia el color de acento secundario de la interfaz
     * @param {string} color - Color en formato hexadecimal (#RRGGBB)
     */
    changeSecondaryAccentColor: function(color) {
        if (!color || !this.isValidColor(color)) {
            console.warn('⚠️ Color secundario no válido:', color);
            return;
        }
        try {
            document.documentElement.style.setProperty('--secondary-accent-color', color);
            // Actualizar también el equivalente RGB para usar en rgba()
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            document.documentElement.style.setProperty('--secondary-accent-color-rgb', `${r}, ${g}, ${b}`);
            document.dispatchEvent(new CustomEvent('secondaryAccentColorChanged', { detail: { color } }));

            const isAuthAvailable = typeof Auth !== 'undefined' && Auth !== null;
            const isAuthenticated = isAuthAvailable && typeof Auth.isAuthenticated === 'function' ? Auth.isAuthenticated() : false;

            if (isAuthAvailable && isAuthenticated && Auth.currentUser?.email) {
                const key = `${CONFIG.STORAGE_KEYS.SECONDARY_ACCENT_COLOR}_${Auth.currentUser.email}`;
                localStorage.setItem(key, color);
            } else {
                localStorage.setItem(CONFIG.STORAGE_KEYS.SECONDARY_ACCENT_COLOR, color);
            }

            // Actualizar controles del picker secundario
            document.querySelectorAll('.secondary-color-option').forEach(option => {
                option.classList.remove('selected');
                const input = option.querySelector('input');
                if (input && input.value === color) {
                    option.classList.add('selected');
                    input.checked = true;
                }
            });
            const customSecondaryInput = document.getElementById('custom-secondary-accent-color');
            if (customSecondaryInput) customSecondaryInput.value = color;

            console.log(`🎨 Color secundario ${color} aplicado`);
        } catch (error) {
            console.error('❌ Error al cambiar color secundario:', error);
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
        
        let savedSecondaryColor = null;

        if (currentUser && currentUser.email) {
            // Usuario autenticado: cargar configuración específica
            const userThemeKey = `${CONFIG.STORAGE_KEYS.THEME}_${currentUser.email}`;
            const userColorKey = `${CONFIG.STORAGE_KEYS.PRIMARY_COLOR}_${currentUser.email}`;
            const userSecondaryKey = `${CONFIG.STORAGE_KEYS.SECONDARY_ACCENT_COLOR}_${currentUser.email}`;

            savedTheme = localStorage.getItem(userThemeKey);
            savedColor = localStorage.getItem(userColorKey);
            savedSecondaryColor = localStorage.getItem(userSecondaryKey);

            console.log(`👤 Cargando configuración para: ${currentUser.email}`);
        } else {
            // Sin usuario: cargar configuración temporal o por defecto
            savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
            savedColor = localStorage.getItem(CONFIG.STORAGE_KEYS.PRIMARY_COLOR);
            savedSecondaryColor = localStorage.getItem(CONFIG.STORAGE_KEYS.SECONDARY_ACCENT_COLOR);

            console.log('🌐 Cargando configuración temporal');
        }

        // Aplicar tema (usar la lógica centralizada de theme.load)
        const isDarkMode = this.theme.load();
        this.theme.apply(isDarkMode);

        // Aplicar color primario
        if (savedColor && this.isValidColor(savedColor)) {
            this.changePrimaryColor(savedColor);
        } else {
            this.changePrimaryColor(CONFIG.DEFAULTS.PRIMARY_COLOR);
        }

        // Aplicar color secundario de acento
        if (savedSecondaryColor && this.isValidColor(savedSecondaryColor)) {
            this.changeSecondaryAccentColor(savedSecondaryColor);
        } else {
            this.changeSecondaryAccentColor(CONFIG.DEFAULTS.SECONDARY_ACCENT_COLOR);
        }

        console.log(`✅ Tema cargado: ${isDarkMode ? 'oscuro' : 'claro'}, Color: ${savedColor || 'default'}, Acento: ${savedSecondaryColor || 'default'}`);
        
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
     * Aplica configuraciones persistentes del usuario (tema, colores)
     */
    applyUserSettings: function(settings = {}) {
        try {
            if (!settings || typeof settings !== 'object') {
                return;
            }

            const primaryColor = settings.primary_color || settings.primaryColor;
            if (primaryColor) {
                this.changePrimaryColor(primaryColor);
            }

            const secondaryColor = settings.secondary_accent_color || settings.secondaryAccentColor;
            if (secondaryColor && typeof this.changeSecondaryAccentColor === 'function') {
                this.changeSecondaryAccentColor(secondaryColor);
            }

            if (Object.prototype.hasOwnProperty.call(settings, 'dark_mode') && this.theme && typeof this.theme.apply === 'function') {
                const shouldEnableDark = settings.dark_mode === true || settings.dark_mode === 'true';
                this.theme.apply(shouldEnableDark);

                try {
                    const themeKey = (typeof Auth !== 'undefined' && Auth?.currentUser?.email)
                        ? `${CONFIG.STORAGE_KEYS.THEME}_${Auth.currentUser.email}`
                        : CONFIG.STORAGE_KEYS.THEME;
                    localStorage.setItem(themeKey, shouldEnableDark.toString());
                } catch (storageError) {
                    console.warn('No se pudo sincronizar el tema en localStorage:', storageError);
                }
            }
        } catch (error) {
            console.error('Error al aplicar configuraciones de usuario:', error);
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
        
        // 2. Remover modo oscuro (y sincronizar estado visual)
        if (this.theme && typeof this.theme.apply === 'function') {
            this.theme.apply(false);
        } else {
            document.body.classList.remove('dark-mode');
            document.documentElement.setAttribute('data-theme', 'light');
            document.dispatchEvent(new CustomEvent('darkModeToggled', { detail: { isDark: false } }));
        }
        
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
        const darkThemeToggle = document.getElementById('dark-theme-slider');
        if (darkThemeToggle) darkThemeToggle.checked = false;
        const legacyToggle = document.getElementById('dark-theme-toggle');
        if (legacyToggle) legacyToggle.checked = false;
        
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
    // El tema ya está manejado por theme.init() en initCommonEvents.
    // Esta función solo configura eventos que realmente requieren Auth.
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

    // Inicializar el sistema de temas (modo oscuro)
    this.theme.init();

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
        UI.theme.toggle();
        
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
