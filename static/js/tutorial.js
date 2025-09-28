// ============================================================================
// 🎓 SISTEMA DE TUTORIAL INTERACTIVO - PORTAL PÚBLICO DE SEGUIMIENTO
// Archivo: static/js/tutorial.js
// Versión: 3.2 - Código Completo con Fixes de Estabilidad
// ============================================================================

const Tutorial = {
    // 🎛️ CONFIGURACIÓN DEL TUTORIAL CON CONTROLES DE ESTABILIDAD
    config: {
        storageKey: 'sistema_reclutas_tutorial_completed',
        currentStep: 0,
        totalSteps: 0,
        isActive: false,
        canSkip: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        highlightColor: '#007bff',
        zIndex: 10000,
        tutorialType: null, // 'public' or 'admin_recluta'
        // ✅ NUEVOS CONTROLES DE ESTABILIDAD
        isLocked: false,          // Prevenir ejecuciones múltiples
        debugMode: false,         // Logging detallado
        autoCleanupDisabled: false, // Deshabilitar limpieza automática temporal
        waitForCallbacks: new Map() // Rastrear callbacks activos
    },

    // Internos para limpieza
    _keyHandler: null,
    _activeIntervals: [],
    _activeTimeouts: [],
    _activeObservers: [],
    lastHighlightedElement: null,
    _scrollListener: null,

    // 📚 PASOS DEL TUTORIAL PARA PORTAL PÚBLICO
    publicSteps: [
        {
            id: 'step-1',
            target: '#folio-input',
            title: '📝 Campo de Folio',
            description: 'Aquí debes ingresar tu folio único de candidato. El formato es REC-XXXXXXXX (REC seguido de 8 números). Este folio te fue proporcionado cuando aplicaste.',
            position: 'left',
            action: 'highlight',
            nextButton: 'Entendido'
        },
        {
            id: 'step-2',
            target: '#tracking-button',
            title: '🔍 Botón de Consulta',
            description: 'Una vez que ingreses tu folio, haz clic aquí para consultar el estado actual de tu proceso de selección. Los resultados aparecerán inmediatamente.',
            position: 'left',
            action: 'highlight',
            nextButton: 'Continuar'
        },
        {
            id: 'step-3',
            target: '#tab-recuperar-folio-link',
            title: '❓ ¿Olvidaste tu Folio?',
            description: 'Si no recuerdas tu folio, haz clic aquí. Podrás recuperarlo ingresando el email y teléfono que usaste al aplicar. Es completamente seguro.',
            position: 'top',
            action: 'highlight',
            nextButton: 'Perfecto'
        }
    ],

    // 📚 PASOS DEL TUTORIAL PARA AÑADIR NUEVA RECLUTA (ADMIN)
    adminRecruitSteps: [
        {
            id: 'admin-step-0',
            target: '#open-add-recluta-modal',
            title: '🚀 ¡Bienvenido al Panel de Administración!',
            description: 'Para empezar, vamos a añadir tu primera recluta. Haz clic en el botón "Agregar Nuevo Recluta" para abrir el formulario.',
            position: 'bottom',
            action: 'clickAndProceed',
            nextButton: 'Abrir Formulario'
        },
        {
            id: 'admin-step-1',
            target: '#recluta-upload',
            title: '📸 Foto de Perfil',
            description: 'Aquí puedes subir una foto de perfil para el nuevo recluta. Es opcional, pero ayuda a identificarlo visualmente.',
            position: 'bottom',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'admin-step-2',
            target: '#add-recluta-modal',
            title: '📝 Datos del Recluta',
            description: 'Completa todos los campos con la información del candidato: nombre, correo, teléfono, puesto, estado, asesor asignado y notas adicionales. Todos son importantes para un registro completo.',
            position: 'right',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'admin-step-3',
            target: '#save-recluta-btn',
            title: '💾 Guardar Nuevo Recluta',
            description: 'Una vez que hayas completado todos los campos necesarios, haz clic aquí para guardar el nuevo recluta en el sistema.',
            position: 'top',
            action: 'highlight',
            nextButton: 'Finalizar Tutorial'
        }
    ],

    // 📚 PASOS DEL TUTORIAL PARA EL BOTÓN "AGREGAR NUEVO RECLUTA"
    addButtonTutorialSteps: [
        {
            id: 'add-button-step-1',
            target: '#open-add-recluta-modal',
            title: '➕ Botón Agregar Nuevo Recluta',
            description: 'Este botón te permite añadir un nuevo candidato al sistema. Al hacer clic, se abrirá un formulario para ingresar sus datos.',
            position: 'bottom',
            action: 'clickAndProceed',
            nextButton: 'Siguiente'
        },
        {
            id: 'add-button-step-2',
            target: '#add-recluta-modal .modal-content, #add-recluta-modal, .modal.show .modal-content, .modal[style*="block"] .modal-content',
            title: '📝 Formulario de Nuevo Recluta',
            description: 'Aquí puedes ingresar la información detallada del nuevo recluta, incluyendo nombre, apellidos, correo electrónico y otros datos relevantes. Asegúrate de completar todos los campos obligatorios.',
            position: 'right',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'add-button-step-3',
            target: '#save-recluta-btn, .modal-footer .btn-primary, button[type="submit"]',
            title: '💾 Guardar Nuevo Recluta',
            description: 'Una vez que hayas completado todos los campos necesarios, haz clic aquí para guardar el nuevo recluta en el sistema.',
            position: 'top',
            action: 'highlight',
            nextButton: 'Finalizar Tutorial'
        }
    ],

    // 📚 PASOS DEL TUTORIAL PARA DISTRIBUIR RECLUTAS EXCEL
    distribuirReclutasExcelSteps: [
        {
            id: 'dist-excel-step-1',
            target: '#distribuir-excel-btn',
            title: '📊 Distribuir Reclutas desde Excel',
            description: 'Este botón abre una herramienta para cargar un archivo Excel y distribuir automáticamente los reclutas entre los asesores. Haz clic en "Siguiente" para abrir la herramienta.',
            position: 'bottom',
            action: 'clickAndProceed',
            nextButton: 'Abrir Herramienta'
        },
        {
            id: 'dist-excel-step-2',
            target: '#distribucion-drop-zone, .drop-zone, [class*="drop"], .upload-area, #distribucion-modal .modal-body',
            title: '📂 Área de Carga de Archivo',
            description: 'Una vez que se abra la herramienta, verás esta área donde puedes arrastrar y soltar un archivo Excel (.xlsx o .xls) o hacer clic para seleccionarlo desde tu computadora.',
            position: 'bottom',
            action: 'highlight',
            nextButton: 'Siguiente',
            waitForElement: true,
            timeout: 10000
        },
        {
            id: 'dist-excel-step-3',
            target: '#confirm-distribucion, .confirm-btn, button[class*="confirm"], .modal-footer .btn-primary',
            title: '🚀 Botón de Confirmación',
            description: 'Después de cargar tu archivo Excel, aparecerá un botón para confirmar y procesar la distribución. El sistema validará los datos antes de asignar reclutas a los asesores.',
            position: 'top',
            action: 'highlight',
            nextButton: 'Continuar',
            waitForElement: true,
            timeout: 15000
        },
        {
            id: 'dist-excel-step-4',
            target: '#distribucion-results, .results-container, [class*="result"], .distribution-summary',
            title: '📈 Resultados de la Distribución',
            description: 'Finalmente, aquí se mostrarán los resultados de la distribución: qué reclutas fueron asignados a cada asesor, errores encontrados en el archivo, y un resumen del proceso.',
            position: 'top',
            action: 'highlight',
            nextButton: 'Finalizar Tutorial',
            waitForElement: true,
            timeout: 20000
        }
    ],

    // 📚 PASOS DEL TUTORIAL PARA EL CALENDARIO
    calendarSteps: [
        {
            id: 'calendar-step-1',
            target: '#calendario-section',
            title: '📅 Bienvenido al Calendario',
            description: 'Aquí puedes ver todas las entrevistas programadas. Los eventos se muestran por día, semana o mes.',
            position: 'top',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'calendar-step-2',
            target: '#add-event-button',
            title: '➕ Añadir Nueva Entrevista',
            description: 'Haz clic aquí para programar una nueva entrevista con un candidato.',
            position: 'left',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'calendar-step-3',
            target: '#current-month',
            title: '🗓️ Navegación del Calendario',
            description: 'Usa los botones de flecha y el título del mes para navegar entre diferentes vistas y fechas.',
            position: 'bottom',
            action: 'highlight',
            nextButton: 'Entendido'
        },
        {
            id: 'calendar-step-4',
            target: '#calendar-grid',
            title: 'ℹ️ Días del Calendario',
            description: 'Esta es la cuadrícula donde se muestran los días. Haz clic en un día para ver o añadir eventos.',
            position: 'right',
            action: 'highlight',
            nextButton: 'Finalizar Tutorial'
        }
    ],

    // 📚 NUEVO TUTORIAL ONBOARDING PARA ADMINISTRADORES
    adminFirstVisitTutorialSteps: [
        {
            id: 'admin-onboarding-1',
            target: '.section-header h3',
            title: '¡Bienvenido al Panel de Gestión de Reclutas!',
            description: 'Este es tu centro de operaciones. Desde aquí podrás ver, filtrar, buscar y gestionar a todos los candidatos del sistema. ¡Empecemos el recorrido!',
            position: 'bottom',
            action: 'highlight',
            nextButton: 'Comenzar'
        },
        {
            id: 'admin-onboarding-2',
            target: '#open-add-recluta-modal',
            title: '➕ Agregar un Recluta',
            description: 'Usa este botón para añadir un nuevo candidato manualmente. Se abrirá un formulario para que ingreses toda su información.',
            position: 'left',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'admin-onboarding-3',
            target: '#distribuir-excel-btn',
            title: '📊 Agregar Múltiples Reclutas',
            description: '¿Tienes una lista de candidatos? Usa esta potente herramienta para cargarlos desde un archivo Excel y distribuirlos automáticamente entre tus asesores.',
            position: 'left',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'admin-onboarding-4',
            target: '#search-reclutas',
            title: '🔍 Buscar un Candidato',
            description: 'Usa este campo para buscar rápidamente a un candidato por su nombre, email o cualquier otro dato. Los resultados se actualizarán al instante.',
            position: 'right',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'admin-onboarding-5',
            target: '#filter-estado',
            title: '🚦 Filtrar por Estado',
            description: 'Este filtro te permite ver solo a los candidatos que se encuentran en un estado específico (Activo, En proceso, etc.). Es muy útil para enfocarte en un grupo.',
            position: 'right',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'admin-onboarding-6',
            target: '#filter-asesor',
            title: '👤 Filtrar por Asesor',
            description: 'Como administrador, puedes usar este filtro para ver los candidatos asignados a un asesor en particular. Perfecto para supervisar el trabajo de tu equipo.',
            position: 'right',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'admin-onboarding-7',
            target: '#sort-by',
            title: '⇅ Ordenar la Lista',
            description: 'Organiza la tabla de reclutas según tu preferencia: por nombre, por fecha de registro, etc. Facilita la visualización de los datos.',
            position: 'right',
action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'admin-onboarding-8',
            target: '#reclutas-table',
            title: '📋 Tabla de Reclutas',
            description: 'Aquí se muestra la lista de todos tus candidatos. Cada fila representa un recluta y puedes ver su información más importante de un vistazo.',
            position: 'top',
            action: 'highlight',
            nextButton: 'Casi terminamos...'
        },
        {
            id: 'admin-onboarding-9',
            target: '#reclutas-list tr:first-child .actions-column',
            title: '⚙️ Acciones por Recluta',
            description: 'Cada recluta tiene su propio set de acciones: Ver detalles, Editar su información o Eliminarlo del sistema. Pasa el cursor sobre los íconos para ver qué hace cada uno.',
            position: 'left',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'admin-onboarding-10',
            target: '#reclutas-table',
            title: '🔢 Navegación de Páginas',
            description: 'Si tienes muchos reclutas, la lista se dividirá en varias páginas. En ese caso, aparecerán controles de navegación aquí abajo para que puedas moverte entre ellas.',
            position: 'top',
            action: 'highlight',
            nextButton: '¡Entendido!'
        },
        {
            id: 'admin-onboarding-11',
            target: '.dashboard-header',
            title: '🎉 ¡Has completado el recorrido!',
            description: 'Ya conoces lo esencial para gestionar a tus reclutas. Explora las demás secciones como el Calendario y las Métricas para dominar todo el sistema. ¡Mucho éxito!',
            position: 'bottom',
            action: 'highlight',
            nextButton: 'Finalizar'
        }
    ],

    // 📚 PASOS DEL TUTORIAL PARA LA SECCIÓN DE CONFIGURACIÓN
    configuracionTutorialSteps: [
        {
            id: 'config-step-1',
            target: '#configuracion-section',
            title: '⚙️ Bienvenido a Configuración',
            description: 'Aquí puedes gestionar tu información de usuario, cambiar tu contraseña y ajustar las preferencias de la aplicación.',
            position: 'bottom',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'config-step-2',
            target: '#username-input',
            title: '👤 Nombre de Usuario',
            description: 'Este es tu nombre de usuario actual. Puedes modificarlo aquí.',
            position: 'right',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'config-step-3',
            target: '#email-input',
            title: '📧 Correo Electrónico',
            description: 'Tu dirección de correo electrónico. Asegúrate de que sea correcta para recibir notificaciones importantes.',
            position: 'right',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'config-step-4',
            target: '#current-password-input',
            title: '🔒 Cambiar Contraseña',
            description: 'Para cambiar tu contraseña, primero ingresa tu contraseña actual y luego la nueva contraseña.',
            position: 'right',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'config-step-5',
            target: '#new-password-input',
            title: '🔑 Nueva Contraseña',
            description: 'Ingresa tu nueva contraseña aquí. Asegúrate de que sea segura y fácil de recordar para ti.',
            position: 'right',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'config-step-6',
            target: '#confirm-new-password-input',
            title: '✅ Confirmar Nueva Contraseña',
            description: 'Vuelve a escribir tu nueva contraseña para confirmarla.',
            position: 'right',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'config-step-7',
            target: '#save-changes-btn',
            title: '💾 Guardar Cambios',
            description: 'Una vez que hayas realizado todos los cambios deseados, haz clic aquí para guardarlos. ¡No olvides este paso!',
            position: 'top',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'config-step-8',
            target: '#dark-mode-toggle',
            title: '🌙 Modo Oscuro',
            description: 'Activa o desactiva el modo oscuro para cambiar la apariencia de la aplicación.',
            position: 'left',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'config-step-9',
            target: '#email-notifications-toggle',
            title: '🔔 Notificaciones por Correo',
            description: 'Controla si deseas recibir notificaciones importantes por correo electrónico.',
            position: 'left',
            action: 'highlight',
            nextButton: 'Finalizar Tutorial'
        }
    ],

    // 📚 PASOS DEL TUTORIAL PARA MÉTRICAS DE ADMINISTRADOR (V2)
    adminMetricsTutorialSteps: [
        {
            id: 'metrics-v2-step-1',
            target: '#tab-content-resumen .kpi-grid-v2',
            title: '📊 Resumen General V2',
            description: '¡Bienvenido a las nuevas métricas! Esta es la pestaña de Resumen, donde encontrarás los indicadores clave (KPIs) más importantes de un vistazo.',
            position: 'bottom',
            action: 'highlight',
            nextButton: 'Comenzar'
        },
        {
            id: 'metrics-v2-step-2',
            target: ".tab-button-v2[data-tab='equipos']",
            title: '👥 Vista por Equipos',
            description: 'Haz clic aquí para analizar el rendimiento por equipos. Podrás comparar gerentes y ver la performance de sus asesores.',
            position: 'bottom',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'metrics-v2-step-3',
            target: ".tab-button-v2[data-tab='individual']",
            title: '🎯 Análisis Individual',
            description: 'En esta pestaña puedes ver las métricas detalladas de cada asesor, buscar, filtrar y encontrar los de mejor y peor rendimiento.',
            position: 'bottom',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'metrics-v2-step-4',
            target: ".tab-button-v2[data-tab='tendencias']",
            title: '📈 Tendencias e Historial',
            description: 'Explora las tendencias a lo largo del tiempo con gráficos interactivos y tablas de datos históricos para entender la evolución del reclutamiento.',
            position: 'bottom',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'metrics-v2-step-5',
            target: '.header-actions-v2',
            title: '⚙️ Acciones Globales',
            description: 'Desde aquí puedes refrescar los datos manualmente para ver la información más actualizada y exportar las métricas para tus reportes. ¡Has completado el tour!',
            position: 'bottom',
            action: 'highlight',
            nextButton: '¡Finalizar!'
        }
    ],

    // Steps for gestion de gerentes
    gestionGerentesTutorialSteps: [
        {
            id: 'gerentes-step-1',
            target: '#gestion-gerentes-section .section-header h2',
            title: 'Bienvenido a Gestion de Gerentes',
            description: 'Administra la estructura de gerentes y asesores desde este panel centralizado.',
            position: 'bottom',
            action: 'highlight',
            nextButton: 'Continuar'
        },
        {
            id: 'gerentes-step-2',
            target: '#metrics-gerentes-admin-container, .hierarchical-metrics-container',
            title: 'Resumen de indicadores',
            description: 'Revisa cuantos gerentes activos hay y detecta asesores sin asignar en un vistazo.',
            position: 'bottom',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'gerentes-step-3',
            target: '#metrics-gerentes-admin-container .action-card button, button[onclick*="mostrarJerarquiaCompleta"], button[onclick*="mostrarAsignacionAsesores"]',
            title: 'Acciones rapidas',
            description: 'Utiliza estos botones para asignar asesores o volver a mostrar toda la jerarquia cuando lo necesites.',
            position: 'top',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'gerentes-step-4',
            target: '.jerarquia-hint',
            title: 'Consejo interactivo',
            description: 'Conserva este recordatorio: primero abre un gerente y luego explora a sus asesores y reclutas.',
            position: 'right',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'gerentes-step-5',
            target: '.gerente-item, #jerarquia-container',
            title: 'Arbol jerarquico',
            description: 'Expande cada tarjeta de gerente para revisar su equipo, reasignar asesores y consultar los estados de los reclutas.',
            position: 'left',
            action: 'highlight',
            nextButton: 'Listo'
        }
    ],

    // ✅ FUNCIÓN DE DEBUG MEJORADA
    _debug(message, data = null) {
        if (this.config.debugMode) {
            const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
            console.log(`🎓[${timestamp}] Tutorial: ${message}`, data || '');
        }
    },

    // ✅ SISTEMA DE LOCKS PARA PREVENIR CONDICIONES DE CARRERA
    _acquireLock() {
        if (this.config.isLocked) {
            this._debug('⚠️ Lock ya adquirido, operación cancelada');
            return false;
        }
        this.config.isLocked = true;
        this._debug('🔒 Lock adquirido');
        return true;
    },

    _releaseLock() {
        this.config.isLocked = false;
        this._debug('🔓 Lock liberado');
    },

    // 🏁 INICIALIZAR TUTORIAL
    init() {
        console.log('🎓 Inicializando sistema de tutorial...');

        if (this.isTrackingPage()) {
            this.config.tutorialType = 'public';
            this.steps = this.publicSteps;
            this.config.storageKey = 'sistema_reclutas_tutorial_completed_public';
            console.log('✅ Tutorial público detectado');
        } else if (this.isAddRecruitPage()) {
            this.config.tutorialType = 'admin_recluta';
            this.steps = this.adminRecruitSteps;
            this.config.storageKey = 'sistema_reclutas_tutorial_completed_admin_recluta';
            console.log('✅ Tutorial de añadir recluta (admin) detectado');
        } else if (this.isConfiguracionPage()) {
            this.config.tutorialType = 'configuracion';
            this.steps = this.configuracionTutorialSteps;
            this.config.storageKey = 'sistema_reclutas_tutorial_completed_configuracion';
            console.log('✅ Tutorial de configuración detectado');
        } else if (this.isMetricsPage()) {
            this.config.tutorialType = 'admin_metrics';
            this.steps = this.adminMetricsTutorialSteps;
            this.config.storageKey = 'sistema_reclutas_tutorial_completed_admin_metrics';
            console.log('✅ Tutorial de métricas de admin detectado');
        } else {
            console.log('⚠️ Página no reconocida para tutorial, tutorial no disponible');
            return;
        }

        if (this.shouldShowTutorial()) {
            console.log('✅ Primera visita detectada, iniciando tutorial');
            this._setTimeout(() => this.start(), 1000);
        } else {
            console.log('ℹ️ Tutorial ya completado anteriormente');
        }

        this.addHelpButton();
    },

    // 🔍 VERIFICAR SI ES PÁGINA DE SEGUIMIENTO
isTrackingPage() {
    const trackingIndicators = [
        () => window.location.pathname.includes('/seguimiento'),
        () => document.getElementById('tracking-wrapper') !== null,
        () => document.getElementById('folio-input') !== null && 
              document.getElementById('tracking-button') !== null,
        // ✅ CORREGIDO: Uso de optional chaining en lugar de verificación manual
        () => document.title?.toLowerCase().includes('seguimiento')
    ];
    
    return trackingIndicators.some(check => {
        try {
            return check();
        } catch (e) {
            console.warn('Error checking tracking page indicator:', e.message);
            return false;
        }
    });
},

    // 🔍 VERIFICAR SI ES PÁGINA DE AÑADIR RECLUTA (ADMIN)
    isAddRecruitPage() {
        try {
            return window.location.pathname.includes('/admin/dashboard') &&
                   document.getElementById('add-recluta-modal') !== null;
        } catch (e) {
            console.warn('Error checking admin recruit page:', e.message);
            return false;
        }
    },

    // 🔍 VERIFICAR SI ES PÁGINA DE CONFIGURACIÓN
    isConfiguracionPage() {
        try {
            return window.location.pathname.includes('/configuracion') ||
                   document.getElementById('configuracion-section') !== null;
        } catch (e) {
            console.warn('Error checking configuracion page:', e.message);
            return false;
        }
    },

    // 🔍 VERIFICAR SI ES PÁGINA DE MÉTRICAS (V2)
    isMetricsPage() {
        try {
            // Check for the main section ID and a specific V2 element like a tab button
            return document.getElementById('estadisticas-section') !== null &&
                   document.querySelector('.tab-button-v2') !== null;
        } catch (e) {
            console.warn('Error checking admin metrics page:', e.message);
            return false;
        }
    },

    // ✅ VERIFICAR SI DEBE MOSTRAR TUTORIAL
    shouldShowTutorial() {
        try {
            const isFirstVisitGlobal = !localStorage.getItem('sistema_reclutas_first_visit_completed');
            
            if (isFirstVisitGlobal) {
                return true;
            }
            
            const urlParams = new URLSearchParams(window.location.search);
            const forceTutorial = urlParams.get('tutorial') === 'true';
            
            if (!forceTutorial) {
                return false;
            }
            
            const tutorialCompleted = localStorage.getItem(this.config.storageKey) === 'true';
            return !tutorialCompleted || forceTutorial;
            
        } catch (e) {
            console.warn('Error checking tutorial status:', e.message);
            return true;
        }
    },

    // 📝 MARCAR O DESMARCAR COMO COMPLETADO
    toggleCompleted(isCompleted) {
        try {
            if (isCompleted) {
                localStorage.setItem(this.config.storageKey, 'true');
                console.log('💾 Tutorial marcado como completado');
            } else {
                localStorage.removeItem(this.config.storageKey);
                console.log('🗑️ Tutorial desmarcado como completado');
            }
        } catch (e) {
            console.warn('Error toggling tutorial completion:', e.message);
        }
    },

    // 🎬 INICIAR TUTORIAL
    start() {
        if (this.config.isActive) {
            console.log('⚠️ Tutorial ya está activo');
            return;
        }

        console.log('🎬 Iniciando tutorial interactivo...');
        this.config.isActive = true;
        this.config.currentStep = 0;
        this.config.totalSteps = this.steps.length;

        this.createOverlay();
        this.showStep(0);
        document.body.style.overflow = 'hidden';
    },

    // 🎨 CREAR OVERLAY Y ELEMENTOS VISUALES
    createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'tutorial-overlay';
        overlay.className = 'tutorial-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: ${this.config.backgroundColor};
            z-index: ${this.config.zIndex}; transition: opacity 0.3s ease;
        `;

        const tooltip = document.createElement('div');
        tooltip.id = 'tutorial-tooltip';
        tooltip.className = 'tutorial-tooltip';

        const highlight = document.createElement('div');
        highlight.id = 'tutorial-highlight';
        highlight.className = 'tutorial-highlight';

        document.body.appendChild(overlay);
        document.body.appendChild(highlight);
        document.body.appendChild(tooltip);

        this._keyHandler = this.handleKeyPress.bind(this);
        document.addEventListener('keydown', this._keyHandler);
    },

    // ✅ FUNCIÓN SHOWSTEP REFACTORIZADA - COMPLEJIDAD COGNITIVA REDUCIDA
showStep(stepIndex) {
    // ✅ VALIDACIONES INICIALES (Extraídas a función separada)
    if (!this._validateStepExecution(stepIndex)) {
        return;
    }

    // ✅ ADQUIRIR LOCK Y CONFIGURAR PASO
    if (!this._acquireLock()) {
        this._debug('⚠️ No se pudo adquirir lock, cancelando showStep');
        return;
    }

    const step = this.steps[stepIndex];
    this._debug(`📍 Mostrando paso ${stepIndex + 1}/${this.steps.length}: ${step.title}`);
    this.config.currentStep = stepIndex;

    // ✅ BUSCAR ELEMENTO TARGET
    const targetElement = this._findTargetElement(step.target);
    
    if (!targetElement) {
        this._handleMissingElement(step, stepIndex);
        return;
    }

    // ✅ PROCESAR PASO CON ELEMENTO ENCONTRADO
    this._processStepWithElement(step, targetElement, stepIndex);
},

// ✅ FUNCIÓN AUXILIAR: VALIDAR EJECUCIÓN DEL PASO
_validateStepExecution(stepIndex) {
    if (!this.config.isActive) {
        this._debug('❌ Tutorial inactivo, cancelando showStep');
        return false;
    }

    if (this.config.isLocked) {
        this._debug('⚠️ Tutorial locked, retrasando showStep');
        setTimeout(() => this.showStep(stepIndex), 100);
        return false;
    }

    if (stepIndex < 0 || stepIndex >= this.steps.length) {
        this._debug('📊 Índice fuera de rango, completando tutorial', { 
            stepIndex, 
            totalSteps: this.steps.length 
        });
        this.complete();
        return false;
    }

    return true;
},

// ✅ FUNCIÓN AUXILIAR: BUSCAR ELEMENTO TARGET
_findTargetElement(targetSelector) {
    const selectors = targetSelector.split(',').map(s => s.trim());
    
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            this._debug(`📍 Elemento encontrado con selector: ${selector}`);
            return element;
        }
    }
    
    return null;
},

// ✅ FUNCIÓN AUXILIAR: MANEJAR ELEMENTO FALTANTE
_handleMissingElement(step, stepIndex) {
    this._debug(`⚠️ Ningún elemento encontrado para: ${step.target}. Iniciando búsqueda...`);
    
    // Liberar lock antes de waitForElement
    this._releaseLock();
    
    const waitConfig = this._getWaitConfiguration(step);
    this._debug(`🔍 Esperando elemento ${waitConfig.type}`, { timeout: waitConfig.timeout });
    
    // Usar waitForElement mejorado
    this.waitForElement(step.target, (foundElement) => {
        this._onElementFound(foundElement, stepIndex, waitConfig.isModal);
    }, { 
        timeout: waitConfig.timeout, 
        interval: waitConfig.interval 
    });
},

// ✅ FUNCIÓN AUXILIAR: OBTENER CONFIGURACIÓN DE ESPERA
_getWaitConfiguration(step) {
    const isModal = step.target.includes('modal') || step.target.includes('.modal');
    return {
        isModal,
        type: isModal ? 'modal' : 'regular',
        timeout: isModal ? 10000 : (step.timeout || 8000),
        interval: isModal ? 300 : 200
    };
},

// ✅ FUNCIÓN AUXILIAR: PROCESAR CUANDO SE ENCUENTRA ELEMENTO
_onElementFound(foundElement, stepIndex, isModal) {
    if (!foundElement || !this.config.isActive) {
        return;
    }
    
    this._debug('✅ Elemento apareció, reintentando showStep');
    
    const delay = isModal ? 300 : 0;
    
    if (delay > 0) {
        setTimeout(() => this.showStep(stepIndex), delay);
    } else {
        this.showStep(stepIndex);
    }
},

// ✅ FUNCIÓN AUXILIAR: PROCESAR PASO CON ELEMENTO
_processStepWithElement(step, targetElement, stepIndex) {
    try {
        this._debug('🎯 Aplicando highlight y tooltip');

        // Verificar que el tutorial sigue activo
        if (!this.config.isActive) {
            this._debug('❌ Tutorial se desactivó durante showStep');
            this._releaseLock();
            return;
        }

        // Aplicar efectos visuales
        this._applyVisualEffects(step, targetElement);
        
        this._debug(`✅ Paso ${stepIndex + 1} configurado exitosamente`);
        
    } catch (error) {
        console.error('❌ Error configurando paso:', error);
        this._debug('❌ Error en showStep', error.message);
    } finally {
        this._releaseLock();
    }
},

// ✅ FUNCIÓN AUXILIAR: APLICAR EFECTOS VISUALES
_applyVisualEffects(step, targetElement) {
    this.highlightElement(targetElement);
    this.showTooltip(step, targetElement);
    this.scrollToElement(targetElement);
},

    // ✅ FUNCIÓN WAITFORELEMENT COMPLETAMENTE REESCRITA
    waitForElement(selector, callback, opts = {}) {
        if (!this.config.isActive) {
            this._debug('❌ Tutorial inactivo, cancelando waitForElement');
            return;
        }

        const interval = typeof opts.interval === 'number' ? Math.max(opts.interval, 50) : 200;
        const timeout = typeof opts.timeout === 'number' ? opts.timeout : 8000;
        const startTime = Date.now();
        const waitId = `wait_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

        this._debug(`🔍 Iniciando waitForElement para: ${selector}`, { waitId, timeout });

        // ✅ FUNCIÓN DE BÚSQUEDA MEJORADA
        const findElement = () => {
            if (selector.includes(',')) {
                const selectors = selector.split(',').map(s => s.trim());
                for (const sel of selectors) {
                    const el = document.querySelector(sel);
                    if (el) {
                        this._debug(`✅ Elemento encontrado con selector: ${sel}`);
                        return el;
                    }
                }
                return null;
            } else {
                return document.querySelector(selector);
            }
        };

        // ✅ CHEQUEO INMEDIATO
        const element = findElement();
        if (element) {
            this._debug(`✅ Elemento encontrado inmediatamente: ${selector}`);
            this._safeCallback(callback, element);
            return;
        }

        // ✅ PREVENIR CALLBACKS DUPLICADOS
        if (this.config.waitForCallbacks.has(selector)) {
            this._debug(`⚠️ Ya existe waitForElement para: ${selector}, cancelando duplicado`);
            return;
        }

        let found = false;
        let pollId = null;
        let timeoutId = null;
        let isCleanedUp = false;

        // ✅ FUNCIÓN DE LIMPIEZA SEGURA
        const cleanup = (reason = 'unknown') => {
            if (isCleanedUp) return;
            isCleanedUp = true;

            this._debug(`🧹 Limpiando waitForElement: ${selector} (razón: ${reason})`);

            if (pollId) {
                this._clearInterval(pollId);
                pollId = null;
            }
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            
            this.config.waitForCallbacks.delete(selector);
            this.config.waitForCallbacks.delete(waitId);
        };

        // ✅ REGISTRAR CALLBACK ACTIVO
        this.config.waitForCallbacks.set(selector, { waitId, startTime, cleanup });
        this.config.waitForCallbacks.set(waitId, { selector, startTime, cleanup });

        // ✅ POLLING MEJORADO CON VERIFICACIONES DE ESTADO
        pollId = this._setInterval(() => {
            if (!this.config.isActive) {
                cleanup('tutorial_inactive');
                return;
            }

            if (found || isCleanedUp) {
                cleanup('already_found');
                return;
            }

            const element = findElement();
            if (element) {
                found = true;
                cleanup('element_found');
                
                this._debug(`✅ Elemento encontrado por polling: ${selector}`);
                this._safeCallback(callback, element);
            }
        }, interval);

        // ✅ TIMEOUT MEJORADO - NO AVANZA AUTOMÁTICAMENTE
        timeoutId = setTimeout(() => {
            if (!found && !isCleanedUp) {
                cleanup('timeout');
                this._debug(`⏰ Timeout alcanzado para: ${selector} después de ${timeout}ms`);
                
                console.warn(`⚠️ Elemento ${selector} no encontrado después de ${timeout}ms. Tutorial permanece en paso actual.`);
                this._showElementNotFoundMessage(selector);
            }
        }, timeout);

        this._debug(`🕐 Configurado polling para: ${selector}`, { interval, timeout, waitId });
    },

    // ✅ FUNCIÓN PARA MOSTRAR MENSAJE CUANDO NO SE ENCUENTRA ELEMENTO
    _showElementNotFoundMessage(selector) {
        const tooltip = document.getElementById('tutorial-tooltip');
        if (tooltip) {
            const body = tooltip.querySelector('.tutorial-body');
            if (body) {
                const originalContent = body.innerHTML;
                body.innerHTML = `
                    <div style="border: 2px solid #ffc107; padding: 10px; border-radius: 6px; background: #fff3cd;">
                        <strong>⚠️ Elemento no encontrado</strong><br>
                        <small>El tutorial está esperando que aparezca: <code>${selector}</code></small><br>
                        <small>Verifica que la página esté completamente cargada.</small>
                    </div>
                    <hr>
                    ${originalContent}
                `;
            }
        }
    },

    // ✅ CALLBACK SEGURO MEJORADO
    _safeCallback(callback, ...args) {
        if (typeof callback !== 'function') {
            this._debug('❌ Callback no es una función');
            return;
        }

        try {
            if (!this.config.isActive) {
                this._debug('❌ Tutorial inactivo, cancelando callback');
                return;
            }

            this._debug('📞 Ejecutando callback');
            callback(...args);
        } catch (error) {
            console.error('❌ Error ejecutando callback:', error);
            this._debug('❌ Error en callback', error.message);
        }
    },

    // 🎯 RESALTAR ELEMENTO CON SOPORTE MEJORADO PARA MODALES
    highlightElement(element) {
    const highlight = document.getElementById('tutorial-highlight');
    if (!highlight) return;

    highlight.style.display = 'none';

    const isModal = element.classList.contains('modal') || 
                   element.closest('.modal') || 
                   element.classList.contains('modal-content') ||
                   element.querySelector('.modal-content');

    if (isModal) {
        console.log('🔍 Detectado modal, esperando renderizado completo...');
        
        const highlightModal = () => {
            let modalElement = element;
            
            if (element.classList.contains('modal')) {
                const modalContent = element.querySelector('.modal-content');
                if (modalContent) modalElement = modalContent;
            }
            
            if (element.closest('.modal')) {
                const modalContent = element.closest('.modal').querySelector('.modal-content');
                if (modalContent) modalElement = modalContent;
            }

            const rect = modalElement.getBoundingClientRect();
            
            if (rect.width === 0 || rect.height === 0) {
                console.warn('⚠️ Modal aún no visible, reintentando...');
                setTimeout(highlightModal, 100);
                return;
            }

            this._applyHighlight(modalElement, rect, true);
            // NUEVO: Configurar scroll listener para modales
            this._setupScrollListener(modalElement, true);
        };

        requestAnimationFrame(() => {
            requestAnimationFrame(highlightModal);
        });
        return;
    }

    const rect = element.getBoundingClientRect();
    this._applyHighlight(element, rect, false);
    // NUEVO: Configurar scroll listener para elementos normales
    this._setupScrollListener(element, false);
},

    // 🎯 FUNCIÓN AUXILIAR: APLICAR HIGHLIGHT
    _applyHighlight(element, rect, isModal = false) {
        const highlight = document.getElementById('tutorial-highlight');
        if (!highlight) return;

        if (this.lastHighlightedElement && this.lastHighlightedElement !== element) {
            this.lastHighlightedElement.style.zIndex = this.lastHighlightedElement.dataset.originalZindex || '';
            this.lastHighlightedElement.style.position = this.lastHighlightedElement.dataset.originalPosition || '';
            this.lastHighlightedElement.removeAttribute('data-original-zindex');
            this.lastHighlightedElement.removeAttribute('data-original-position');
        }

        element.dataset.originalZindex = element.style.zIndex;
        element.dataset.originalPosition = element.style.position;

        const targetZIndex = isModal ? 10050 : this.config.zIndex + 2;
        const highlightZIndex = isModal ? 10049 : this.config.zIndex + 1;

        highlight.style.cssText = `
            position: fixed;
            top: ${rect.top - 10}px; 
            left: ${rect.left - 10}px;
            width: ${rect.width + 20}px; 
            height: ${rect.height + 20}px;
            border: 3px solid ${this.config.highlightColor}; 
            border-radius: 8px;
            background: rgba(255,255,255,0.1);
            z-index: ${highlightZIndex};
            transition: all 0.3s ease;
            box-shadow: 0 0 20px rgba(0,123,255,0.5);
            animation: tutorial-pulse 2s infinite;
            display: block;
            pointer-events: none;
        `;

        if (!element.style.position || element.style.position === 'static') {
            element.style.position = 'relative';
        }
        element.style.zIndex = targetZIndex;

        this.lastHighlightedElement = element;
        
        console.log(`✅ Highlight aplicado a ${isModal ? 'modal' : 'elemento'} con z-index: ${targetZIndex}`);
    },

    // NUEVA FUNCIÓN: Throttle para optimizar scroll performance
_throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
},

// Configurar listener de scroll para actualizar highlight
_setupScrollListener(element, isModal = false) {
    // Limpiar listener anterior si existe
    if (this._scrollListener) {
        window.removeEventListener('scroll', this._scrollListener, true);
        this._scrollListener = null;
    }

    // Crear nuevo listener
    this._scrollListener = () => {
        if (!this.config.isActive || !element) return;

        const highlight = document.getElementById('tutorial-highlight');
        if (!highlight) return;

        // Recalcular posición del elemento
        const rect = element.getBoundingClientRect();
        
        // Verificar si el elemento sigue visible
        if (rect.width === 0 || rect.height === 0) {
            highlight.style.display = 'none';
            return;
        }

        // Actualizar posición del highlight
const highlightZIndex = isModal ? 10049 : this.config.zIndex + 1;

highlight.style.cssText = `
    position: fixed;
    top: ${rect.top - 10}px; 
    left: ${rect.left - 10}px;
    width: ${rect.width + 20}px; 
    height: ${rect.height + 20}px;
    border: 3px solid ${this.config.highlightColor}; 
    border-radius: 8px;
    background: rgba(255,255,255,0.1);
    z-index: ${highlightZIndex};
    transition: all 0.1s ease;
    box-shadow: 0 0 20px rgba(0,123,255,0.5);
    animation: tutorial-pulse 2s infinite;
    display: block;
    pointer-events: none;
`;

        this._debug(`🔄 Highlight actualizado por scroll: ${rect.top}, ${rect.left}`);
    };

    // Agregar listener con captura para todos los elementos padre
    window.addEventListener('scroll', this._scrollListener, true);
    this._debug('✅ Scroll listener configurado');
},

    // 💬 MOSTRAR TOOLTIP
    showTooltip(step, targetElement) {
        const tooltip = document.getElementById('tutorial-tooltip');
        if (!tooltip) return;

        tooltip.innerHTML = `
            <div class="tutorial-tooltip-content">
                <div class="tutorial-header">
                    <h3>${step.title}</h3>
                    <div class="tutorial-progress">
                        <span>Paso ${this.config.currentStep + 1} de ${this.config.totalSteps}</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(this.config.currentStep + 1) / this.config.totalSteps * 100}%"></div>
                        </div>
                    </div>
                </div>
                <div class="tutorial-body">
                    <p>${step.description}</p>
                </div>
                <div class="tutorial-footer">
                    <div class="tutorial-controls">
                        <label class="tutorial-checkbox">
                            <input type="checkbox" id="no-show-again">
                            <span>No mostrar este tutorial nuevamente</span>
                        </label>
                    </div>
                    <div class="tutorial-buttons">
                        ${this.config.currentStep > 0 ?
                            '<button id="tutorial-prev" class="btn btn-secondary">⬅️ Anterior</button>' : ''
                        }
                        <button id="tutorial-skip" class="btn btn-outline">Saltar Tutorial</button>
                        <button id="tutorial-next" class="btn btn-primary">${step.nextButton || 'Siguiente'} ➡️</button>
                    </div>
                </div>
            </div>
        `;

        this.positionTooltip(tooltip, targetElement, step.position);
        this.bindTooltipEvents(tooltip);

        tooltip.style.display = 'block';
        this._setTimeout(() => tooltip.style.opacity = '1', 10);

        this.makeDraggable(tooltip);

        if (step.action === 'clickAndProceed') {
            const nextButton = tooltip.querySelector('#tutorial-next');
            if (nextButton) {
                nextButton.removeEventListener('click', this.nextStep);
                nextButton.addEventListener('click', () => this.handleStepClickAndProceed(step.target));
            }
        }
    },

    // 📐 POSICIONAR TOOLTIP MEJORADO
    positionTooltip(tooltip, targetElement, preferredPosition = 'bottom') {
    if (!tooltip || !targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    const margin = 20;
    
    // FIJO: Usar dimensiones consistentes para evitar saltos
    const tooltipWidth = Math.min(350, window.innerWidth * 0.9);
    const tooltipHeight = Math.min(280, window.innerHeight * 0.8); // Altura estimada fija
    
    console.log(`📏 Tooltip dimensions fijas: ${tooltipWidth}x${tooltipHeight}`);

    // Posiciones candidatas más conservadoras
    const positions = {
        bottom: {
            top: rect.bottom + margin,
            left: rect.left + (rect.width / 2) - (tooltipWidth / 2)
        },
        top: {
            top: rect.top - tooltipHeight - margin,
            left: rect.left + (rect.width / 2) - (tooltipWidth / 2)
        },
        right: {
            top: rect.top + (rect.height / 2) - (tooltipHeight / 2),
            left: rect.right + margin
        },
        left: {
            top: rect.top + (rect.height / 2) - (tooltipHeight / 2),
            left: rect.left - tooltipWidth - margin
        }
    };

    // Validar que la posición preferida no tape el elemento resaltado
    let bestPosition = null;
    let finalPosition = preferredPosition;

    // NUEVO: Verificar que no se superpone con el elemento target
    const validatePosition = (pos) => {
        const tooltipRect = {
            top: pos.top,
            left: pos.left,
            right: pos.left + tooltipWidth,
            bottom: pos.top + tooltipHeight
        };
        
        const targetRect = {
            top: rect.top - 10,
            left: rect.left - 10,
            right: rect.right + 10,
            bottom: rect.bottom + 10
        };
        
        // Verificar que no se superponen
        const noOverlap = (
            tooltipRect.left > targetRect.right ||
            tooltipRect.right < targetRect.left ||
            tooltipRect.top > targetRect.bottom ||
            tooltipRect.bottom < targetRect.top
        );
        
        // Verificar que cabe en viewport
        const fitsInViewport = (
            pos.top >= margin &&
            pos.left >= margin &&
            (pos.top + tooltipHeight) <= (window.innerHeight - margin) &&
            (pos.left + tooltipWidth) <= (window.innerWidth - margin)
        );
        
        return noOverlap && fitsInViewport;
    };

    // Probar posiciones en orden de preferencia
    const positionOrder = [preferredPosition, 'bottom', 'top', 'right', 'left'];
    
    for (const pos of positionOrder) {
        const candidate = positions[pos];
        if (validatePosition(candidate)) {
            bestPosition = candidate;
            finalPosition = pos;
            break;
        }
    }

    // Si ninguna posición es válida, usar la menos problemática
    if (!bestPosition) {
        bestPosition = positions['top']; // Top por defecto
        finalPosition = 'top';
        console.warn('⚠️ Ninguna posición ideal encontrada, usando top por defecto');
    }

    // Ajustes finales para asegurar visibilidad sin superposición
    let { top, left } = bestPosition;

    // Clamp horizontal conservador
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));
    
    // Clamp vertical conservador - evitar solapar con elemento target
    if (finalPosition === 'top' || finalPosition === 'bottom') {
        // Para posiciones arriba/abajo, asegurar separación mínima
        if (finalPosition === 'bottom' && top < rect.bottom + margin) {
            top = rect.bottom + margin;
        }
        if (finalPosition === 'top' && (top + tooltipHeight) > rect.top - margin) {
            top = rect.top - tooltipHeight - margin;
        }
    }
    
    top = Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin));

    // Aplicar posición final con dimensiones fijas
    tooltip.style.cssText = `
        position: fixed;
        top: ${top}px; 
        left: ${left}px;
        width: ${tooltipWidth}px; 
        max-width: 90vw;
        max-height: ${tooltipHeight}px;
        z-index: ${this.config.zIndex + 3};
        opacity: 0; 
        transition: opacity 0.3s ease;
        display: block;
    `;

    console.log(`📍 Tooltip posicionado: ${finalPosition} en (${Math.round(top)}, ${Math.round(left)}) - Sin superposición`);
},

    // 🔗 VINCULAR EVENTOS DEL TOOLTIP
    bindTooltipEvents(tooltip) {
        this._removePreviousListeners(tooltip);
        this._setupNextButton(tooltip);
        this._setupPrevButton(tooltip);
        this._setupSkipButton(tooltip);
        this._setupCheckbox(tooltip);
    },

    // 🧹 REMOVER LISTENERS PREVIOS
    _removePreviousListeners(tooltip) {
        const listenersToRemove = [
            { selector: '#tutorial-next', listener: '_nextBtnListener' },
            { selector: '#tutorial-prev', listener: '_prevBtnListener' },
            { selector: '#tutorial-skip', listener: '_skipBtnListener' },
            { selector: '#no-show-again', listener: '_checkboxListener' }
        ];
        for (const { selector, listener } of listenersToRemove) {
            if (this[listener]) {
                const element = tooltip.querySelector(selector);
                const eventType = selector === '#no-show-again' ? 'change' : 'click';
                if (element) element.removeEventListener(eventType, this[listener]);
            }
        }
    },

    // ▶️ CONFIGURAR BOTÓN SIGUIENTE
    _setupNextButton(tooltip) {
        const nextBtn = tooltip.querySelector('#tutorial-next');
        if (!nextBtn) return;

        const currentStep = this.steps[this.config.currentStep];
        if (currentStep && currentStep.action === 'clickAndProceed') {
            console.log('⚠️ Paso con acción especial, no agregando listener normal');
            return;
        }

        const currentStepId = this.steps[this.config.currentStep].id;
        const isLastStep = currentStepId === 'admin-step-3' || 
                          currentStepId === 'add-button-step-3' || 
                          currentStepId === 'dist-excel-step-4' ||
                          this.config.currentStep === this.steps.length - 1;

        this._nextBtnListener = () => isLastStep ? this.complete() : this.nextStep();
        nextBtn.addEventListener('click', this._nextBtnListener);
    },

    // ◀️ CONFIGURAR BOTÓN ANTERIOR
    _setupPrevButton(tooltip) {
        const prevBtn = tooltip.querySelector('#tutorial-prev');
        if (!prevBtn) return;
        this._prevBtnListener = () => this.prevStep();
        prevBtn.addEventListener('click', this._prevBtnListener);
    },

    // ⏭️ CONFIGURAR BOTÓN SALTAR
    _setupSkipButton(tooltip) {
        const skipBtn = tooltip.querySelector('#tutorial-skip');
        if (!skipBtn) return;
        this._skipBtnListener = () => this.skip();
        skipBtn.addEventListener('click', this._skipBtnListener);
    },

    // ☑️ CONFIGURAR CHECKBOX
    _setupCheckbox(tooltip) {
        const checkbox = tooltip.querySelector('#no-show-again');
        if (!checkbox) return;
        try {
            checkbox.checked = localStorage.getItem(this.config.storageKey) === 'true';
        } catch (e) {
            console.warn('Error accessing localStorage:', e.message);
            checkbox.checked = false;
        }
        this._checkboxListener = (e) => this.toggleCompleted(e.target.checked);
        checkbox.addEventListener('change', this._checkboxListener);
    },

    // ✅ HACER ELEMENTO ARRASTRABLE
    makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const dragHandle = element.querySelector('.tutorial-header');
        if (!dragHandle) return;

        dragHandle.style.cursor = 'move';
        dragHandle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            if (!e) return;
            e.preventDefault();
            pos3 = e.clientX; 
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            if (!e) return;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX; 
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    },

    // 🆕 MANEJAR ACCIÓN 'clickAndProceed'
    handleStepClickAndProceed(targetSelector) {
        console.log(`🔄 Ejecutando clickAndProceed para: ${targetSelector}`);
        
        const targetElement = document.querySelector(targetSelector);
        if (targetElement) {
            console.log('✅ Elemento encontrado, haciendo clic...');
            targetElement.click();
            
            this._setTimeout(() => {
                const nextStepIndex = this.config.currentStep + 1;
                const nextStepInfo = this.steps[nextStepIndex];
                
                if (nextStepInfo?.target) {
                    console.log(`🔍 Esperando elemento del paso ${nextStepIndex + 1}: ${nextStepInfo.target}`);
                    
                    this.waitForElement(nextStepInfo.target, (element) => {
                        if (element) {
                            console.log('✅ Elemento del siguiente paso encontrado, avanzando...');
                            this.nextStep();
                        } else {
                            console.warn('⚠️ Elemento del siguiente paso no encontrado, avanzando de todos modos');
                            this.nextStep();
                        }
                    }, { timeout: 3000, interval: 200 });
                } else {
                    console.log('📍 No hay siguiente paso definido, avanzando...');
                    this.nextStep();
                }
            }, 300);
            
        } else {
            console.warn(`❌ Elemento objetivo no encontrado para clickAndProceed: ${targetSelector}`);
            this.nextStep();
        }
    },

    // ➡️ PASO SIGUIENTE
    nextStep() {
        if (!this.config.isActive) return;
        this.config.currentStep++;
        if (this.config.currentStep >= this.steps.length) {
            this.complete();
        } else {
            this.showStep(this.config.currentStep);
        }
    },

    // ⬅️ PASO ANTERIOR
    prevStep() {
        if (!this.config.isActive) return;
        if (this.config.currentStep > 0) {
            this.config.currentStep--;
            this.showStep(this.config.currentStep);
        }
    },

    // ⏭️ SALTAR TUTORIAL
    skip() {
        const confirmSkip = confirm('¿Estás seguro de que quieres saltar el tutorial? Podrás acceder a él nuevamente desde el botón de ayuda.');
        if (confirmSkip) this.complete();
    },

    // ✅ COMPLETE REFACTORIZADA - COMPLEJIDAD COGNITIVA REDUCIDA
