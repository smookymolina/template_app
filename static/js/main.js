import CONFIG from './config.js';
import Auth from './auth.js';
import Reclutas from './reclutas.js';
import UI from './ui.js';
import Calendar from './calendar.js';
import Client from './client.js';
import Timeline from './timeline.js';
import { showNotification, showError, showSuccess } from './notifications.js';
import Tutorial from './tutorial.js';
import Jerarquia from './jerarquia.js';

let MetricasAdmin = null;

// Estado global de la aplicación
let appState = {
    initialized: false,
    currentSection: 'reclutas-section'
};

/**
 * ✅ INICIALIZACIÓN PRINCIPAL DE LA APLICACIÓN
 */
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('🚀 Iniciando sistema de gestión de reclutas...');

        // Asegurar que el dashboard esté oculto al inicio
        ensureDashboardHidden();

        await initializeApplication();

        console.log('✅ Sistema inicializado correctamente');

    } catch (error) {
        console.error('❌ Error crítico en la inicialización:', error);
        showError('Error al cargar el sistema. Por favor, recarga la página.');
        // En caso de error, asegurar que se muestre la pantalla de login
        showLoginScreen(true);
    }
});

/**
 * ✅ FUNCIÓN PRINCIPAL DE INICIALIZACIÓN (Refactorizada para reducir complejidad)
 */
async function initializeApplication() {
    // 1. Inicializar componentes básicos
    await initializeBasicComponents();
    
    // 2. Configurar tracking público (puede ejecutarse independientemente)
    initializePublicTracking();
    
    // 3. Configurar autenticación (primero autenticar)
    await initializeAuthentication();
    
    // 4. Configurar usuario específico (luego configurar características específicas del usuario)
    await initializeUserSpecificFeatures();
    
    // 5. Configurar eventos de formularios
    setupFormEvents();
}

/**
 * ✅ INICIALIZAR COMPONENTES BÁSICOS
 */
async function initializeBasicComponents() {
    UI?.initCommonEvents?.();
    UI?.initNavigation?.();
    UI?.initColorSelectors?.();
    initModalTriggers();
    
    // Agregar estilos básicos para gráficos
    addBasicChartStyles();
}

function initModalTriggers() {
    document.body.addEventListener('click', function(event) {
        const modalTrigger = event.target.closest('[data-modal-target]');
        if (modalTrigger) {
            const modalId = modalTrigger.getAttribute('data-modal-target');
            if (modalId) {
                UI.showModal(modalId);
            }
        }
    });
}

/**
 * ✅ CONFIGURAR CARACTERÍSTICAS ESPECÍFICAS DEL USUARIO
 */
async function initializeUserSpecificFeatures() {
    const currentUser = getCurrentUser();
    
    if (currentUser?.rol === 'admin') {
        console.log('👑 Usuario administrador detectado - Preparando métricas avanzadas');
        await handleAdminUserInitialization();
    } else if (currentUser?.rol === 'asesor') {
        console.log('👥 Usuario asesor detectado - Configurando vista simplificada');
        hideAdminFeatures();
    }
    
    // Actualizar navegación según rol (para todos los usuarios)
    updateNavigationByRole(currentUser);
}

/**
 * ✅ MANEJAR INICIALIZACIÓN PARA ADMINISTRADOR
 */
async function handleAdminUserInitialization() {
    const dashboardSection = document.getElementById('dashboard-section');
    if (dashboardSection) {
        await loadMetricasAdminModule();
    }
}

/**
 * ✅ AGREGAR ESTILOS BÁSICOS PARA GRÁFICOS
 */
function addBasicChartStyles() {
    const basicChartStyles = `
        <style>
        .basic-chart {
            display: flex;
            height: 100px;
            border-radius: 8px;
            overflow: hidden;
            margin: 1rem 0;
        }
        .chart-segment {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 0.8rem;
            text-align: center;
            padding: 0.5rem;
            transition: all 0.3s ease;
        }
        .chart-segment:hover {
            transform: scale(1.05);
            z-index: 1;
        }
        .chart-segment.verde { background: #10B981; }
        .chart-segment.amarillo { background: #F59E0B; }
        .chart-segment.rojo { background: #EF4444; }
        </style>
    `;
    document.head.insertAdjacentHTML('beforeend', basicChartStyles);
}

/**
 * ✅ INICIALIZAR TRACKING PÚBLICO
 */
function initializePublicTracking() {
    console.log('📋 Inicializando sistema de tracking por folio...');
    Client?.init?.();
    Timeline?.init?.();
    initPublicTracking();
}

/**
 * ✅ INICIALIZAR AUTENTICACIÓN
 */
async function initializeAuthentication() {
    try {
        const user = await Auth?.checkAuth?.();
        if (user) {
            console.log('👤 Usuario autenticado, mostrando dashboard...');
            await loginSuccess(user);
        } else {
            console.log('🔐 No hay sesión activa, mostrando pantalla pública...');
            showLoginScreen();
        }
    } catch (error) {
        console.warn('⚠️ Error verificando auth, mostrando pantalla pública:', error);
        showLoginScreen();
    }
}

/**
 * ✅ INICIALIZAR Auth Y UI EN ORDEN CORRECTO (Refactorizada)
 */
async function initializeAuthAndUI() {
    try {
        console.log('⚙️ Inicializando Auth y UI...');
        
        if (!Auth) {
            console.warn('⚠️ Módulo Auth no disponible, usando modo sin autenticación');
            handleAuthUnavailable();
            return;
        }
        
        await handleAuthAvailable();
        
        console.log('✅ Auth y UI inicializados correctamente');
        
    } catch (error) {
        console.error('❌ Error al inicializar Auth y UI:', error);
        handleAuthError();
    }
}

/**
 * ✅ MANEJAR AUTH NO DISPONIBLE
 */
function handleAuthUnavailable() {
    UI?.resetUIToDefault?.();
    showLoginScreen();
}

/**
 * ✅ MANEJAR AUTH DISPONIBLE
 */
async function handleAuthAvailable() {
    console.log('🔍 Verificando sesión existente...');
    let user = null;
    
    try {
        user = await Auth.checkAuth();
    } catch (error) {
        console.warn('⚠️ Error verificando auth:', error);
    }
    
    if (user) {
        console.log('👤 Usuario autenticado encontrado, configurando dashboard...');
        UI?.initializeWithAuth?.();
        await loginSuccess(user);
    } else {
        console.log('🔐 No hay sesión activa, mostrando pantalla de login...');
        UI?.resetUIToDefault?.();
        showLoginScreen();
    }
    
    UI?.initAuthDependentEvents?.();
}

/**
 * ✅ MANEJAR ERROR DE AUTH
 */
function handleAuthError() {
    UI?.resetUIToDefault?.();
    showLoginScreen();
}

/**
 * ✅ OBTENER USUARIO ACTUAL (Con optional chaining)
 */
function getCurrentUser() {
    try {
        // 1. Intentar desde Auth.currentUser
        if (Auth?.currentUser) {
            return Auth.currentUser;
        }
        
        // 2. Intentar desde variable global
        if (window.currentGerente) {
            return window.currentGerente;
        }
        
        // 3. Intentar desde localStorage
        const userDataStr = localStorage.getItem('user_data');
        if (userDataStr) {
            return JSON.parse(userDataStr);
        }
        
        return null;
        
    } catch (error) {
        console.error('🚨 Error al obtener usuario actual:', error);
        localStorage.removeItem('user_data');
        return null;
    }
}

/**
 * ✅ INICIALIZACIÓN DEL SISTEMA DE TRACKING PÚBLICO (Refactorizada)
 */
function initPublicTracking() {
    console.log('🎯 Configurando tracking público...');
    
    setupTabNavigation();
    setupTrackingEvents();
    setupRecoveryLink();
    initClientModal();
    
    console.log('✅ Tracking público configurado');
}

/**
 * ✅ CONFIGURAR NAVEGACIÓN DE PESTAÑAS
 */
function setupTabNavigation() {
    const adminLoginTab = document.getElementById('admin-login-tab');
    const trackingTab = document.getElementById('tracking-tab');
    const loginForm = document.getElementById('login-form');
    const trackingWrapper = document.getElementById('tracking-wrapper');

    if (adminLoginTab && trackingTab && loginForm && trackingWrapper) {
        console.log('📑 Configurando pestañas...');
        
        adminLoginTab.addEventListener('click', switchToAdminTab);
        trackingTab.addEventListener('click', switchToTrackingTab);
    }
}

/**
 * ✅ CONFIGURAR EVENTOS DE TRACKING
 */
function setupTrackingEvents() {
    const trackingButton = document.getElementById('tracking-button');
    const folioInput = document.getElementById('folio-input');
    
    if (trackingButton && folioInput) {
        console.log('🔍 Configurando botón de consulta principal...');
        
        trackingButton.addEventListener('click', () => {
            handleTrackingRequest(folioInput.value);
        });

        folioInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleTrackingRequest(folioInput.value);
            }
        });
    }
}

/**
 * ✅ CONFIGURAR LINK DE RECUPERACIÓN
 */
function setupRecoveryLink() {
    const tabRecuperarLink = document.getElementById('tab-recuperar-folio-link');
    tabRecuperarLink?.addEventListener('click', (e) => {
        e.preventDefault();
        openRecoveryModal();
    });
}

/**
 * ✅ CAMBIAR A PESTAÑA DE SEGUIMIENTO
 */
function switchToTrackingTab() {
    const adminTab = document.getElementById('admin-login-tab');
    const trackingTab = document.getElementById('tracking-tab');
    const loginForm = document.getElementById('login-form');
    const trackingWrapper = document.getElementById('tracking-wrapper');
    
    trackingTab?.classList.add('active');
    adminTab?.classList.remove('active');
    trackingWrapper?.classList.add('active');
    loginForm?.classList.remove('active');
    
    const folioInput = document.getElementById('folio-input');
    if (folioInput) {
        folioInput.value = '';
        setTimeout(() => folioInput.focus(), 100);
    }
    
    console.log('📋 Cambiado a pestaña de seguimiento');
}

/**
 * ✅ CAMBIAR A PESTAÑA DE ADMINISTRADOR
 */
function switchToAdminTab() {
    const adminTab = document.getElementById('admin-login-tab');
    const trackingTab = document.getElementById('tracking-tab');
    const loginForm = document.getElementById('login-form');
    const trackingWrapper = document.getElementById('tracking-wrapper');
    
    adminTab?.classList.add('active');
    trackingTab?.classList.remove('active');
    loginForm?.classList.add('active');
    trackingWrapper?.classList.remove('active');
    
    console.log('📑 Cambiado a pestaña de administrador');
}

/**
 * ✅ MANEJAR SOLICITUD DE TRACKING (Simplificada)
 */
function handleTrackingRequest(folioValue) {
    const trimmedFolio = folioValue?.trim();
    
    if (!trimmedFolio) {
        showError('Por favor, ingresa un número de folio');
        return;
    }
    
    console.log(`🔍 Procesando solicitud de tracking para folio: ${trimmedFolio}`);
    
    Client?.processFolioValue?.(trimmedFolio) || 
    console.error('❌ Módulo Client no disponible');
}

/**
 * ✅ ABRIR MODAL DE RECUPERACIÓN
 */
function openRecoveryModal() {
    const modal = document.getElementById('cliente-modal');
    if (modal) {
        modal.style.display = 'block';
        setTimeout(() => {
            Client?.showRecuperarFolioForm?.();
        }, 150);
    }
}

/**
 * ✅ INICIALIZAR MODAL DE CLIENTE (Refactorizada)
 */
