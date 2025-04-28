/**
 * Módulo de autenticación
 */
import CONFIG from './config.js';
import { showNotification } from './notifications.js';

const Auth = {
    currentUser: null,
    
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
    }
};

export default Auth;