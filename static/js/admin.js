/**
 * ✅ MÓDULO DE ADMINISTRACIÓN - GESTIÓN DE USUARIOS
 * Maneja la funcionalidad de creación de cuentas de usuarios para administradores
 */

class UserAccountManager {
    constructor() {
        this.form = null;
        this.submitBtn = null;
        this.modal = null;
        this.isSubmitting = false;
        this.init();
    }

    init() {
        console.log('🔧 Inicializando UserAccountManager...');
        this.bindElements();
        this.bindEvents();
        this.setupValidation();
        console.log('✅ UserAccountManager inicializado correctamente');
        
        // Cargar lista inicial de usuarios
        this.loadInitialUsersList();
    }

    bindElements() {
        // Elementos principales
        this.form = document.getElementById('create-user-form');
        this.submitBtn = document.getElementById('create-user-submit-btn');
        this.modal = document.getElementById('create-user-account-modal');
        
        // Log de debugging
        console.log('🔍 Binding elements:', {
            form: !!this.form,
            submitBtn: !!this.submitBtn, 
            modal: !!this.modal
        });
        
        // Campos del formulario
        this.fields = {
            nombre: document.getElementById('user-nombre'),
            email: document.getElementById('user-email'),
            password: document.getElementById('user-password'),
            passwordConfirm: document.getElementById('user-password-confirm'),
            role: document.getElementById('user-role')
        };

        // Elementos de error
        this.errorElements = {
            nombre: document.getElementById('user-nombre-error'),
            email: document.getElementById('user-email-error'),
            password: document.getElementById('user-password-error'),
            passwordConfirm: document.getElementById('user-password-confirm-error'),
            role: document.getElementById('user-role-error')
        };
        
        // Verificar elementos críticos
        const missingElements = [];
        if (!this.submitBtn) missingElements.push('create-user-submit-btn');
        if (!this.form) missingElements.push('create-user-form');
        if (!this.modal) missingElements.push('create-user-account-modal');
        
        if (missingElements.length > 0) {
            console.warn('⚠️ Elementos faltantes:', missingElements);
        }
    }

    bindEvents() {
        console.log('🔗 Binding events...');
        
        if (this.submitBtn) {
            console.log('✅ Botón submit encontrado, agregando evento');
            this.submitBtn.addEventListener('click', (e) => {
                console.log('🖱️ Click en botón crear usuario detectado');
                e.preventDefault();
                this.handleSubmit();
            });
        } else {
            console.warn('❌ Botón submit no encontrado');
        }

        if (this.form) {
            console.log('✅ Formulario encontrado, agregando evento');
            this.form.addEventListener('submit', (e) => {
                console.log('📋 Submit del formulario detectado');
                e.preventDefault();
                this.handleSubmit();
            });
        } else {
            console.warn('❌ Formulario no encontrado');
        }

        // Eventos de validación en tiempo real
        this.setupRealTimeValidation();

        // Configurar botón de actualizar usuarios
        this.setupRefreshButton();
    }

    setupRealTimeValidation() {
        // Validación de nombre
        if (this.fields.nombre) {
            this.fields.nombre.addEventListener('blur', () => {
                this.validateField('nombre');
            });
        }

        // Validación de email
        if (this.fields.email) {
            this.fields.email.addEventListener('blur', () => {
                this.validateField('email');
            });
        }

        // Validación de contraseña
        if (this.fields.password) {
            this.fields.password.addEventListener('input', () => {
                this.validateField('password');
                // Re-validar confirmación si ya se llenó
                if (this.fields.passwordConfirm.value) {
                    this.validateField('passwordConfirm');
                }
            });
        }

        // Validación de confirmación de contraseña
        if (this.fields.passwordConfirm) {
            this.fields.passwordConfirm.addEventListener('input', () => {
                this.validateField('passwordConfirm');
            });
        }
    }