complete() {
    this._debug('🏁 Iniciando complete()');
    
    // ✅ VALIDACIONES INICIALES (Complejidad: 2)
    if (!this._validateCompleteExecution()) {
        return;
    }
    
    // ✅ ADQUIRIR LOCK (Complejidad: 1)
    if (!this._acquireLock()) {
        this._debug('⚠️ No se pudo adquirir lock para complete()');
        return;
    }
    
    // ✅ PROCESAR FINALIZACIÓN (Complejidad: 1)
    try {
        this._processCompletion();
        this._debug('✅ Complete() finalizado exitosamente');
    } catch (error) {
        console.error('❌ Error en complete():', error);
        this._debug('❌ Error en complete()', error.message);
    } finally {
        this._releaseLock();
    }
},
// TOTAL COMPLEJIDAD complete(): 4 puntos (muy por debajo del límite de 15)

// ✅ FUNCIÓN AUXILIAR: VALIDAR EJECUCIÓN DE COMPLETE
_validateCompleteExecution() {
    if (!this.config.isActive) {
        this._debug('⚠️ Complete() llamado pero tutorial ya inactivo');
        return false;
    }
    return true;
},

// ✅ FUNCIÓN AUXILIAR: PROCESAR FINALIZACIÓN
_processCompletion() {
    this._debug('✅ Marcando tutorial como inactivo');
    this.config.isActive = false;
    
    // Cleanup básico
    this.cleanup();
    document.body.style.overflow = '';
    
    // Manejar checkbox de "no mostrar otra vez"
    this._handleNoShowAgainCheckbox();
    
    // Determinar siguiente acción basada en tipo de tutorial
    this._handleTutorialChaining();

    // ✅ Execute onComplete callback if it exists
    if (this.config.onComplete && typeof this.config.onComplete === 'function') {
        this._debug('🏃‍♂️ Ejecutando callback onComplete...');
        this.config.onComplete();
    }
},

