/**
 * Utilidades para manejo de permisos en el frontend
 */
import Auth from './auth.js';

const Permissions = {
    // ❌ ELIMINAR ESTAS FUNCIONES COMPLETAMENTE:
    // canUploadExcel: function() { ... }
    // canDownloadTemplate: function() { ... }

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
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    element.style.display = 'none';
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
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    element.style.display = '';
                });
            });
        }
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
     * Configura la UI completa según los permisos del usuario
     */
    configureUIByPermissions: function() {
        console.log('Configurando UI según permisos del usuario');
        
        // ❌ ELIMINAR ESTAS LÍNEAS:
        // if (!this.canUploadExcel()) {
        //     this.hideElementsIfNoPermission('upload_excel', ['#upload-excel-btn']);
        // }
        // if (!this.canDownloadTemplate()) {
        //     this.hideElementsIfNoPermission('download_template', ['#download-template-btn']);
        // }
        
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