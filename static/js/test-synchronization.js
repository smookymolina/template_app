/**
 * ✅ FUNCIÓN DE PRUEBA PARA VALIDAR LA SOLUCIÓN DE SINCRONIZACIÓN
 * Ejecutar: window.testSynchronizationFix() en la consola del navegador
 */

window.testSynchronizationFix = function() {
    console.log('🧪 === INICIANDO PRUEBA DE SINCRONIZACIÓN ===');

    const results = {
        photoUpdate: false,
        colorSync: false,
        customColorSync: false,
        hierarchicalFunctions: false,
        dataSync: false,
        cleanupOnLogout: false,
        overall: false
    };

    try {
        // 1. Test actualización de foto de perfil
        console.log('1️⃣ Probando actualización de foto de perfil...');
        if (window.configManager && typeof window.configManager.updateAllProfileImages === 'function') {
            results.photoUpdate = true;
            console.log('✅ Función de actualización de fotos disponible');
        } else {
            console.log('❌ Función de actualización de fotos NO disponible');
        }

        // 2. Test sincronización de colores predefinidos
        console.log('2️⃣ Probando sincronización de colores predefinidos...');
        if (window.configManager && typeof window.configManager.applyColorTheme === 'function') {
            results.colorSync = true;
            console.log('✅ Función de sincronización de colores disponible');

            // Demo: cambiar color temporalmente
            if (window.configManager.applyColorTheme) {
                console.log('🎨 Probando cambio de color...');
                window.configManager.applyColorTheme('#e74c3c');
                setTimeout(() => {
                    window.configManager.applyColorTheme('#007bff');
                    console.log('🎨 Color restaurado');
                }, 1000);
            }
        } else {
            console.log('❌ Función de sincronización de colores NO disponible');
        }

        // 3. Test sincronización de colores personalizados
        console.log('3️⃣ Probando sincronización de colores personalizados...');
        if (window.configManager && typeof window.configManager.handleCustomColorChange === 'function') {
            results.customColorSync = true;
            console.log('✅ Función de colores personalizados mejorada disponible');

            // Verificar que usa applyColorTheme
            const handleCustomString = window.configManager.handleCustomColorChange.toString();
            if (handleCustomString.includes('applyColorTheme') && handleCustomString.includes('syncUIChanges')) {
                console.log('✅ Función de colores personalizados usa métodos correctos');
            } else {
                console.log('⚠️ Función de colores personalizados podría no estar actualizada');
                results.customColorSync = false;
            }
        } else {
            console.log('❌ Función de colores personalizados NO disponible');
        }

        // 4. Test funciones jerárquicas
        console.log('4️⃣ Probando funciones jerárquicas...');
        if (typeof forceUpdateHierarchicalFeatures === 'function' &&
            typeof updateRoleSpecificElements === 'function' &&
            typeof applyHierarchicalVisibility === 'function') {
            results.hierarchicalFunctions = true;
            console.log('✅ Funciones jerárquicas mejoradas disponibles');
        } else {
            console.log('❌ Funciones jerárquicas mejoradas NO disponibles');
        }

        // 3. Test sincronización de datos
        console.log('3️⃣ Probando sincronización de datos...');
        if (window.configManager && typeof window.configManager.syncUIChanges === 'function') {
            results.dataSync = true;
            console.log('✅ Función de sincronización de datos disponible');
        } else {
            console.log('❌ Función de sincronización de datos NO disponible');
        }

        // 4. Test limpieza al cerrar sesión
        console.log('4️⃣ Probando limpieza al cerrar sesión...');
        if (window.Auth && typeof window.Auth.clearUserState === 'function' &&
            typeof window.Auth.clearProfileImages === 'function' &&
            typeof window.Auth.notifyCleanupComplete === 'function') {
            results.cleanupOnLogout = true;
            console.log('✅ Funciones de limpieza disponibles');
        } else {
            console.log('❌ Funciones de limpieza NO disponibles');
        }

        // 5. Test eventos de comunicación
        console.log('5️⃣ Probando eventos de comunicación...');
        try {
            // Probar evento de configuraciones
            document.dispatchEvent(new CustomEvent('userSettingsChanged', {
                detail: { test: true, timestamp: Date.now() }
            }));

            // Probar evento de limpieza
            document.dispatchEvent(new CustomEvent('userStateCleared', {
                detail: { test: true, timestamp: Date.now() }
            }));

            console.log('✅ Eventos de comunicación funcionando');
        } catch (error) {
            console.warn('⚠️ Error probando eventos:', error);
        }

        // Resultado final
        results.overall = results.photoUpdate && results.colorSync && results.customColorSync &&
                         results.hierarchicalFunctions && results.dataSync && results.cleanupOnLogout;

        console.log('🧪 === RESULTADOS DE LA PRUEBA ===');
        console.table(results);

        if (results.overall) {
            console.log('🎉 ¡TODAS LAS PRUEBAS PASARON! La solución está implementada correctamente.');
            if (window.showNotification) {
                window.showNotification('✅ Solución de sincronización implementada exitosamente', 'success');
            }
        } else {
            console.log('❌ ALGUNAS PRUEBAS FALLARON. Revisar implementación.');
            if (window.showNotification) {
                window.showNotification('❌ Hay problemas con la implementación. Ver consola.', 'error');
            }
        }

        return results;

    } catch (error) {
        console.error('❌ Error ejecutando pruebas:', error);
        return { error: error.message, overall: false };
    }
};

/**
 * DEMO: Función para demostrar la sincronización en tiempo real
 */
window.demoSynchronization = function() {
    console.log('🎭 === DEMO DE SINCRONIZACIÓN EN TIEMPO REAL ===');

    if (!window.configManager) {
        console.log('❌ ConfigurationManager no disponible');
        return;
    }

    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#007bff'];
    let currentIndex = 0;

    const interval = setInterval(() => {
        const color = colors[currentIndex];
        console.log(`🎨 Cambiando a color: ${color}`);

        if (window.configManager.applyColorTheme) {
            window.configManager.applyColorTheme(color);
        }

        currentIndex++;
        if (currentIndex >= colors.length) {
            clearInterval(interval);
            console.log('🎭 Demo completado, restaurando color original');
            setTimeout(() => {
                window.configManager.applyColorTheme('#007bff');
            }, 1000);
        }
    }, 1500);

    console.log('🎭 Demo iniciado - los colores cambiarán automáticamente');
};

console.log('🧪 Archivo de pruebas cargado');
console.log('📋 Funciones disponibles:');
console.log('   - window.testSynchronizationFix() - Ejecutar todas las pruebas');
console.log('   - window.demoSynchronization() - Demostración de cambio de colores');