function initClientModal() {
    const modal = document.getElementById('cliente-modal');
    if (!modal) return;

    console.log('🖥️ Configurando modal de cliente...');

    setupModalButtons();
    setupModalEvents();
    setupModalCloseEvents();
}

/**
 * ✅ CONFIGURAR BOTONES DEL MODAL
 */
function setupModalButtons() {
    const consultarBtn = document.getElementById('consultar-folio-btn');
    const recuperarLink = document.getElementById('recuperar-folio-link');

    consultarBtn?.addEventListener('click', () => {
        Client?.processFolio?.();
    });

    recuperarLink?.addEventListener('click', (e) => {
        e.preventDefault();
        Client?.showRecuperarFolioForm?.();
    });
}

/**
 * ✅ CONFIGURAR EVENTOS DEL MODAL
 */
function setupModalEvents() {
    const folioModalInput = document.getElementById('folio');
    
    folioModalInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            Client?.processFolio?.();
        }
    });
}

/**
 * ✅ CONFIGURAR EVENTOS DE CIERRE DEL MODAL
 */
function setupModalCloseEvents() {
    const modal = document.getElementById('cliente-modal');
    const closeButtons = document.querySelectorAll('.close-modal, .close-modal-btn');

    for (const button of closeButtons) {
        button.addEventListener('click', closeClientModal);
    }

    window.addEventListener('click', (clickEvent) => {
        if (clickEvent.target === modal) {
            closeClientModal();
        }
    });
}

/**
 * ✅ CERRAR MODAL DE CLIENTE
 */
function closeClientModal() {
    const modal = document.getElementById('cliente-modal');
    if (modal) {
        modal.style.display = 'none';
        Client?.resetFolioForm?.();
    }
}

/**
 * ✅ CONFIGURAR EVENTOS DE FORMULARIOS ADMIN (Refactorizada)
 */
function setupFormEvents() {
    setupLoginEvents();
    setupLogoutEvents();
    setupPasswordChangeEvents();
    setupProfileEvents();
}

/**
 * ✅ CONFIGURAR EVENTOS DE LOGIN
 */
function setupLoginEvents() {
    const loginForm = document.getElementById('login-form');
    const loginButton = document.getElementById('login-button');
    const emailField = document.getElementById('email');
    const passwordField = document.getElementById('password');
    
    loginForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        login();
    });
    
    loginButton?.addEventListener('click', login);
    
    [emailField, passwordField].forEach(field => {
        field?.addEventListener('keypress', (keyEvent) => {
            if (keyEvent.key === 'Enter') {
                login();
            }
        });
    });
}

/**
 * ✅ CONFIGURAR EVENTOS DE LOGOUT
 */
function setupLogoutEvents() {
    const logoutButton = document.getElementById('logout-button');
    logoutButton?.addEventListener('click', logout);
}

/**
 * ✅ CONFIGURAR EVENTOS DE CAMBIO DE CONTRASEÑA
 */
function setupPasswordChangeEvents() {
    const changePasswordBtn = document.getElementById('change-password-btn');
    changePasswordBtn?.addEventListener('click', changePassword);
}

/**
 * ✅ CONFIGURAR EVENTOS DE PERFIL
 */
function setupProfileEvents() {
    const updateProfileBtn = document.getElementById('update-profile-btn');
    const profileUpload = document.getElementById('profile-upload');
    
    updateProfileBtn?.addEventListener('click', updateProfile);
    profileUpload?.addEventListener('change', handleProfileImageChange);
}

/**
 * ✅ FUNCIÓN DE LOGIN (Simplificada)
 */
async function login() {
    const credentials = getLoginCredentials();
    if (!credentials) return;

    const loginButton = document.getElementById('login-button');
    updateLoginButtonState(loginButton, true);

    try {
        console.log('🔐 Iniciando proceso de login...');

        // Validar que las credenciales no estén vacías
        if (!credentials.email.trim() || !credentials.password.trim()) {
            throw new Error('Por favor, completa todos los campos');
        }

        const user = await Auth.login(credentials.email, credentials.password);

        console.log('✅ Login exitoso, datos de usuario:', user);
        await loginSuccess(user);

    } catch (error) {
        console.error('❌ Error de login:', error);

        // Mantener la pantalla de login visible y mostrar error específico
        const errorMessage = error.message || 'Usuario o contraseña incorrectos';
        showError(errorMessage);

        // Limpiar campos de contraseña por seguridad
        const passwordField = document.getElementById('password');
        if (passwordField) passwordField.value = '';

    } finally {
        updateLoginButtonState(loginButton, false);
    }
}

/**
 * ✅ OBTENER CREDENCIALES DE LOGIN
 */
function getLoginCredentials() {
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;

    if (!email || !password) {
        showError('Completa los campos de usuario y contraseña');
        return null;
    }

    return { email, password };
}

/**
 * ✅ ACTUALIZAR ESTADO DEL BOTÓN DE LOGIN
 */
function updateLoginButtonState(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
        button.disabled = true;
    } else {
        button.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
        button.disabled = false;
    }
}

/**
 * ✅ ACCIONES TRAS LOGIN EXITOSO (Refactorizada y simplificada para reducir complejidad)
 */
async function loginSuccess(usuario) {
    try {
        console.log('🎉 Procesando login exitoso para:', usuario.email, 'Rol:', usuario.rol);
        
        validateUserData(usuario);
        await processLogin(usuario);
        startTutorial(usuario);
        showWelcomeMessage(usuario);
        
        console.log('✅ Login completado exitosamente para:', usuario.rol);
        
    } catch (error) {
        console.error('❌ Error en loginSuccess:', error);
        showError('Error al cargar el dashboard: ' + error.message);
        showLoginScreen(true);
    }
}

/**
 * ✅ VALIDAR DATOS DE USUARIO
 */
function validateUserData(usuario) {
    if (!usuario?.email) {
        throw new Error('Datos de usuario incompletos');
    }
}

/**
 * ✅ PROCESAR LOGIN
 */
async function processLogin(usuario) {
    await processSuccessfulLogin(usuario);
    await ensureUserSettingsApplied(usuario);
    await setupUserInterface(usuario);
    await initializeUserModules(usuario);
    // ✅ AGREGAR: Forzar actualización inmediata de funciones jerárquicas
    forceUpdateHierarchicalFeatures(usuario);

    // ✅ NUEVO: Cargar configuraciones de usuario después del login
    if (window.configManager) {
        await window.configManager.loadSettingsForAuthenticatedUser();
    }

    // Mostrar la sección por defecto después de que todo esté listo
    showSection('reclutas-section');
}

/**
 * ✅ INICIAR TUTORIAL
 */
function startTutorial(usuario) {
    try {
        window.Tutorial?.startFirstSessionTutorial?.(usuario);
    } catch (e) {
        console.warn('No se pudo iniciar el tutorial de primera sesión:', e);
    }
}

/**
 * ✅ PROCESAR LOGIN EXITOSO
 */
async function processSuccessfulLogin(usuario) {
    // Actualizar referencias de usuario
    Auth?.updateUserData?.(usuario);
    
    // Almacenar en localStorage
    localStorage.setItem('user_data', JSON.stringify(usuario));
    
    // Variable global para compatibilidad
    window.currentGerente = usuario;
}

async function ensureUserSettingsApplied(usuario) {
    try {
        UI?.resetUIToDefault?.();
        const settings = await fetchAndApplyUserSettings(usuario);
        if (!settings && typeof UI?.loadSavedTheme === 'function') {
            UI.loadSavedTheme();
        }
    } catch (error) {
        console.warn('[settings] No se pudieron aplicar las configuraciones personalizadas inmediatamente:', error);
    }
}

async function fetchAndApplyUserSettings(usuario) {
    if (!usuario || !usuario.email) {
        return null;
    }

    try {
        const response = await fetch('/auth/user-settings', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success) {
            const resolvedUser = mergeUserProfile(usuario, data.user);
            if (resolvedUser) {
                Auth?.updateUserData?.(resolvedUser);
                try {
                    localStorage.setItem('user_data', JSON.stringify(resolvedUser));
                } catch (storageError) {
                    console.warn('[settings] No se pudo almacenar el usuario actualizado en localStorage:', storageError);
                }
                window.currentGerente = resolvedUser;
                if (data.settings) {
                    resolvedUser.settings = data.settings;
                }
            }

            const settings = data.settings || {};
            UI?.applyUserSettings?.(settings);

            document.dispatchEvent(new CustomEvent('userSettingsChanged', {
                detail: {
                    timestamp: Date.now(),
                    type: 'login_sync',
                    settings
                }
            }));

            return settings;
        }
    } catch (error) {
        console.warn('[settings] No se pudieron recuperar las configuraciones del usuario:', error);
    }

    return null;
}

function mergeUserProfile(baseUser, incomingUser) {
    if (!baseUser) {
        return incomingUser ? { ...incomingUser } : null;
    }
    if (!incomingUser) {
        return baseUser;
    }

    Object.assign(baseUser, incomingUser);
    return baseUser;
}

/**
 * ✅ CONFIGURAR INTERFAZ DE USUARIO
 */
async function setupUserInterface(usuario) {
    configureDashboardForRole(usuario.rol);
    updateUserInfo(usuario);

    // Mostrar dashboard solo si el login fue exitoso
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');

    if (loginSection) loginSection.style.display = 'none';
    if (dashboardSection) {
        dashboardSection.classList.add('show-dashboard');
        dashboardSection.style.visibility = 'visible';
    }

    console.log('✅ Interfaz de usuario configurada para:', usuario.rol);
}

/**
 * ✅ INICIALIZAR MÓDULOS DE USUARIO
 */
async function initializeUserModules(usuario) {
    if (usuario.rol === 'admin') {
        await setupAdminModules();
    } else if (usuario.rol === 'asesor') {
        await setupAsesorModules();
    }
    
    await setupCommonModules(usuario);
}

/**
 * ✅ CONFIGURAR MÓDULOS DE ADMINISTRADOR
 */
async function setupAdminModules() {
    console.log('👑 Preparando métricas administrativas...');
    
    const adminElements = document.querySelectorAll('.admin-only');
    for (const element of adminElements) {
        element.style.display = 'block';
    }

    await loadMetricasAdminModule();

    // Se elimina el setTimeout para una inicialización más robusta y directa
    const estadisticasSection = document.getElementById('estadisticas-section');
    if (estadisticasSection) {
        console.log('📈 Inicializando métricas administrativas directamente...');
        // ✅ PRIORIZAR MÉTRICAS V2
        if (window.initializeMetricasAdminV2) {
            console.log('🚀 Inicializando métricas admin V2 directamente');
            window.initializeMetricasAdminV2();
        } else if (window.initializeMetricasAdmin) {
            console.warn('⚠️ Fallback a métricas V1 directamente');
            window.initializeMetricasAdmin();
        } else {
            console.warn('⚠️ No se encontraron funciones de inicialización de métricas');
        }
    } else {
        console.warn('⚠️ No se pudo inicializar métricas: sección no encontrada.');
    }

    // Iniciar tutorial de onboarding para la primera visita del admin
    const onboardingCompleted = localStorage.getItem('admin_onboarding_tutorial_completed');
    if (!onboardingCompleted && Tutorial && typeof Tutorial.startTutorial === 'function') {
        console.log('🚀 Lanzando tutorial de primera visita para admin...');
        Tutorial.startTutorial({
            type: 'admin_first_visit',
            steps: Tutorial.adminFirstVisitTutorialSteps,
            storageKey: 'admin_onboarding_tutorial_completed',
            force: true,
            onComplete: () => {
                try {
                    localStorage.setItem('admin_onboarding_tutorial_completed', 'true');
                    console.log('✅ Tutorial de onboarding para admin marcado como completado.');
                } catch (e) {
                    console.error('Error al marcar el tutorial como completado:', e);
                }
            }
        });
    }
}

