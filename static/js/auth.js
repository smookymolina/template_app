/**
 * Módulo de autenticación
 */
import CONFIG from './config.js';
import { showNotification } from './notifications.js';

const Auth = {
    currentUser: null,
    
    /**
     * Verifica si el usuario tiene rol de administrador
     * @returns {boolean} True si es admin, False en caso contrario
     */
    isAdmin: function() {
        return this.currentUser && this.currentUser.rol === 'admin';
    },
    
    /**
     * Verifica si el usuario tiene rol de asesor
     * @returns {boolean} True si es asesor, False en caso contrario
     */
    isAsesor: function() {
        return this.currentUser && this.currentUser.rol === 'asesor';
    },
    
    /**
     * Obtiene el rol del usuario actual
     * @returns {string} Rol del usuario o null si no hay usuario autenticado
     */
    getUserRole: function() {
        return this.currentUser ? this.currentUser.rol : null;
    },
    
    /**
     * Verifica si un usuario tiene permisos para acceder a un recurso
     * @param {string} permission - Nombre del permiso a verificar
     * @returns {boolean} - True si tiene el permiso, False en caso contrario
     */
    hasPermission: function(permission) {
        // Lista de permisos básicos por rol
        const permisos = {
            'admin': ['ver_todos_reclutas', 'asignar_asesores', 'eliminar_usuarios'],
            'asesor': ['ver_mis_reclutas']
        };
        
        const userRole = this.getUserRole();
        if (!userRole) return false;
        
        return permisos[userRole] && permisos[userRole].includes(permission);
    },
    
    /**
     * Inicia sesión con credenciales
     * @param {string} email - Correo electrónico del usuario
     * @param {string} password - Contraseña del usuario
     * @returns {Promise<Object>} - Datos del usuario autenticado
     * @throws {Error} Si las credenciales son inválidas o hay error de conexión
     */
    login: async function(email, password) {
        try {
            const response = await fetch(`${CONFIG.AUTH_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Credenciales inválidas');
                }
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            if (data.success) {
                this.currentUser = data.usuario;
                return data.usuario;
            } else {
                throw new Error(data.message || 'Error de autenticación');
            }
        } catch (err) {
            console.error('Error de login:', err);
            throw err;
        }
    },
    
    /**
     * Cierra la sesión del usuario actual
     * @returns {Promise<boolean>} - True si se cerró sesión correctamente
     * @throws {Error} Si hay error al cerrar la sesión
     */
    logout: async function() {
        try {
            const response = await fetch(`${CONFIG.AUTH_URL}/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            if (data.success) {
                this.currentUser = null;
                return true;
            } else {
                throw new Error(data.message || 'Error al cerrar sesión');
            }
        } catch (err) {
            console.error('Error de logout:', err);
            throw err;
        }
    },
    
    /**
     * Verifica si hay una sesión activa
     * @returns {Promise<Object|null>} - Datos del usuario o null si no hay sesión
     */
    checkAuth: async function() {
        try {
            const response = await fetch(`${CONFIG.AUTH_URL}/check-auth`);
            const data = await response.json();
            
            if (data.authenticated) {
                this.currentUser = data.usuario;
                return data.usuario;
            } else {
                this.currentUser = null;
                return null;
            }
        } catch (err) {
            console.error('Error al verificar autenticación:', err);
            this.currentUser = null;
            return null;
        }
    },
    
    /**
     * Cambia la contraseña del usuario actual
     * @param {string} currentPassword - Contraseña actual
     * @param {string} newPassword - Nueva contraseña
     * @returns {Promise<boolean>} - True si se cambió correctamente
     * @throws {Error} Si hay error al cambiar la contraseña
     */
    changePassword: async function(currentPassword, newPassword) {
        try {
            const response = await fetch(`${CONFIG.AUTH_URL}/cambiar-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data.success;
        } catch (err) {
            console.error('Error al cambiar contraseña:', err);
            throw err;
        }
    },
    
    /**
     * Obtiene las sesiones activas del usuario
     * @returns {Promise<Array>} - Lista de sesiones activas
     */
    getSessions: async function() {
        try {
            const response = await fetch(`${CONFIG.AUTH_URL}/sessions`);
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data.sessions || [];
        } catch (err) {
            console.error('Error al obtener sesiones:', err);
            throw err;
        }
    },
    
    /**
     * Cierra una sesión específica
     * @param {number} sessionId - ID de la sesión a cerrar
     * @returns {Promise<boolean>} - True si se cerró correctamente
     */
    closeSession: async function(sessionId) {
        try {
            const response = await fetch(`${CONFIG.AUTH_URL}/sessions/${sessionId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data.success;
        } catch (err) {
            console.error(`Error al cerrar sesión ${sessionId}:`, err);
            throw err;
        }
    },
    
    /**
     * Verifica si el usuario está autenticado
     * @returns {boolean} - True si hay un usuario autenticado
     */
    isAuthenticated: function() {
        return this.currentUser !== null;
    },
 /**
     * Actualiza los datos del usuario, asegurando que el rol sea correcto
     * @param {Object} userData - Datos del usuario
     */
    updateUserData: function(userData) {
    this.currentUser = userData;
    
    // ASEGURAR que el rol esté presente
    if (!this.currentUser.rol) {
        this.currentUser.rol = 'admin'; // Default seguro
    }
    
    console.log('Usuario actualizado:', {
        email: this.currentUser.email,
        rol: this.currentUser.rol,
        nombre: this.currentUser.nombre
    });
},

    
/**
 * Limpia completamente el estado del usuario y configuraciones
 * ✅ NUEVA FUNCIÓN - Agregar al objeto Auth
 */
clearUserState: function() {
    console.log('🧹 Iniciando limpieza completa de estado de usuario...');
    
    // 1. Limpiar usuario actual
    this.currentUser = null;
    
    // 2. Limpiar localStorage relacionado con usuario
    const userKeys = [
        CONFIG.STORAGE_KEYS.THEME,
        CONFIG.STORAGE_KEYS.PRIMARY_COLOR,
        'user_preferences',
        'dashboard_settings',
        'last_user_role',
        'user_config'
    ];
    
    userKeys.forEach(key => {
        try {
            localStorage.removeItem(key);
            console.log(`📦 Limpiado localStorage: ${key}`);
        } catch (e) {
            console.warn(`⚠️ No se pudo limpiar ${key}:`, e);
        }
    });
    
    // 3. Limpiar sessionStorage
    try {
        sessionStorage.clear();
        console.log('🗂️ sessionStorage limpiado');
    } catch (e) {
        console.warn('⚠️ Error limpiando sessionStorage:', e);
    }
    
    // 4. Resetear configuraciones CSS a valores por defecto
    this.resetUIToDefault();
    
    // 5. Limpiar elementos DOM dinámicos
    this.cleanupDynamicElements();
    
    console.log('✅ Limpieza completa de estado finalizada');
},

/**
 * Resetea la UI a configuración por defecto
 * ✅ NUEVA FUNCIÓN
 */
resetUIToDefault: function() {
    console.log('🎨 Reseteando UI a configuración por defecto...');
    
    // Resetear variables CSS
    const root = document.documentElement;
    root.style.setProperty('--primary-color', '#007bff');
    root.style.setProperty('--primary-dark', '#0056b3');
    root.style.setProperty('--primary-light', '#e9f2f9');
    
    // Remover modo oscuro
    document.body.classList.remove('dark-mode');
    
    // Resetear selecciones de color
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Seleccionar color por defecto
    const defaultColorOption = document.querySelector('input[name="primary-color"][value="#007bff"]');
    if (defaultColorOption) {
        defaultColorOption.parentElement.classList.add('selected');
    }
    
    // Resetear toggle de tema oscuro
    const darkToggle = document.getElementById('dark-theme-toggle');
    if (darkToggle) {
        darkToggle.checked = false;
    }
    
    console.log('✅ UI reseteada a configuración por defecto');
},

/**
 * Limpia elementos DOM dinámicos y de rol
 * ✅ NUEVA FUNCIÓN
 */
cleanupDynamicElements: function() {
    console.log('🧽 Limpiando elementos DOM dinámicos...');
    
    // Remover clases de rol del body
    document.body.classList.remove('admin-view', 'asesor-view');
    
    // Remover elementos de bienvenida dinámicos
    const welcomeElements = document.querySelectorAll('.admin-welcome, .asesor-welcome, .role-specific-element');
    welcomeElements.forEach(element => {
        console.log('🗑️ Removiendo elemento:', element.className);
        element.remove();
    });
    
    // Limpiar atributos style inline en elementos de rol
    const elementsWithInlineStyle = document.querySelectorAll('[style*="display"], [style*="background"]');
    elementsWithInlineStyle.forEach(element => {
        // Solo limpiar estilos relacionados con roles si no es necesario
        if (element.classList.contains('role-element') || 
            element.innerHTML.includes('welcome') ||
            element.innerHTML.includes('admin') ||
            element.innerHTML.includes('asesor')) {
            element.removeAttribute('style');
            console.log('🎨 Limpiado style inline de:', element.tagName);
        }
    });
    
    // Resetear navegación del dashboard
    const dashboardNav = document.querySelector('.dashboard-nav ul');
    if (dashboardNav) {
        dashboardNav.innerHTML = '';
    }
    
    // Limpiar información de usuario en UI
    const userNameElements = document.querySelectorAll('#gerente-name, #dropdown-user-name, #user-name');
    userNameElements.forEach(el => {
        if (el.tagName === 'INPUT') {
            el.value = '';
        } else {
            el.textContent = '';
        }
    });
    
    console.log('✅ Elementos DOM dinámicos limpiados');
},

/**
 * Logout mejorado con limpieza completa
 * ✅ MODIFICAR FUNCIÓN EXISTENTE
 */
logout: async function() {
    try {
        console.log('🚪 Iniciando logout con limpieza completa...');
        
        // 1. Logout del backend
        const response = await fetch(`${CONFIG.AUTH_URL}/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.success) {
            // 2. ✅ NUEVA: Limpieza completa de estado
            this.clearUserState();
            
            console.log('✅ Logout completado con limpieza total');
            return true;
        } else {
            throw new Error(data.message || 'Error al cerrar sesión');
        }
    } catch (err) {
        console.error('❌ Error de logout:', err);
        // Aún así limpiar estado local
        this.clearUserState();
        throw err;
    }
},

/**
 * Login mejorado con validación de estado limpio
 * ✅ MODIFICAR FUNCIÓN EXISTENTE (agregar al final)
 */
login: async function(email, password) {
    try {
        // ✅ NUEVA: Asegurar estado limpio antes de login
        console.log('🧹 Pre-login: Asegurando estado limpio...');
        this.clearUserState();
        
        const response = await fetch(`${CONFIG.AUTH_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Credenciales inválidas');
            }
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.success) {
            this.currentUser = data.usuario;
            
            // ✅ NUEVA: Configurar UI específica para usuario
            this.setupUserSpecificUI(data.usuario);
            
            return data.usuario;
        } else {
            throw new Error(data.message || 'Error de autenticación');
        }
    } catch (err) {
        console.error('❌ Error de login:', err);
        throw err;
    }
},

/**
 * Configurar UI específica para el usuario logueado
 *
 */
setupUserSpecificUI: function(usuario) {
    console.log('⚙️ Configurando UI específica para usuario:', usuario.email);
    
    // Establecer configuraciones por defecto para este usuario
    const userRole = usuario.rol || 'asesor';
    
    // Configurar tema por defecto según rol (opcional)
    if (userRole === 'admin') {
        // Configuración por defecto para admin
        document.body.classList.add('admin-view');
    } else {
        // Configuración por defecto para asesor
        document.body.classList.add('asesor-view');
    }
    
    // No cargar configuraciones previas, usar siempre defaults
    console.log(`✅ UI configurada para rol: ${userRole}`);
},

    /**
     * Obtiene el rol del usuario desde el backend
     * @returns {Promise<Object>} - Datos del rol y permisos
     */
    fetchUserRole: async function() {
    // Si ya tenemos el rol en currentUser, usarlo
    if (this.currentUser && this.currentUser.rol) {
        return {
            rol: this.currentUser.rol,
            permisos: this.getPermissionsForRole(this.currentUser.rol)
        };
    }
    
    if (!this.isAuthenticated()) return null;
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/usuario/rol`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.success) {
            // Actualizar el rol en el objeto currentUser
            if (this.currentUser) {
                this.currentUser.rol = data.rol;
                this.currentUser.permisos = data.permisos;
            }
            return data;
        } else {
            throw new Error(data.message || 'Error al obtener rol');
        }
    } catch (error) {
        console.error('Error al obtener rol del usuario:', error);
        // Usar 'asesor' como rol por defecto más seguro
        if (this.currentUser) {
            this.currentUser.rol = 'asesor';
        }
        return { 
            rol: 'asesor', 
            permisos: { 
                is_admin: false, 
                is_asesor: true,
                can_upload_excel: false  // Por defecto NO puede Excel
            } 
        };
    }
},

getPermissionsForRole: function(rol) {
    const permissions = {
        'admin': {
            is_admin: true,
            is_asesor: false,
            can_assign_asesores: true,
            can_see_all_reclutas: true,
            can_upload_excel: true,
            can_manage_users: true
        },
        'asesor': {
            is_admin: false,
            is_asesor: true,
            can_assign_asesores: false,
            can_see_all_reclutas: false,
            can_upload_excel: false,
            can_manage_users: false
        },
        'user': {
            is_admin: false,
            is_asesor: false,
            can_assign_asesores: false,
            can_see_all_reclutas: false,
            can_upload_excel: false,
            can_manage_users: false
        }
    };
    
    return permissions[rol] || permissions['user'];
}
};
export default Auth;