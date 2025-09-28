/**
 * ✅ MÓDULO DE CONFIGURACIÓN - GESTIÓN DE PREFERENCIAS DE USUARIO
 * Maneja la funcionalidad de configuración de la aplicación
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
        // this.loadUserSettings(); // Se cargará después de la autenticación
        console.log('✅ ConfigurationManager inicializado correctamente');
    }

    // ✅ NUEVA FUNCIÓN: Cargar configuraciones solo para usuarios autenticados
    async loadSettingsForAuthenticatedUser() {
        console.log('ConfigurationManager: intentando cargar configuraciones para usuario autenticado...');
        this.showLoader();
        const loaderText = document.querySelector('#configuracion-loader .loader-text');
        if (loaderText) loaderText.textContent = 'Cargando configuracion y usuarios...';

        try {
            const currentUser = await this.resolveCurrentUser();

            if (!currentUser) {
                console.log('ConfigurationManager: usuario no autenticado, no se cargan configuraciones.');
                return;
            }

            const tasks = [
                this.loadUserSettings(),
                this.loadActiveSessions()
            ];

            if (currentUser.rol === 'admin') {
                const manager = await this.ensureUserManagerReady();

                if (manager && typeof manager.loadUsers === 'function') {
                    let adminUser = currentUser;

                    if (typeof manager.waitForAdminUser === 'function') {
                        adminUser = await manager.waitForAdminUser();
                    }

                    if (adminUser && adminUser.rol === 'admin') {
                        tasks.push(manager.loadUsers(adminUser));
                    }
                } else {
                    console.log('ConfigurationManager: userAccountManager no disponible, se omitio la carga de usuarios.');
                }
            }

            await Promise.all(tasks);
        } finally {
            if (loaderText) loaderText.textContent = 'Cargando configuracion...';
            this.hideLoader();
        }
    }

    async resolveCurrentUser() {
        if (window.Auth && window.Auth.currentUser) {
            return window.Auth.currentUser;
        }

        try {
            const stored = localStorage.getItem('user_data');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (window.Auth && typeof window.Auth.updateUserData === 'function') {
                    window.Auth.updateUserData(parsed);
                } else if (window.Auth) {
                    window.Auth.currentUser = parsed;
                }
                return parsed;
            }
        } catch (error) {
            console.warn('ConfigurationManager: no se pudo leer user_data almacenado', error);
        }

        if (window.Auth && typeof window.Auth.checkAuth === 'function') {
            try {
                return await window.Auth.checkAuth();
            } catch (error) {
                console.warn('ConfigurationManager: error verificando autenticacion', error);
            }
        }

        return null;
    }

    async ensureUserManagerReady(maxWait = 2500) {
        if (window.userAccountManager && window.userAccountManager.ready) {
            return window.userAccountManager;
        }

        return new Promise(resolve => {
            let settled = false;

            const cleanup = () => {
                if (settled) return;
                settled = true;
                document.removeEventListener('userAccountManagerReady', onReady);
                clearTimeout(timerId);
            };

            const onReady = () => {
                cleanup();
                resolve(window.userAccountManager || null);
            };

            const timerId = setTimeout(() => {
                cleanup();
                resolve(window.userAccountManager || null);
            }, maxWait);

            document.addEventListener('userAccountManagerReady', onReady, { once: true });
        });
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
        console.log('✅ Binding configuration events...');
        
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
        
        // Cargar sesiones activas cuando se muestra la sección
        document.addEventListener('sectionChanged', (event) => {
            if (event.detail.section === 'configuracion-section') {
                this.loadActiveSessions();
            }
        });
    }

    async handleSaveChanges() {
        if (this.isLoading) return;
        
        console.log('🔄 Guardando cambios de perfil...');
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
            console.error('❌ Error al guardar cambios:', error);
            this.showNotification('Error de conexión al guardar cambios', 'error');
        } finally {
            this.isLoading = false;
            this.updateButton(this.saveChangesBtn, false, '<i class="fas fa-save"></i> Guardar Cambios');
        }
    }

    async handleChangePassword() {
        if (this.isLoading) return;
        
        console.log('🔄 Cambiando contraseña...');
        
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
            console.error('❌ Error al cambiar contraseña:', error);
            this.showNotification('Error de conexión al cambiar contraseña', 'error');
        } finally {
            this.isLoading = false;
            this.updateButton(this.changePasswordBtn, false, '<i class="fas fa-key"></i> Cambiar Contraseña');
        }
    }

    

    handleColorChange(color) {
        console.log('🎨 Cambiando color principal a:', color);

        // Aplicar color inmediatamente
        this.applyColorTheme(color);

        // Actualizar selección visual
        this.updateColorSelection(color);

        // Guardar preferencia y sincronizar
        this.saveSetting('primary_color', color);
        this.syncUIChanges();
    }

    applyColorTheme(color) {
        if (window.UI && typeof window.UI.changePrimaryColor === 'function') {
            window.UI.changePrimaryColor(color);
        } else {
            document.documentElement.style.setProperty('--primary-color', color);
            document.documentElement.style.setProperty('--primary-dark', this.darkenColor(color, 20));
            document.documentElement.style.setProperty('--primary-light', this.lightenColor(color, 80));
        }

        // Actualizar colores relacionados inmediatamente
        this.updateDynamicColors(color);
    }

    updateColorSelection(color) {
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
        });

        const selectedOption = document.querySelector(`input[value="${color}"]`)?.closest('.color-option');
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
    }

    updateDynamicColors(primaryColor) {
        // Actualizar elementos que usan colores dinámicos
        const dynamicElements = document.querySelectorAll('.btn-primary, .badge-primary, .nav-link.active');
        dynamicElements.forEach(element => {
            element.style.backgroundColor = primaryColor;
        });
    }

    darkenColor(hex, percent) {
        const num = parseInt(hex.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    lightenColor(hex, percent) {
        const num = parseInt(hex.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    handleCustomColorChange() {
        const customColor = this.customColorInput.value;
        console.log('🎨 Color personalizado:', customColor);

        // ✅ USAR FUNCIÓN COMPLETA DE APLICACIÓN DE COLOR
        this.applyColorTheme(customColor);

        // Deseleccionar opciones predefinidas
        this.primaryColorRadios.forEach(radio => {
            radio.checked = false;
            radio.closest('.color-option').classList.remove('selected');
        });

        // Guardar preferencia y sincronizar
        this.saveSetting('primary_color', customColor);
        this.syncUIChanges();

        // ✅ ACTUALIZAR TAMBIÉN EL UI.js SI EXISTE
        if (window.UI && typeof window.UI.changePrimaryColor === 'function') {
            window.UI.changePrimaryColor(customColor);
        }
    }

    handleNotificationSettings() {
        const emailNotifications = this.emailNotificationsToggle?.checked || false;
        const interviewReminders = this.interviewRemindersToggle?.checked || false;
        
        console.log('🔄 Configuración de notificaciones:', {
            email: emailNotifications,
            reminders: interviewReminders
        });
        
        // Guardar configuraciones
        this.saveSetting('email_notifications', emailNotifications);
        this.saveSetting('interview_reminders', interviewReminders);
        
        this.showNotification('Configuración de notificaciones actualizada', 'success');
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

            // ✅ ACTUALIZAR TODAS LAS FOTOS DE PERFIL EN LA UI
            this.updateAllProfileImages(finalUrl);
        } else {
            console.warn('[displayPhotoPreview] Llamado sin URL o sin elemento de preview.');
        }
    }

    updateAllProfileImages(photoUrl) {
        console.log('🔄 Actualizando todas las fotos de perfil en la UI...');

        // Lista de selectores de fotos de perfil en la aplicación
        const profileImageSelectors = [
            '#dashboard-profile-pic',
            '#user-avatar',
            '#profile-image',
            '.profile-picture',
            '.user-photo'
        ];

        profileImageSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (element.tagName === 'IMG') {
                    element.src = photoUrl;
                    console.log(`📸 Actualizada imagen: ${selector}`);
                } else if (element.style) {
                    element.style.backgroundImage = `url(${photoUrl})`;
                    console.log(`📸 Actualizado background: ${selector}`);
                }
            });
        });

        // Actualizar en Auth.currentUser si existe
        if (window.Auth && window.Auth.currentUser) {
            window.Auth.currentUser.foto_url = photoUrl.split('?')[0]; // Sin cache buster
            localStorage.setItem('user_data', JSON.stringify(window.Auth.currentUser));
            console.log('👤 Actualizado foto en Auth.currentUser');
        }

        console.log('✅ Todas las fotos de perfil actualizadas');
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
        console.log('🔄 Cargando configuración de usuario...');
        
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
                console.warn('⚠️ No se pudieron cargar las configuraciones:', result.message);
            }
            
        } catch (error) {
            console.error('❌ Error al cargar configuraciones:', error);
        }
    }

    populateUserData(user, settings = {}) {
        console.log('🔄 Poblando datos de usuario:', user);
        
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
        
        
        
        if (window.UI && typeof window.UI.applyUserSettings === 'function') {
            window.UI.applyUserSettings(settings);
        } else if (settings.primary_color && settings.primary_color !== 'default') {
            this.applyColorTheme(settings.primary_color);

            // Seleccionar opción correspondiente
            const matchingRadio = document.querySelector(`input[value="${settings.primary_color}"]`);
            if (matchingRadio) {
                matchingRadio.checked = true;
                matchingRadio.closest('.color-option')?.classList.add('selected');
            } else if (this.customColorInput) {
                // Es un color personalizado
                this.customColorInput.value = settings.primary_color;
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
        
        console.log('🔄 Cargando sesiones activas...');
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
            console.error('❌ Error al cargar sesiones:', error);
            this.activeSessionsContainer.innerHTML = '<p>Error de conexión</p>';
        }
    }

    displayActiveSessions(sessions) {
        // Actualizar contador de sesiones
        const sessionsCount = document.getElementById('sessions-count');
        if (sessionsCount) {
            const count = sessions.length;
            sessionsCount.textContent = `${count} sesión${count !== 1 ? 'es' : ''}`;
        }

        if (sessions.length === 0) {
            this.activeSessionsContainer.innerHTML = '<div class="no-sessions">No hay sesiones activas</div>';
            return;
        }

        const sessionsHTML = sessions.map((session, index) => `
            <div class="session-item fade-in" style="animation-delay: ${index * 0.1}s">
                <div class="session-info">
                    <strong>IP:</strong> ${session.ip_address || 'N/A'}<br>
                    <strong>Navegador:</strong> ${this.truncateUserAgent(session.user_agent) || 'N/A'}<br>
                    <strong>Inicio:</strong> ${new Date(session.created_at).toLocaleString('es-ES')}<br>
                    <strong>Ubicación:</strong> ${session.location || 'Desconocida'}
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

    truncateUserAgent(userAgent) {
        if (!userAgent) return 'N/A';

        // Extraer información más legible del user agent
        const browserInfo = this.parseBrowserInfo(userAgent);
        return browserInfo || userAgent.substring(0, 50) + (userAgent.length > 50 ? '...' : '');
    }

    parseBrowserInfo(userAgent) {
        if (!userAgent) return 'Desconocido';

        const browsers = [
            { name: 'Chrome', pattern: /Chrome\/(\d+)/ },
            { name: 'Firefox', pattern: /Firefox\/(\d+)/ },
            { name: 'Safari', pattern: /Safari\/(\d+)/ },
            { name: 'Edge', pattern: /Edg\/(\d+)/ },
            { name: 'Opera', pattern: /Opera\/(\d+)/ }
        ];

        for (const browser of browsers) {
            const match = userAgent.match(browser.pattern);
            if (match) {
                return `${browser.name} ${match[1]}`;
            }
        }

        return 'Navegador desconocido';
    }

    async terminateSession(sessionId) {
        console.log('🔄 Terminando sesión:', sessionId);
        
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
            console.error('❌ Error al terminar sesión:', error);
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
            console.error(`❌ Error al guardar configuración ${key}:`, error);
        }
    }

    // ✅ NUEVA FUNCIÓN: Sincronizar cambios de UI inmediatamente
    syncUIChanges() {
        console.log('🔄 Sincronizando cambios de UI...');

        // Disparar evento personalizado para notificar cambios
        document.dispatchEvent(new CustomEvent('userSettingsChanged', {
            detail: {
                timestamp: Date.now(),
                type: 'ui_update'
            }
        }));

        // Actualizar Auth.currentUser si existe
        if (window.Auth && window.Auth.currentUser) {
            // Forzar actualización del estado
            window.Auth.checkAuth().then(user => {
                if (user) {
                    this.updateUIWithUserData(user);
                }
            }).catch(err => {
                console.warn('⚠️ Error al verificar auth tras cambios:', err);
            });
        }

        console.log('✅ Sincronización de UI completada');
    }

    // ✅ NUEVA FUNCIÓN: Actualizar UI con datos de usuario actualizados
    updateUIWithUserData(userData) {
        console.log('👤 Actualizando UI con datos de usuario:', userData.email);

        // Actualizar elementos de texto que muestran info del usuario
        const userNameElements = document.querySelectorAll('#gerente-name, #dropdown-user-name, #user-name');
        userNameElements.forEach(element => {
            if (element.tagName === 'INPUT') {
                element.value = userData.nombre || userData.email;
            } else {
                element.textContent = userData.nombre || userData.email;
            }
        });

        // Actualizar email si es campo de input
        const emailElement = document.getElementById('user-email');
        if (emailElement && emailElement.tagName === 'INPUT') {
            emailElement.value = userData.email;
        }

        // Actualizar teléfono si existe
        const phoneElement = document.getElementById('user-phone');
        if (phoneElement && userData.telefono) {
            phoneElement.value = userData.telefono;
        }

        // Actualizar foto de perfil si existe
        if (userData.foto_url) {
            this.updateAllProfileImages(userData.foto_url + '?t=' + Date.now());
        }

        console.log('✅ UI actualizada con datos de usuario');
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
            console.log(`🔄 CONFIGURACIÓN [${type.toUpperCase()}]: ${message}`);
        }
    }

    // ✅ NUEVA FUNCIÓN: Resetear a configuraciones por defecto
    resetToDefaults() {
        console.log('🔄 Reseteando ConfigurationManager a valores por defecto...');

        // Resetear campos de perfil a vacío
        if (this.usernameInput) this.usernameInput.value = '';
        if (this.emailInput) this.emailInput.value = '';
        if (this.phoneInput) this.phoneInput.value = '';

        // Resetear foto de perfil
        this.resetPhotoPreview();

        // Resetear configuraciones de color
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Seleccionar color por defecto (azul)
        const defaultColorOption = document.querySelector('input[value="#007bff"]');
        if (defaultColorOption) {
            defaultColorOption.checked = true;
            defaultColorOption.parentElement.classList.add('selected');
        }

        // Aplicar color por defecto
        this.applyColorTheme('#007bff');

        // Resetear configuraciones de notificaciones
        if (this.emailNotificationsToggle) this.emailNotificationsToggle.checked = true;
        if (this.interviewRemindersToggle) this.interviewRemindersToggle.checked = true;

        // Limpiar campos de contraseña
        if (this.currentPasswordInput) this.currentPasswordInput.value = '';
        if (this.newPasswordInput) this.newPasswordInput.value = '';
        if (this.confirmNewPasswordInput) this.confirmNewPasswordInput.value = '';

        // Limpiar contenedor de sesiones activas
        if (this.activeSessionsContainer) {
            this.activeSessionsContainer.innerHTML = '';
        }

        console.log('✅ ConfigurationManager reseteado a valores por defecto');
    }

    showLoader() {
        const loader = document.getElementById('configuracion-loader');
        if (loader) {
            loader.style.display = 'flex';

            const progressFill = document.getElementById('configuracion-progress-fill');
            if (progressFill) {
                progressFill.style.width = '0%';
                setTimeout(() => progressFill.style.width = '100%', 100);
            }
        }
    }

    hideLoader() {
        const loader = document.getElementById('configuracion-loader');
        if (loader) {
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500); 
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
        console.log('⚙️ Detectados elementos de configuración, inicializando...');
        window.configManager = new ConfigurationManager();
    } else {
        console.log('ℹ️ No se encontraron elementos de configuración - configuracion.js en standby');
    }
});

// Listener adicional para cuando se cambia a la sección de configuración
document.addEventListener('sectionChanged', function(event) {
    if (event.detail && event.detail.section === 'configuracion-section') {
        console.log('🔄 Cambiando a sección configuración');
        
        // Re-inicializar si no existe
        if (!window.configManager) {
            console.log('🔄 Inicializando ConfigurationManager para sección configuración');
            window.configManager = new ConfigurationManager();
        }
        // ✅ NUEVO: Cargar configuraciones solo si el usuario está autenticado
        if (window.configManager && window.Auth && window.Auth.isAuthenticated()) {
            window.configManager.loadSettingsForAuthenticatedUser();
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

// ===== FUNCIÓN GLOBAL PARA CONTROLAR EL DESPLEGABLE DE SESIONES =====
window.toggleActiveSessionsDropdown = function() {
    const dropdown = document.getElementById('active-sessions-dropdown');
    const header = document.querySelector('.sessions-header');
    const chevron = document.getElementById('sessions-chevron');

    if (!dropdown || !header) return;

    const isExpanded = dropdown.classList.contains('expanded');

    if (isExpanded) {
        // Contraer
        dropdown.classList.remove('expanded');
        dropdown.classList.add('collapsed');
        header.classList.remove('expanded');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    } else {
        // Expandir
        dropdown.classList.remove('collapsed');
        dropdown.classList.add('expanded');
        header.classList.add('expanded');
        if (chevron) chevron.style.transform = 'rotate(180deg)';

        // Cargar sesiones si no se han cargado
        if (window.configManager && typeof window.configManager.loadActiveSessions === 'function') {
            window.configManager.loadActiveSessions();
        }
    }
};

console.log('✅ configuracion.js cargado - Módulo de configuración listo');