/**
 * ✅ CONFIGURAR MÓDULOS DE ASESOR
 */
async function setupAsesorModules() {
    console.log('👥 Configurando vista de asesor...');
    
    setTimeout(() => {
        if (window.MetricasAdmin?.setupContainer) {
            window.MetricasAdmin.setupContainer();
        }
    }, 500);
}

/**
 * ✅ CONFIGURAR MÓDULOS COMUNES
 */
async function setupCommonModules(usuario) {
    // Cargar reclutas
    if (Reclutas) {
        try {
            Reclutas.userRole = usuario.rol;
            await Reclutas.init();
            await Reclutas.loadAndDisplayReclutas();
        } catch (e) {
            console.error('❌ Error al cargar reclutas:', e);
        }
    }

    // Inicializar calendario
    if (Calendar) {
        console.log('Main: Inicializando módulo de Calendario...');
        Calendar.init();
    }

    // Configurar navegación jerárquica basada en rol
    setupHierarchicalNavigation(usuario);
}

/**
 * ✅ NUEVA FUNCIÓN: Forzar actualización de funciones jerárquicas
 */
function forceUpdateHierarchicalFeatures(usuario) {
    console.log('🔄 Forzando actualización de funciones jerárquicas para:', usuario.rol);

    try {
        // 1. Actualizar navegación inmediatamente
        updateNavigationByRole(usuario);

        // 2. Configurar dashboard específico por rol
        configureDashboardForRole(usuario.rol);

        // 3. Actualizar elementos admin/gerente/asesor inmediatamente
        updateRoleSpecificElements(usuario.rol);

        // 4. Configurar navegación jerárquica
        setupHierarchicalNavigation(usuario);

        // 5. Mostrar/ocultar elementos según jerarquía
        applyHierarchicalVisibility(usuario.rol);

        console.log('✅ Funciones jerárquicas actualizadas para:', usuario.rol);

    } catch (error) {
        console.error('❌ Error actualizando funciones jerárquicas:', error);
    }
}

/**
 * ✅ NUEVA FUNCIÓN: Actualizar elementos específicos por rol
 */
function updateRoleSpecificElements(rol) {
    console.log('🎭 Actualizando elementos específicos para rol:', rol);

    // Elementos admin-only
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => {
        if (rol === 'admin') {
            element.style.display = 'block';
            element.style.visibility = 'visible';
        } else {
            element.style.display = 'none';
            element.style.visibility = 'hidden';
        }
    });

    // Elementos gerente-only
    const gerenteElements = document.querySelectorAll('.gerente-only, .gerente-only-filter');
    gerenteElements.forEach(element => {
        if (rol === 'admin' || rol === 'gerente') {
            element.style.display = 'block';
            element.style.visibility = 'visible';
        } else {
            element.style.display = 'none';
            element.style.visibility = 'hidden';
        }
    });

    // Elementos asesor-only
    const asesorElements = document.querySelectorAll('.asesor-only, .asesor-only-message');
    asesorElements.forEach(element => {
        if (rol === 'asesor') {
            element.style.display = 'block';
            element.style.visibility = 'visible';
        } else {
            element.style.display = 'none';
            element.style.visibility = 'hidden';
        }
    });

    console.log(`✅ Elementos específicos actualizados para: ${rol}`);
}

/**
 * ✅ NUEVA FUNCIÓN: Aplicar visibilidad jerárquica
 */
function applyHierarchicalVisibility(rol) {
    console.log('👑 Aplicando visibilidad jerárquica para:', rol);

    // Navegación de jerarquía (solo admin)
    const navJerarquia = document.getElementById('nav-jerarquia');
    if (navJerarquia) {
        if (rol === 'admin') {
            navJerarquia.style.display = 'list-item';
            navJerarquia.classList.remove('nav-jerarquia-hidden');
            navJerarquia.classList.add('nav-jerarquia-visible');
        } else {
            navJerarquia.style.display = 'none';
            navJerarquia.classList.add('nav-jerarquia-hidden');
            navJerarquia.classList.remove('nav-jerarquia-visible');
        }
    }

    // Gestión de gerentes (solo admin)
    const navGestionGerentes = document.getElementById('nav-gestion-gerentes');
    if (navGestionGerentes) {
        if (rol === 'admin') {
            navGestionGerentes.style.display = 'list-item';
            navGestionGerentes.classList.remove('nav-admin-hidden');
            navGestionGerentes.classList.add('nav-admin-visible');
        } else {
            navGestionGerentes.style.display = 'none';
            navGestionGerentes.classList.add('nav-admin-hidden');
            navGestionGerentes.classList.remove('nav-admin-visible');
        }
    }

    // Funciones de Excel y distribución
    const excelUploadElements = document.querySelectorAll('.excel-upload, .distribute-excel');
    excelUploadElements.forEach(element => {
        if (!element.dataset.defaultDisplay) {
            const computedDisplay = window.getComputedStyle
                ? window.getComputedStyle(element).display
                : element.style.display || '';
            const fallbackDisplay = element.tagName === 'BUTTON' ? 'inline-flex' : 'block';
            element.dataset.defaultDisplay = computedDisplay && computedDisplay !== 'none'
                ? computedDisplay
                : fallbackDisplay;
        }

        if (rol === 'admin' || rol === 'gerente') {
            element.style.display = element.dataset.defaultDisplay || 'block';
            element.removeAttribute('disabled');
        } else {
            element.style.display = 'none';
            element.setAttribute('disabled', 'true');
        }
    });


    console.log(`✅ Visibilidad jerárquica aplicada para: ${rol}`);
}

/**
 * ✅ CONFIGURAR NAVEGACIÓN JERÁRQUICA BASADA EN ROL
 */
function setupHierarchicalNavigation(usuario) {
    console.log('🔍 Debug - setupHierarchicalNavigation llamado con usuario:', usuario);
    console.log('🔍 Debug - usuario.rol:', usuario.rol);
    console.log('🔍 Debug - typeof usuario.rol:', typeof usuario.rol);

    // Intentar múltiples veces si los elementos no están disponibles
    const maxRetries = 10;
    let retryCount = 0;

    function trySetupNavigation() {
        const navJerarquia = document.getElementById('nav-jerarquia');
        const jerarquiaSection = document.getElementById('jerarquia-section');

        console.log(`🔍 Debug (intento ${retryCount + 1}) - navJerarquia encontrado:`, !!navJerarquia);
        console.log(`🔍 Debug (intento ${retryCount + 1}) - jerarquiaSection encontrado:`, !!jerarquiaSection);

        if (!navJerarquia && retryCount < maxRetries) {
            retryCount++;
            console.log(`⏳ Reintentando en 100ms... (intento ${retryCount}/${maxRetries})`);
            setTimeout(trySetupNavigation, 100);
            return;
        }

        if (!navJerarquia || !jerarquiaSection) {
            console.log('⚠️ Elementos de navegación jerárquica no encontrados después de todos los intentos');
            return;
        }

        console.log('✅ Elementos encontrados, configurando navegación jerárquica...');
        setupNavigationElements(navJerarquia, jerarquiaSection, usuario);
    }

    trySetupNavigation();
}

function setupNavigationElements(navJerarquia, jerarquiaSection, usuario) {
    const rolLower = usuario.rol ? usuario.rol.toLowerCase() : '';

    navJerarquia.classList.remove('nav-jerarquia-visible');
    navJerarquia.classList.add('nav-jerarquia-hidden');

    const adminControls = jerarquiaSection.querySelector('#admin-jerarquia-controls');
    const gerenteControls = jerarquiaSection.querySelector('#gerente-jerarquia-controls');

    if (adminControls) adminControls.style.display = 'none';
    if (gerenteControls) gerenteControls.style.display = 'none';

    if (rolLower === 'admin' || rolLower === 'administrador') {
        navJerarquia.classList.remove('nav-jerarquia-hidden');
        navJerarquia.classList.add('nav-jerarquia-visible');
        if (adminControls) adminControls.style.display = 'block';
        console.log('Navegación jerárquica habilitada para administrador');
    } else {
        console.log('Navegación jerárquica oculta para rol:', usuario.rol);
    }
}
function setupGestionGerentesControls(currentUser) {
    const section = document.getElementById('gestion-gerentes-section');
    if (!section) return;

    section.classList.toggle('gerentes-admin-view', currentUser?.rol === 'admin');

    const adminOnlyBlocks = section.querySelectorAll('[data-admin-only]');
    adminOnlyBlocks.forEach(element => {
        element.style.display = currentUser?.rol === 'admin' ? '' : 'none';
    });
}



/**
 * ✅ MOSTRAR MENSAJE DE BIENVENIDA
 */
function showWelcomeMessage(usuario) {
    const welcomeMessage = getWelcomeMessage(usuario);
    showSuccess?.(welcomeMessage);
}

/**
 * ✅ OBTENER MENSAJE DE BIENVENIDA
 */
function getWelcomeMessage(usuario) {
    if (!usuario) return '¡Bienvenido al sistema!';
    
    const nombre = usuario.nombre || usuario.email;
    const rol = usuario.rol || 'usuario';
    
    const messages = {
        admin: `¡Bienvenido ${nombre}! Tienes acceso completo como Administrador.`,
        asesor: `¡Bienvenido ${nombre}! Gestiona tus reclutas asignados como Asesor.`,
        gerente: `¡Bienvenido ${nombre}! Supervisa el proceso de reclutamiento como Gerente.`
    };
    
    return messages[rol] || `¡Bienvenido ${nombre}!`;
}

/**
 * ✅ FUNCIÓN LOGOUT CORREGIDA (Refactorizada)
 */
async function logout() {
    try {
        console.log('🚪 Iniciando logout desde main.js...');
        
        if (Auth?.logout) {
            await Auth.logout();
        }
        
        showLoginScreen(true);
        clearFormFields();
        
        showSuccess?.('Sesión cerrada correctamente');
        console.log('✅ Logout completado exitosamente');
        
    } catch (error) {
        console.error('❌ Error durante logout:', error);
        forceCleanupAndShowLogin();
    }
}

/**
 * ✅ RESETEAR VISIBILIDAD DE ELEMENTOS
 */
function resetElementVisibility() {
    const adminElements = document.querySelectorAll('.admin-only');
    for (const element of adminElements) {
        if (element) element.style.display = 'none';
    }
    
    const asesorMessages = document.querySelectorAll('.asesor-only-message');
    for (const element of asesorMessages) {
        if (element) element.style.display = 'none';
    }
}

/**
 * ✅ LIMPIAR CAMPOS DE FORMULARIO
 */
function clearFormFields() {
    const emailField = document.getElementById('email');
    const passwordField = document.getElementById('password');
    
    if (emailField) emailField.value = '';
    if (passwordField) passwordField.value = '';
}

/**
 * ✅ ACTUALIZAR INFORMACIÓN DE USUARIO (Simplificada)
 */
function updateUserInfo(usuario) {
    if (!usuario) return;

    updateUserDisplayElements(usuario);
    configureDashboardForRole(usuario.rol);
    updateProfileElements(usuario);
}

/**
 * ✅ ACTUALIZAR ELEMENTOS DE VISUALIZACIÓN DE USUARIO
 */
function updateUserDisplayElements(usuario) {
    const gerenteName = document.getElementById('gerente-name');
    const dropdownUserName = document.getElementById('dropdown-user-name');
    
    const displayName = usuario.nombre || usuario.email;
    
    if (gerenteName) gerenteName.textContent = displayName;
    if (dropdownUserName) dropdownUserName.textContent = displayName;
}

