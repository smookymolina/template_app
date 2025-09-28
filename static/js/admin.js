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

    async viewUser(userId) {
        console.log(`👁️ Ver detalles del usuario ${userId}`);

        try {
            const response = await fetch(`/admin/usuarios/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showUserDetailsModal(result.usuario);
            } else {
                this.showNotification(result.message || 'Error al obtener detalles del usuario', 'error');
            }
        } catch (error) {
            console.error('❌ Error al obtener detalles del usuario:', error);
            this.showNotification('Error de conexión al obtener detalles', 'error');
        }
    }

    showUserDetailsModal(usuario) {
        const modalHTML = `
            <div class="modal fade" id="user-details-modal" tabindex="-1" role="dialog" aria-labelledby="userDetailsModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="userDetailsModalLabel">
                                <i class="fas fa-user"></i> Detalles del Usuario
                            </h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close" onclick="this.closest('.modal').remove()">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="user-details-container">
                                <div class="user-header">
                                    <div class="user-avatar-large">
                                        ${usuario.foto_url ?
                                            `<img src="${usuario.foto_url}" alt="Foto de perfil" class="profile-image-large">` :
                                            '<i class="fas fa-user-circle"></i>'
                                        }
                                    </div>
                                    <div class="user-basic-info">
                                        <h4>${usuario.nombre || 'Sin nombre'}</h4>
                                        <p class="user-email">${usuario.email}</p>
                                        <span class="role-badge ${this.getRoleBadgeClass(usuario.rol)}">${this.getRoleDisplayName(usuario.rol)}</span>
                                    </div>
                                </div>

                                <div class="user-info-grid">
                                    <div class="info-section">
                                        <h6><i class="fas fa-info-circle"></i> Información Personal</h6>
                                        <div class="info-item">
                                            <strong>ID:</strong> ${usuario.id}
                                        </div>
                                        <div class="info-item">
                                            <strong>Nombre completo:</strong> ${usuario.nombre || 'No especificado'}
                                        </div>
                                        <div class="info-item">
                                            <strong>Email:</strong> ${usuario.email}
                                        </div>
                                        <div class="info-item">
                                            <strong>Teléfono:</strong> ${usuario.telefono || 'No especificado'}
                                        </div>
                                    </div>

                                    <div class="info-section">
                                        <h6><i class="fas fa-clock"></i> Información de Cuenta</h6>
                                        <div class="info-item">
                                            <strong>Rol:</strong> ${this.getRoleDisplayName(usuario.rol)}
                                        </div>
                                        <div class="info-item">
                                            <strong>Fecha de creación:</strong> ${usuario.created_at ? new Date(usuario.created_at).toLocaleString('es-ES') : 'No disponible'}
                                        </div>
                                        <div class="info-item">
                                            <strong>Último acceso:</strong> ${usuario.last_login ? new Date(usuario.last_login).toLocaleString('es-ES') : 'Nunca'}
                                        </div>
                                        <div class="info-item">
                                            <strong>Estado:</strong> <span class="badge badge-success">Activo</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                                <i class="fas fa-times"></i> Cerrar
                            </button>
                            <button type="button" class="btn btn-primary" onclick="window.userAccountManager?.editUser(${usuario.id}); this.closest('.modal').remove();">
                                <i class="fas fa-edit"></i> Editar Usuario
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente si existe
        const existingModal = document.getElementById('user-details-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Mostrar modal
        const modal = document.getElementById('user-details-modal');
        modal.style.display = 'block';
        modal.classList.add('show');
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';

        console.log('✅ Modal de detalles de usuario mostrado');
    }

    async editUser(userId) {
        console.log(`✏️ Editar usuario ${userId}`);

        try {
            const response = await fetch(`/admin/usuarios/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showEditUserModal(result.usuario);
            } else {
                this.showNotification(result.message || 'Error al obtener datos del usuario', 'error');
            }
        } catch (error) {
            console.error('❌ Error al obtener datos del usuario para edición:', error);
            this.showNotification('Error de conexión al obtener datos', 'error');
        }
    }

    showEditUserModal(usuario) {
        const modalHTML = `
            <div class="modal fade" id="edit-user-modal" tabindex="-1" role="dialog" aria-labelledby="editUserModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="editUserModalLabel">
                                <i class="fas fa-edit"></i> Editar Usuario
                            </h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close" onclick="this.closest('.modal').remove()">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <form id="edit-user-form">
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-group">
                                            <label for="edit-user-nombre">Nombre completo *</label>
                                            <input type="text" class="form-control" id="edit-user-nombre" value="${usuario.nombre || ''}" required>
                                            <div class="error-message" id="edit-user-nombre-error"></div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group">
                                            <label for="edit-user-email">Correo electrónico *</label>
                                            <input type="email" class="form-control" id="edit-user-email" value="${usuario.email}" required>
                                            <div class="error-message" id="edit-user-email-error"></div>
                                        </div>
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-group">
                                            <label for="edit-user-telefono">Teléfono</label>
                                            <input type="tel" class="form-control" id="edit-user-telefono" value="${usuario.telefono || ''}">
                                            <div class="error-message" id="edit-user-telefono-error"></div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group">
                                            <label for="edit-user-role">Rol *</label>
                                            <select class="form-control" id="edit-user-role" required>
                                                <option value="user" ${usuario.rol === 'user' ? 'selected' : ''}>Usuario</option>
                                                <option value="asesor" ${usuario.rol === 'asesor' ? 'selected' : ''}>Asesor</option>
                                                <option value="gerente" ${usuario.rol === 'gerente' ? 'selected' : ''}>Gerente</option>
                                                <option value="admin" ${usuario.rol === 'admin' ? 'selected' : ''}>Administrador</option>
                                            </select>
                                            <div class="error-message" id="edit-user-role-error"></div>
                                        </div>
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col-12">
                                        <div class="form-group">
                                            <label>Cambiar contraseña (opcional)</label>
                                            <div class="password-section">
                                                <input type="password" class="form-control mb-2" id="edit-user-password" placeholder="Nueva contraseña (dejar vacío para mantener actual)">
                                                <input type="password" class="form-control" id="edit-user-password-confirm" placeholder="Confirmar nueva contraseña">
                                                <div class="error-message" id="edit-user-password-error"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <input type="hidden" id="edit-user-id" value="${usuario.id}">
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                                    <i class="fas fa-times"></i> Cancelar
                                </button>
                                <button type="submit" class="btn btn-primary" id="save-user-changes-btn">
                                    <i class="fas fa-save"></i> Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente si existe
        const existingModal = document.getElementById('edit-user-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Mostrar modal
        const modal = document.getElementById('edit-user-modal');
        modal.style.display = 'block';
        modal.classList.add('show');
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';

        // Configurar eventos del formulario de edición
        this.setupEditUserForm();

        console.log('✅ Modal de edición de usuario mostrado');
    }

    setupEditUserForm() {
        const form = document.getElementById('edit-user-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleEditUserSubmit();
        });

        // Validación en tiempo real para contraseñas
        const passwordInput = document.getElementById('edit-user-password');
        const passwordConfirmInput = document.getElementById('edit-user-password-confirm');

        if (passwordInput && passwordConfirmInput) {
            const validatePasswords = () => {
                const password = passwordInput.value;
                const confirm = passwordConfirmInput.value;
                const errorElement = document.getElementById('edit-user-password-error');

                if (password && password.length < 6) {
                    errorElement.textContent = 'La contraseña debe tener al menos 6 caracteres';
                    errorElement.style.display = 'block';
                    return false;
                } else if (password && confirm && password !== confirm) {
                    errorElement.textContent = 'Las contraseñas no coinciden';
                    errorElement.style.display = 'block';
                    return false;
                } else {
                    errorElement.style.display = 'none';
                    return true;
                }
            };

            passwordInput.addEventListener('input', validatePasswords);
            passwordConfirmInput.addEventListener('input', validatePasswords);
        }
    }

    async handleEditUserSubmit() {
        const userId = document.getElementById('edit-user-id').value;
        const nombre = document.getElementById('edit-user-nombre').value.trim();
        const email = document.getElementById('edit-user-email').value.trim();
        const telefono = document.getElementById('edit-user-telefono').value.trim();
        const rol = document.getElementById('edit-user-role').value;
        const password = document.getElementById('edit-user-password').value;
        const passwordConfirm = document.getElementById('edit-user-password-confirm').value;

        // Validaciones básicas
        if (!nombre || !email || !rol) {
            this.showNotification('Por favor completa todos los campos obligatorios', 'error');
            return;
        }

        if (password && password.length < 6) {
            this.showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        if (password && password !== passwordConfirm) {
            this.showNotification('Las contraseñas no coinciden', 'error');
            return;
        }

        const submitBtn = document.getElementById('save-user-changes-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

        try {
            const updateData = {
                nombre: nombre,
                email: email,
                telefono: telefono,
                rol: rol
            };

            // Solo incluir contraseña si se proporcionó una nueva
            if (password) {
                updateData.password = password;
            }

            const response = await fetch(`/admin/usuarios/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showNotification('Usuario actualizado correctamente', 'success');
                document.getElementById('edit-user-modal').remove();
                this.refreshUserList(); // Actualizar la lista
            } else {
                this.showNotification(result.message || 'Error al actualizar usuario', 'error');
            }
        } catch (error) {
            console.error('❌ Error al actualizar usuario:', error);
            this.showNotification('Error de conexión al actualizar usuario', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
        }
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
        // Cargar lista solo si el usuario está autenticado y es administrador
        const container = document.getElementById('users-list-container');
        const adminSection = document.getElementById('user-administration-section');

        // Verificar que existe el container y que el usuario está autenticado
        if (container && window.Auth && window.Auth.isAuthenticated()) {
            // Verificar que el usuario es administrador
            const currentUser = window.Auth.currentUser;
            if (currentUser && currentUser.rol === 'admin') {
                console.log('📋 Cargando lista inicial de usuarios...');
                // Pequeño delay para asegurar que todos los elementos estén listos
                setTimeout(() => {
                    this.refreshUserList();
                }, 100);
            } else {
                console.log('⏭️ Usuario no es administrador - no se cargan usuarios');
            }
        } else {
            console.log('⏭️ Saltando carga de usuarios - usuario no autenticado o container no disponible');
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
        } else {
            // Si ya existe, cargar usuarios inmediatamente
            console.log('🔄 UserAccountManager ya existe, cargando usuarios...');
            if (window.userAccountManager.loadInitialUsersList) {
                window.userAccountManager.loadInitialUsersList();
            }
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