// ✅ FUNCIÓN AUXILIAR: MANEJAR CHECKBOX "NO MOSTRAR OTRA VEZ"
_handleNoShowAgainCheckbox() {
    const checkbox = document.querySelector('#no-show-again');
    if (checkbox?.checked) {
        this.markAsCompleted();
    }
},

// ✅ FUNCIÓN AUXILIAR: MANEJAR ENCADENAMIENTO DE TUTORIALES
_handleTutorialChaining() {
    const tutorialType = this.config.tutorialType;
    
    if (tutorialType === 'admin_add_button') {
        this._handleAddButtonTutorialComplete();
    } else if (tutorialType === 'admin_distribute_excel') {
        this._handleDistributeExcelTutorialComplete();
    } else {
        this.showWelcomeMessage();
    }
},

// ✅ FUNCIÓN AUXILIAR: MANEJAR FINALIZACIÓN DE TUTORIAL DE BOTÓN AGREGAR
_handleAddButtonTutorialComplete() {
    this._debug('🔗 Iniciando encadenamiento automático');
    
    // Cerrar modal si está abierto
    this._closeAddReclutaModal();
    
    // Decidir próxima acción basada en si es primera visita
    const isFirstVisit = this._isFirstVisit();
    
    if (isFirstVisit) {
        this._setTimeout(() => {
            this.startDistributionTutorialAutomatic();
        }, 1500);
    } else {
        this.showWelcomeMessage();
    }
},