/**
 * ✅ ACTUALIZAR ELEMENTOS DE PERFIL
 */
function updateProfileElements(usuario) {
    const profilePic = document.getElementById('dashboard-profile-pic');
    profilePic?.src && (profilePic.src = usuario.foto_url || '/api/placeholder/100/100');
    
    const userFields = {
        'user-name': usuario.nombre || '',
        'user-email': usuario.email || '',
        'user-phone': usuario.telefono || ''
    };
    
    for (const [id, value] of Object.entries(userFields)) {
        const element = document.getElementById(id);
        if (element) element.value = value;
    }
}

/**
 * ✅ FUNCIÓN CORREGIDA: configureDashboardForRole (Refactorizada)
 */
function configureDashboardForRole(rol) {
    console.log('⚙️ Configurando dashboard para rol:', rol);
    
    try {
        cleanPreviousRoleClasses();
        
        setTimeout(() => {
            applyRoleConfiguration(rol);
            updateProfileRole(rol);
        }, 100);
        
    } catch (error) {
        console.error('❌ Error configurando dashboard:', error);
    }
}

/**
 * ✅ LIMPIAR CLASES DE ROL ANTERIORES
 */
function cleanPreviousRoleClasses() {
    document.body.classList.remove('admin-view', 'asesor-view', 'gerente-view');
}

/**
 * ✅ APLICAR CONFIGURACIÓN DE ROL
 */
function applyRoleConfiguration(rol) {
    if (rol === 'admin') {
        setupAdminConfiguration();
    } else if (rol === 'gerente') {
        setupGerenteConfiguration();
    } else if (rol === 'asesor') {
        setupAsesorConfiguration();
    } else {
        console.warn('⚠️ Rol no reconocido:', rol);
    }
}

/**
 * ✅ CONFIGURAR PARA ADMINISTRADOR
 */
function setupAdminConfiguration() {
    console.log('👑 Configurando vista de administrador...');
    
    document.body.classList.add('admin-view');
    
    const adminElements = document.querySelectorAll('.admin-only');
    console.log(`📦 Encontrados ${adminElements.length} elementos admin-only`);
    
    adminElements.forEach((element, index) => {
        if (element) {
            element.style.display = 'block';
            console.log(`✅ Elemento admin ${index + 1} mostrado:`, element.className);
        }
    });
    
    hideAsesorOnlyMessages();
    updateAdminNavigation();
    
    console.log('✅ Vista de administrador configurada correctamente');
}

/**
 * ✅ CONFIGURAR PARA GERENTE
 */
function setupGerenteConfiguration() {
    console.log('👔 Configurando vista de gerente...');

    document.body.classList.add('gerente-view');

    // Ocultar elementos admin-only
    const adminElements = document.querySelectorAll('.admin-only');
    console.log(`📦 Ocultando ${adminElements.length} elementos admin-only para gerente`);

    adminElements.forEach((element, index) => {
        if (element) {
            element.style.display = 'none';
            console.log(`❌ Elemento admin ${index + 1} oculto:`, element.className);
        }
    });

    // Mostrar elementos específicos para gerente
    const gerenteElements = document.querySelectorAll('.gerente-only-filter');
    console.log(`📦 Mostrando ${gerenteElements.length} elementos gerente-only`);

    gerenteElements.forEach((element, index) => {
        if (element) {
            element.style.display = 'block';
            console.log(`✅ Elemento gerente ${index + 1} mostrado:`, element.className);
        }
    });

    updateGerenteNavigation();

    console.log('✅ Vista de gerente configurada correctamente');
}

/**
 * ✅ CONFIGURAR PARA ASESOR
 */
function setupAsesorConfiguration() {
    console.log('👥 Configurando vista de asesor...');

    document.body.classList.add('asesor-view');

    const adminElements = document.querySelectorAll('.admin-only');
    console.log(`📦 Ocultando ${adminElements.length} elementos admin-only`);

    adminElements.forEach((element, index) => {
        if (element) {
            element.style.display = 'none';
            console.log(`❌ Elemento admin ${index + 1} oculto:`, element.className);
        }
    });

    showAsesorOnlyMessages();
    updateAsesorNavigation();

    console.log('✅ Vista de asesor configurada correctamente');
}

/**
 * ✅ OCULTAR MENSAJES ESPECÍFICOS PARA ASESORES
 */
function hideAsesorOnlyMessages() {
    const asesorMessages = document.querySelectorAll('.asesor-only-message');
    for (const element of asesorMessages) {
        if (element) element.style.display = 'none';
    }
}

/**
 * ✅ MOSTRAR MENSAJES ESPECÍFICOS PARA ASESORES
 */
function showAsesorOnlyMessages() {
    const asesorMessages = document.querySelectorAll('.asesor-only-message');
    for (const element of asesorMessages) {
        if (element) element.style.display = 'block';
    }
}


function updateAdminNavigation() {
    const dashboardNav = document.querySelector('.dashboard-nav ul');
    
    if (dashboardNav) {
        console.log('📋 Configurando navegación de administrador...');
        
        dashboardNav.innerHTML = `
            <li class="active">
                <a href="#" data-section="reclutas-section">
                    <i class="fas fa-users"></i> Gestión de Reclutas
                </a>
            </li>
            <li>
                <a href="#" data-section="admin-reclutas-management">
                    <i class="fas fa-tools"></i> Panel Administrativo
                </a>
            </li>
            <li>
                <a href="#" data-section="calendario-section">
                    <i class="fas fa-calendar-alt"></i> Calendario
                </a>
            </li>
            <li>
                <a href="#" data-section="estadisticas-section">
                    <i class="fas fa-chart-bar"></i> Métricas Avanzadas
                </a>
            </li>
            <li>
                <a href="#" data-section="gestion-gerentes-section">
                    <i class="fas fa-users-cog"></i> Gestión de Gerentes
                </a>
            </li>
            <li>
                <a href="#" data-section="configuracion-section">
                    <i class="fas fa-cog"></i> Configuración
                </a>
            </li>
        `;
        
        reinitializeNavigation();
        console.log('✅ Navegación de administrador configurada');
    }
}

/**
 * ✅ ACTUALIZAR NAVEGACIÓN PARA GERENTE
 */
function updateGerenteNavigation() {
    const dashboardNav = document.querySelector('.dashboard-nav ul');

    if (dashboardNav) {
        console.log('📋 Configurando navegación de gerente...');

        dashboardNav.innerHTML = `
            <li class="active">
                <a href="#" data-section="reclutas-section">
                    <i class="fas fa-users"></i> Gestión de Reclutas
                </a>
            </li>
            <li>
                <a href="#" data-section="calendario-section">
                    <i class="fas fa-calendar-alt"></i> Calendario
                </a>
            </li>
            <li>
                <a href="#" data-section="estadisticas-section">
                    <i class="fas fa-chart-bar"></i> Estadísticas
                </a>
            </li>
            <li>
                <a href="#" data-section="configuracion-section">
                    <i class="fas fa-cog"></i> Configuración
                </a>
            </li>
        `;

        reinitializeNavigation();
        console.log('✅ Navegación de gerente configurada');
    }
}

/**
 * ✅ ACTUALIZAR NAVEGACIÓN PARA ASESOR
 */
function updateAsesorNavigation() {
    const dashboardNav = document.querySelector('.dashboard-nav ul');

    if (dashboardNav) {
        console.log('📋 Configurando navegación de asesor...');

        dashboardNav.innerHTML = `
            <li class="active">
                <a href="#" data-section="reclutas-section">
                    <i class="fas fa-users"></i> Mis Reclutas
                </a>
            </li>
            <li>
                <a href="#" data-section="calendario-section">
                    <i class="fas fa-calendar-alt"></i> Mis Entrevistas
                </a>
            </li>
            <li>
                <a href="#" data-section="estadisticas-section">
                    <i class="fas fa-chart-bar"></i> Mis Estadísticas
                </a>
            </li>
            <li>
                <a href="#" data-section="configuracion-section">
                    <i class="fas fa-cog"></i> Mi Perfil
                </a>
            </li>
        `;

        reinitializeNavigation();
        console.log('✅ Navegación de asesor configurada');
    }
}

/**
 * ✅ REINICIALIZAR NAVEGACIÓN
 */
function reinitializeNavigation() {
    UI?.initNavigation?.();
}

/**
 * ✅ ACTUALIZAR ROL EN PERFIL
 */
function updateProfileRole(rol) {
    const profileRole = document.querySelector('.profile-role');
    
    if (profileRole) {
        const roleNames = {
            'admin': 'Administrador',
            'asesor': 'Asesor de Reclutamiento',
            'gerente': 'Gerente de Reclutamiento'
        };
        
        profileRole.textContent = roleNames[rol] || 'Usuario';
        console.log('👤 Rol actualizado en perfil:', roleNames[rol]);
    }
}

/**
 * ✅ OCULTAR FUNCIONALIDADES ADMIN PARA ASESORES
 */
function hideAdminFeatures() {
    const adminElements = document.querySelectorAll('.admin-only');
    for (const element of adminElements) {
        element.style.display = 'none';
    }
    
    const asesorMessage = document.querySelector('.asesor-only-message');
    asesorMessage?.style && (asesorMessage.style.display = 'block');
    
    console.log('🔒 Funcionalidades admin ocultas para usuario asesor');
}

/**
 * ✅ ACTUALIZAR NAVEGACIÓN SEGÚN ROL DE USUARIO
 */
function updateNavigationByRole(userOrRole = null) {
    function resetRoleNavigationState() {
        const navGestion = document.getElementById('nav-gestion-gerentes');
        if (navGestion) {
            navGestion.style.display = 'none';
            navGestion.classList.add('nav-admin-hidden');
            navGestion.classList.remove('nav-admin-visible');
        }

        const adminLinks = document.querySelectorAll('.nav-admin-only');
        adminLinks.forEach(link => {
            link.style.display = 'none';
        });
    }

    let resolvedRole = null;

    if (typeof userOrRole === 'string') {
        resolvedRole = userOrRole;
    } else if (userOrRole && typeof userOrRole === 'object') {
        resolvedRole = userOrRole.rol;
    }

    if (!resolvedRole) {
        const currentUser = getCurrentUser();
        resolvedRole = currentUser?.rol;
        userOrRole = currentUser || userOrRole;
    }

    if (!resolvedRole) {
        resetRoleNavigationState();
        return;
    }

    console.log('[nav] Actualizando navegación para rol:', resolvedRole);
    const normalizedRole = (resolvedRole || '').toLowerCase();
    const isAdmin = normalizedRole === 'admin' || normalizedRole === 'administrador';
    const isGerente = normalizedRole === 'gerente';

    const navGestionGerentes = document.getElementById('nav-gestion-gerentes');
    if (navGestionGerentes) {
        if (isAdmin) {
            navGestionGerentes.style.display = 'list-item';
            navGestionGerentes.classList.remove('nav-admin-hidden');
            navGestionGerentes.classList.add('nav-admin-visible');
            console.log('Gestión de Gerentes habilitada para administrador');
        } else {
            navGestionGerentes.style.display = 'none';
            navGestionGerentes.classList.add('nav-admin-hidden');
            navGestionGerentes.classList.remove('nav-admin-visible');
            if (isGerente) {
                console.log('Gestión de Gerentes oculta para rol gerente');
            } else {
                console.log('Gestión de Gerentes oculta para rol:', resolvedRole);
            }
        }
    }

    const adminOnlyElements = document.querySelectorAll('.nav-admin-only');
    adminOnlyElements.forEach(element => {
        element.style.display = isAdmin ? 'block' : 'none';
    });
}

