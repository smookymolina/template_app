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
export function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    
    if (!notification || !notificationMessage) return;
    
    // Limpiar timeout anterior si existe
    if (activeNotificationTimeout) {
        clearTimeout(activeNotificationTimeout);
    }
    
    notificationMessage.textContent = message;
    
    // Configurar tipo de notificación
    notification.className = 'notification';
    notification.classList.add(type);
    notification.classList.add('show');
    
    // Auto-ocultar después de la duración especificada
    activeNotificationTimeout = setTimeout(hideNotification, duration);
    
    // Asegurarse de que el botón de cierre funcione
    const closeButton = document.getElementById('notification-close');
    if (closeButton) {
        closeButton.onclick = hideNotification;
    }
}

/**
 * Oculta la notificación actual
 */
export function hideNotification() {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.classList.remove('show');
    }
    
    if (activeNotificationTimeout) {
        clearTimeout(activeNotificationTimeout);
        activeNotificationTimeout = null;
    }
}

/**
 * Muestra una notificación de error
 * @param {string} message - Mensaje de error
 * @param {number} duration - Duración en milisegundos
 */
export function showError(message, duration = 5000) {
    showNotification(message, 'error', duration);
}

/**
 * Muestra una notificación de éxito
 * @param {string} message - Mensaje de éxito
 * @param {number} duration - Duración en milisegundos
 */
export function showSuccess(message, duration = 5000) {
    showNotification(message, 'success', duration);
}

/**
 * Muestra una notificación de advertencia
 * @param {string} message - Mensaje de advertencia
 * @param {number} duration - Duración en milisegundos
 */
export function showWarning(message, duration = 5000) {
    showNotification(message, 'warning', duration);
}

/**
 * Muestra una notificación informativa
 * @param {string} message - Mensaje informativo
 * @param {number} duration - Duración en milisegundos
 */
export function showInfo(message, duration = 5000) {
    showNotification(message, 'info', duration);
}

/**
 * Maneja errores de API y muestra notificaciones apropiadas
 * @param {Error} error - Error capturado
 * @param {string} defaultMessage - Mensaje por defecto si no hay detalles
 */
export function handleApiError(error, defaultMessage = 'Error en la operación') {
    console.error(error);
    
    let message = defaultMessage;
    
    if (error.response && error.response.data && error.response.data.message) {
        message = error.response.data.message;
    } else if (error.message) {
        message = error.message;
    }
    
    showError(message);
}