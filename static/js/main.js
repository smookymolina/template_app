/**
 * ✅ ARCHIVO PRINCIPAL JavaScript - SISTEMA DE FOLIO RESTAURADO
 * Inicializa todos los módulos y gestiona la lógica principal
 */
import CONFIG from './config.js';
import Auth from './auth.js';
import Reclutas from './reclutas.js';
import UI from './ui.js';
import Calendar from './calendar.js';
import Client from './client.js';
import Timeline from './timeline.js';
import { showNotification, showError, showSuccess } from './notifications.js';

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
        
        // ✅ 1. INICIALIZAR COMPONENTES BÁSICOS
        UI.loadSavedTheme();
        UI.initCommonEvents();
        UI.initNavigation();
        UI.initColorSelectors();
        
        // ✅ 2. INICIALIZAR SISTEMA DE TRACKING PÚBLICO (CRÍTICO)
        console.log('📋 Inicializando sistema de tracking por folio...');
        Client.init();
        Timeline.init();
        initPublicTracking();
        
        // ✅ 3. VERIFICAR AUTENTICACIÓN PARA PANEL ADMIN
        try {
            const user = await Auth.checkAuth();
            if (user) {
                console.log('👤 Usuario autenticado, mostrando dashboard...');
                loginSuccess(user);
            } else {
                console.log('🔐 No hay sesión activa, mostrando pantalla pública...');
                showLoginScreen();
            }
        } catch (error) {
            console.warn('⚠️ Error verificando auth, mostrando pantalla pública:', error);
            showLoginScreen();
        }
        
        // ✅ 4. CONFIGURAR EVENTOS DE FORMULARIOS
        setupFormEvents();
        
        console.log('✅ Sistema inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error crítico en la inicialización:', error);
        showError('Error al cargar el sistema. Por favor, recarga la página.');
    }
});

/**
 * ✅ INICIALIZACIÓN DEL SISTEMA DE TRACKING PÚBLICO
 */
function initPublicTracking() {
    console.log('🎯 Configurando tracking público...');
    
    // ✅ Manejo de pestañas (Admin vs Seguimiento)
    const adminLoginTab = document.getElementById('admin-login-tab');
    const trackingTab = document.getElementById('tracking-tab');
    const loginForm = document.getElementById('login-form');
    const trackingWrapper = document.getElementById('tracking-wrapper');

    if (adminLoginTab && trackingTab && loginForm && trackingWrapper) {
        console.log('📑 Configurando pestañas...');
        
        adminLoginTab.addEventListener('click', function() {
            switchToAdminTab();
        });
        
        trackingTab.addEventListener('click', function() {
            switchToTrackingTab();
        });
    }

    // ✅ Eventos de tracking en la pestaña principal
    const trackingButton = document.getElementById('tracking-button');
    const folioInput = document.getElementById('folio-input');
    
    if (trackingButton && folioInput) {
        console.log('🔍 Configurando botón de consulta principal...');
        
        trackingButton.addEventListener('click', function() {
            handleTrackingRequest(folioInput.value);
        });

        folioInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleTrackingRequest(this.value);
            }
        });
    }

    // ✅ Link de recuperación en pestaña
    const tabRecuperarLink = document.getElementById('tab-recuperar-folio-link');
    if (tabRecuperarLink) {
        tabRecuperarLink.addEventListener('click', function(e) {
            e.preventDefault();
            openRecoveryModal();
        });
    }

    // ✅ Modal de cliente
    initClientModal();
    
    console.log('✅ Tracking público configurado');
}

/**
 * ✅ CAMBIAR A PESTAÑA DE ADMINISTRADOR
 */
function switchToAdminTab() {
    const adminTab = document.getElementById('admin-login-tab');
    const trackingTab = document.getElementById('tracking-tab');
    const loginForm = document.getElementById('login-form');
    const trackingWrapper = document.getElementById('tracking-wrapper');
    const trackingResults = document.getElementById('tracking-results');
    
    // Activar pestaña admin
    adminTab?.classList.add('active');
    trackingTab?.classList.remove('active');
    loginForm?.classList.add('active');
    trackingWrapper?.classList.remove('active');
    
    // Ocultar resultados de tracking
    if (trackingResults) {
        trackingResults.style.display = 'none';
    }
    
    console.log('🔐 Cambiado a pestaña de administrador');
}

