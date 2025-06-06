/**
 * Utilidades para manejo de permisos en el frontend
 */
import Auth from './auth.js';

const Permissions = {

    /**
     * Verifica si el usuario actual puede ver todos los reclutas
     * @returns {boolean}
     */
    canSeeAllReclutas: function() {
        const user = Auth.currentUser;
        if (!user) return false;
        
        // Verificar por rol
        if (user.rol === 'admin') return true;
        
        // Verificar por permisos específicos
        if (user.permisos && user.permisos.can_see_all_reclutas) return true;
        
        return false;
    },
    
    /**
     * Verifica si el usuario actual puede asignar asesores
     * @returns {boolean}
     */
    canAssignAsesores: function() {
        const user = Auth.currentUser;
        if (!user) return false;
        
        // Verificar por rol
        if (user.rol === 'admin') return true;
        
        // Verificar por permisos específicos
        if (user.permisos && user.permisos.can_assign_asesores) return true;
        
        return false;
    },
    
    /**
     * Verifica si el usuario actual puede ver la columna de asesor
     * @returns {boolean}
     */
    canShowAsesorColumn: function() {
        const user = Auth.currentUser;
        if (!user) return false;
        
        // Verificar por rol
        if (user.rol === 'admin') return true;
        
        // Verificar por permisos específicos
        if (user.permisos && user.permisos.show_asesor_column) return true;
        
        return false;
    },
    
    /**
     * Verifica si el usuario actual es administrador
     * @returns {boolean}
     */
    isAdmin: function() {
        const user = Auth.currentUser;
        if (!user) return false;
        
        return user.rol === 'admin' || (user.permisos && user.permisos.is_admin);
    },
    
    /**
     * Verifica si el usuario actual es asesor/gerente
     * @returns {boolean}
     */
    isAsesor: function() {
        const user = Auth.currentUser;
        if (!user) return false;
        
        return user.rol === 'asesor' || user.rol === 'gerente' || (user.permisos && user.permisos.is_asesor);
    },
    
    /**
     * Obtiene el nombre descriptivo del rol actual
     * @returns {string}
     */
    getCurrentRoleDisplayName: function() {
        const user = Auth.currentUser;
        if (!user || !user.rol) return 'Usuario';
        
        const roleNames = {
            'admin': 'Administrador',
            'asesor': 'Asesor de Reclutamiento',
            'gerente': 'Gerente de Reclutamiento',
            'user': 'Usuario'
        };
        
        return roleNames[user.rol] || 'Usuario';
    },
    
    /**
     * Oculta elementos que requieren permisos específicos
     * @param {string} permission - Nombre del permiso
     * @param {Array<string>} selectors - Selectores CSS de elementos a ocultar
     */
    hideElementsIfNoPermission: function(permission, selectors) {
    if (!this.hasPermission(permission)) {
        console.log(`🔒 Ocultando elementos por falta de permiso: ${permission}`);
        
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.style.display = 'none';
                element.classList.add('hidden-by-permissions');
                console.log(`👁️‍🗨️ Elemento ocultado: ${selector}`);
            });
        });
    }
},
    
    /**
     * Muestra elementos que requieren permisos específicos
     * @param {string} permission - Nombre del permiso
     * @param {Array<string>} selectors - Selectores CSS de elementos a mostrar
     */
    showElementsIfHasPermission: function(permission, selectors) {
    if (this.hasPermission(permission)) {
        console.log(`🔓 Mostrando elementos por permiso: ${permission}`);
        
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.style.display = '';
                element.classList.remove('hidden-by-permissions');
                console.log(`👁️ Elemento mostrado: ${selector}`);
            });
        });
    }
},

/**
 * ✅ NUEVA FUNCIÓN: Validar estado limpio antes de configurar
 * Agregar al objeto Permissions
 */
validateCleanState: function() {
    console.log('🔍 Validando estado limpio...');
    
    const problematicElements = document.querySelectorAll(`
        .admin-welcome,
        .asesor-welcome,
        .role-specific-element,
        [style*="background-color"],
        .hidden-by-permissions
    `);
    
    if (problematicElements.length > 0) {
        console.warn(`⚠️ Encontrados ${problematicElements.length} elementos problemáticos:`, problematicElements);
        return false;
    }
    
    console.log('✅ Estado limpio validado');
    return true;
},
    
    /**
     * Verifica si el usuario tiene un permiso específico
     * @param {string} permission - Nombre del permiso a verificar
     * @returns {boolean}
     */
    hasPermission: function(permission) {
        const user = Auth.currentUser;
        if (!user) return false;
        
        // Mapeo de permisos a funciones (SIN EXCEL)
        const permissionMap = {
            'see_all_reclutas': this.canSeeAllReclutas,
            'assign_asesores': this.canAssignAsesores,
            'show_asesor_column': this.canShowAsesorColumn,
            'is_admin': this.isAdmin,
            'is_asesor': this.isAsesor
        };
        
        const permissionFunction = permissionMap[permission];
        if (permissionFunction) {
            return permissionFunction.call(this);
        }
        
        // Verificar en permisos directamente
        if (user.permisos && typeof user.permisos[permission] !== 'undefined') {
            return user.permisos[permission];
        }
        
        return false;
    },

    /**
 * ✅ NUEVA FUNCIÓN: Limpia todos los elementos de rol anterior
 * Agregar al objeto Permissions
 */
