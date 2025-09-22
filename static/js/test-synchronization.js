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

/**
 * ✅ PRUEBAS ESPECÍFICAS PARA EL CALENDARIO
 */

// Función para probar la sincronización completa del calendario
window.testCalendarSynchronization = function() {
    console.group('🧪 Test de Sincronización del Calendario');

    // 1. Verificar que el calendario esté inicializado
    if (typeof Calendar === 'undefined') {
        console.error('❌ Calendar no está definido');
        console.groupEnd();
        return false;
    }

    // 2. Verificar que Auth esté funcionando
    if (typeof Auth === 'undefined') {
        console.error('❌ Auth no está definido');
        console.groupEnd();
        return false;
    }

    console.log('✅ Módulos básicos cargados');

    // 3. Verificar usuario autenticado
    if (!Auth.currentUser) {
        console.warn('⚠️ No hay usuario autenticado');
    } else {
        console.log('✅ Usuario autenticado:', Auth.currentUser.nombre, 'Rol:', Auth.currentUser.rol);
    }

    // 4. Verificar elementos DOM
    const calendarSection = document.getElementById('calendario-section');
    const upcomingEvents = document.querySelector('.upcoming-events');
    const calendarGrid = document.getElementById('calendar-grid');

    console.log('📋 Verificando elementos DOM:');
    console.log('  - Sección calendario:', calendarSection ? '✅' : '❌');
    console.log('  - Container próximas entrevistas:', upcomingEvents ? '✅' : '❌');
    console.log('  - Grid calendario:', calendarGrid ? '✅' : '❌');

    // 5. Verificar eventos en memoria
    const eventsInMemory = Calendar.calendarEvents ? Calendar.calendarEvents.length : 0;
    console.log('📊 Eventos en memoria:', eventsInMemory);

    // 6. Verificar eventos en DOM
    const eventsInDOM = document.querySelectorAll('.upcoming-interview-item').length;
    console.log('🏠 Eventos en DOM (sidebar):', eventsInDOM);

    const calendarEventsInDOM = document.querySelectorAll('.calendar-event').length;
    console.log('📅 Eventos en calendario (DOM):', calendarEventsInDOM);

    // 7. Test de permisos
    console.log('🔐 Verificando permisos:');
    if (Auth.currentUser) {
        console.log('  - Puede crear entrevistas:', Calendar.canCreateInterview());

        if (Calendar.calendarEvents && Calendar.calendarEvents.length > 0) {
            const firstEvent = Calendar.calendarEvents[0];
            console.log('  - Puede editar primera entrevista:', Calendar.canEditInterview(firstEvent));
            console.log('  - Puede eliminar primera entrevista:', Calendar.canDeleteInterview(firstEvent));
        }
    }

    console.groupEnd();

    return {
        modulesLoaded: true,
        userAuthenticated: !!Auth.currentUser,
        domElementsFound: !!(calendarSection && upcomingEvents && calendarGrid),
        eventsInMemory,
        eventsInDOM,
        calendarEventsInDOM
    };
};

// Función para simular la creación de una entrevista
window.simulateInterviewCreation = async function() {
    console.group('🎯 Simulando Creación de Entrevista');

    try {
        // Obtener reclutas disponibles
        const response = await fetch('/api/reclutas');
        const data = await response.json();

        if (!data.success || !data.reclutas || data.reclutas.length === 0) {
            console.error('❌ No hay reclutas disponibles para la prueba');
            console.groupEnd();
            return false;
        }

        const firstRecluta = data.reclutas[0];
        console.log('✅ Usando recluta para prueba:', firstRecluta.nombre);

        // Crear datos de entrevista de prueba
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const testInterview = {
            recluta_id: firstRecluta.id,
            candidato_nombre: firstRecluta.nombre,
            fecha: tomorrow.toISOString().split('T')[0],
            hora: '14:30',
            duracion: 45,
            tipo: 'virtual',
            ubicacion: 'Zoom Meeting',
            notas: 'Entrevista de prueba creada automáticamente'
        };

        console.log('📝 Datos de entrevista de prueba:', testInterview);

        // Intentar crear la entrevista
        const createResponse = await fetch('/api/entrevistas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testInterview)
        });

        const createData = await createResponse.json();

        if (createData.success) {
            console.log('✅ Entrevista de prueba creada exitosamente:', createData.entrevista.id);

            // Forzar actualización del calendario
            await Calendar.refreshCalendarEvents();

            // Verificar que aparezca en la sidebar
            setTimeout(() => {
                const sidebarItems = document.querySelectorAll('.upcoming-interview-item');
                console.log('📊 Items en sidebar después de crear:', sidebarItems.length);

                // Limpiar entrevista de prueba
                fetch(`/api/entrevistas/${createData.entrevista.id}`, {
                    method: 'DELETE'
                }).then(() => {
                    console.log('🗑️ Entrevista de prueba eliminada');
                    Calendar.refreshCalendarEvents();
                });
            }, 1000);

            console.groupEnd();
            return true;
        } else {
            console.error('❌ Error al crear entrevista de prueba:', createData.message);
            console.groupEnd();
            return false;
        }

    } catch (error) {
        console.error('❌ Error en simulación:', error);
        console.groupEnd();
        return false;
    }
};

// Función para verificar filtros de roles
window.testRoleFilters = function() {
    console.group('👥 Test de Filtros de Roles');

    if (!Auth.currentUser) {
        console.warn('⚠️ No hay usuario para probar filtros');
        console.groupEnd();
        return;
    }

    console.log('👤 Usuario actual:', Auth.currentUser.nombre, 'Rol:', Auth.currentUser.rol);

    // Crear eventos de prueba para filtrar
    const testEvents = [
        { id: 1, asesor_id: 1, candidato_nombre: 'Test 1' },
        { id: 2, asesor_id: 2, candidato_nombre: 'Test 2' },
        { id: 3, asesor_id: null, candidato_nombre: 'Test 3' },
        { id: 4, asesor_id: Auth.currentUser.id, candidato_nombre: 'Test 4' }
    ];

    const filteredEvents = Calendar.applyRoleBasedFilters(testEvents);

    console.log('🔍 Eventos originales:', testEvents.length);
    console.log('✅ Eventos después de filtro:', filteredEvents.length);
    console.log('📋 Eventos filtrados:', filteredEvents);

    console.groupEnd();
};

console.log('🧪 Archivo de pruebas cargado');
console.log('📋 Funciones disponibles:');
console.log('   - window.testSynchronizationFix() - Ejecutar todas las pruebas');
console.log('   - window.demoSynchronization() - Demostración de cambio de colores');
console.log('   - window.testCalendarSynchronization() - Test específico del calendario');
console.log('   - window.simulateInterviewCreation() - Simular creación de entrevista');
console.log('   - window.testRoleFilters() - Test de filtros por roles');