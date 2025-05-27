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
        // ✅ CAMBIO: Usar 'asesor' como rol por defecto más seguro
        if (this.currentUser) {
            this.currentUser.rol = 'asesor';
        }
        return { 
            rol: 'asesor', 
            permisos: { 
                is_admin: false, 
                is_asesor: true,
                can_upload_excel: false  // ✅ CLAVE: Por defecto NO puede Excel
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