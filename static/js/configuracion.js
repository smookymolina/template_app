/**
 *  MÓDULO DE CONFIGURACIÓN - GESTIÓN DE PREFERENCIAS DE USUARIO
 * Maneja la funcionalidad de configuración de la aplicación
 */

class ConfigurationManager {
    constructor() {
        this.settings = {};
        this.isLoading = false;
        this.init();
    }

    init() {
        console.log('=' Inicializando ConfigurationManager...');
        this.bindElements();
        this.bindEvents();
        this.loadUserSettings();
        console.log(' ConfigurationManager inicializado correctamente');
    }

    bindElements() {
        // Botones principales
        this.saveChangesBtn = document.getElementById('save-changes-btn');
        this.changePasswordBtn = document.getElementById('change-password-btn');
        
        // Campos de perfil
        this.usernameInput = document.getElementById('username-input');
        this.emailInput = document.getElementById('email-input');
        this.phoneInput = document.getElementById('user-phone');
        
        // Campos de contraseña
        this.currentPasswordInput = document.getElementById('current-password-input');
        this.newPasswordInput = document.getElementById('new-password-input');
        this.confirmNewPasswordInput = document.getElementById('confirm-new-password-input');
        
        // Configuraciones de apariencia
        this.darkModeToggle = document.getElementById('dark-mode-toggle');
        this.primaryColorRadios = document.querySelectorAll('input[name="primary-color"]');
        this.customColorInput = document.getElementById('custom-primary-color');
        
        // Configuraciones de notificaciones
        this.emailNotificationsToggle = document.getElementById('email-notifications-toggle');
        this.interviewRemindersToggle = document.getElementById('interview-reminders');
        
        // Contenedor de sesiones activas
        this.activeSessionsContainer = document.getElementById('active-sessions');
    }

    bindEvents() {
        console.log('= Binding configuration events...');
        
        // Eventos de botones principales
        if (this.saveChangesBtn) {
            this.saveChangesBtn.addEventListener('click', () => this.handleSaveChanges());
        }
        
        if (this.changePasswordBtn) {
            this.changePasswordBtn.addEventListener('click', () => this.handleChangePassword());
        }
        
        // Eventos de modo oscuro
        if (this.darkModeToggle) {
            this.darkModeToggle.addEventListener('change', () => this.handleDarkModeToggle());
        }
        
        // Eventos de color principal
        this.primaryColorRadios.forEach(radio => {
            radio.addEventListener('change', () => this.handleColorChange(radio.value));
        });
        
        if (this.customColorInput) {
            this.customColorInput.addEventListener('change', () => this.handleCustomColorChange());
        }
        
        // Eventos de configuraciones de notificaciones
        if (this.emailNotificationsToggle) {
            this.emailNotificationsToggle.addEventListener('change', () => this.handleNotificationSettings());
        }
        
        if (this.interviewRemindersToggle) {
            this.interviewRemindersToggle.addEventListener('change', () => this.handleNotificationSettings());
        }
        
        // Cargar sesiones activas cuando se muestra la sección
        document.addEventListener('sectionChanged', (event) => {
            if (event.detail.section === 'configuracion-section') {
                this.loadActiveSessions();
            }
        });
    }

    async handleSaveChanges() {
        if (this.isLoading) return;
        
        console.log('=¾ Guardando cambios de perfil...');
        this.isLoading = true;
        this.updateButton(this.saveChangesBtn, true, 'Guardando...');
        
        try {
            const profileData = {
                nombre: this.usernameInput?.value?.trim() || '',
                telefono: this.phoneInput?.value?.trim() || ''
            };
            
            const response = await fetch('/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showNotification('Perfil actualizado correctamente', 'success');
                this.loadUserSettings(); // Recargar datos
            } else {
                this.showNotification(result.message || 'Error al actualizar perfil', 'error');
            }
            
        } catch (error) {
            console.error('L Error al guardar cambios:', error);
            this.showNotification('Error de conexión al guardar cambios', 'error');
        } finally {
            this.isLoading = false;
            this.updateButton(this.saveChangesBtn, false, '<i class="fas fa-save"></i> Guardar Cambios');
        }
    }

    async handleChangePassword() {
        if (this.isLoading) return;
        
        console.log('= Cambiando contraseña...');
        
        // Validar campos
        const currentPassword = this.currentPasswordInput?.value || '';
        const newPassword = this.newPasswordInput?.value || '';
        const confirmPassword = this.confirmNewPasswordInput?.value || '';
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showNotification('Todos los campos de contraseña son obligatorios', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            this.showNotification('La nueva contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showNotification('Las contraseñas no coinciden', 'error');
            return;
        }
        
        this.isLoading = true;
        this.updateButton(this.changePasswordBtn, true, 'Cambiando...');
        
        try {
            const response = await fetch('/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showNotification('Contraseña cambiada correctamente', 'success');
                // Limpiar campos
                this.currentPasswordInput.value = '';
                this.newPasswordInput.value = '';
                this.confirmNewPasswordInput.value = '';
            } else {
                this.showNotification(result.message || 'Error al cambiar contraseña', 'error');
            }
            
        } catch (error) {
            console.error('L Error al cambiar contraseña:', error);
            this.showNotification('Error de conexión al cambiar contraseña', 'error');
        } finally {
            this.isLoading = false;
            this.updateButton(this.changePasswordBtn, false, '<i class="fas fa-key"></i> Cambiar Contraseña');
        }
    }

    handleDarkModeToggle() {
        const isDarkMode = this.darkModeToggle.checked;
        console.log('< Modo oscuro:', isDarkMode ? 'activado' : 'desactivado');
        
        // Aplicar tema
        document.body.classList.toggle('dark-mode', isDarkMode);
        
        // Guardar preferencia
        this.saveSetting('dark_mode', isDarkMode);
        
        this.showNotification(
            `Modo ${isDarkMode ? 'oscuro' : 'claro'} activado`, 
            'info'
        );
    }

    handleColorChange(color) {
        console.log('<¨ Cambiando color principal a:', color);
        
        // Aplicar color
        document.documentElement.style.setProperty('--primary-color', color);
        
        // Actualizar selección visual
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`input[value="${color}"]`)?.closest('.color-option');
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        // Guardar preferencia
        this.saveSetting('primary_color', color);
    }

    handleCustomColorChange() {
        const customColor = this.customColorInput.value;
        console.log('<¨ Color personalizado:', customColor);
        
        // Aplicar color personalizado
        document.documentElement.style.setProperty('--primary-color', customColor);
        
        // Deseleccionar opciones predefinidas
        this.primaryColorRadios.forEach(radio => {
            radio.checked = false;
            radio.closest('.color-option').classList.remove('selected');
        });
        
        // Guardar preferencia
        this.saveSetting('primary_color', customColor);
    }

    handleNotificationSettings() {
        const emailNotifications = this.emailNotificationsToggle?.checked || false;
        const interviewReminders = this.interviewRemindersToggle?.checked || false;
        
        console.log('= Configuración de notificaciones:', {
            email: emailNotifications,
            reminders: interviewReminders
        });
        
        // Guardar configuraciones
        this.saveSetting('email_notifications', emailNotifications);
        this.saveSetting('interview_reminders', interviewReminders);
        
        this.showNotification('Configuración de notificaciones actualizada', 'success');
    }

    async loadUserSettings() {
        console.log('=å Cargando configuración de usuario...');
        
        try {
            const response = await fetch('/auth/user-settings', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.populateUserData(result.user, result.settings);
            } else {
                console.warn('  No se pudieron cargar las configuraciones:', result.message);
            }
            
        } catch (error) {
            console.error('L Error al cargar configuraciones:', error);
        }
    }

    populateUserData(user, settings = {}) {
        console.log('=Ý Poblando datos de usuario:', user);
        
        // Poblar campos de perfil
        if (this.usernameInput && user.nombre) {
            this.usernameInput.value = user.nombre;
        }
        
        if (this.emailInput && user.email) {
            this.emailInput.value = user.email;
        }
        
        if (this.phoneInput && user.telefono) {
            this.phoneInput.value = user.telefono;
        }
        
        // Aplicar configuraciones guardadas
        if (settings.dark_mode !== undefined && this.darkModeToggle) {
            this.darkModeToggle.checked = settings.dark_mode;
            document.body.classList.toggle('dark-mode', settings.dark_mode);
        }
        
        if (settings.primary_color && settings.primary_color !== 'default') {
            document.documentElement.style.setProperty('--primary-color', settings.primary_color);
            
            // Seleccionar opción correspondiente
            const matchingRadio = document.querySelector(`input[value="${settings.primary_color}"]`);
            if (matchingRadio) {
                matchingRadio.checked = true;
                matchingRadio.closest('.color-option')?.classList.add('selected');
            } else {
                // Es un color personalizado
                if (this.customColorInput) {
                    this.customColorInput.value = settings.primary_color;
                }
            }
        }
        
        if (settings.email_notifications !== undefined && this.emailNotificationsToggle) {
            this.emailNotificationsToggle.checked = settings.email_notifications;
        }
        
        if (settings.interview_reminders !== undefined && this.interviewRemindersToggle) {
            this.interviewRemindersToggle.checked = settings.interview_reminders;
        }
    }

    async loadActiveSessions() {
        if (!this.activeSessionsContainer) return;
        
        console.log('= Cargando sesiones activas...');
        this.activeSessionsContainer.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando sesiones...';
        
        try {
            const response = await fetch('/auth/user-sessions', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.displayActiveSessions(result.sessions || []);
            } else {
                this.activeSessionsContainer.innerHTML = '<p>Error al cargar sesiones activas</p>';
            }
            
        } catch (error) {
            console.error('L Error al cargar sesiones:', error);
            this.activeSessionsContainer.innerHTML = '<p>Error de conexión</p>';
        }
    }

    displayActiveSessions(sessions) {
        if (sessions.length === 0) {
            this.activeSessionsContainer.innerHTML = '<p>No hay sesiones activas</p>';
            return;
        }
        
        const sessionsHTML = sessions.map(session => `
            <div class="session-item">
                <div class="session-info">
                    <strong>IP:</strong> ${session.ip_address || 'N/A'}<br>
                    <strong>Navegador:</strong> ${session.user_agent || 'N/A'}<br>
                    <strong>Inicio:</strong> ${new Date(session.created_at).toLocaleString('es-ES')}
                </div>
                <div class="session-actions">
                    ${session.is_current ? 
                        '<span class="current-session">Sesión actual</span>' : 
                        `<button class="btn-sm btn-danger" onclick="window.configManager?.terminateSession('${session.id}')">
                            <i class="fas fa-sign-out-alt"></i> Cerrar
                        </button>`
                    }
                </div>
            </div>
        `).join('');
        
        this.activeSessionsContainer.innerHTML = sessionsHTML;
    }

    async terminateSession(sessionId) {
        console.log('=ª Terminando sesión:', sessionId);
        
        try {
            const response = await fetch(`/auth/terminate-session/${sessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showNotification('Sesión terminada correctamente', 'success');
                this.loadActiveSessions(); // Recargar lista
            } else {
                this.showNotification(result.message || 'Error al terminar sesión', 'error');
            }
            
        } catch (error) {
            console.error('L Error al terminar sesión:', error);
            this.showNotification('Error de conexión al terminar sesión', 'error');
        }
    }

    async saveSetting(key, value) {
        try {
            await fetch('/auth/save-setting', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    key: key,
                    value: value
                })
            });
        } catch (error) {
            console.error(`L Error al guardar configuración ${key}:`, error);
        }
    }

    updateButton(button, loading, text) {
        if (!button) return;
        
        button.disabled = loading;
        button.innerHTML = loading ? `<i class="fas fa-spinner fa-spin"></i> ${text}` : text;
    }

    showNotification(message, type = 'info') {
        // Usar el sistema de notificaciones existente
        if (window.showNotification) {
            window.showNotification(message, type);
        } else if (window.showSuccess && type === 'success') {
            window.showSuccess(message);
        } else if (window.showError && type === 'error') {
            window.showError(message);
        } else {
            console.log(`= CONFIGURACIÓN [${type.toUpperCase()}]: ${message}`);
        }
    }

    // Método de debug
    debugStatus() {
        return {
            isLoading: this.isLoading,
            settings: this.settings,
            elementsFound: {
                saveChangesBtn: !!this.saveChangesBtn,
                changePasswordBtn: !!this.changePasswordBtn,
                darkModeToggle: !!this.darkModeToggle,
                activeSessionsContainer: !!this.activeSessionsContainer
            }
        };
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en una página con elementos de configuración
    const configSection = document.getElementById('configuracion-section');
    const saveChangesBtn = document.getElementById('save-changes-btn');
    
    if (configSection || saveChangesBtn) {
        console.log('<¯ Detectados elementos de configuración, inicializando...');
        window.configManager = new ConfigurationManager();
    } else {
        console.log('9 No se encontraron elementos de configuración - configuracion.js en standby');
    }
});

// Listener adicional para cuando se cambia a la sección de configuración
document.addEventListener('sectionChanged', function(event) {
    if (event.detail && event.detail.section === 'configuracion-section') {
        console.log('=Í Cambiando a sección configuración');
        
        // Re-inicializar si no existe
        if (!window.configManager) {
            console.log('= Inicializando ConfigurationManager para sección configuración');
            window.configManager = new ConfigurationManager();
        }
    }
});

// Función global para debugging
window.debugConfigManager = function() {
    if (window.configManager) {
        console.log('Debug ConfigurationManager:', window.configManager.debugStatus());
        return window.configManager.debugStatus();
    } else {
        console.log('ConfigurationManager no inicializado');
        return null;
    }
};

// Exponer globalmente para debugging
window.ConfigurationManager = ConfigurationManager;

console.log(' configuracion.js cargado - Módulo de configuración listo');