cleanupPreviousRoleElements: function() {
    console.log('🧹 Limpiando elementos de rol anterior...');
    
    try {
        // 1. Remover elementos dinámicos de rol
        const roleElements = document.querySelectorAll(`
            .admin-welcome,
            .asesor-welcome,
            .role-specific-element,
            .admin-only,
            .asesor-only,
            [data-role],
            .dynamic-role-element
        `);
        
        roleElements.forEach(element => {
            console.log(`🗑️ Removiendo elemento de rol: ${element.className || element.tagName}`);
            element.remove();
        });
        
        // 2. Limpiar clases de rol del body
        document.body.classList.remove('admin-view', 'asesor-view', 'role-admin', 'role-asesor');
        
        // 3. Limpiar atributos style inline relacionados con roles
        const elementsWithStyle = document.querySelectorAll('[style]');
        elementsWithStyle.forEach(element => {
            const style = element.getAttribute('style');
            if (style && (
                style.includes('role') || 
                style.includes('admin') || 
                style.includes('asesor') ||
                style.includes('background-color') ||
                style.includes('display: block') ||
                style.includes('display: none')
            )) {
                // Solo limpiar estilos que parezcan relacionados con roles
                const isRoleRelated = element.className.includes('welcome') ||
                                    element.innerHTML.toLowerCase().includes('bienvenido') ||
                                    element.innerHTML.toLowerCase().includes('admin') ||
                                    element.innerHTML.toLowerCase().includes('asesor');
                
                if (isRoleRelated) {
                    element.removeAttribute('style');
                    console.log(`🎨 Limpiado style inline de elemento de rol: ${element.tagName}`);
                }
            }
        });
        
        // 4. Resetear navegación del dashboard
        this.cleanupDashboardNavigation();
        
        // 5. Limpiar filtros específicos de rol
        this.cleanupRoleSpecificFilters();
        
        console.log('✅ Elementos de rol anterior limpiados completamente');
        
    } catch (error) {
        console.error('❌ Error al limpiar elementos de rol:', error);
    }
},

/**
 * ✅ NUEVA FUNCIÓN: Limpia navegación del dashboard
 * Agregar al objeto Permissions
 */
cleanupDashboardNavigation: function() {
    console.log('🧭 Limpiando navegación del dashboard...');
    
    const dashboardNav = document.querySelector('.dashboard-nav ul');
    if (dashboardNav) {
        dashboardNav.innerHTML = '';
        console.log('📋 Navegación del dashboard limpiada');
    }
    
    // Remover listeners de navegación antiguos
    const navLinks = document.querySelectorAll('.dashboard-nav a[data-role]');
    navLinks.forEach(link => link.remove());
},

/**
 * ✅ NUEVA FUNCIÓN: Limpia filtros específicos de rol
 * Agregar al objeto Permissions
 */
cleanupRoleSpecificFilters: function() {
    console.log('🔍 Limpiando filtros específicos de rol...');
    
    // Ocultar filtro de asesor
    const filterAsesorGroup = document.getElementById('filter-asesor-group');
    if (filterAsesorGroup) {
        filterAsesorGroup.style.display = 'none';
    }
    
    // Resetear valor del filtro
    const filterAsesor = document.getElementById('filter-asesor');
    if (filterAsesor) {
        filterAsesor.value = 'todos';
    }
    
    // Limpiar opciones dinámicas
    const asesorSelectors = document.querySelectorAll('#recluta-asesor, #edit-recluta-asesor');
    asesorSelectors.forEach(selector => {
        if (selector) {
            // Mantener solo la opción por defecto
            selector.innerHTML = '<option value="">-- Seleccionar asesor --</option>';
        }
    });
    
    console.log('✅ Filtros específicos de rol limpiados');
},
    
    /**
     * Configura la UI completa según los permisos del usuario
     */
    configureUIByPermissions: function() {
        console.log('Configurando UI según permisos del usuario');
        
        // Columna de asesor
        if (!this.canShowAsesorColumn()) {
            this.hideElementsIfNoPermission('show_asesor_column', ['#asesor-header', '.asesor-cell']);
        } else {
            this.showElementsIfHasPermission('show_asesor_column', ['#asesor-header']);
        }
        
        // Selectores de asesor en formularios
        if (!this.canAssignAsesores()) {
            this.hideElementsIfNoPermission('assign_asesores', [
                '#recluta-asesor', 
                '#edit-recluta-asesor',
                '.asesor-selector-group'
            ]);
        }
        
        console.log('Configuración de UI por permisos completada');
    }
};

export default Permissions;