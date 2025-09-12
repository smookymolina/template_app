/**
 *  M�DULO DE CONFIGURACI�N - GESTI�N DE PREFERENCIAS DE USUARIO
 * Maneja la funcionalidad de configuraci�n de la aplicaci�n
 */

class ConfigurationManager {
    constructor() {
        this.settings = {};
        this.isLoading = false;
        this.init();
    }

    init() {
        console.log('= Inicializando ConfigurationManager...');
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
        
        // Campos de contrase�a
        this.currentPasswordInput = document.getElementById('current-password-input');
        this.newPasswordInput = document.getElementById('new-password-input');
        this.confirmNewPasswordInput = document.getElementById('confirm-new-password-input');
        
        // Configuraciones de apariencia
        
        this.primaryColorRadios = document.querySelectorAll('input[name="primary-color"]');
        this.customColorInput = document.getElementById('custom-primary-color');
        
        // Elementos de foto de perfil
        this.userPhotoFile = document.getElementById('user-photo-file');
        this.userPhotoPreview = document.getElementById('user-photo-preview');
        this.removeUserPhoto = document.getElementById('remove-user-photo');
        
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
        
        // Eventos de foto de perfil
        if (this.userPhotoFile) {
            this.userPhotoFile.addEventListener('change', () => this.handlePhotoUpload());
        }
        
        if (this.removeUserPhoto) {
            this.removeUserPhoto.addEventListener('click', () => this.handleRemovePhoto());
        }
        
        // Cargar sesiones activas cuando se muestra la secci�n
        document.addEventListener('sectionChanged', (event) => {
            if (event.detail.section === 'configuracion-section') {
                this.loadActiveSessions();
            }
        });
    }