// ✅ FUNCIÓN AUXILIAR: MANEJAR FINALIZACIÓN DE TUTORIAL DE DISTRIBUCIÓN EXCEL
_handleDistributeExcelTutorialComplete() {
    this._markFirstVisitCompleted();
    this.showWelcomeMessage();
},

// ✅ FUNCIÓN AUXILIAR: CERRAR MODAL DE AGREGAR RECLUTA
_closeAddReclutaModal() {
    const openModal = document.querySelector('#add-recluta-modal');
    if (openModal) {
        openModal.style.display = 'none';
    }
},

// ✅ FUNCIÓN AUXILIAR: VERIFICAR SI ES PRIMERA VISITA
_isFirstVisit() {
    return !localStorage.getItem('sistema_reclutas_first_visit_completed');
},

// ✅ FUNCIÓN AUXILIAR: MARCAR PRIMERA VISITA COMO COMPLETADA
_markFirstVisitCompleted() {
    try {
        localStorage.setItem('sistema_reclutas_first_visit_completed', 'true');
        this._debug('✅ Primera visita marcada como completada');
    } catch (e) {
        this._debug('⚠️ Error marcando primera visita', e.message);
    }
},

    // Iniciar tutorial de distribución automáticamente
    startDistributionTutorialAutomatic() {
        console.log('Iniciando tutorial de distribución Excel automáticamente...');
        
        const distribuirBtn = document.querySelector('#distribuir-excel-btn');
        
        if (!distribuirBtn) {
            console.warn('Botón de distribución no encontrado. Finalizando secuencia de tutoriales.');
            try {
                localStorage.setItem('sistema_reclutas_first_visit_completed', 'true');
            } catch (e) {
                console.warn('Error marcando primera visita:', e.message);
            }
            this.showWelcomeMessage();
            return;
        }

        try {
            localStorage.removeItem('sistema_reclutas_tutorial_completed_admin_distribute_excel');
        } catch (e) {
            console.warn('Error reseteando tutorial de distribución:', e.message);
        }
        
        this.startTutorial({
            type: 'admin_distribute_excel',
            steps: this.distribuirReclutasExcelSteps,
            storageKey: 'sistema_reclutas_tutorial_completed_admin_distribute_excel',
            force: true
        });
    },

    // ✅ CLEANUP MEJORADO CON VERIFICACIONES
    cleanup() {
        this._debug('🧹 Iniciando limpieza de tutorial');

        // NUEVO: Limpiar scroll listener
    if (this._scrollListener) {
        window.removeEventListener('scroll', this._scrollListener, true);
        this._scrollListener = null;
        this._debug('🗑️ Scroll listener removido');
    }

    if (this.config.autoCleanupDisabled) {
        this._debug('⚠️ Cleanup automático deshabilitado');
        return;
    }

        if (this.config.autoCleanupDisabled) {
            this._debug('⚠️ Cleanup automático deshabilitado');
            return;
        }

        const elementsToRemove = ['tutorial-overlay', 'tutorial-highlight', 'tutorial-tooltip'];
        elementsToRemove.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.remove();
                this._debug(`🗑️ Elemento removido: ${id}`);
            }
        });

        document.querySelectorAll('[data-original-zindex]').forEach(el => {
            el.style.zIndex = el.dataset.originalZindex || '';
            el.removeAttribute('data-original-zindex');
        });
        document.querySelectorAll('[data-original-position]').forEach(el => {
            el.style.position = el.dataset.originalPosition || '';
            el.removeAttribute('data-original-position');
        });

        if (this._keyHandler) {
            document.removeEventListener('keydown', this._keyHandler);
            this._keyHandler = null;
        }

        this._debug(`🧹 Limpiando ${this._activeIntervals.length} intervals y ${this._activeTimeouts.length} timeouts`);
        
        this._activeIntervals.forEach(id => {
            try {
                clearInterval(id);
            } catch (e) {
                this._debug('⚠️ Error limpiando interval', e.message);
            }
        });
        
        this._activeTimeouts.forEach(id => {
            try {
                clearTimeout(id);
            } catch (e) {
                this._debug('⚠️ Error limpiando timeout', e.message);
            }
        });
        
        this._activeObservers.forEach(obs => { 
            try { 
                obs.disconnect(); 
            } catch(e) {
                this._debug('⚠️ Error desconectando observer', e.message);
            }
        });

        this.config.waitForCallbacks.forEach((data, key) => {
            try {
                if (data.cleanup) data.cleanup('tutorial_cleanup');
            } catch (e) {
                this._debug('⚠️ Error limpiando callback', e.message);
            }
        });

        this._activeIntervals = [];
        this._activeTimeouts = [];
        this._activeObservers = [];
        this.config.waitForCallbacks.clear();
        this.lastHighlightedElement = null;
        this.config.isLocked = false;

        this._debug('✅ Limpieza completada');
    },

    // 📝 MARCAR COMO COMPLETADO
    markAsCompleted() {
        try {
            localStorage.setItem(this.config.storageKey, 'true');
            console.log('💾 Tutorial marcado como completado');
        } catch (e) {
            console.warn('Error marcando tutorial como completado:', e.message);
        }
    },

    // 🎉 MENSAJE DE BIENVENIDA
    showWelcomeMessage() {
        if (typeof showNotification === 'function') {
            try {
                showNotification('¡Tutorial completado exitosamente! 🎉', 'success', 5000);
            } catch (e) {
                console.warn('Error mostrando notificación:', e.message);
                this._fallbackMessage();
            }
        } else {
            this._fallbackMessage();
        }
    },

    _fallbackMessage() {
        alert('¡Tutorial completado exitosamente! 🎉\n\nYa conoces las funciones principales del sistema.');
    },

    // ⌨️ MANEJAR TECLAS
    handleKeyPress(event) {
        if (!this.config.isActive) return;
        try {
            switch(event.key) {
                case 'Escape': 
                    this.skip(); 
                    break;
                case 'ArrowRight':
                case 'Enter':
                    event.preventDefault();
                    this.nextStep();
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    this.prevStep();
                    break;
            }
        } catch (e) {
            console.warn('Error manejando tecla:', e.message);
        }
    },

    // 📜 SCROLL AL ELEMENTO
    scrollToElement(element) {
        try {
            const rect = element.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            if (rect.top < 0 || rect.bottom > viewportHeight) {
                element.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center', 
                    inline: 'nearest' 
                });
            }
        } catch (e) {
            console.warn('Error haciendo scroll al elemento:', e.message);
        }
    },

    // 🆘 AGREGAR BOTÓN DE AYUDA
    addHelpButton() {
        if (document.getElementById('tutorial-help-btn')) return;

        const helpButton = document.createElement('button');
        helpButton.id = 'tutorial-help-btn';
        helpButton.innerHTML = '❓';
        helpButton.title = 'Mostrar tutorial de ayuda';
        helpButton.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; width: 50px; height: 50px;
            border-radius: 50%; background: ${this.config.highlightColor}; color: white;
            border: none; font-size: 20px; cursor: pointer; z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: all 0.3s ease;
        `;

        helpButton.addEventListener('click', () => {
            try {
                const wasCompleted = localStorage.getItem(this.config.storageKey);
                localStorage.removeItem(this.config.storageKey);
                this.start();
                if (wasCompleted) {
                    this._setTimeout(() => {
                        try {
                            localStorage.setItem(this.config.storageKey, 'true');
                        } catch (e) {
                            console.warn('Error restaurando estado del tutorial:', e.message);
                        }
                    }, 1000);
                }
            } catch (e) {
                console.warn('Error en botón de ayuda:', e.message);
            }
        });

        helpButton.addEventListener('mouseenter', () => { 
            helpButton.style.transform = 'scale(1.1)'; 
        });
        helpButton.addEventListener('mouseleave', () => { 
            helpButton.style.transform = 'scale(1)'; 
        });

        document.body.appendChild(helpButton);
    },

    // 🔄 REINICIAR TUTORIAL
    restart() {
        try {
            localStorage.removeItem(this.config.storageKey);
            if (this.config.isActive) this.cleanup();
            this._setTimeout(() => this.start(), 100);
        } catch (e) {
            console.warn('Error reiniciando tutorial:', e.message);
        }
    },

    // 🗑️ RESET TUTORIAL
    reset() {
        try {
            localStorage.removeItem(this.config.storageKey);
            console.log('🗑️ Tutorial reseteado - se mostrará en próxima visita');
        } catch (e) {
            console.warn('Error reseteando tutorial:', e.message);
        }
    },

    // Helpers para controlar timers/observers
    _setInterval(fn, ms) { 
        const id = setInterval(fn, ms); 
        this._activeIntervals.push(id); 
        return id; 
    },
    _clearInterval(id) { 
        clearInterval(id); 
        this._activeIntervals = this._activeIntervals.filter(x => x !== id); 
    },
    _setTimeout(fn, ms) { 
        const id = setTimeout(fn, ms); 
        this._activeTimeouts.push(id); 
        return id; 
    },

    // ✅ FUNCIÓN DE DEBUG HABILITADA POR DEFECTO EN DESARROLLO
    enableDebugMode() {
        this.config.debugMode = true;
        console.log('🐛 Modo debug del tutorial habilitado');
        console.log('🎯 Estado actual:', {
            isActive: this.config.isActive,
            currentStep: this.config.currentStep,
            totalSteps: this.config.totalSteps,
            isLocked: this.config.isLocked,
            waitForCallbacks: this.config.waitForCallbacks.size
        });
    },

    // ✅ FUNCIÓN PARA FORZAR REINICIO DEL TUTORIAL
    forceRestart() {
        console.log('🔄 Forzando reinicio del tutorial...');
        
        this.config.isActive = false;
        this.config.isLocked = false;
        this.config.autoCleanupDisabled = false;
        this.cleanup();
        
        setTimeout(() => {
            this.start();
        }, 500);
    }
};

// Tutorial para distribución Excel
Tutorial.startDistributionTutorial = function() {
    const distribuirBtn = document.querySelector('#distribuir-excel-btn');
    if (!distribuirBtn) {
        console.warn('Botón de distribución no encontrado. Tutorial no disponible.');
        return false;
    }

    console.log('Iniciando tutorial de distribución Excel...');

    try {
        localStorage.removeItem('sistema_reclutas_tutorial_completed_admin_distribute_excel');
    } catch (e) {
        console.warn('Error reseteando tutorial de distribución:', e.message);
    }
    
    this.config.tutorialType = 'admin_distribute_excel';
    this.steps = this.distribuirReclutasExcelSteps;
    this.config.storageKey = 'sistema_reclutas_tutorial_completed_admin_distribute_excel';
    
    if (this.config.isActive) {
        this.cleanup();
    }
    
    this._setTimeout(() => {
        this.start();
    }, 100);
    
    return true;
};

// Función de conveniencia para testing
Tutorial.testDistributionTutorial = function() {
    console.log('Iniciando tutorial de distribución Excel en modo test...');
    return this.startDistributionTutorial();
};

// Función para resetear completamente el sistema de primera visita
Tutorial.resetFirstVisit = function() {
    try {
        localStorage.removeItem('sistema_reclutas_first_visit_completed');
        localStorage.removeItem('sistema_reclutas_tutorial_completed_public');
        localStorage.removeItem('sistema_reclutas_tutorial_completed_admin_add_button');
        localStorage.removeItem('sistema_reclutas_tutorial_completed_admin_distribute_excel');
        console.log('Sistema de primera visita reseteado completamente');
    } catch (e) {
        console.warn('Error reseteando primera visita:', e.message);
    }
};

// 🚀 FUNCIÓN PARA INICIAR UN TUTORIAL ESPECÍFICO
Tutorial.startTutorial = function(tutorialConfig) {
    try {
        console.log(`🎓 Iniciando tutorial: ${tutorialConfig.type}...`);
        this.config.tutorialType = tutorialConfig.type;
        this.steps = tutorialConfig.steps;
        this.config.storageKey = tutorialConfig.storageKey;
        this.config.onComplete = tutorialConfig.onComplete || null; // Store the callback
        if (this.shouldShowTutorial() || tutorialConfig.force) {
            console.log(`✅ Iniciando tutorial ${tutorialConfig.type}`);
            this.restart();
        } else {
            console.log(`ℹ️ Tutorial ${tutorialConfig.type} ya completado anteriormente`);
        }
    } catch (e) {
        console.warn('Error iniciando tutorial específico:', e.message);
    }
};

// 🚀 FUNCIÓN PARA INICIAR EL TUTORIAL DEL BOTÓN DE AGREGAR RECLUTA
Tutorial.startAdminRecruitTutorial = function() {
    this.startTutorial({
        type: 'admin_add_button',
        steps: this.addButtonTutorialSteps,
        storageKey: 'sistema_reclutas_tutorial_completed_admin_add_button'
    });
};

// 🚀 FUNCIÓN PARA INICIAR EL TUTORIAL DE CONFIGURACIÓN
Tutorial.startConfiguracionTutorial = function() {
    this.startTutorial({
        type: 'configuracion',
        steps: this.configuracionTutorialSteps,
        storageKey: 'admin_configuracion_tutorial_completed',
        force: true,
        onComplete: () => {
            try {
                localStorage.setItem('admin_configuracion_tutorial_completed', 'true');
                console.log('✅ Tutorial de configuración marcado como completado.');
            } catch (e) {
                console.error('Error al marcar el tutorial de configuración como completado:', e);
            }
        }
    });
};

// 🚀 FUNCIÓN PARA INICIAR EL TUTORIAL DEL CALENDARIO
Tutorial.startCalendarTutorial = function() {
    this.startTutorial({
        type: 'admin_calendar',
        steps: this.calendarSteps,
        storageKey: 'admin_calendar_tutorial_completed',
        force: true,
        onComplete: () => {
            try {
                localStorage.setItem('admin_calendar_tutorial_completed', 'true');
                console.log('✅ Tutorial del calendario marcado como completado.');
            } catch (e) {
                console.error('Error al marcar el tutorial del calendario como completado:', e);
            }
        }
    });
};

Tutorial.startGestionGerentesTutorial = function() {
    this.startTutorial({
        type: 'admin_gerentes',
        steps: this.gestionGerentesTutorialSteps,
        storageKey: 'admin_gerentes_tutorial_completed',
        force: true,
        onComplete: () => {
            try {
                localStorage.setItem('admin_gerentes_tutorial_completed', 'true');
                console.log('? Tutorial de gestion de gerentes marcado como completado.');
            } catch (e) {
                console.error('Error al marcar el tutorial de gerentes como completado:', e);
            }
        }
    });
};

// ============================================================================
// 🐛 HERRAMIENTAS DE DEBUGGING INTEGRADAS
// ============================================================================

// 🔍 DIAGNÓSTICO COMPLETO DEL ESTADO DEL TUTORIAL
Tutorial.diagnose = function() {
    console.log('🏥 === DIAGNÓSTICO DEL TUTORIAL ===');
    console.log('📊 Estado actual:', {
        isActive: this.config.isActive,
        currentStep: this.config.currentStep,
        totalSteps: this.config.totalSteps,
        isLocked: this.config.isLocked,
        tutorialType: this.config.tutorialType,
        storageKey: this.config.storageKey
    });
    
    console.log('🕐 Timers activos:', {
        intervals: this._activeIntervals.length,
        timeouts: this._activeTimeouts.length,
        observers: this._activeObservers.length,
        waitForCallbacks: this.config.waitForCallbacks.size
    });
    
    console.log('🎯 Elementos DOM:', {
        overlay: !!document.getElementById('tutorial-overlay'),
        highlight: !!document.getElementById('tutorial-highlight'),
        tooltip: !!document.getElementById('tutorial-tooltip')
    });
    
    console.log('💾 LocalStorage:', {
        completed: localStorage.getItem(this.config.storageKey),
        firstVisit: localStorage.getItem('sistema_reclutas_first_visit_completed')
    });
    
    // ✅ CORREGIDO: Uso de optional chaining en lugar de verificación manual
    if (this.steps?.[this.config.currentStep]) {
        const currentStep = this.steps[this.config.currentStep];
        const targetExists = !!document.querySelector(currentStep.target);
        console.log('🎯 Paso actual:', {
            id: currentStep.id,
            title: currentStep.title,
            target: currentStep.target,
            targetExists: targetExists
        });
    }
};

// 🔧 REPARACIÓN AUTOMÁTICA
Tutorial.autoFix = function() {
    console.log('🔧 Iniciando reparación automática...');
    
    this.config.isLocked = false;
    this.config.autoCleanupDisabled = false;
    this.config.waitForCallbacks.clear();
    
    if (this.config.isActive && !document.getElementById('tutorial-tooltip')) {
        console.log('🏗️ Recreando elementos perdidos...');
        this.createOverlay();
        
        if (this.steps?.[this.config.currentStep]) {
            this.showStep(this.config.currentStep);
        }
    }
    
    if (!this.config.isActive && document.getElementById('tutorial-tooltip')) {
        console.log('🧹 Limpiando elementos huérfanos...');
        this.cleanup();
    }
    
    console.log('✅ Reparación completada');
    this.diagnose();
};

// 🎮 CONTROLES MANUALES DE PASOS
Tutorial.goToStep = function(stepIndex) {
    if (!this.steps || stepIndex < 0 || stepIndex >= this.steps.length) {
        console.error('❌ Índice de paso inválido:', stepIndex);
        return;
    }
    
    console.log(`🎯 Yendo manualmente al paso ${stepIndex + 1}`);
    this.config.currentStep = stepIndex;
    this.showStep(stepIndex);
};

Tutorial.quickCommands = function() {
    console.log('🎮 === COMANDOS RÁPIDOS DEL TUTORIAL ===');
    console.log('Tutorial.diagnose()         - Diagnóstico completo');
    console.log('Tutorial.enableDebugMode()  - Activar logs detallados');  
    console.log('Tutorial.autoFix()          - Reparación automática');
    console.log('Tutorial.forceRestart()     - Reiniciar tutorial');
    console.log('Tutorial.goToStep(n)        - Ir al paso n');
    console.log('Tutorial.resetFirstVisit()  - Reset completo primera visita');
};

// 🚀 AUTO-INICIALIZACIÓN SEGURA
document.addEventListener('DOMContentLoaded', function(){
    try {
        if (window.location.pathname.includes('/seguimiento')) {
            window.Tutorial = Tutorial;
            Tutorial.init();
        }
    } catch (err) {
        console.warn('⚠️ Error iniciando tutorial público:', err.message);
    }
});

// 🌍 EXPORTAR PARA USO GLOBAL
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Tutorial;
} else if (typeof window !== 'undefined') {
    window.Tutorial = Tutorial;
    
    // Inicializar herramientas de debug en desarrollo
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        Tutorial.enableDebugMode();
        Tutorial.quickCommands();
    }
}

export default Tutorial;
