/**
 * 📢 MÓDULO DE NOTIFICACIONES UNIFICADO
 * Sistema de Gestión de Reclutas v3.0
 * 
 * Exporta todas las funciones de notificación necesarias para el sistema
 * Soporta todos los tipos de import existentes en la aplicación
 */

let activeNotificationTimeout;

/**
 * ✅ FUNCIÓN PRINCIPAL: Muestra una notificación en la interfaz
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación (success, error, warning, info)
 * @param {number} duration - Duración en milisegundos (default: 5000)
 */
export function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    
    // ✅ VALIDACIÓN ROBUSTA: Verificar que los elementos DOM existen
    if (!notification || !notificationMessage) {
        console.warn('⚠️ Elementos de notificación no encontrados en el DOM');
        // Fallback: usar console para desarrollo
        console.log(`🔔 NOTIFICACIÓN [${type.toUpperCase()}]: ${message}`);
        return;
    }
    
    // Limpiar timeout anterior si existe
    if (activeNotificationTimeout) {
        clearTimeout(activeNotificationTimeout);
    }
    
    // Configurar contenido del mensaje
    notificationMessage.textContent = message;
    
    // Configurar tipo de notificación
    notification.className = 'notification';
    notification.classList.add(type);
    notification.classList.add('show');
    
    // Auto-ocultar después de la duración especificada
    activeNotificationTimeout = setTimeout(hideNotification, duration);
    
    // Asegurar que el botón de cierre funcione
    const closeButton = document.getElementById('notification-close');
    if (closeButton) {
        closeButton.onclick = hideNotification;
    }
    
    // Log para debugging
    console.log(`🔔 Notificación mostrada: [${type}] ${message}`);
}

/**
 * ✅ Oculta la notificación actual
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
 * ✅ FUNCIÓN DE ERROR: Muestra una notificación de error
 * @param {string} message - Mensaje de error
 * @param {number} duration - Duración en milisegundos (default: 5000)
 */
export function showError(message, duration = 5000) {
    showNotification(message, 'error', duration);
}

/**
 * ✅ FUNCIÓN DE ÉXITO: Muestra una notificación de éxito
 * @param {string} message - Mensaje de éxito
 * @param {number} duration - Duración en milisegundos (default: 5000)
 */
export function showSuccess(message, duration = 5000) {
    showNotification(message, 'success', duration);
}

/**
 * ✅ FUNCIÓN DE ADVERTENCIA: Muestra una notificación de advertencia
 * @param {string} message - Mensaje de advertencia
 * @param {number} duration - Duración en milisegundos (default: 5000)
 */
export function showWarning(message, duration = 5000) {
    showNotification(message, 'warning', duration);
}

/**
 * ✅ FUNCIÓN INFORMATIVA: Muestra una notificación informativa
 * @param {string} message - Mensaje informativo
 * @param {number} duration - Duración en milisegundos (default: 5000)
 */
export function showInfo(message, duration = 5000) {
    showNotification(message, 'info', duration);
}

/**
 * ✅ MANEJO DE ERRORES API: Maneja errores de API y muestra notificaciones apropiadas
 * @param {Error} error - Error capturado
 * @param {string} defaultMessage - Mensaje por defecto si no hay detalles
 */
export function handleApiError(error, defaultMessage = 'Error en la operación') {
    console.error('🚨 Error de API capturado:', error);
    
    let message = defaultMessage;
    
    // Extraer mensaje de error específico
    if (error.response && error.response.data && error.response.data.message) {
        message = error.response.data.message;
    } else if (error.message) {
        message = error.message;
    }
    
    showError(message);
}

/**
 * ✅ COMPATIBILIDAD LEGACY: Objeto Notifications para retrocompatibilidad
 * Algunos archivos antiguos pueden usar Notifications.show() o Notifications.error()
 */
export const Notifications = {
    show: showNotification,
    hide: hideNotification,
    error: showError,
    success: showSuccess,
    warning: showWarning,
    info: showInfo,
    handleApiError: handleApiError,
    activeNotificationTimeout
};

/**
 * ✅ FUNCIÓN DE VALIDACIÓN: Verificar que el sistema de notificaciones funciona
 * Útil para debugging y testing
 */
export function validateNotificationSystem() {
    console.log('🧪 === VALIDACIÓN DEL SISTEMA DE NOTIFICACIONES ===');
    
    const requiredElements = [
        'notification',
        'notification-message', 
        'notification-close'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.error('❌ Elementos DOM faltantes:', missingElements);
        return false;
    } else {
        console.log('✅ Todos los elementos DOM están disponibles');
        return true;
    }
}

// ✅ EXPORTACIÓN DEFAULT PARA COMPATIBILIDAD COMPLETA
export default {
    showNotification,
    hideNotification,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    handleApiError,
    validateNotificationSystem,
    Notifications
};

console.log('📢 Módulo de notificaciones unificado cargado correctamente');