/**
 * ✅ CAMBIAR A PESTAÑA DE SEGUIMIENTO
 */
function switchToTrackingTab() {
    const adminTab = document.getElementById('admin-login-tab');
    const trackingTab = document.getElementById('tracking-tab');
    const loginForm = document.getElementById('login-form');
    const trackingWrapper = document.getElementById('tracking-wrapper');
    
    // Activar pestaña tracking
    trackingTab?.classList.add('active');
    adminTab?.classList.remove('active');
    trackingWrapper?.classList.add('active');
    loginForm?.classList.remove('active');
    
    // Limpiar y enfocar input
    const folioInput = document.getElementById('folio-input');
    if (folioInput) {
        folioInput.value = '';
        setTimeout(() => folioInput.focus(), 100);
    }
    
    console.log('📋 Cambiado a pestaña de seguimiento');
}

/**
 * ✅ MANEJAR SOLICITUD DE TRACKING
 */
function handleTrackingRequest(folioValue) {
    if (!folioValue || !folioValue.trim()) {
        showError('Por favor, ingresa un número de folio');
        return;
    }
    
    console.log(`🔍 Procesando solicitud de tracking para folio: ${folioValue}`);
    
    // Usar el módulo Client para procesar
    if (Client && typeof Client.processFolioValue === 'function') {
        Client.processFolioValue(folioValue.trim());
    } else {
        console.error('❌ Módulo Client no disponible');
        showError('Error interno: módulo de tracking no disponible');
    }
}

/**
 * ✅ ABRIR MODAL DE RECUPERACIÓN
 */
function openRecoveryModal() {
    const modal = document.getElementById('cliente-modal');
    if (modal) {
        modal.style.display = 'block';
        // Esperar a que el modal se muestre y luego mostrar formulario de recuperación
        setTimeout(() => {
            if (Client && typeof Client.showRecuperarFolioForm === 'function') {
                Client.showRecuperarFolioForm();
            }
        }, 150);
    }
}

/**
 * ✅ INICIALIZAR MODAL DE CLIENTE
 */
function initClientModal() {
    const modal = document.getElementById('cliente-modal');
    const consultarBtn = document.getElementById('consultar-folio-btn');
    const folioModalInput = document.getElementById('folio');
    const recuperarLink = document.getElementById('recuperar-folio-link');
    const closeButtons = document.querySelectorAll('.close-modal, .close-modal-btn');

    if (!modal) return;

    console.log('🖥️ Configurando modal de cliente...');

    // Botón consultar en modal
    if (consultarBtn && folioModalInput) {
        consultarBtn.addEventListener('click', function() {
            if (Client && typeof Client.processFolio === 'function') {
                Client.processFolio();
            }
        });
    }

    // Enter en input del modal
    if (folioModalInput) {
        folioModalInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (Client && typeof Client.processFolio === 'function') {
                    Client.processFolio();
                }
            }
        });
    }

    // Link de recuperación en modal
    if (recuperarLink) {
        recuperarLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (Client && typeof Client.showRecuperarFolioForm === 'function') {
                Client.showRecuperarFolioForm();
            }
        });
    }

    // Cerrar modal
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeClientModal();
        });
    });

    // Cerrar al hacer clic fuera
    window.addEventListener('click', function(event) {
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
        // Resetear formulario
        if (Client && typeof Client.resetFolioForm === 'function') {
            Client.resetFolioForm();
        }
    }
}

/**
 * ✅ CONFIGURAR EVENTOS DE FORMULARIOS ADMIN
 */
