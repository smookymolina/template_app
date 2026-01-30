/**
 * ============================================================================
 * 📊 ACTIVITY TRACKER - Rastreador de Tiempo de Uso Activo
 * ============================================================================
 *
 * Este módulo rastrea el tiempo REAL de uso de la aplicación, contando solo
 * cuando el usuario está activamente interactuando (clicks, scroll, teclas, etc.).
 *
 * NO cuenta el tiempo si:
 * - La pestaña está en segundo plano
 * - El usuario está inactivo (sin interacción por más de X segundos)
 * - La sesión está pausada
 *
 * Uso:
 *   // Se activa automáticamente si el usuario está autenticado
 *   // O manualmente:
 *   window.activityTracker.start();
 *   window.activityTracker.stop();
 *   window.activityTracker.getStats();
 */

(function() {
    'use strict';

    // ============================================================================
    // CONFIGURACIÓN
    // ============================================================================
    const CONFIG = {
        // Intervalo entre heartbeats (segundos) - cada cuánto se envía al servidor
        HEARTBEAT_INTERVAL: 30,

        // Tiempo de inactividad para considerar al usuario "idle" (segundos)
        IDLE_TIMEOUT: 60,

        // Endpoint para enviar heartbeats
        HEARTBEAT_ENDPOINT: '/auth/activity-heartbeat',

        // Eventos que indican actividad del usuario
        ACTIVITY_EVENTS: [
            'mousedown',
            'mousemove',
            'keydown',
            'scroll',
            'touchstart',
            'touchmove',
            'click',
            'wheel'
        ],

        // Throttle para eventos de alta frecuencia (ms)
        THROTTLE_MS: 1000,

        // Debug mode
        DEBUG: false
    };

    // ============================================================================
    // ESTADO DEL TRACKER
    // ============================================================================
    let state = {
        isActive: false,           // Si el tracker está corriendo
        isUserActive: false,       // Si el usuario está actualmente activo
        lastActivityTime: null,    // Timestamp de última actividad
        lastHeartbeatTime: null,   // Timestamp de último heartbeat enviado
        heartbeatTimer: null,      // Timer para enviar heartbeats
        idleTimer: null,           // Timer para detectar inactividad
        totalActiveTime: 0,        // Tiempo activo acumulado localmente (segundos)
        sessionStartTime: null,    // Inicio de la sesión activa actual
        isTabVisible: true,        // Si la pestaña está visible
        isPaused: false            // Si el tracking está pausado manualmente
    };

    // ============================================================================
    // UTILIDADES
    // ============================================================================

    function log(...args) {
        if (CONFIG.DEBUG) {
            console.log('[ActivityTracker]', ...args);
        }
    }

    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    function formatDuration(seconds) {
        if (!seconds || seconds <= 0) return '0m';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    // ============================================================================
    // DETECCIÓN DE ACTIVIDAD
    // ============================================================================

    const onUserActivity = throttle(function() {
        if (!state.isActive || state.isPaused || !state.isTabVisible) {
            return;
        }

        const now = Date.now();
        state.lastActivityTime = now;

        // Si el usuario estaba inactivo, marcar como activo
        if (!state.isUserActive) {
            state.isUserActive = true;
            state.sessionStartTime = now;
            log('👤 Usuario activo');

            // Iniciar heartbeats
            startHeartbeatTimer();
        }

        // Resetear timer de inactividad
        resetIdleTimer();

    }, CONFIG.THROTTLE_MS);

    function resetIdleTimer() {
        if (state.idleTimer) {
            clearTimeout(state.idleTimer);
        }

        state.idleTimer = setTimeout(() => {
            onUserIdle();
        }, CONFIG.IDLE_TIMEOUT * 1000);
    }

    function onUserIdle() {
        if (!state.isUserActive) return;

        state.isUserActive = false;
        log('💤 Usuario inactivo');

        // Detener heartbeats
        stopHeartbeatTimer();

        // Enviar último heartbeat antes de marcar como inactivo
        sendHeartbeat();
    }

    // ============================================================================
    // HEARTBEATS
    // ============================================================================

    function startHeartbeatTimer() {
        if (state.heartbeatTimer) return;

        // Enviar primer heartbeat inmediatamente
        sendHeartbeat();

        // Programar heartbeats periódicos
        state.heartbeatTimer = setInterval(() => {
            if (state.isUserActive && state.isTabVisible && !state.isPaused) {
                sendHeartbeat();
            }
        }, CONFIG.HEARTBEAT_INTERVAL * 1000);

        log('⏱️ Heartbeat timer iniciado');
    }

    function stopHeartbeatTimer() {
        if (state.heartbeatTimer) {
            clearInterval(state.heartbeatTimer);
            state.heartbeatTimer = null;
            log('⏱️ Heartbeat timer detenido');
        }
    }

    async function sendHeartbeat() {
        if (!state.isActive) return;

        try {
            const response = await fetch(CONFIG.HEARTBEAT_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    heartbeat_interval: CONFIG.HEARTBEAT_INTERVAL
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    state.totalActiveTime = data.active_time_seconds || 0;
                    state.lastHeartbeatTime = Date.now();
                    log('💓 Heartbeat OK - Tiempo activo:', data.active_time_formatted);

                    // Disparar evento personalizado para que otros módulos puedan escuchar
                    window.dispatchEvent(new CustomEvent('activityTracker:heartbeat', {
                        detail: {
                            activeTimeSeconds: data.active_time_seconds,
                            activeTimeFormatted: data.active_time_formatted
                        }
                    }));
                }
            } else if (response.status === 401) {
                // Usuario no autenticado, detener tracker
                log('🔒 No autenticado, deteniendo tracker');
                stop();
            }
        } catch (error) {
            log('❌ Error enviando heartbeat:', error.message);
        }
    }

    // ============================================================================
    // VISIBILIDAD DE PESTAÑA
    // ============================================================================

    function onVisibilityChange() {
        const wasVisible = state.isTabVisible;
        state.isTabVisible = !document.hidden;

        if (state.isTabVisible && !wasVisible) {
            log('👁️ Pestaña visible');
            // Si el usuario estaba activo antes, reanudar
            if (state.isUserActive) {
                startHeartbeatTimer();
            }
        } else if (!state.isTabVisible && wasVisible) {
            log('👁️ Pestaña oculta');
            // Pausar heartbeats cuando la pestaña está oculta
            stopHeartbeatTimer();
        }
    }

    // ============================================================================
    // CONTROL DEL TRACKER
    // ============================================================================

    function start() {
        if (state.isActive) {
            log('⚠️ Tracker ya está activo');
            return;
        }

        log('🚀 Iniciando Activity Tracker');
        state.isActive = true;
        state.lastActivityTime = Date.now();
        state.isTabVisible = !document.hidden;

        // Agregar listeners de actividad
        CONFIG.ACTIVITY_EVENTS.forEach(event => {
            document.addEventListener(event, onUserActivity, { passive: true });
        });

        // Listener de visibilidad
        document.addEventListener('visibilitychange', onVisibilityChange);

        // Listener para cuando el usuario cierra/recarga la página
        window.addEventListener('beforeunload', onBeforeUnload);

        // Iniciar con el usuario como activo (acaba de cargar la página)
        state.isUserActive = true;
        state.sessionStartTime = Date.now();
        startHeartbeatTimer();
        resetIdleTimer();

        log('✅ Activity Tracker iniciado');
    }

    function stop() {
        if (!state.isActive) return;

        log('🛑 Deteniendo Activity Tracker');
        state.isActive = false;
        state.isUserActive = false;

        // Remover listeners
        CONFIG.ACTIVITY_EVENTS.forEach(event => {
            document.removeEventListener(event, onUserActivity);
        });
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('beforeunload', onBeforeUnload);

        // Detener timers
        stopHeartbeatTimer();
        if (state.idleTimer) {
            clearTimeout(state.idleTimer);
            state.idleTimer = null;
        }

        log('✅ Activity Tracker detenido');
    }

    function pause() {
        state.isPaused = true;
        stopHeartbeatTimer();
        log('⏸️ Activity Tracker pausado');
    }

    function resume() {
        state.isPaused = false;
        if (state.isUserActive && state.isTabVisible) {
            startHeartbeatTimer();
        }
        log('▶️ Activity Tracker reanudado');
    }

    function onBeforeUnload() {
        // Enviar último heartbeat antes de cerrar
        if (state.isUserActive) {
            // Usar sendBeacon para asegurar que se envíe
            const data = JSON.stringify({ heartbeat_interval: CONFIG.HEARTBEAT_INTERVAL });
            navigator.sendBeacon(CONFIG.HEARTBEAT_ENDPOINT, new Blob([data], { type: 'application/json' }));
        }
    }

    // ============================================================================
    // API PÚBLICA
    // ============================================================================

    function getStats() {
        return {
            isActive: state.isActive,
            isUserActive: state.isUserActive,
            isTabVisible: state.isTabVisible,
            isPaused: state.isPaused,
            totalActiveTime: state.totalActiveTime,
            totalActiveTimeFormatted: formatDuration(state.totalActiveTime),
            lastActivityTime: state.lastActivityTime ? new Date(state.lastActivityTime) : null,
            lastHeartbeatTime: state.lastHeartbeatTime ? new Date(state.lastHeartbeatTime) : null
        };
    }

    function setConfig(newConfig) {
        Object.assign(CONFIG, newConfig);
        log('⚙️ Configuración actualizada:', CONFIG);
    }

    // ============================================================================
    // INICIALIZACIÓN AUTOMÁTICA
    // ============================================================================

    function autoInit() {
        // Verificar si hay un usuario autenticado
        // Esto se puede hacer de varias formas, aquí verificamos si existe un elemento
        // que indica sesión activa o hacemos una verificación al servidor

        // Opción 1: Verificar si existe un elemento del DOM que indica sesión
        const userLoggedIn = document.body.classList.contains('logged-in') ||
                            document.querySelector('[data-user-authenticated="true"]') ||
                            document.querySelector('.user-menu') ||
                            document.querySelector('#user-info');

        if (userLoggedIn) {
            log('🔐 Usuario autenticado detectado, iniciando tracker...');
            start();
        } else {
            log('🔓 No hay usuario autenticado, tracker en espera');
        }
    }

    // ============================================================================
    // EXPORTAR API GLOBAL
    // ============================================================================

    window.activityTracker = {
        start,
        stop,
        pause,
        resume,
        getStats,
        setConfig,
        // Constantes útiles
        CONFIG: { ...CONFIG }
    };

    // Auto-inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        // DOM ya está listo
        setTimeout(autoInit, 100);
    }

    log('📦 Activity Tracker módulo cargado');

})();
