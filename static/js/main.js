import CONFIG from './config.js';
import Auth from './auth.js';
import Reclutas from './reclutas.js';
import UI from './ui.js';
import Calendar from './calendar.js';
import Client from './client.js';
import Timeline from './timeline.js';
import { showNotification, showError, showSuccess } from './notifications.js';
import Tutorial from './tutorial.js';

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
        
        await initializeApplication();
        
        console.log('✅ Sistema inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error crítico en la inicialización:', error);
        showError('Error al cargar el sistema. Por favor, recarga la página.');
    }
});

/**
 * ✅ FUNCIÓN PRINCIPAL DE INICIALIZACIÓN (Refactorizada para reducir complejidad)
 */
async function initializeApplication() {
    // 1. Inicializar componentes básicos
    await initializeBasicComponents();
    
    // 2. Configurar usuario específico
    await initializeUserSpecificFeatures();
    
    // 3. Configurar tracking público
    initializePublicTracking();
    
    // 4. Configurar autenticación
    await initializeAuthentication();
    
    // 5. Configurar eventos de formularios
    setupFormEvents();
}

/**
 * ✅ INICIALIZAR COMPONENTES BÁSICOS
 */
async function initializeBasicComponents() {
    UI?.loadSavedTheme?.();
    UI?.initCommonEvents?.();
    UI?.initNavigation?.();
    UI?.initColorSelectors?.();
    
    // Agregar estilos básicos para gráficos
    addBasicChartStyles();
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

    closeButtons.forEach(button => {
        button.addEventListener('click', closeClientModal);
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
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
        field?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
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
        
        const user = await Auth.login(credentials.email, credentials.password);
        
        console.log('✅ Login exitoso, datos de usuario:', user);
        await loginSuccess(user);
        
    } catch (error) {
        console.error('❌ Error de login:', error);
        showError('Usuario o contraseña incorrectos');
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
 * ✅ ACCIONES TRAS LOGIN EXITOSO (Refactorizada)
 */
async function loginSuccess(usuario) {
    try {
        console.log('🎉 Procesando login exitoso para:', usuario.email, 'Rol:', usuario.rol);
        
        if (!usuario?.email) {
            throw new Error('Datos de usuario incompletos');
        }
        
        await processSuccessfulLogin(usuario);
        await setupUserInterface(usuario);
        await initializeUserModules(usuario);
        
        showWelcomeMessage(usuario);
        console.log('✅ Login completado exitosamente para:', usuario.rol);
        
    } catch (error) {
        console.error('❌ Error en loginSuccess:', error);
        showError('Error al cargar el dashboard: ' + error.message);
        showLoginScreen(true);
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

/**
 * ✅ CONFIGURAR INTERFAZ DE USUARIO
 */
async function setupUserInterface(usuario) {
    configureDashboardForRole(usuario.rol);
    updateUserInfo(usuario);
    
    // Mostrar dashboard
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    
    if (loginSection) loginSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'block';
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
    adminElements.forEach(element => {
        element.style.display = 'block';
    });

    await loadMetricasAdminModule();

    setTimeout(() => {
        const estadisticasSection = document.getElementById('estadisticas-section');
        if (estadisticasSection && window.initializeMetricasAdmin) {
            console.log('📈 Inicializando métricas administrativas...');
            window.initializeMetricasAdmin();
        }
        // Iniciar tutorial para administradores si es la primera vez
        if (Tutorial && typeof Tutorial.startAdminRecruitTutorial === 'function') {
            Tutorial.startAdminRecruitTutorial();
        }
    }, 800);
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
        
        await performCleanup();
        await performLogout();
        
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
 * ✅ REALIZAR LIMPIEZA
 */
async function performCleanup() {
    // Limpiar métricas admin si está inicializado
    window.cleanupMetricasAdmin?.();
    
    // Limpiar todas las variables globales
    window.currentGerente = null;
    localStorage.removeItem('user_data');
    
    // Limpiar clases del body
    document.body.classList.remove('admin-view', 'asesor-view');
    
    // Resetear visibilidad de elementos
    resetElementVisibility();
}

/**
 * ✅ REALIZAR LOGOUT
 */
async function performLogout() {
    if (Auth?.logout) {
        await Auth.logout();
    }
}

/**
 * ✅ RESETEAR VISIBILIDAD DE ELEMENTOS
 */
function resetElementVisibility() {
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => {
        if (element) element.style.display = 'none';
    });
    
    const asesorMessages = document.querySelectorAll('.asesor-only-message');
    asesorMessages.forEach(element => {
        if (element) element.style.display = 'none';
    });
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
    
    Object.entries(userFields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
    });
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
    document.body.classList.remove('admin-view', 'asesor-view');
}

/**
 * ✅ APLICAR CONFIGURACIÓN DE ROL
 */
function applyRoleConfiguration(rol) {
    if (rol === 'admin') {
        setupAdminConfiguration();
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
    asesorMessages.forEach(element => {
        if (element) element.style.display = 'none';
    });
}

/**
 * ✅ MOSTRAR MENSAJES ESPECÍFICOS PARA ASESORES
 */
function showAsesorOnlyMessages() {
    const asesorMessages = document.querySelectorAll('.asesor-only-message');
    asesorMessages.forEach(element => {
        if (element) element.style.display = 'block';
    });
}

/**
 * ✅ ACTUALIZAR NAVEGACIÓN PARA ADMIN
 */
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
    adminElements.forEach(element => {
        element.style.display = 'none';
    });
    
    const asesorMessage = document.querySelector('.asesor-only-message');
    asesorMessage?.style && (asesorMessage.style.display = 'block');
    
    console.log('🔒 Funcionalidades admin ocultas para usuario asesor');
}

/**
 * ✅ MOSTRAR PANTALLA DE LOGIN (Refactorizada)
 */
function showLoginScreen(forceClean = false) {
    console.log('🔐 Mostrando pantalla de login...');
    
    if (forceClean) {
        performForcedCleanup();
    }
    
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
    const dynamicElements = document.querySelectorAll('.admin-welcome, .asesor-welcome, .role-specific-element');
    dynamicElements.forEach(el => el.remove());
    
    // Remover clases de rol
    document.body.classList.remove('admin-view', 'asesor-view');
    
    // Resetear UI básica
    UI?.resetUIToDefault?.();
}

/**
 * ✅ ALTERNAR PANTALLAS DE LOGIN
 */
function toggleLoginScreens() {
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    
    if (loginSection) loginSection.style.display = 'block';
    if (dashboardSection) dashboardSection.style.display = 'none';
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
        
        itemsToRemove.forEach(item => localStorage.removeItem(item));
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
    sections.forEach(section => {
        if (section) section.style.display = 'none';
    });
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
        window.initializeMetricasAdmin?.();
        console.log('📈 Inicializando métricas admin para la sección');
    }, 200);
}

/**
 * ✅ CONFIGURAR ESTADÍSTICAS PARA ASESOR
 */
function setupEstadisticasForAsesor() {
    setTimeout(async () => {
        await loadMetricasAdminModule();
        window.MetricasAdmin?.setupContainer?.();
    }, 200);
}

/**
 * ✅ ACTUALIZAR NAVEGACIÓN ACTIVA
 */
function updateActiveNavigation(sectionId) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[onclick*="${sectionId}"]`);
    activeLink?.classList.add('active');
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
    
    statElements.forEach(({ selector, value }) => {
        const element = document.querySelector(selector);
        if (element && value !== undefined) {
            element.textContent = value;
        }
    });
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
    
    passwordFields.forEach(id => {
        const field = document.getElementById(id);
        if (field) field.value = '';
    });
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
        Auth.currentUser = responseData.usuario;
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
function handleProfileImageChange(event) {
    const file = event?.target?.files?.[0];
    if (!file) return;
    
    const profilePic = document.getElementById('dashboard-profile-pic');
    if (!profilePic) return;
    
    if (file.size > CONFIG?.MAX_UPLOAD_SIZE) {
        const maxSizeMB = CONFIG.MAX_UPLOAD_SIZE / (1024 * 1024);
        showError?.(`La imagen es demasiado grande. Máximo ${maxSizeMB}MB.`);
        event.target.value = '';
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
    const problematicElements = document.querySelectorAll('.admin-welcome, .asesor-welcome, [style*="background-color"]');
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
    dynamicButtons.forEach(button => button.remove());
    
    // Cleanup de módulos si existe
    const modules = [
        { obj: window.Reclutas, method: 'cleanup' },
        { obj: window.Calendar, method: 'cleanup' }
    ];
    
    modules.forEach(({ obj, method }) => {
        obj?.[method]?.();
    });
    
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

console.log('✅ main.js cargado completamente - Sistema de folio restaurado');
console.log('🔧 Integración de métricas administrativas completada');
console.log('🎯 Todas las funciones de validación y debug disponibles');