function setupFormEvents() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            login();
        });
    }
    
    // Login button
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.addEventListener('click', login);
    }
    
    // Enter en campos de login
    const emailField = document.getElementById('email');
    const passwordField = document.getElementById('password');
    
    if (emailField) {
        emailField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
    
    if (passwordField) {
        passwordField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
    
    // Logout button
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
    
    // Cambio de contraseña
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', changePassword);
    }
    
    // Actualizar perfil
    const updateProfileBtn = document.getElementById('update-profile-btn');
    if (updateProfileBtn) {
        updateProfileBtn.addEventListener('click', updateProfile);
    }
    
    // Manejo de foto de perfil
    const profileUpload = document.getElementById('profile-upload');
    if (profileUpload) {
        profileUpload.addEventListener('change', handleProfileImageChange);
    }
}

/**
 * ✅ FUNCIÓN DE LOGIN
 */
async function login() {
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;

    if (!email || !password) {
        showError('Completa los campos de usuario y contraseña');
        return;
    }

    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
        loginButton.disabled = true;
    }

    try {
        const user = await Auth.login(email, password);
        loginSuccess(user);
    } catch (error) {
        console.error('Error de login:', error);
        showError('Usuario o contraseña incorrectos');
    } finally {
        if (loginButton) {
            loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
            loginButton.disabled = false;
        }
    }
}

/**
 * ✅ ACCIONES TRAS LOGIN EXITOSO
 */
async function loginSuccess(usuario) {
    try {
        console.log('✅ Login exitoso, configurando dashboard...');
        
        // Actualizar usuario actual
        Auth.updateUserData(usuario);
        
        // Cambiar de pantalla
        const loginSection = document.getElementById('login-section');
        const dashboardSection = document.getElementById('dashboard-section');
        
        if (loginSection && dashboardSection) {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
        }
        
        // Configurar UI según rol
        const userRole = usuario.rol || 'admin';
        configureDashboardForRole(userRole);
        
        // Actualizar información de usuario
        updateUserInfo(usuario);
        
        // Inicializar módulos si no están inicializados
        if (!appState.initialized) {
            console.log('📦 Inicializando módulos del dashboard...');
            
            try {
                if (typeof Reclutas !== 'undefined' && Reclutas.init) {
                    Reclutas.userRole = userRole;
                    await Reclutas.init();
                    await Reclutas.loadAndDisplayReclutas();
                }
            } catch (e) {
                console.error('Error al inicializar reclutas:', e);
                showError('Error al cargar reclutas: ' + e.message);
            }
            
            try {
                if (typeof Calendar !== 'undefined' && Calendar.init) {
                    await Calendar.init();
                }
            } catch (e) {
                console.error('Error al inicializar calendario:', e);
            }
            
            try {
                await loadEstadisticas();
            } catch (e) {
                console.error('Error al cargar estadísticas:', e);
            }
            
            appState.initialized = true;
        } else {
            // Recargar datos si ya está inicializado
            try {
                await Reclutas.loadAndDisplayReclutas();
            } catch (e) {
                console.error('Error al recargar reclutas:', e);
            }
        }
        
        // Mensaje de bienvenida
        const welcomeMessage = getWelcomeMessage(usuario);
        showSuccess(welcomeMessage);
        
        console.log('✅ Dashboard configurado correctamente');
        
    } catch (error) {
        console.error('Error en loginSuccess:', error);
        showError('Error al cargar el dashboard: ' + error.message);
        showLoginScreen();
    }
}

/**
 * ✅ RESTO DE FUNCIONES (sin cambios, solo cleanup)
 */

function updateUserInfo(usuario) {
    if (!usuario) return;

    const gerenteName = document.getElementById('gerente-name');
    const dropdownUserName = document.getElementById('dropdown-user-name');
    
    if (gerenteName) gerenteName.textContent = usuario.nombre || usuario.email;
    if (dropdownUserName) dropdownUserName.textContent = usuario.nombre || usuario.email;
    
    configureDashboardForRole(usuario.rol);
    
    const profilePic = document.getElementById('dashboard-profile-pic');
    if (profilePic) {
        profilePic.src = usuario.foto_url || '/api/placeholder/100/100';
    }
    
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const userPhone = document.getElementById('user-phone');
    
    if (userName) userName.value = usuario.nombre || '';
    if (userEmail) userEmail.value = usuario.email || '';
    if (userPhone) userPhone.value = usuario.telefono || '';
}