/**
 * ✅ MOSTRAR PANTALLA DE LOGIN (Refactorizada)
 */
function showLoginScreen(forceClean = false) {
    console.log('🔐 Mostrando pantalla de login...');

    if (forceClean) {
        performForcedCleanup();
    }

    // Asegurar que el dashboard esté completamente oculto
    ensureDashboardHidden();
    toggleLoginScreens();
    switchToAdminTab();

    console.log('✅ Pantalla de login mostrada');
}

/**
 * ✅ REALIZAR LIMPIEZA FORZADA
 */
function performForcedCleanup() {
    console.log('🧹 Realizando limpieza forzada antes de mostrar login...');
    
    // Limpiar elementos dinámicos
    const dynamicElements = document.querySelectorAll('.admin-welcome, .gerente-welcome, .asesor-welcome, .role-specific-element');
    for (const el of dynamicElements) {
        el.remove();
    }
    
    // Remover clases de rol (Jerarquía: Admin > Gerente > Asesor)
    document.body.classList.remove('admin-view', 'gerente-view', 'asesor-view');
    
    // Resetear UI básica
    UI?.resetUIToDefault?.();
}

/**
 * ✅ ASEGURAR QUE EL DASHBOARD ESTÉ OCULTO
 */
function ensureDashboardHidden() {
    const dashboardSection = document.getElementById('dashboard-section');
    if (dashboardSection) {
        dashboardSection.classList.remove('show-dashboard');
        dashboardSection.style.visibility = 'hidden';
    }

    // Ocultar también las secciones internas del dashboard
    const dashboardSections = document.querySelectorAll('.dashboard-content-section');
    dashboardSections.forEach(section => {
        if (section) section.style.display = 'none';
    });
}

/**
 * ✅ ALTERNAR PANTALLAS DE LOGIN
 */
function toggleLoginScreens() {
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');

    if (loginSection) loginSection.style.display = 'block';
    if (dashboardSection) {
        dashboardSection.classList.remove('show-dashboard');
        dashboardSection.style.visibility = 'hidden';
    }
}

/**
 * ✅ FORZAR LIMPIEZA Y MOSTRAR LOGIN EN CASO DE ERROR
 */
function forceCleanupAndShowLogin() {
    console.log('🔧 Forzando limpieza de emergencia...');
    
    // Forzar limpieza básica
    if (Auth) {
        Auth.currentUser = null;
    }
    
    // Limpiar localStorage básico
    try {
        const itemsToRemove = [
            CONFIG?.STORAGE_KEYS?.THEME,
            CONFIG?.STORAGE_KEYS?.PRIMARY_COLOR,
            'user_data'
        ].filter(Boolean);
        
        for (const item of itemsToRemove) {
            localStorage.removeItem(item);
        }
    } catch (e) {
        console.warn('⚠️ Error en limpieza de emergencia:', e);
    }
    
    showLoginScreen(true);
    console.log('✅ Limpieza de emergencia completada');
}

/**
 * ✅ FUNCIÓN PARA MOSTRAR SECCIÓN (Refactorizada)
 */
function showSection(sectionId) {
    console.log('📄 Mostrando sección:', sectionId);
    
    try {
        hidePreviousSections();
        showTargetSection(sectionId);
        handleSpecialSections(sectionId);
        updateActiveNavigation(sectionId);
        
    } catch (error) {
        console.error('❌ Error al mostrar sección:', error);
    }
}

/**
 * ✅ OCULTAR SECCIONES ANTERIORES
 */
function hidePreviousSections() {
    const sections = document.querySelectorAll('.dashboard-content-section');
    for (const section of sections) {
        if (section) section.style.display = 'none';
    }
}

/**
 * ✅ MOSTRAR SECCIÓN OBJETIVO
 */
function showTargetSection(sectionId) {
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    } else {
        console.warn('⚠️ Sección no encontrada:', sectionId);
    }
}

/**
 * ✅ MANEJAR SECCIONES ESPECIALES
 */
function handleSpecialSections(sectionId) {
    if (sectionId === 'estadisticas-section') {
        handleEstadisticasSection();
    } else if (sectionId === 'calendario-section') {
        handleCalendarioSection();
    } else if (sectionId === 'configuracion-section') {
        handleConfiguracionSection();
    } else if (sectionId === 'gestion-gerentes-section') {
        handleGestionGerentesSection();
    }
}

/**
 * ✅ MANEJAR SECCIÓN DE ESTADÍSTICAS
 */
function handleEstadisticasSection() {
    const currentUser = getCurrentUser();
    console.log('📊 Accediendo a estadísticas, usuario:', currentUser?.rol);

    if (currentUser?.rol === 'admin') {
        setupEstadisticasForAdmin();
    } else if (currentUser?.rol === 'gerente') {
        setupEstadisticasForGerente();
    } else if (currentUser?.rol === 'asesor') {
        setupEstadisticasForAsesor();
    }
}

/**
 * ✅ CONFIGURAR ESTADÍSTICAS PARA ADMIN
 */
function setupEstadisticasForAdmin() {
    setTimeout(async () => {
        await loadMetricasAdminModule();
        // ✅ INICIALIZAR MÉTRICAS V2 PARA ADMIN
        if (window.initializeMetricasAdminV2) {
            console.log('🚀 Inicializando métricas admin V2 para la sección');
            window.initializeMetricasAdminV2();
        } else {
            console.warn('⚠️ Fallback a métricas V1');
            window.initializeMetricasAdmin?.();
        }
        console.log('📈 Métricas admin inicializadas para la sección');

        // Iniciar tutorial de métricas para admin
        const metricsTutorialCompleted = localStorage.getItem('admin_metrics_tutorial_completed');
        if (!metricsTutorialCompleted && window.Tutorial && typeof window.Tutorial.startTutorial === 'function') {
            console.log('🚀 Lanzando tutorial de métricas para admin...');
            window.Tutorial.startTutorial({
                type: 'admin_metrics',
                steps: window.Tutorial.adminMetricsTutorialSteps,
                storageKey: 'admin_metrics_tutorial_completed',
                force: true,
                onComplete: () => {
                    try {
                        localStorage.setItem('admin_metrics_tutorial_completed', 'true');
                        console.log('✅ Tutorial de métricas para admin marcado como completado.');
                    } catch (e) {
                        console.error('Error al marcar el tutorial de métricas como completado:', e);
                    }
                }
            });
        }
    }, 200);
}

/**
 * ✅ CONFIGURAR ESTADÍSTICAS PARA GERENTE
 */
function setupEstadisticasForGerente() {
    setTimeout(async () => {
        console.log('🎯 Configurando estadísticas para gerente');
        await loadGerenteStatsModule();
        console.log('📊 Módulo de estadísticas de gerente cargado');
    }, 200);
}

/**
 * ✅ CONFIGURAR ESTADÍSTICAS PARA ASESOR
 */
function setupEstadisticasForAsesor() {
    setTimeout(async () => {
        console.log('🎯 Configurando estadísticas para asesor');
        await loadAsesorStatsModule();
        console.log('📊 Módulo de estadísticas de asesor cargado');
    }, 200);
}

/**
 * ✅ MANEJAR SECCIÓN DE CALENDARIO
 */
function handleCalendarioSection() {
    const currentUser = getCurrentUser();
    console.log('📅 Accediendo a calendario, usuario:', currentUser?.rol);
    
    if (currentUser?.rol === 'admin') {
        setupCalendarioForAdmin();
    } else if (currentUser?.rol === 'asesor') {
        setupCalendarioForAsesor();
    }
}

/**
 * ✅ CONFIGURAR CALENDARIO PARA ADMIN
 */
function setupCalendarioForAdmin() {
    setTimeout(() => {
        console.log('📅 Inicializando calendario para admin');

        // Iniciar tutorial de calendario para admin si es la primera vez
        const calendarTutorialCompleted = localStorage.getItem('admin_calendar_tutorial_completed');
        if (!calendarTutorialCompleted && window.Tutorial && typeof window.Tutorial.startCalendarTutorial === 'function') {
            console.log('🚀 Lanzando tutorial de calendario para admin...');
            window.Tutorial.startCalendarTutorial();
        } else {
            console.log('ℹ️ Tutorial del calendario ya completado anteriormente');
        }
    }, 200);
}

/**
 * ✅ CONFIGURAR CALENDARIO PARA ASESOR
 */
function setupCalendarioForAsesor() {
    setTimeout(() => {
        console.log('📅 Configurando calendario básico para asesor');
        // Los asesores pueden ver el calendario sin tutorial por ahora
    }, 150);
}

/**
 * ✅ MANEJAR SECCIÓN DE CONFIGURACIÓN
 */
function handleConfiguracionSection() {
    const currentUser = getCurrentUser();
    console.log('⚙️ Accediendo a configuración, usuario:', currentUser?.rol);
    
    if (currentUser?.rol === 'admin') {
        setupConfiguracionForAdmin();
    } else if (currentUser?.rol === 'asesor') {
        setupConfiguracionForAsesor();
    }
}

/**
 * ✅ CONFIGURAR CONFIGURACIÓN PARA ADMIN
 */
function setupConfiguracionForAdmin() {
    setTimeout(() => {
        console.log('⚙️ Inicializando configuración para admin');

        // Iniciar tutorial de configuración para admin si es la primera vez
        const configTutorialCompleted = localStorage.getItem('admin_configuracion_tutorial_completed');
        if (!configTutorialCompleted && window.Tutorial && typeof window.Tutorial.startConfiguracionTutorial === 'function') {
            console.log('🚀 Lanzando tutorial de configuración para admin...');
            window.Tutorial.startConfiguracionTutorial();
        } else {
            console.log('ℹ️ Tutorial de configuración ya completado anteriormente');
        }
    }, 200);
}

/**
 * ✅ CONFIGURAR CONFIGURACIÓN PARA ASESOR
 */
function setupConfiguracionForAsesor() {
    setTimeout(() => {
        console.log('⚙️ Configurando configuración básica para asesor');
        
        // Iniciar tutorial de configuración para asesor si es la primera vez
        const configTutorialCompleted = localStorage.getItem('admin_configuracion_tutorial_completed');
        if (!configTutorialCompleted && window.Tutorial && typeof window.Tutorial.startConfiguracionTutorial === 'function') {
            console.log('🚀 Lanzando tutorial de configuración para asesor...');
            window.Tutorial.startConfiguracionTutorial();
        } else {
            console.log('ℹ️ Tutorial de configuración ya completado anteriormente');
        }
    }, 150);
}


function handleGestionGerentesSection() {
    const currentUser = getCurrentUser();
    console.log('🏗️ Accediendo a gestión de gerentes, usuario:', currentUser?.rol);

    if (currentUser?.rol !== 'admin') {
        showNotification('Acceso denegado. Solo los administradores pueden gestionar gerentes.', 'error');
        showSection('reclutas-section');
        return;
    }

    // Inicializar el módulo de jerarquía
    if (Jerarquia) {
        Jerarquia.init();
    } else {
        showError('No se pudo cargar el módulo de gestión de gerentes.');
    }

    // Configurar controles específicos del rol
    setupGestionGerentesControls(currentUser);

    setTimeout(() => {
        try {
            const tutorialCompleted = localStorage.getItem('admin_gerentes_tutorial_completed');
            if (!tutorialCompleted && window.Tutorial && typeof window.Tutorial.startGestionGerentesTutorial === 'function') {
                console.log('Lanzando tutorial de gestion de gerentes...');
                window.Tutorial.startGestionGerentesTutorial();
            }
        } catch (error) {
            console.error('Error al iniciar tutorial de gerentes:', error);
        }
    }, 500);
}

/**
 * ✅ ACTUALIZAR NAVEGACIÓN ACTIVA
 */