    setupValidation() {
        this.validators = {
            nombre: (value) => {
                if (!value || value.trim().length < 2) {
                    return 'El nombre debe tener al menos 2 caracteres';
                }
                return null;
            },
            email: (value) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!value) {
                    return 'El correo electrónico es requerido';
                }
                if (!emailRegex.test(value)) {
                    return 'El formato del correo no es válido';
                }
                return null;
            },
            password: (value) => {
                if (!value) {
                    return 'La contraseña es requerida';
                }
                if (value.length < 6) {
                    return 'La contraseña debe tener al menos 6 caracteres';
                }
                return null;
            },
            passwordConfirm: (value) => {
                const password = this.fields.password.value;
                if (!value) {
                    return 'Confirma la contraseña';
                }
                if (value !== password) {
                    return 'Las contraseñas no coinciden';
                }
                return null;
            },
            role: (value) => {
                if (!value) {
                    return 'Selecciona un rol';
                }
                if (!['user', 'admin', 'gerente', 'asesor'].includes(value)) {
                    return 'Rol no válido';
                }
                return null;
            }
        };
    }

    validateField(fieldName) {
        const field = this.fields[fieldName];
        const errorElement = this.errorElements[fieldName];
        const validator = this.validators[fieldName];

        if (!field || !errorElement || !validator) return true;

        const value = field.value.trim();
        const error = validator(value);

        if (error) {
            this.showFieldError(field, errorElement, error);
            return false;
        } else {
            this.clearFieldError(field, errorElement);
            return true;
        }
    }

    validateAllFields() {
        let isValid = true;
        
        for (const fieldName of Object.keys(this.fields)) {
            if (!this.validateField(fieldName)) {
                isValid = false;
            }
        }

        return isValid;
    }

    showFieldError(field, errorElement, message) {
        field.classList.add('error');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    clearFieldError(field, errorElement) {
        field.classList.remove('error');
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }

    clearAllErrors() {
        for (const fieldName of Object.keys(this.fields)) {
            const field = this.fields[fieldName];
            const errorElement = this.errorElements[fieldName];
            if (field && errorElement) {
                this.clearFieldError(field, errorElement);
            }
        }
    }

    async handleSubmit() {
        if (this.isSubmitting) return;

        console.log('📝 Iniciando proceso de creación de usuario...');

        // Limpiar errores previos
        this.clearAllErrors();

        // Validar formulario
        if (!this.validateAllFields()) {
            this.showNotification('Por favor, corrige los errores en el formulario', 'error');
            return;
        }

        // Recopilar datos
        const formData = this.getFormData();
        
        this.isSubmitting = true;
        this.updateSubmitButton(true);

        try {
            const response = await this.submitUserData(formData);
            await this.handleResponse(response);
        } catch (error) {
            console.error('❌ Error durante la creación de usuario:', error);
            this.showNotification('Error de conexión al crear el usuario', 'error');
        } finally {
            this.isSubmitting = false;
            this.updateSubmitButton(false);
        }
    }

    getFormData() {
        return {
            nombre: this.fields.nombre.value.trim(),
            email: this.fields.email.value.trim(),
            password: this.fields.password.value,
            rol: this.fields.role.value
        };
    }

    async submitUserData(data) {
        console.log('🌐 Enviando datos al servidor:', data);
        
        const response = await fetch('/admin/usuarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        console.log('📡 Respuesta del servidor:', {
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type'),
            ok: response.ok
        });
        
        return response;
    }

    async handleResponse(response) {
        let result;
        
        try {
            // Verificar si la respuesta es JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else {
                // Si no es JSON, obtener el texto de la respuesta
                const textResponse = await response.text();
                console.error('❌ Respuesta no-JSON recibida:', textResponse);
                
                result = {
                    success: false,
                    message: `Error del servidor (${response.status}): Respuesta no válida`
                };
            }
        } catch (jsonError) {
            console.error('❌ Error al parsear JSON:', jsonError);
            result = {
                success: false,
                message: `Error de formato en respuesta del servidor`
            };
        }

        if (response.ok && result.success) {
            this.handleSuccess(result);
        } else {
            this.handleError(result, response.status);
        }
    }

    handleSuccess(result) {
        console.log('✅ Usuario creado exitosamente:', result);
        
        this.showNotification(
            `Usuario ${result.usuario?.email || 'nuevo'} creado exitosamente`, 
            'success'
        );

        this.resetForm();
        this.closeModal();

        // Opcional: Recargar lista de usuarios si existe
        this.refreshUserList();
    }

    handleError(result, statusCode) {
        console.error('❌ Error al crear usuario:', result);

        if (result.errors && typeof result.errors === 'object') {
            // Errores de validación específicos
            this.handleValidationErrors(result.errors);
        } else if (result.message) {
            // Error general del servidor
            this.showNotification(result.message, 'error');
        } else {
            // Error genérico
            const message = statusCode === 400 ? 
                'Error de validación. Verifica los datos ingresados' :
                'Error interno del servidor';
            this.showNotification(message, 'error');
        }
    }

    handleValidationErrors(errors) {
        let hasErrors = false;

        for (const [fieldName, message] of Object.entries(errors)) {
            const field = this.fields[fieldName];
            const errorElement = this.errorElements[fieldName];

            if (field && errorElement) {
                this.showFieldError(field, errorElement, message);
                hasErrors = true;
            }
        }

        if (hasErrors) {
            this.showNotification('Corrige los errores marcados en el formulario', 'error');
        }
    }

    updateSubmitButton(loading) {
        if (!this.submitBtn) return;

        if (loading) {
            this.submitBtn.disabled = true;
            this.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
        } else {
            this.submitBtn.disabled = false;
            this.submitBtn.innerHTML = '<i class="fas fa-save"></i> Crear Cuenta';
        }
    }

    resetForm() {
        if (this.form) {
            this.form.reset();
        }
        this.clearAllErrors();
        console.log('🧹 Formulario limpiado');
    }

    closeModal() {
        // Usar el sistema UI existente
        if (window.UI && window.UI.closeModal) {
            window.UI.closeModal('create-user-account-modal');
        } else if (this.modal) {
            // Fallback manual
            this.modal.style.display = 'none';
        }
        console.log('❌ Modal cerrado');
    }

    async refreshUserList() {
        console.log('🔄 Actualizando lista de usuarios...');
        
        const loadingElement = document.getElementById('loading-users');
        const listElement = document.getElementById('users-list');
        const noUsersElement = document.getElementById('no-users');

        if (!loadingElement || !listElement || !noUsersElement) {
            console.warn('⚠️ Elementos de lista de usuarios no encontrados');
            return;
        }

        // Mostrar loading
        loadingElement.style.display = 'block';
        listElement.style.display = 'none';
        noUsersElement.style.display = 'none';

        try {
            const response = await fetch('/admin/usuarios', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.displayUsersList(result.usuarios || []);
            } else {
                throw new Error(result.message || 'Error al cargar usuarios');
            }
        } catch (error) {
            console.error('❌ Error cargando usuarios:', error);
            this.showNotification('Error al cargar la lista de usuarios', 'error');
            noUsersElement.innerHTML = '<p>Error al cargar usuarios. Intenta nuevamente.</p>';
            noUsersElement.style.display = 'block';
        } finally {
            loadingElement.style.display = 'none';
        }
    }

    displayUsersList(usuarios) {
        const listElement = document.getElementById('users-list');
        const noUsersElement = document.getElementById('no-users');

        if (usuarios.length === 0) {
            noUsersElement.style.display = 'block';
            listElement.style.display = 'none';
            return;
        }

        listElement.innerHTML = this.generateUsersListHTML(usuarios);
        listElement.style.display = 'block';
        noUsersElement.style.display = 'none';

        console.log(`✅ Lista de usuarios actualizada: ${usuarios.length} usuarios`);
    }

    generateUsersListHTML(usuarios) {
        return `
            <div class="users-table">
                <div class="users-table-header">
                    <div class="user-info-col">Usuario</div>
                    <div class="user-role-col">Rol</div>
                    <div class="user-created-col">Creado</div>
                    <div class="user-actions-col">Acciones</div>
                </div>
                ${usuarios.map(user => this.generateUserRowHTML(user)).join('')}
            </div>
        `;
    }

    generateUserRowHTML(user) {
        const roleBadgeClass = this.getRoleBadgeClass(user.rol);
        const createdDate = user.created_at ? 
            new Date(user.created_at).toLocaleDateString('es-ES') : 
            'N/A';

        return `
            <div class="users-table-row" data-user-id="${user.id}">
                <div class="user-info-col">
                    <div class="user-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="user-details">
                        <div class="user-name">${user.nombre || 'Sin nombre'}</div>
                        <div class="user-email">${user.email}</div>
                    </div>
                </div>
                <div class="user-role-col">
                    <span class="role-badge ${roleBadgeClass}">${this.getRoleDisplayName(user.rol)}</span>
                </div>
                <div class="user-created-col">
                    ${createdDate}
                </div>
                <div class="user-actions-col">
                    <button class="btn-sm btn-secondary" onclick="window.userAccountManager?.viewUser(${user.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-sm btn-warning" onclick="window.userAccountManager?.editUser(${user.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getRoleBadgeClass(rol) {
        const classes = {
            'admin': 'badge-danger',
            'gerente': 'badge-warning',
            'asesor': 'badge-info',
            'user': 'badge-secondary'
        };
        return classes[rol] || 'badge-secondary';
    }

    getRoleDisplayName(rol) {
        const names = {
            'admin': 'Administrador',
            'gerente': 'Gerente',
            'asesor': 'Asesor',
            'user': 'Usuario'
        };
        return names[rol] || 'Usuario';
    }

    viewUser(userId) {
        console.log(`👁️ Ver detalles del usuario ${userId}`);
        this.showNotification('Función de ver usuario próximamente disponible', 'info');
    }

    editUser(userId) {
        console.log(`✏️ Editar usuario ${userId}`);
        this.showNotification('Función de editar usuario próximamente disponible', 'info');
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
            // Fallback mejorado con console en desarrollo
            console.log(`🔔 NOTIFICACIÓN [${type.toUpperCase()}]: ${message}`);
            // Solo usar alert en producción si no hay sistema de notificaciones
            if (typeof window.console === 'undefined') {
                alert(message);
            }
        }
    }

    setupRefreshButton() {
        const refreshBtn = document.getElementById('refresh-users-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshUserList();
            });
        }
    }

    loadInitialUsersList() {
        // Cargar lista solo si el usuario está autenticado y en la sección correcta
        const container = document.getElementById('users-list-container');
        const dashboardSection = document.getElementById('dashboard-section');

        // Verificar que el dashboard esté visible (usuario autenticado)
        if (container && dashboardSection && dashboardSection.style.display !== 'none') {
            console.log('📋 Cargando lista inicial de usuarios...');
            this.refreshUserList();
        } else {
            console.log('⏭️ Saltando carga de usuarios - usuario no autenticado o sección no visible');
        }
    }
    
    // MÉTODO ADICIONAL: Re-inicializar si es necesario
    reinitialize() {
        console.log('🔄 Re-inicializando UserAccountManager...');
        this.bindElements();
        this.bindEvents();
        this.setupValidation();
        console.log('✅ Re-inicialización completada');
    }
    
    // MÉTODO DE DEBUG: Verificar estado actual
    debugStatus() {
        return {
            form: !!this.form,
            submitBtn: !!this.submitBtn,
            modal: !!this.modal,
            fieldsCount: Object.keys(this.fields).length,
            errorElementsCount: Object.keys(this.errorElements).length,
            isSubmitting: this.isSubmitting
        };
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en una página con elementos de administración
    const createUserForm = document.getElementById('create-user-form');
    const createUserBtn = document.getElementById('create-user-account-btn');
    const createUserModal = document.getElementById('create-user-account-modal');
    
    // Inicializar si existe el formulario OR el botón OR el modal
    if (createUserForm || createUserBtn || createUserModal) {
        console.log('🎯 Detectado elementos de administración de usuarios, inicializando...');
        window.userAccountManager = new UserAccountManager();
    } else {
        console.log('ℹ️ No se encontraron elementos de usuarios - admin.js en standby');
    }
});

// Listener adicional para cuando se cambia a la sección de configuración
document.addEventListener('sectionChanged', function(event) {
    if (event.detail && event.detail.section === 'configuracion-section') {
        console.log('📍 Cambiando a sección configuración');
        
        // Re-inicializar si no existe o si faltan elementos
        if (!window.userAccountManager || !window.userAccountManager.submitBtn) {
            console.log('🔄 Re-inicializando UserAccountManager para sección configuración');
            window.userAccountManager = new UserAccountManager();
        }
    }
});

// Función global para debugging
window.debugUserManager = function() {
    if (window.userAccountManager) {
        console.log('Debug UserAccountManager:', window.userAccountManager.debugStatus());
        return window.userAccountManager.debugStatus();
    } else {
        console.log('UserAccountManager no inicializado');
        return null;
    }
};

// Exponer globalmente para debugging
window.UserAccountManager = UserAccountManager;

console.log('✅ admin.js cargado - Módulo de gestión de usuarios listo');