function getWelcomeMessage(usuario) {
    if (!usuario) return '¡Bienvenido al sistema!';
    
    const nombre = usuario.nombre || usuario.email;
    const rol = usuario.rol || 'usuario';
    
    switch (rol) {
        case 'admin':
            return `¡Bienvenido ${nombre}! Tienes acceso completo como Administrador.`;
        case 'asesor':
            return `¡Bienvenido ${nombre}! Gestiona tus reclutas asignados como Asesor.`;
        case 'gerente':
            return `¡Bienvenido ${nombre}! Supervisa el proceso de reclutamiento como Gerente.`;
        default:
            return `¡Bienvenido ${nombre}!`;
    }
}

function configureDashboardForRole(rol) {
    const dashboardNav = document.querySelector('.dashboard-nav ul');
    const profileRole = document.querySelector('.profile-role');
    
    if (!dashboardNav) return;
    
    document.body.classList.remove('admin-view', 'asesor-view');
    document.body.classList.add(rol === 'admin' ? 'admin-view' : 'asesor-view');
    
    if (profileRole) {
        const roleNames = {
            'admin': 'Administrador',
            'asesor': 'Asesor de Reclutamiento',
            'gerente': 'Gerente de Reclutamiento'
        };
        profileRole.textContent = roleNames[rol] || 'Usuario';
    }
    
    if (rol === 'admin') {
        dashboardNav.innerHTML = `
            <li class="active"><a href="#" data-section="reclutas-section"><i class="fas fa-users"></i> Gestión de Reclutas</a></li>
            <li><a href="#" data-section="calendario-section"><i class="fas fa-calendar-alt"></i> Calendario</a></li>
            <li><a href="#" data-section="estadisticas-section"><i class="fas fa-chart-bar"></i> Estadísticas</a></li>
            <li><a href="#" data-section="configuracion-section"><i class="fas fa-cog"></i> Configuración</a></li>
        `;
    } else {
        dashboardNav.innerHTML = `
            <li class="active"><a href="#" data-section="reclutas-section"><i class="fas fa-users"></i> Mis Reclutas</a></li>
            <li><a href="#" data-section="calendario-section"><i class="fas fa-calendar-alt"></i> Mis Entrevistas</a></li>
            <li><a href="#" data-section="configuracion-section"><i class="fas fa-cog"></i> Mi Perfil</a></li>
        `;
    }
    
    UI.initNavigation();
    
    if (typeof Reclutas !== 'undefined' && Reclutas.configureUIForRole) {
        Reclutas.userRole = rol;
        setTimeout(() => Reclutas.configureUIForRole(), 100);
    }
}