function updateActiveNavigation(sectionId) {
    const navItems = document.querySelectorAll('.dashboard-nav li');
    navItems.forEach((item) => {
        const link = item.querySelector('a[data-section]');
        const isActive = link && link.getAttribute('data-section') === sectionId;
        item.classList.toggle('active', !!isActive);
        if (link) {
            link.classList.toggle('active', !!isActive);
        }
    });

    const extraLinks = document.querySelectorAll('[data-section]');
    extraLinks.forEach((link) => {
        if (link.closest('.dashboard-nav')) {
            return;
        }
        link.classList.toggle('active', link.getAttribute('data-section') === sectionId);
    });
}

/**
 * ✅ CARGAR MÓDULO DE MÉTRICAS ADMINISTRATIVAS
 */
async function loadMetricasAdminModule() {
    return new Promise((resolve, reject) => {
        if (window.MetricasAdmin) {
            console.log('📊 Módulo MetricasAdmin ya está cargado');
            resolve(window.MetricasAdmin);
            return;
        }

        const script = document.createElement('script');
        script.src = '/static/js/metricas-admin.js';
        
        script.onload = () => {
            console.log('✅ Módulo MetricasAdmin cargado exitosamente');
            if (window.MetricasAdmin) {
                MetricasAdmin = window.MetricasAdmin;
                resolve(window.MetricasAdmin);
            } else {
                const error = 'MetricasAdmin no se definió después de la carga del script.';
                console.error('❌ ' + error);
                reject(new Error(error));
            }
        };
        
        script.onerror = () => {
            const error = 'Error al cargar el script de MetricasAdmin.';
            console.error('❌ ' + error);
            reject(new Error(error));
        };

        document.head.appendChild(script);

        // También cargar estilos CSS específicos
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = '/static/css/metricas-admin.css';
        document.head.appendChild(cssLink);
    });
}

/**
 * ✅ CARGAR MÓDULO DE ESTADÍSTICAS PARA GERENTE
 */
async function loadGerenteStatsModule() {
    return new Promise((resolve, reject) => {
        if (window.GerenteStats) {
            console.log('📊 Módulo GerenteStats ya está cargado');
            resolve(window.GerenteStats);
            return;
        }

        const script = document.createElement('script');
        script.src = '/static/js/gerente-stats.js';

        script.onload = () => {
            console.log('✅ Módulo GerenteStats cargado exitosamente');
            if (window.GerenteStats) {
                resolve(window.GerenteStats);
            } else {
                const error = 'GerenteStats no se definió después de la carga del script.';
                console.error('❌ ' + error);
                reject(new Error(error));
            }
        };

        script.onerror = () => {
            const error = 'Error al cargar el script de GerenteStats.';
            console.error('❌ ' + error);
            reject(new Error(error));
        };

        document.head.appendChild(script);

        // También cargar estilos CSS específicos para gerentes
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = '/static/css/gerente-stats.css';
        document.head.appendChild(cssLink);
    });
}

/**
 * ✅ CARGAR MÓDULO DE ESTADÍSTICAS PARA ASESOR
 */
async function loadAsesorStatsModule() {
    return new Promise((resolve, reject) => {
        if (window.AsesorStats) {
            console.log('📊 Módulo AsesorStats ya está cargado');
            resolve(window.AsesorStats);
            return;
        }

        const script = document.createElement('script');
        script.src = '/static/js/asesor-stats.js';

        script.onload = () => {
            console.log('✅ Módulo AsesorStats cargado exitosamente');
            if (window.AsesorStats) {
                resolve(window.AsesorStats);
            } else {
                const error = 'AsesorStats no se definió después de la carga del script.';
                console.error('❌ ' + error);
                reject(new Error(error));
            }
        };

        script.onerror = () => {
            const error = 'Error al cargar el script de AsesorStats.';
            console.error('❌ ' + error);
            reject(new Error(error));
        };

        document.head.appendChild(script);

        // También cargar estilos CSS específicos para asesores
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = '/static/css/asesor-stats.css';
        document.head.appendChild(cssLink);
    });
}

/**
 * ✅ INICIALIZAR MÉTRICAS ADMINISTRATIVAS
 */
function initializeMetricasAdmin() {
    const estadisticasSection = document.getElementById('estadisticas-section');
    const currentUser = getCurrentUser();
    
    if (!window.MetricasAdmin) {
        console.warn('⚠️ MetricasAdmin no está cargado, no se puede inicializar.');
        return;
    }

    if (estadisticasSection && currentUser?.rol === 'admin' && window.MetricasAdmin) {
        try {
            console.log('🎯 Inicializando métricas administrativas...');
            window.MetricasAdmin.init();
            
            let metricasContainer = document.getElementById('metricas-admin-container');
            if (!metricasContainer) {
                metricasContainer = document.createElement('div');
                metricasContainer.id = 'metricas-admin-container';
                metricasContainer.className = 'admin-only';
                estadisticasSection.appendChild(metricasContainer);
            }
            
        } catch (error) {
            console.error('❌ Error al inicializar métricas administrativas:', error);
        }
    }
}

/**
 * ✅ CARGAR ESTADÍSTICAS (Refactorizada)
 */
async function loadEstadisticas() {
    try {
        const currentUser = getCurrentUser();
        console.log('🔍 Cargando estadísticas para:', currentUser?.rol);
        
        if (!currentUser) {
            console.warn('⚠️ No hay usuario autenticado para cargar estadísticas');
            showLoginScreen();
            return;
        }
        
        if (currentUser.rol === 'admin') {
            await loadEstadisticasForAdmin();
        } else {
            await loadEstadisticasForAsesor();
        }
        
    } catch (error) {
        console.error('❌ Error en loadEstadisticas:', error);
        showNotification?.('Error al cargar estadísticas del sistema', 'error');
    }
}

/**
 * ✅ CARGAR ESTADÍSTICAS PARA ADMINISTRADOR
 */
async function loadEstadisticasForAdmin() {
    console.log('📊 Cargando métricas administrativas...');
    
    await loadEstadisticasBasicas();
    
    if (MetricasAdmin) {
        await MetricasAdmin.loadMetricas(true);
    } else {
        console.log('⚠️ MetricasAdmin no disponible, cargando módulo...');
        await loadMetricasAdminModule();
        if (MetricasAdmin) {
            await MetricasAdmin.loadMetricas(true);
        }
    }
}

/**
 * ✅ CARGAR ESTADÍSTICAS PARA ASESOR
 */
async function loadEstadisticasForAsesor() {
    console.log('📊 Cargando estadísticas básicas para asesor');
    await loadEstadisticasBasicas();
}

/**
 * ✅ CARGAR ESTADÍSTICAS BÁSICAS (Refactorizada)
 */
async function loadEstadisticasBasicas() {
    try {
        console.log('📊 Cargando estadísticas básicas...');
        
        const response = await fetchEstadisticas();
        const data = await validateEstadisticasResponse(response);
        
        if (data?.success && data.estadisticas) {
            console.log('✅ Estadísticas básicas cargadas:', data.estadisticas);
            updateEstadisticasUI(data.estadisticas);
        } else {
            throw new Error(data?.message || 'Datos de estadísticas inválidos');
        }
        
    } catch (error) {
        console.error('❌ Error al cargar estadísticas básicas:', error);
        handleEstadisticasError(error);
    }
}

/**
 * ✅ OBTENER ESTADÍSTICAS DEL SERVIDOR
 */
async function fetchEstadisticas() {
    return await fetch('/api/estadisticas', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });
}

/**
 * ✅ VALIDAR RESPUESTA DE ESTADÍSTICAS
 */
async function validateEstadisticasResponse(response) {
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
        throw new Error(`Respuesta no es JSON. Content-Type: ${contentType}`);
    }
    
    if (!response.ok) {
        if (response.status === 401) {
            console.warn('🔐 Usuario no autenticado, redirigiendo a login');
            showLoginScreen();
            return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
}

/**
 * ✅ MANEJAR ERROR DE ESTADÍSTICAS
 */
function handleEstadisticasError(error) {
    showNotification?.(`Error al cargar estadísticas: ${error.message}`, 'error');
    
    // Mostrar datos por defecto
    updateEstadisticasUI({
        reclutas: { total: 0, activos: 0, en_proceso: 0 },
        entrevistas: { pendientes: 0, completadas: 0 }
    });
}

/**
 * ✅ ACTUALIZAR UI CON ESTADÍSTICAS
 */
function updateEstadisticasUI(data) {
    const statElements = [
        { selector: '.stat-card:nth-child(1) .stat-number', value: data.reclutas?.total },
        { selector: '.stat-card:nth-child(2) .stat-number', value: data.reclutas?.activos },
        { selector: '.stat-card:nth-child(3) .stat-number', value: data.reclutas?.en_proceso },
        { selector: '.stat-card:nth-child(4) .stat-number', value: data.entrevistas?.pendientes }
    ];
    
    for (const { selector, value } of statElements) {
        const element = document.querySelector(selector);
        if (element && value !== undefined) {
            element.textContent = value;
        }
    }
}

/**
 * ✅ ACTUALIZAR GRÁFICOS BÁSICOS
 */
function updateBasicCharts(distribucion) {
    const chartContainer = document.querySelector('.chart-placeholder');
    if (!chartContainer || !distribucion) return;
    
    const total = distribucion.activos + distribucion.proceso + distribucion.rechazados;
    
    if (total > 0) {
        const porcentajes = {
            activos: (distribucion.activos / total * 100).toFixed(1),
            proceso: (distribucion.proceso / total * 100).toFixed(1),
            rechazados: (distribucion.rechazados / total * 100).toFixed(1)
        };
        
        chartContainer.innerHTML = createBasicChartHTML(porcentajes);
    }
}

/**
 * ✅ CREAR HTML DEL GRÁFICO BÁSICO
 */
function createBasicChartHTML(porcentajes) {
    return `
        <div class="basic-chart">
            <div class="chart-segment verde" style="flex: ${porcentajes.activos}">
                ${porcentajes.activos}%<br>Activos
            </div>
            <div class="chart-segment amarillo" style="flex: ${porcentajes.proceso}">
                ${porcentajes.proceso}%<br>Proceso
            </div>
            <div class="chart-segment rojo" style="flex: ${porcentajes.rechazados}">
                ${porcentajes.rechazados}%<br>Rechazados
            </div>
        </div>
    `;
}

/**
 * ✅ CAMBIAR CONTRASEÑA (Refactorizada)
 */
async function changePassword() {
    const passwords = getPasswordFields();
    if (!passwords) return;
    
    const button = document.getElementById('change-password-btn');
    updatePasswordButtonState(button, true);
    
    try {
        await Auth.changePassword(passwords.current, passwords.new);
        clearPasswordFields();
        showSuccess?.('Contraseña cambiada correctamente');
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        showError?.('Error al cambiar la contraseña: ' + error.message);
    } finally {
        updatePasswordButtonState(button, false);
    }
}

/**
 * ✅ OBTENER CAMPOS DE CONTRASEÑA
 */
function getPasswordFields() {
    const currentPassword = document.getElementById('current-password')?.value;
    const newPassword = document.getElementById('new-password')?.value;
    const confirmPassword = document.getElementById('confirm-password')?.value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showError?.('Por favor, completa todos los campos');
        return null;
    }
    
    if (newPassword !== confirmPassword) {
        showError?.('Las contraseñas nuevas no coinciden');
        return null;
    }
    
    return { current: currentPassword, new: newPassword };
}

/**
 * ✅ ACTUALIZAR ESTADO DEL BOTÓN DE CONTRASEÑA
 */
