/**
 * Módulo para gestionar notificaciones en la interfaz de usuario
 */

let activeNotificationTimeout;

/**
 * Muestra una notificación en la interfaz
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación (success, error, warning, info)
 * @param {number} duration - Duración en milisegundos
 */
export const Notifications = {
    show: function(message, type = 'info', duration = 5000) {
        const notification = document.getElementById('notification');
        const notificationMessage = document.getElementById('notification-message');
        
        if (!notification || !notificationMessage) return;
        
        // Limpiar timeout anterior si existe
        if (Notifications.activeNotificationTimeout) {
            clearTimeout(Notifications.activeNotificationTimeout);
        }
        
        notificationMessage.textContent = message;
        
        // Configurar tipo de notificación
        notification.className = 'notification';
        notification.classList.add(type);
        notification.classList.add('show');
        
        // Auto-ocultar después de la duración especificada
        Notifications.activeNotificationTimeout = setTimeout(Notifications.hide, duration);
        
        // Asegurarse de que el botón de cierre funcione
        const closeButton = document.getElementById('notification-close');
        if (closeButton) {
            closeButton.onclick = Notifications.hide;
        }
    },

    hide: function() {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.classList.remove('show');
        }
        
        if (Notifications.activeNotificationTimeout) {
            clearTimeout(Notifications.activeNotificationTimeout);
            Notifications.activeNotificationTimeout = null;
        }
    },

    error: function(message, duration = 5000) {
        Notifications.show(message, 'error', duration);
    },

    success: function(message, duration = 5000) {
        Notifications.show(message, 'success', duration);
    },

    warning: function(message, duration = 5000) {
        Notifications.show(message, 'warning', duration);
    },

    info: function(message, duration = 5000) {
        Notifications.show(message, 'info', duration);
    },

    handleApiError: function(error, defaultMessage = 'Error en la operación') {
        console.error(error);
        
        let message = defaultMessage;
        
        if (error.response && error.response.data && error.response.data.message) {
            message = error.response.data.message;
        } else if (error.message) {
            message = error.message;
        }
        
        Notifications.error(message);
    }
};
    