/**
 * 🔧 SCRIPT DE DEBUG PARA CREACIÓN DE USUARIOS
 * 
 * Ejecuta este script en la consola del navegador para diagnosticar
 * problemas con el botón de crear usuarios.
 * 
 * Instrucciones:
 * 1. Abre la consola del navegador (F12)
 * 2. Navega a la sección de configuración
 * 3. Copia y pega este código en la consola
 * 4. Ejecuta las funciones de prueba
 */

console.log('🔧 Iniciando diagnóstico de creación de usuarios...');

// FUNCIÓN 1: Verificar elementos DOM
function checkDOMElements() {
    console.log('\n=== VERIFICACIÓN DE ELEMENTOS DOM ===');
    
    const elements = {
        modal: document.getElementById('create-user-account-modal'),
        form: document.getElementById('create-user-form'),
        submitBtn: document.getElementById('create-user-submit-btn'),
        triggerBtn: document.getElementById('create-user-account-btn'),
        
        // Campos del formulario
        nombreField: document.getElementById('user-nombre'),
        emailField: document.getElementById('user-email'),
        passwordField: document.getElementById('user-password'),
        confirmField: document.getElementById('user-password-confirm'),
        roleField: document.getElementById('user-role')
    };
    
    for (const [name, element] of Object.entries(elements)) {
        const status = element ? '✅ ENCONTRADO' : '❌ FALTANTE';
        console.log(`${name}: ${status}`);
        
        if (element && element.tagName === 'BUTTON') {
            console.log(`  - Eventos registrados: ${element.onclick ? 'SÍ' : 'NO'}`);
        }
    }
    
    return elements;
}

// FUNCIÓN 2: Verificar clases JavaScript
function checkJavaScriptClasses() {
    console.log('\n=== VERIFICACIÓN DE CLASES JAVASCRIPT ===');
    
    const classes = {
        'window.UserAccountManager': typeof window.UserAccountManager,
        'window.userAccountManager': typeof window.userAccountManager,
        'window.UI': typeof window.UI,
        'window.showNotification': typeof window.showNotification
    };
    
    for (const [name, type] of Object.entries(classes)) {
        const status = type !== 'undefined' ? `✅ ${type.toUpperCase()}` : '❌ UNDEFINED';
        console.log(`${name}: ${status}`);
    }
    
    return classes;
}

// FUNCIÓN 3: Probar apertura del modal
function testModalOpening() {
    console.log('\n=== PRUEBA DE APERTURA DEL MODAL ===');
    
    try {
        const modal = document.getElementById('create-user-account-modal');
        if (!modal) {
            throw new Error('Modal no encontrado en el DOM');
        }
        
        // Probar con UI.showModal
        if (typeof window.UI !== 'undefined' && typeof window.UI.showModal === 'function') {
            console.log('📖 Intentando abrir modal con UI.showModal...');
            window.UI.showModal('create-user-account-modal');
            console.log('✅ Modal abierto exitosamente');
            
            // Cerrar después de 2 segundos
            setTimeout(() => {
                window.UI.closeModal('create-user-account-modal');
                console.log('✅ Modal cerrado exitosamente');
            }, 2000);
            
        } else {
            // Fallback manual
            console.log('📖 Intentando abrir modal manualmente...');
            modal.style.display = 'block';
            console.log('✅ Modal abierto manualmente');
            
            setTimeout(() => {
                modal.style.display = 'none';
                console.log('✅ Modal cerrado manualmente');
            }, 2000);
        }
        
    } catch (error) {
        console.error('❌ Error al probar modal:', error.message);
    }
}

// FUNCIÓN 4: Simular click en el botón
function testButtonClick() {
    console.log('\n=== PRUEBA DE CLICK DEL BOTÓN ===');
    
    try {
        const submitBtn = document.getElementById('create-user-submit-btn');
        if (!submitBtn) {
            throw new Error('Botón submit no encontrado');
        }
        
        console.log('📖 Simulando click en botón crear usuario...');
        
        // Crear evento personalizado
        const clickEvent = new Event('click', {
            bubbles: true,
            cancelable: true
        });
        
        // Disparar el evento
        submitBtn.dispatchEvent(clickEvent);
        console.log('✅ Click simulado exitosamente');
        
    } catch (error) {
        console.error('❌ Error al simular click:', error.message);
    }
}

// FUNCIÓN 5: Verificar inicialización del UserAccountManager
function checkUserAccountManager() {
    console.log('\n=== VERIFICACIÓN DEL USER ACCOUNT MANAGER ===');
    
    if (window.userAccountManager) {
        const status = window.userAccountManager.debugStatus();
        console.log('Estado actual:', status);
        
        if (!status.submitBtn) {
            console.log('🔄 Intentando re-inicializar...');
            window.userAccountManager.reinitialize();
            console.log('✅ Re-inicialización completada');
        }
        
    } else if (typeof window.UserAccountManager === 'function') {
        console.log('🔧 Creando nueva instancia de UserAccountManager...');
        window.userAccountManager = new window.UserAccountManager();
        console.log('✅ Instancia creada');
        
    } else {
        console.error('❌ UserAccountManager no está disponible');
    }
}

// FUNCIÓN 6: Prueba completa de creación de usuario
function testCompleteUserCreation() {
    console.log('\n=== PRUEBA COMPLETA DE CREACIÓN ===');
    
    try {
        // 1. Abrir modal
        if (window.UI && window.UI.showModal) {
            window.UI.showModal('create-user-account-modal');
        }
        
        // 2. Llenar formulario con datos de prueba
        const fields = {
            'user-nombre': 'Usuario Prueba',
            'user-email': 'prueba@ejemplo.com',
            'user-password': 'password123',
            'user-password-confirm': 'password123',
            'user-role': 'user'
        };
        
        for (const [fieldId, value] of Object.entries(fields)) {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = value;
                console.log(`✅ Campo ${fieldId} llenado`);
            } else {
                console.warn(`⚠️ Campo ${fieldId} no encontrado`);
            }
        }
        
        // 3. Simular click en submit (NO ejecutar realmente)
        console.log('📖 Formulario listo para prueba (NO se enviará)');
        console.log('💡 Puedes hacer click en "Crear Cuenta" para probar');
        
    } catch (error) {
        console.error('❌ Error en prueba completa:', error.message);
    }
}

// FUNCIÓN PRINCIPAL: Ejecutar todas las pruebas
function runAllTests() {
    console.log('🚀 EJECUTANDO TODAS LAS PRUEBAS DE DIAGNÓSTICO\n');
    
    checkDOMElements();
    checkJavaScriptClasses();
    checkUserAccountManager();
    
    console.log('\n🎯 PRUEBAS INTERACTIVAS:');
    console.log('- testModalOpening(): Abre y cierra el modal');
    console.log('- testButtonClick(): Simula click en el botón');
    console.log('- testCompleteUserCreation(): Llena el formulario para pruebas');
    console.log('\n💡 Ejecuta window.debugUserManager() para ver el estado actual');
}

// Ejecutar automáticamente
runAllTests();

// Exponer funciones globalmente para uso manual
window.testModalOpening = testModalOpening;
window.testButtonClick = testButtonClick;
window.testCompleteUserCreation = testCompleteUserCreation;
window.runAllTests = runAllTests;

console.log('\n✅ Script de diagnóstico cargado. Usa las funciones test*() para pruebas específicas.');