    async handleSaveChanges() {
        if (this.isLoading) return;
        
        console.log('=� Guardando cambios de perfil...');
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
            this.showNotification('Error de conexi�n al guardar cambios', 'error');
        } finally {
            this.isLoading = false;
            this.updateButton(this.saveChangesBtn, false, '<i class="fas fa-save"></i> Guardar Cambios');
        }
    }

    async handleChangePassword() {
        if (this.isLoading) return;
        
        console.log('= Cambiando contrase�a...');
        
        // Validar campos
        const currentPassword = this.currentPasswordInput?.value || '';
        const newPassword = this.newPasswordInput?.value || '';
        const confirmPassword = this.confirmNewPasswordInput?.value || '';
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showNotification('Todos los campos de contrase�a son obligatorios', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            this.showNotification('La nueva contrase�a debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showNotification('Las contrase�as no coinciden', 'error');
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
                this.showNotification('Contrase�a cambiada correctamente', 'success');
                // Limpiar campos
                this.currentPasswordInput.value = '';
                this.newPasswordInput.value = '';
                this.confirmNewPasswordInput.value = '';
            } else {
                this.showNotification(result.message || 'Error al cambiar contrase�a', 'error');
            }
            
        } catch (error) {
            console.error('L Error al cambiar contrase�a:', error);
            this.showNotification('Error de conexi�n al cambiar contrase�a', 'error');
        } finally {
            this.isLoading = false;
            this.updateButton(this.changePasswordBtn, false, '<i class="fas fa-key"></i> Cambiar Contrase�a');
        }
    }

    

    handleColorChange(color) {
        console.log('<� Cambiando color principal a:', color);
        
        // Aplicar color
        document.documentElement.style.setProperty('--primary-color', color);
        
        // Actualizar selecci�n visual
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
        console.log('<� Color personalizado:', customColor);
        
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
        
        console.log('= Configuraci�n de notificaciones:', {
            email: emailNotifications,
            reminders: interviewReminders
        });
        
        // Guardar configuraciones
        this.saveSetting('email_notifications', emailNotifications);
        this.saveSetting('interview_reminders', interviewReminders);
        
        this.showNotification('Configuraci�n de notificaciones actualizada', 'success');
    }

    async handlePhotoUpload() {
        const file = this.userPhotoFile.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showNotification('Por favor selecciona un archivo de imagen válido', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB max
            this.showNotification('La imagen no debe superar los 5MB', 'error');
            return;
        }

        console.log('📸 Subiendo foto de perfil...');
        this.isLoading = true;

        try {
            const formData = new FormData();
            formData.append('foto', file);

            const response = await fetch('/auth/upload-profile-photo', {
                method: 'POST',
                body: formData
            });

            console.log('[handlePhotoUpload] Respuesta del servidor:', response);
            const result = await response.json();
            console.log('[handlePhotoUpload] JSON de la respuesta:', result);

            if (response.ok && result.success && result.foto_url) {
                console.log('[handlePhotoUpload] Subida exitosa. URL recibida:', result.foto_url);
                this.displayPhotoPreview(result.foto_url);
                this.showNotification('Foto de perfil actualizada correctamente', 'success');
            } else {
                console.error('[handlePhotoUpload] El servidor indicó un error:', result.message);
                this.showNotification(result.message || 'Error al subir la foto', 'error');
            }

        } catch (error) {
            console.error('❌ Error de red o de JSON en handlePhotoUpload:', error);
            this.showNotification('Error de conexión al subir la foto', 'error');
        } finally {
            this.isLoading = false;
            this.userPhotoFile.value = '';
        }
    }

    async handleRemovePhoto() {
        if (!confirm('¿Estás seguro de que quieres eliminar tu foto de perfil?')) {
            return;
        }

        console.log('🗑️ Eliminando foto de perfil...');
        this.isLoading = true;

        try {
            const response = await fetch('/auth/remove-profile-photo', {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.resetPhotoPreview();
                this.showNotification('Foto de perfil eliminada correctamente', 'success');
            } else {
                this.showNotification(result.message || 'Error al eliminar la foto', 'error');
            }

        } catch (error) {
            console.error('❌ Error al eliminar foto:', error);
            this.showNotification('Error de conexión al eliminar la foto', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    displayPhotoPreview(photoUrl) {
        console.log(`[displayPhotoPreview] Recibida URL: ${photoUrl}`);
        if (this.userPhotoPreview && photoUrl) {
            // Añadir un "cache buster" para forzar la recarga de la imagen
            const finalUrl = `${photoUrl}?t=${new Date().getTime()}`;
            console.log(`[displayPhotoPreview] URL final a mostrar: ${finalUrl}`);

            this.userPhotoPreview.innerHTML = `<img src="${finalUrl}" alt="Foto de perfil" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            
            const label = document.getElementById('user-photo-label');
            if (label) {
                label.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar foto';
            }

            if (this.removeUserPhoto) {
                this.removeUserPhoto.style.display = 'inline-block';
            }
        } else {
            console.warn('[displayPhotoPreview] Llamado sin URL o sin elemento de preview.');
        }
    }

    resetPhotoPreview() {
        if (this.userPhotoPreview) {
            this.userPhotoPreview.innerHTML = '<i class="fas fa-user-circle"></i>';
            
            const label = document.getElementById('user-photo-label');
            if (label) {
                label.innerHTML = '<i class="fas fa-camera"></i> Subir foto';
            }

            if (this.removeUserPhoto) {
                this.removeUserPhoto.style.display = 'none';
            }
        }
    }

    async loadUserSettings() {
        console.log('=� Cargando configuraci�n de usuario...');
        
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
                console.warn('� No se pudieron cargar las configuraciones:', result.message);
            }
            
        } catch (error) {
            console.error('L Error al cargar configuraciones:', error);
        }
    }

    populateUserData(user, settings = {}) {
        console.log('=� Poblando datos de usuario:', user);
        
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
        
        // Cargar foto de perfil si existe
        if (user.foto_url) {
            this.displayPhotoPreview(user.foto_url);
        } else {
            this.resetPhotoPreview();
        }
        
        
        
        if (settings.primary_color && settings.primary_color !== 'default') {
            document.documentElement.style.setProperty('--primary-color', settings.primary_color);
            
            // Seleccionar opci�n correspondiente
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
            this.activeSessionsContainer.innerHTML = '<p>Error de conexi�n</p>';
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
                        '<span class="current-session">Sesi�n actual</span>' : 
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
        console.log('=� Terminando sesi�n:', sessionId);
        
        try {
            const response = await fetch(`/auth/terminate-session/${sessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showNotification('Sesi�n terminada correctamente', 'success');
                this.loadActiveSessions(); // Recargar lista
            } else {
                this.showNotification(result.message || 'Error al terminar sesi�n', 'error');
            }
            
        } catch (error) {
            console.error('L Error al terminar sesi�n:', error);
            this.showNotification('Error de conexi�n al terminar sesi�n', 'error');
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
            console.error(`L Error al guardar configuraci�n ${key}:`, error);
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
            console.log(`= CONFIGURACI�N [${type.toUpperCase()}]: ${message}`);
        }
    }

    // M�todo de debug
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

// Inicializar cuando el DOM est� listo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en una p�gina con elementos de configuraci�n
    const configSection = document.getElementById('configuracion-section');
    const saveChangesBtn = document.getElementById('save-changes-btn');
    
    if (configSection || saveChangesBtn) {
        console.log('<� Detectados elementos de configuraci�n, inicializando...');
        window.configManager = new ConfigurationManager();
    } else {
        console.log('9 No se encontraron elementos de configuraci�n - configuracion.js en standby');
    }
});

// Listener adicional para cuando se cambia a la secci�n de configuraci�n
document.addEventListener('sectionChanged', function(event) {
    if (event.detail && event.detail.section === 'configuracion-section') {
        console.log('=� Cambiando a secci�n configuraci�n');
        
        // Re-inicializar si no existe
        if (!window.configManager) {
            console.log('= Inicializando ConfigurationManager para secci�n configuraci�n');
            window.configManager = new ConfigurationManager();
        }
    }
});

// Funci�n global para debugging
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

console.log(' configuracion.js cargado - M�dulo de configuraci�n listo');