async function loadEstadisticas() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/estadisticas`);
        if (!response.ok) throw new Error(`Error ${response.status}`);
        
        const data = await response.json();
        if (data.success) {
            updateEstadisticasUI(data);
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

function updateEstadisticasUI(data) {
    const stats = {
        totalReclutas: document.querySelector('.stat-card:nth-child(1) .stat-number'),
        reclutasActivos: document.querySelector('.stat-card:nth-child(2) .stat-number'),
        enProceso: document.querySelector('.stat-card:nth-child(3) .stat-number'),
        entrevistasPendientes: document.querySelector('.stat-card:nth-child(4) .stat-number')
    };
    
    if (stats.totalReclutas) stats.totalReclutas.textContent = data.reclutas.total;
    if (stats.reclutasActivos) stats.reclutasActivos.textContent = data.reclutas.activos;
    if (stats.enProceso) stats.enProceso.textContent = data.reclutas.en_proceso;
    if (stats.entrevistasPendientes) stats.entrevistasPendientes.textContent = data.entrevistas.pendientes;
}

async function logout() {
    try {
        await Auth.logout();
        Auth.currentUser = null;
        showLoginScreen();
        
        const emailField = document.getElementById('email');
        const passwordField = document.getElementById('password');
        
        if (emailField) emailField.value = '';
        if (passwordField) passwordField.value = '';
        
        showSuccess('Sesión cerrada correctamente');
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showError('Error al cerrar sesión');
    }
}

function showLoginScreen() {
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    
    if (loginSection) loginSection.style.display = 'block';
    if (dashboardSection) dashboardSection.style.display = 'none';
}

async function changePassword() {
    const currentPassword = document.getElementById('current-password')?.value;
    const newPassword = document.getElementById('new-password')?.value;
    const confirmPassword = document.getElementById('confirm-password')?.value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showError('Por favor, completa todos los campos');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showError('Las contraseñas nuevas no coinciden');
        return;
    }
    
    const button = document.getElementById('change-password-btn');
    if (button) {
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cambiando...';
        button.disabled = true;
    }
    
    try {
        await Auth.changePassword(currentPassword, newPassword);
        
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
        
        showSuccess('Contraseña cambiada correctamente');
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        showError('Error al cambiar la contraseña: ' + error.message);
    } finally {
        if (button) {
            button.innerHTML = '<i class="fas fa-key"></i> Cambiar Contraseña';
            button.disabled = false;
        }
    }
}

async function updateProfile() {
    const nombre = document.getElementById('user-name')?.value;
    const telefono = document.getElementById('user-phone')?.value;
    
    if (!nombre) {
        showError('El nombre es requerido');
        return;
    }
    
    const button = document.getElementById('update-profile-btn');
    if (button) {
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        button.disabled = true;
    }
    
    try {
        let data;
        if (window.profileImage) {
            data = new FormData();
            data.append('nombre', nombre);
            if (telefono) data.append('telefono', telefono);
            data.append('foto', window.profileImage);
        } else {
            data = { nombre, telefono };
        }
        
        const response = await fetch(`${CONFIG.API_URL}/perfil`, {
            method: 'PUT',
            body: data instanceof FormData ? data : JSON.stringify(data),
            headers: data instanceof FormData ? undefined : {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error(`Error ${response.status}`);
        
        const responseData = await response.json();
        if (responseData.success) {
            Auth.currentUser = responseData.usuario;
            updateUserInfo(responseData.usuario);
            window.profileImage = null;
            showSuccess('Perfil actualizado correctamente');
        } else {
            throw new Error(responseData.message || 'Error al actualizar perfil');
        }
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        showError('Error al actualizar perfil: ' + error.message);
    } finally {
        if (button) {
            button.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
            button.disabled = false;
        }
    }
}

function handleProfileImageChange(event) {
    if (!event?.target?.files?.[0]) return;
    
    const file = event.target.files[0];
    const profilePic = document.getElementById('dashboard-profile-pic');
    
    if (!profilePic) return;
    
    if (file.size > CONFIG.MAX_UPLOAD_SIZE) {
        showError(`La imagen es demasiado grande. Máximo ${CONFIG.MAX_UPLOAD_SIZE / (1024 * 1024)}MB.`);
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        if (e?.target?.result) {
            profilePic.src = e.target.result;
            window.profileImage = file;
            showNotification('Foto actualizada. Guarda los cambios.', 'info');
        }
    };
    
    reader.readAsDataURL(file);
}

// ✅ EXPONER FUNCIONES GLOBALMENTE PARA COMPATIBILIDAD
window.login = login;
window.logout = logout;
window.loginSuccess = loginSuccess;
window.Client = Client;
window.Timeline = Timeline;
window.showNotification = showNotification;
window.showError = showError;
window.showSuccess = showSuccess;

// ✅ FUNCIONES GLOBALES PARA RECLUTAS (COMPATIBILIDAD)
window.openAddReclutaModal = function() {
    if (typeof Reclutas !== 'undefined' && Reclutas.openAddReclutaModal) {
        Reclutas.openAddReclutaModal();
    } else {
        const modal = document.getElementById('add-recluta-modal');
        if (modal) modal.style.display = 'block';
    }
};

window.addRecluta = function() {
    if (typeof Reclutas !== 'undefined' && Reclutas.saveNewRecluta) {
        Reclutas.saveNewRecluta();
    }
};

console.log('✅ main.js cargado - Sistema de folio restaurado');