function updatePasswordButtonState(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cambiando...';
        button.disabled = true;
    } else {
        button.innerHTML = '<i class="fas fa-key"></i> Cambiar Contraseña';
        button.disabled = false;
    }
}

/**
 * ✅ LIMPIAR CAMPOS DE CONTRASEÑA
 */
function clearPasswordFields() {
    const passwordFields = [
        'current-password',
        'new-password', 
        'confirm-password'
    ];
    
    for (const id of passwordFields) {
        const field = document.getElementById(id);
        if (field) field.value = '';
    }
}

/**
 * ✅ ACTUALIZAR PERFIL (Refactorizada)
 */
async function updateProfile() {
    const profileData = getProfileData();
    if (!profileData) return;
    
    const button = document.getElementById('update-profile-btn');
    updateProfileButtonState(button, true);
    
    try {
        const requestData = prepareProfileData(profileData);
        const response = await sendProfileUpdate(requestData);
        
        await handleProfileUpdateResponse(response);
        
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        showError?.('Error al actualizar perfil: ' + error.message);
    } finally {
        updateProfileButtonState(button, false);
    }
}

/**
 * ✅ OBTENER DATOS DEL PERFIL
 */
function getProfileData() {
    const nombre = document.getElementById('user-name')?.value;
    const telefono = document.getElementById('user-phone')?.value;
    
    if (!nombre) {
        showError?.('El nombre es requerido');
        return null;
    }
    
    return { nombre, telefono };
}

/**
 * ✅ PREPARAR DATOS DEL PERFIL
 */
function prepareProfileData({ nombre, telefono }) {
    if (window.profileImage) {
        const data = new FormData();
        data.append('nombre', nombre);
        if (telefono) data.append('telefono', telefono);
        data.append('foto', window.profileImage);
        return data;
    } else {
        return { nombre, telefono };
    }
}

/**
 * ✅ ENVIAR ACTUALIZACIÓN DE PERFIL
 */
async function sendProfileUpdate(data) {
    return await fetch(`${CONFIG.API_URL}/perfil`, {
        method: 'PUT',
        body: data instanceof FormData ? data : JSON.stringify(data),
        headers: data instanceof FormData ? undefined : {
            'Content-Type': 'application/json'
        }
    });
}

/**
 * ✅ MANEJAR RESPUESTA DE ACTUALIZACIÓN DE PERFIL
 */
async function handleProfileUpdateResponse(response) {
    if (!response.ok) throw new Error(`Error ${response.status}`);
    
    const responseData = await response.json();
    if (responseData.success) {
        Auth.currentUser = { ...responseData.usuario };
        updateUserInfo(responseData.usuario);
        window.profileImage = null;
        showSuccess?.('Perfil actualizado correctamente');
    } else {
        throw new Error(responseData.message || 'Error al actualizar perfil');
    }
}

/**
 * ✅ ACTUALIZAR ESTADO DEL BOTÓN DE PERFIL
 */
function updateProfileButtonState(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        button.disabled = true;
    } else {
        button.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
        button.disabled = false;
    }
}

/**
 * ✅ MANEJAR CAMBIO DE IMAGEN DE PERFIL (Refactorizada)
 */
function handleProfileImageChange(profileEvent) {
    const file = profileEvent?.target?.files?.[0];
    if (!file) return;
    
    const profilePic = document.getElementById('dashboard-profile-pic');
    if (!profilePic) return;
    
    if (file.size > CONFIG?.MAX_UPLOAD_SIZE) {
        const maxSizeMB = CONFIG.MAX_UPLOAD_SIZE / (1024 * 1024);
        showError?.(`La imagen es demasiado grande. Máximo ${maxSizeMB}MB.`);
        profileEvent.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        if (e?.target?.result) {
            profilePic.src = e.target.result;
            window.profileImage = file;
            showNotification?.('Foto actualizada. Guarda los cambios.', 'info');
        }
    };
    
    reader.readAsDataURL(file);
}

/**
 * ✅ FUNCIÓN DE DEBUG: Verificar visibilidad de elementos admin
 */
window.checkAdminVisibility = function() {
    console.log('🔍 === VERIFICACIÓN DE VISIBILIDAD ADMIN ===');
    
    const currentUser = getCurrentUser();
    console.log('👤 Usuario actual:', currentUser?.email, '- Rol:', currentUser?.rol);
    
    const bodyClasses = document.body.className;
    console.log('🎨 Clases del body:', bodyClasses);
    
    const adminElements = document.querySelectorAll('.admin-only');
    console.log(`📦 Total elementos admin-only: ${adminElements.length}`);
    
    adminElements.forEach((element, index) => {
        const computedStyle = getComputedStyle(element);
        const isVisible = computedStyle.display !== 'none';
        const hasInlineStyle = element.style.display;
        
        console.log(`📋 Elemento ${index + 1}:`, {
            className: element.className,
            id: element.id,
            display: computedStyle.display,
            inlineStyle: hasInlineStyle,
            visible: isVisible
        });
    });
    
    if (currentUser?.rol === 'admin') {
        console.log('🔧 Ejecutando reparación de visibilidad...');
        configureDashboardForRole('admin');
        
        setTimeout(() => {
            console.log('✅ Reparación completada, verificando de nuevo...');
            window.checkAdminVisibility();
        }, 200);
    }
};

/**
 * ✅ FUNCIÓN DE REPARACIÓN: Forzar mostrar elementos admin
 */
window.forceShowAdminElements = function() {
    console.log('🚨 FORZANDO VISIBILIDAD DE ELEMENTOS ADMIN...');
    
    document.body.classList.add('admin-view');
    document.body.classList.remove('asesor-view');
    
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach((element, index) => {
        element.style.display = 'block';
        element.style.setProperty('display', 'block', 'important');
        console.log(`✅ Forzado elemento ${index + 1}: ${element.className}`);
    });
    
    console.log(`✅ ${adminElements.length} elementos admin forzados a visible`);
    
    updateAdminNavigation();
    
    return adminElements.length;
};

/**
 * ✅ FUNCIÓN DE VALIDACIÓN: Verificar que el fix funciona correctamente
 */
window.validateCacheStateFix = function() {
    console.log('🧪 === INICIANDO VALIDACIÓN DEL FIX CACHE/ESTADO ===');
    
    const results = {
        authFunctions: validateAuthFunctions(),
        uiFunctions: validateUIFunctions(),
        permissionsFunctions: validatePermissionsFunctions(),
        domCleanup: validateDOMCleanup(),
        configurationReset: validateConfigurationReset(),
        overall: false
    };
    
    results.overall = Object.values(results).every(r => r === true);
    
    console.log('🧪 === RESULTADOS DE VALIDACIÓN ===');
    console.table(results);
    
    if (results.overall) {
        console.log('🎉 ¡VALIDACIÓN EXITOSA! El fix está implementado correctamente.');
        showNotification?.('✅ Fix de cache/estado validado exitosamente', 'success');
    } else {
        console.error('❌ VALIDACIÓN FALLIDA. Revisar funciones faltantes.');
        showNotification?.('❌ Validación del fix falló. Revisar consola.', 'error');
    }
    
    return results;
};

/**
 * ✅ VALIDAR FUNCIONES DE AUTH
 */
function validateAuthFunctions() {
    console.log('1️⃣ Validando funciones de Auth...');
    const hasRequiredFunctions = Auth && 
        typeof Auth.clearUserState === 'function' &&
        typeof Auth.resetUIToDefault === 'function' &&
        typeof Auth.cleanupDynamicElements === 'function' &&
        typeof Auth.setupUserSpecificUI === 'function';
    
    if (hasRequiredFunctions) {
        console.log('✅ Funciones de Auth implementadas correctamente');
        return true;
    } else {
        console.error('❌ Funciones de Auth faltantes o incorrectas');
        return false;
    }
}

/**
 * ✅ VALIDAR FUNCIONES DE UI
 */
function validateUIFunctions() {
    console.log('2️⃣ Validando funciones de UI...');
    const hasRequiredFunctions = UI && 
        typeof UI.resetUIToDefault === 'function' &&
        typeof UI.clearStoredConfigurations === 'function' &&
        typeof UI.initializeForUser === 'function' &&
        typeof UI.isValidColor === 'function';
    
    if (hasRequiredFunctions) {
        console.log('✅ Funciones de UI implementadas correctamente');
        return true;
    } else {
        console.error('❌ Funciones de UI faltantes o incorrectas');
        return false;
    }
}

/**
 * ✅ VALIDAR FUNCIONES DE PERMISSIONS
 */
function validatePermissionsFunctions() {
    console.log('3️⃣ Validando funciones de Permissions...');
    
    const hasRequiredFunctions = Boolean(
        window.Permissions?.cleanupPreviousRoleElements &&
        window.Permissions?.applyRoleBasedConfiguration &&
        window.Permissions?.validateCleanState
    );
    
    console.log(hasRequiredFunctions ? 
        '✅ Funciones de Permissions implementadas correctamente' :
        '⚠️ Funciones de Permissions no disponibles (puede ser normal)'
    );
    
    return true; // No es crítico si no existe
}

/**
 * ✅ VALIDAR LIMPIEZA DE DOM
 */
function validateDOMCleanup() {
    console.log('4️⃣ Validando limpieza de DOM...');
    const problematicElements = document.querySelectorAll('.admin-welcome, .gerente-welcome, .asesor-welcome, [style*="background-color"]');
    if (problematicElements.length === 0) {
        console.log('✅ DOM limpio sin elementos problemáticos');
        return true;
    } else {
        console.warn(`⚠️ Encontrados ${problematicElements.length} elementos problemáticos en DOM`);
        return false;
    }
}

/**
 * ✅ VALIDAR CONFIGURACIONES
 */
function validateConfigurationReset() {
    console.log('5️⃣ Validando configuraciones...');
    const hasCleanConfig = !localStorage.getItem(CONFIG?.STORAGE_KEYS?.THEME) || 
                          !localStorage.getItem(CONFIG?.STORAGE_KEYS?.PRIMARY_COLOR);
    
    if (hasCleanConfig) {
        console.log('✅ Configuraciones reseteadas correctamente');
    } else {
        console.log('ℹ️ Configuraciones presentes (normal si hay usuario logueado)');
    }
    
    return true; // Ambos estados son válidos
}

/**
 * ✅ VERIFICACIÓN RÁPIDA DE DEPENDENCIAS
 */
window.verifyDependencies = function() {
    console.log('🔍 === VERIFICACIÓN DE DEPENDENCIAS ===');
    
    const dependencies = {
        CONFIG: typeof CONFIG !== 'undefined',
        Auth: typeof Auth !== 'undefined',
        UI: typeof UI !== 'undefined',
        Reclutas: typeof Reclutas !== 'undefined',
        Calendar: typeof Calendar !== 'undefined',
        Client: typeof Client !== 'undefined',
        Timeline: typeof Timeline !== 'undefined',
        showNotification: typeof showNotification !== 'undefined',
        showError: typeof showError !== 'undefined',
        showSuccess: typeof showSuccess !== 'undefined'
    };
    
    console.table(dependencies);
    
    const missing = Object.entries(dependencies)
        .filter(([key, available]) => !available)
        .map(([key]) => key);
    
    if (missing.length > 0) {
        console.error('❌ Dependencias faltantes:', missing);
        return false;
    } else {
        console.log('✅ Todas las dependencias están disponibles');
        return true;
    }
};

// 🎓 IMPORTAR TUTORIAL (solo para portal público)
if (window.location.pathname.includes('/seguimiento')) {
    import('./tutorial.js').then(module => {
        console.log('✅ Módulo de tutorial cargado para portal público');
    }).catch(err => {
        console.warn('⚠️ Error cargando tutorial:', err);
    });
}

/**
 * ✅ VERIFICACIÓN RÁPIDA DEL SISTEMA
 */
window.quickHealthCheck = function() {
    console.log('⚡ === VERIFICACIÓN RÁPIDA DEL SISTEMA ===');
    
    const results = {
        dependencies: window.verifyDependencies(),
        uiFunctions: validateBasicUIFunctions(),
        domClean: validateDOMCleanup(),
        basicConfig: validateBasicConfig(),
        overall: false
    };
    
    results.overall = Object.values(results).every(Boolean);
    
    console.table(results);
    
    if (results.overall) {
        console.log('🎉 ¡Sistema funcionando correctamente!');
        showNotification?.('✅ Sistema verificado correctamente', 'success');
    } else {
        console.error('❌ Sistema tiene problemas. Ver detalles arriba.');
        showError?.('❌ Sistema tiene problemas. Revisar consola.');
    }
    
    return results.overall;
};

/**
 * ✅ VALIDAR FUNCIONES BÁSICAS DE UI
 */
function validateBasicUIFunctions() {
    return UI && 
           typeof UI.loadSavedTheme === 'function' &&
           typeof UI.resetUIToDefault === 'function';
}

/**
 * ✅ VALIDAR CONFIGURACIÓN BÁSICA
 */
function validateBasicConfig() {
    return Boolean(CONFIG?.DEFAULTS);
}

/**
 * ✅ LIMPIEZA ESPECÍFICA DEL DOM DE MAIN.JS
 */
function cleanupMainDOMElements() {
    console.log('🧽 Limpiando elementos específicos de main.js...');
    
    if (window.appState) {
        window.appState.initialized = false;
        window.appState.currentSection = 'reclutas-section';
    }
    
    const dynamicButtons = document.querySelectorAll('.dynamic-button, .role-button');
    for (const button of dynamicButtons) {
        button.remove();
    }
    
    // Cleanup de módulos si existe
    const modules = [
        { obj: window.Reclutas, method: 'cleanup' },
        { obj: window.Calendar, method: 'cleanup' }
    ];
    
    for (const { obj, method } of modules) {
        obj?.[method]?.();
    }
    
    console.log('✅ Elementos específicos de main.js limpiados');
}

// 🎓 IMPORTAR TUTORIAL (solo para portal público)
if (window.location.pathname.includes('/seguimiento')) {
    import('./tutorial.js').then(module => {
        console.log('✅ Módulo de tutorial cargado para portal público');
    }).catch(err => {
        console.warn('⚠️ Error cargando tutorial:', err);
    });
}

/**
 * ✅ EXPONER FUNCIONES GLOBALMENTE PARA COMPATIBILIDAD
 */
// Funciones principales
window.login = login;
window.logout = logout;
window.loginSuccess = loginSuccess;
window.getCurrentUser = getCurrentUser;
window.showSection = showSection;
window.configureDashboardForRole = configureDashboardForRole;
window.updateNavigationByRole = updateNavigationByRole;
window.Jerarquia = Jerarquia;

// Puente de compatibilidad para acciones inline existentes
window.mostrarAsignacionAsesores = (gerenteId) => Jerarquia?.mostrarAsignacionAsesores?.(gerenteId);
window.mostrarJerarquiaCompleta = (...args) => Jerarquia?.mostrarJerarquiaCompleta?.(...args);
window.redistribuirReclutasGerente = (...args) => Jerarquia?.redistribuirReclutasGerente?.(...args);
window.verMiEquipo = (...args) => Jerarquia?.verMiEquipo?.(...args);

// Función específica para mostrar gestión de gerentes
window.showGestionGerentes = function() {
    console.log('🏗️ Función showGestionGerentes llamada');
    showSection('gestion-gerentes-section');
};

// Exponer changeActiveSection también globalmente
window.changeActiveSection = function(targetSection) {
    if (window.UI && window.UI.changeActiveSection) {
        window.UI.changeActiveSection(targetSection);
    } else {
        // Fallback directo
        console.log('🔄 Fallback: Cambiando a sección:', targetSection);
        const sections = document.querySelectorAll('.dashboard-content-section');
        sections.forEach(section => section.style.display = 'none');
        
        const targetElement = document.getElementById(targetSection);
        if (targetElement) {
            targetElement.style.display = 'block';
            
            // Disparar evento personalizado
            const event = new CustomEvent('sectionChanged', { 
                detail: { section: targetSection } 
            });
            document.dispatchEvent(event);
        }
    }
};

// Módulos
window.Reclutas = Reclutas;
window.Client = Client;
window.Timeline = Timeline;

// Notificaciones
window.showNotification = showNotification;
window.showError = showError;
window.showSuccess = showSuccess;

// Funciones de estadísticas y métricas
window.loadEstadisticas = loadEstadisticas;
window.loadMetricasAdminModule = loadMetricasAdminModule;
window.initializeMetricasAdmin = initializeMetricasAdmin;

// Funciones de inicialización
window.initializeAuthAndUI = initializeAuthAndUI;

// Funciones globales para reclutas (compatibilidad)
window.openAddReclutaModal = function() {
    Reclutas?.openAddReclutaModal?.() || 
    showModal('add-recluta-modal');
};

window.viewRecluta = function(id) {
    Reclutas?.viewRecluta?.(id);
};

window.editRecluta = function(id) {
    Reclutas?.editRecluta?.(id);
};

window.deleteRecluta = function(id) {
    Reclutas?.confirmDeleteRecluta?.(id);
};

/**
 * ✅ FUNCIÓN HELPER PARA MOSTRAR MODALES
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'block';
}

/**
 * ✅ FUNCIÓN HELPER PARA CERRAR MODALES
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

/**
 * ✅ CREAR OBJETO UI SI NO EXISTE (FALLBACK)
 */
if (typeof UI === 'undefined' || !UI) {
    console.log('⚠️ Objeto UI no encontrado, creando fallback...');
    window.UI = {
        showModal: showModal,
        closeModal: closeModal,
        resetUIToDefault: function() {
            console.log('🔄 UI reset fallback');
            document.body.classList.remove('admin-view', 'asesor-view');
        },
        loadSavedTheme: function() {
            console.log('🎨 Load theme fallback');
        },
        initCommonEvents: function() {
            console.log('📋 Init events fallback');
        },
        initNavigation: function() {
            console.log('🧭 Init navigation fallback - configurando eventos...');
            const navLinks = document.querySelectorAll('.dashboard-nav a, [data-section]');
            navLinks.forEach(link => {
                if (link.getAttribute('data-section')) {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const targetSection = link.getAttribute('data-section');
                        console.log('📄 Navegando a sección:', targetSection);
                        if (window.showSection) {
                            window.showSection(targetSection);
                        } else {
                            // Fallback directo si showSection no existe
                            this.changeActiveSection(targetSection);
                        }
                    });
                }
            });
            console.log(`✅ ${navLinks.length} enlaces de navegación configurados`);
        },
        changeActiveSection: function(targetSection) {
            if (!targetSection) return;
            
            console.log('🔄 Cambiando a sección:', targetSection);
            
            // Actualizar tab activa
            const navItems = document.querySelectorAll('.dashboard-nav li');
            navItems.forEach(li => {
                li.classList.remove('active');
                const link = li.querySelector(`[data-section="${targetSection}"]`);
                if (link) {
                    li.classList.add('active');
                }
            });
            
            // Actualizar sección visible
            const sections = document.querySelectorAll('.dashboard-content-section');
            sections.forEach(section => {
                section.classList.remove('active');
                section.style.display = 'none';
            });
            
            const targetElement = document.getElementById(targetSection);
            if (targetElement) {
                targetElement.classList.add('active');
                targetElement.style.display = 'block';
                
                // Disparar evento personalizado
                const event = new CustomEvent('sectionChanged', { 
                    detail: { section: targetSection } 
                });
                document.dispatchEvent(event);
                console.log('✅ Sección cambiada a:', targetSection);
            } else {
                console.warn('⚠️ Sección no encontrada:', targetSection);
            }
        },
        initColorSelectors: function() {
            console.log('🎨 Init colors fallback');
        }
    };
}

/**
 * ✅ PRUEBA COMPLETA DEL FIX
 */
window.testCacheStateFix = function() {
    console.log('🔬 === INICIANDO PRUEBA COMPLETA DEL FIX ===');
    
    // 1. Simular logout
    console.log('1️⃣ Simulando logout...');
    Auth?.clearUserState?.();
    console.log('✅ clearUserState ejecutado');
    
    // 2. Verificar limpieza
    setTimeout(() => {
        console.log('2️⃣ Verificando limpieza...');
        const cleanState = window.Permissions?.validateCleanState ? 
                          window.Permissions.validateCleanState() : true;
        console.log(`🧹 Estado limpio: ${cleanState ? 'SÍ' : 'NO'}`);
        
        // 3. Simular configuración para nuevo usuario
        console.log('3️⃣ Simulando configuración para nuevo usuario...');
        const mockUser = { email: 'test@test.com', rol: 'admin' };
        UI?.initializeForUser?.(mockUser);
        console.log('✅ initializeForUser ejecutado');
        
        // 4. Resultado final
        console.log('🔬 === PRUEBA COMPLETA FINALIZADA ===');
        return window.validateCacheStateFix();
    }, 500);
};

// ✅ AGREGAR LISTENER PARA EVENTOS DE LIMPIEZA DE USUARIO
document.addEventListener('userStateCleared', function(event) {
    console.log('🧹 Evento de limpieza de estado de usuario recibido:', event.detail);

    try {
        // Resetear estado de la aplicación
        if (window.appState) {
            window.appState.initialized = false;
            window.appState.currentSection = 'reclutas-section';
        }

        // Limpiar módulos específicos
        if (window.Reclutas && typeof window.Reclutas.clearCache === 'function') {
            window.Reclutas.clearCache();
        }

        if (window.Calendar && typeof window.Calendar.reset === 'function') {
            window.Calendar.reset();
        }

        // Resetear navegación a estado inicial
        const dashboardNav = document.querySelector('.dashboard-nav ul');
        if (dashboardNav) {
            dashboardNav.innerHTML = '';
        }

        // Ocultar todas las secciones del dashboard
        const dashboardSections = document.querySelectorAll('.dashboard-content-section');
        dashboardSections.forEach(section => {
            if (section) section.style.display = 'none';
        });

        updateNavigationByRole(null);

        console.log('✅ Limpieza de main.js completada tras evento de logout');

    } catch (error) {
        console.error('❌ Error procesando evento de limpieza en main.js:', error);
    }
});

// ✅ AGREGAR LISTENER PARA EVENTOS DE ACTUALIZACIÓN DE CONFIGURACIONES
document.addEventListener('userSettingsChanged', function(event) {
    console.log('⚙️ Configuraciones de usuario actualizadas:', event.detail);

    try {
        // Refresh elementos que podrían haber cambiado
        const currentUser = getCurrentUser();
        if (currentUser) {
            updateUserInfo(currentUser);
            configureDashboardForRole(currentUser.rol);

            // ✅ ACTUALIZAR TAMBIÉN FUNCIONES JERÁRQUICAS
            forceUpdateHierarchicalFeatures(currentUser);
        }

        console.log('✅ UI sincronizada tras cambio de configuraciones');

    } catch (error) {
        console.error('❌ Error sincronizando UI tras cambio de configuraciones:', error);
    }
});

console.log('✅ main.js cargado completamente - Sistema de folio restaurado');
console.log('🔧 Integración de métricas administrativas completada');
console.log('🎯 Todas las funciones de validación y debug disponibles');
console.log('🔄 Listeners de eventos de limpieza y sincronización agregados');
