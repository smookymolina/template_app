/**
 * Módulo para gestionar reclutas
 */
import CONFIG from './config.js';
import Auth from './auth.js';
import { showNotification, showError, showSuccess } from './notifications.js';
import UI from './ui.js';

const Reclutas = {
    reclutas: [],
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: CONFIG.DEFAULT_PAGE_SIZE,
    filters: {
        search: '',
        estado: 'todos',
        sortBy: 'nombre',
        sortOrder: 'asc'
    },
    currentReclutaId: null,
    asesores: [], // Añadido para almacenar la lista de asesores

/**
 * Configura la interfaz de usuario según el rol
 */
configureUIForRole: function() {
    const role = this.userRole || Auth.getUserRole() || 'asesor';  // ✅ CAMBIO: Default 'asesor'
    this.userRole = role;
    
    console.log('Configurando UI de reclutas para rol:', role);
    
    if (role === 'admin') {
        console.log('Configurando UI para administrador');
        
        // ✅ MOSTRAR funcionalidades de Excel solo para admins
        this.setupExcelUpload();
        
        // Mostrar columna de asesor
        this.showAsesorColumn();
        
        // Mostrar mensaje de bienvenida admin
        this.showAdminWelcome();
        
    } else {
        console.log('Configurando UI para asesor/gerente');
        
        // ✅ OCULTAR elementos de admin
        this.hideAdminElements();
        
        // Ocultar columna de asesor
        this.hideAsesorColumn();
        
        // Mostrar mensaje de bienvenida asesor
        this.showAsesorWelcome();
    }
},

showAsesorColumn: function() {
    console.log('Mostrando columna de asesor');
    
    // Mostrar header de asesor
    const asesorHeader = document.querySelector('#asesor-header');
    if (asesorHeader) {
        asesorHeader.style.display = 'table-cell';
    }
    
    // Remover estilos que ocultan la columna
    const existingStyle = document.querySelector('#hide-asesor-style');
    if (existingStyle) {
        existingStyle.remove();
    }
},

hideAsesorColumn: function() {
    console.log('Ocultando columna de asesor');
    
    // Crear estilo para ocultar columna de asesor
    const style = document.createElement('style');
    style.id = 'hide-asesor-style';
    style.textContent = `
        #reclutas-table th:nth-child(7),
        #reclutas-table td:nth-child(7) { 
            display: none !important; 
        }
    `;
    document.head.appendChild(style);
},

hideAdminElements: function() {
    console.log('Ocultando elementos de administrador');
    
    // Ocultar botón de Excel
    const excelButton = document.getElementById('upload-excel-btn');
    const templateButton = document.getElementById('download-template-btn');
    
    if (excelButton) excelButton.style.display = 'none';
    if (templateButton) templateButton.style.display = 'none';
    
    // Ocultar selectores de asesor en formularios
    const asesorSelectors = document.querySelectorAll('#recluta-asesor, #edit-recluta-asesor');
    asesorSelectors.forEach(selector => {
        const formGroup = selector ? selector.closest('.form-group') : null;
        if (formGroup) formGroup.style.display = 'none';
    });
},

showAdminWelcome: function() {
    const reclutasSection = document.getElementById('reclutas-section');
    if (reclutasSection && !reclutasSection.querySelector('.admin-welcome')) {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'admin-welcome';
        welcomeDiv.style.cssText = `
            background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
            color: white;
            padding: 15px;
            border-radius: var(--border-radius);
            margin-bottom: 20px;
            text-align: center;
        `;
        welcomeDiv.innerHTML = `
            <h4><i class="fas fa-crown"></i> Panel de Administrador</h4>
            <p>Gestiona todos los reclutas, asigna asesores y supervisa el proceso completo de reclutamiento.</p>
        `;
        
        const sectionHeader = reclutasSection.querySelector('.section-header');
        if (sectionHeader && sectionHeader.nextSibling) {
            reclutasSection.insertBefore(welcomeDiv, sectionHeader.nextSibling);
        }
    }
},

showAsesorWelcome: function() {
    const reclutasSection = document.getElementById('reclutas-section');
    if (reclutasSection && !reclutasSection.querySelector('.asesor-welcome')) {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'asesor-welcome';
        welcomeDiv.style.cssText = `
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            padding: 15px;
            border-radius: var(--border-radius);
            margin-bottom: 20px;
            text-align: center;
        `;
        welcomeDiv.innerHTML = `
            <h4><i class="fas fa-handshake"></i> Panel de Gerente</h4>
            <p>Gestiona tus reclutas asignados y programa entrevistas para tus candidatos.</p>
        `;
        
        const sectionHeader = reclutasSection.querySelector('.section-header');
        if (sectionHeader && sectionHeader.nextSibling) {
            reclutasSection.insertBefore(welcomeDiv, sectionHeader.nextSibling);
        }
    }
},

showAsesorColumn: function() {
    console.log('Mostrando columna de asesor');
    
    // Mostrar header de asesor
    const asesorHeader = document.querySelector('#asesor-header');
    if (asesorHeader) {
        asesorHeader.style.display = 'table-cell';
    }
    
    // Remover estilos que ocultan la columna
    const existingStyle = document.querySelector('#hide-asesor-style');
    if (existingStyle) {
        existingStyle.remove();
    }
},

hideAsesorColumn: function() {
    console.log('Ocultando columna de asesor');
    
    // Crear estilo para ocultar columna de asesor
    const style = document.createElement('style');
    style.id = 'hide-asesor-style';
    style.textContent = `
        #reclutas-table th:nth-child(7),
        #reclutas-table td:nth-child(7) { 
            display: none !important; 
        }
    `;
    document.head.appendChild(style);
},

hideAdminElements: function() {
    console.log('Ocultando elementos de administrador');
    
    // Ocultar botón de Excel
    const excelButton = document.getElementById('upload-excel-btn');
    const templateButton = document.getElementById('download-template-btn');
    
    if (excelButton) excelButton.style.display = 'none';
    if (templateButton) templateButton.style.display = 'none';
    
    // Ocultar selectores de asesor en formularios
    const asesorSelectors = document.querySelectorAll('#recluta-asesor, #edit-recluta-asesor');
    asesorSelectors.forEach(selector => {
        const formGroup = selector ? selector.closest('.form-group') : null;
        if (formGroup) formGroup.style.display = 'none';
    });
},

showAdminWelcome: function() {
    const reclutasSection = document.getElementById('reclutas-section');
    if (reclutasSection && !reclutasSection.querySelector('.admin-welcome')) {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'admin-welcome';
        welcomeDiv.style.cssText = `
            background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
            color: white;
            padding: 15px;
            border-radius: var(--border-radius);
            margin-bottom: 20px;
            text-align: center;
        `;
        welcomeDiv.innerHTML = `
            <h4><i class="fas fa-crown"></i> Panel de Administrador</h4>
            <p>Gestiona todos los reclutas, asigna asesores y supervisa el proceso completo de reclutamiento.</p>
        `;
        
        const sectionHeader = reclutasSection.querySelector('.section-header');
        if (sectionHeader && sectionHeader.nextSibling) {
            reclutasSection.insertBefore(welcomeDiv, sectionHeader.nextSibling);
        }
    }
},

showAsesorWelcome: function() {
    const reclutasSection = document.getElementById('reclutas-section');
    if (reclutasSection && !reclutasSection.querySelector('.asesor-welcome')) {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'asesor-welcome';
        welcomeDiv.style.cssText = `
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            padding: 15px;
            border-radius: var(--border-radius);
            margin-bottom: 20px;
            text-align: center;
        `;
        welcomeDiv.innerHTML = `
            <h4><i class="fas fa-handshake"></i> Panel de Gerente</h4>
            <p>Gestiona tus reclutas asignados y programa entrevistas para tus candidatos.</p>
        `;
        
        const sectionHeader = reclutasSection.querySelector('.section-header');
        if (sectionHeader && sectionHeader.nextSibling) {
            reclutasSection.insertBefore(welcomeDiv, sectionHeader.nextSibling);
        }
    }
},

/**
 * ✅ NUEVA FUNCIÓN: Descarga la plantilla Excel
 */
downloadExcelTemplate: async function() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/reclutas/plantilla-excel`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        // Crear blob y descargar
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_reclutas.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showSuccess('Plantilla Excel descargada correctamente');
    } catch (error) {
        console.error('Error al descargar plantilla:', error);
        showError('Error al descargar la plantilla Excel');
    }
},

/**
 * Configura la funcionalidad de subir Excel
 */
setupExcelUpload: function() {
    console.log('Configurando botones de Excel para administrador');
    
    // Buscar el contenedor de acciones de la sección
    const sectionActions = document.querySelector('#reclutas-section .section-actions');
    if (!sectionActions) {
        console.error('No se encontró el contenedor de acciones');
        return;
    }
    
    // Verificar si ya existen los botones
    let excelButton = document.getElementById('upload-excel-btn');
    let templateButton = document.getElementById('download-template-btn');
    
    // Crear botón de plantilla si no existe
    if (!templateButton) {
        templateButton = document.createElement('button');
        templateButton.id = 'download-template-btn';
        templateButton.className = 'btn-secondary';
        templateButton.innerHTML = '<i class="fas fa-download"></i> Plantilla Excel';
        templateButton.style.marginRight = '10px';
        templateButton.title = 'Descargar plantilla Excel para importación masiva';
        
        // Insertar antes del botón "Agregar Nuevo Recluta"
        const addButton = document.getElementById('open-add-recluta-modal');
        if (addButton) {
            sectionActions.insertBefore(templateButton, addButton);
        } else {
            sectionActions.appendChild(templateButton);
        }
        
        console.log('Botón de plantilla Excel creado');
    }
    
    // Crear botón de subir Excel si no existe
    if (!excelButton) {
        excelButton = document.createElement('button');
        excelButton.id = 'upload-excel-btn';
        excelButton.className = 'btn-success';
        excelButton.innerHTML = '<i class="fas fa-file-excel"></i> Subir Excel';
        excelButton.style.marginRight = '10px';
        excelButton.title = 'Importar reclutas desde archivo Excel';
        
        // Insertar antes del botón "Agregar Nuevo Recluta"
        const addButton = document.getElementById('open-add-recluta-modal');
        if (addButton) {
            sectionActions.insertBefore(excelButton, addButton);
        } else {
            sectionActions.appendChild(excelButton);
        }
        
        console.log('Botón de subir Excel creado');
    }
    
    // Mostrar los botones si estaban ocultos
    excelButton.style.display = 'inline-block';
    templateButton.style.display = 'inline-block';
    
    // Crear input file oculto si no existe
    let fileInput = document.getElementById('excel-file-input');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'excel-file-input';
        fileInput.accept = '.xlsx,.xls';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
    }
    
    // Configurar eventos (remover listeners previos)
    templateButton.replaceWith(templateButton.cloneNode(true));
    excelButton.replaceWith(excelButton.cloneNode(true));
    
    // Obtener referencias actualizadas
    templateButton = document.getElementById('download-template-btn');
    excelButton = document.getElementById('upload-excel-btn');
    
    templateButton.addEventListener('click', () => {
        console.log('Descargando plantilla Excel...');
        this.downloadExcelTemplate();
    });
    
    excelButton.addEventListener('click', () => {
        console.log('Abriendo selector de archivo Excel...');
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            console.log('Archivo Excel seleccionado:', e.target.files[0].name);
            this.handleExcelUpload(e.target.files[0]);
        }
    });
    
    console.log('Configuración de Excel completada');
},

/**
 * ✅ NUEVA FUNCIÓN: Maneja la subida de archivo Excel
 * @param {File} file - Archivo Excel seleccionado
 */
handleExcelUpload: async function(file) {
    if (!file) return;
    
    // Validar tipo de archivo
    const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel' // .xls
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
        showError('Por favor selecciona un archivo Excel válido (.xlsx o .xls)');
        return;
    }
    
    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showError('El archivo es demasiado grande. Máximo 5MB permitido.');
        return;
    }
    
    // Mostrar modal de confirmación/progreso
    this.showExcelUploadModal(file);
},

/**
 * ✅ NUEVA FUNCIÓN: Muestra modal de confirmación para subir Excel
 * @param {File} file - Archivo Excel a procesar
 */
showExcelUploadModal: function(file) {
    // Crear modal dinámicamente
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content modal-sm">
            <div class="modal-header">
                <h3>Importar Reclutas desde Excel</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="excel-upload-info">
                    <p><strong>Archivo seleccionado:</strong> ${file.name}</p>
                    <p><strong>Tamaño:</strong> ${(file.size / 1024).toFixed(1)} KB</p>
                    
                    <div style="margin: 20px 0; padding: 15px; background-color: rgba(0, 123, 255, 0.1); border-radius: 5px;">
                        <h4 style="margin-top: 0;"><i class="fas fa-info-circle"></i> Formato Requerido</h4>
                        <p style="margin-bottom: 10px;">El archivo Excel debe tener las siguientes columnas:</p>
                        <ul style="margin-bottom: 0; padding-left: 20px;">
                            <li><strong>nombre</strong> - Nombre completo (requerido)</li>
                            <li><strong>email</strong> - Correo electrónico (requerido)</li>
                            <li><strong>telefono</strong> - Número de teléfono (requerido)</li>
                            <li><strong>puesto</strong> - Puesto al que aplica (opcional)</li>
                            <li><strong>estado</strong> - Estado: "Activo", "En proceso", "Rechazado" (opcional, por defecto "En proceso")</li>
                            <li><strong>notas</strong> - Notas adicionales (opcional)</li>
                        </ul>
                    </div>
                    
                    <div class="upload-progress" style="display: none;">
                        <div style="display: flex; align-items: center; margin: 15px 0;">
                            <i class="fas fa-spinner fa-spin" style="margin-right: 10px;"></i>
                            <span>Procesando archivo...</span>
                        </div>
                        <div style="background-color: #f0f0f0; border-radius: 10px; overflow: hidden;">
                            <div class="progress-bar" style="height: 8px; background-color: var(--primary-color); width: 0%; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="text-align: center; margin-top: 10px; font-size: 12px; color: var(--text-light);">0%</div>
                    </div>
                    
                    <div class="upload-results" style="display: none;">
                        <!-- Los resultados se mostrarán aquí -->
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary cancel-upload">
                    <i class="fas fa-times"></i> Cancelar
                </button>
                <button class="btn-primary confirm-upload">
                    <i class="fas fa-upload"></i> Procesar Archivo
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Configurar eventos
    const closeButtons = modal.querySelectorAll('.close-modal, .cancel-upload');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            document.body.removeChild(modal);
            // Limpiar input file
            const fileInput = document.getElementById('excel-file-input');
            if (fileInput) fileInput.value = '';
        });
    });
    
    const confirmButton = modal.querySelector('.confirm-upload');
    confirmButton.addEventListener('click', () => {
        this.processExcelFile(file, modal);
    });
},

/**
 * ✅ NUEVA FUNCIÓN: Procesa el archivo Excel y sube los reclutas
 * @param {File} file - Archivo Excel
 * @param {HTMLElement} modal - Modal de progreso
 */
processExcelFile: async function(file, modal) {
    const progressContainer = modal.querySelector('.upload-progress');
    const resultsContainer = modal.querySelector('.upload-results');
    const confirmButton = modal.querySelector('.confirm-upload');
    const cancelButton = modal.querySelector('.cancel-upload');
    
    // Mostrar progreso
    progressContainer.style.display = 'block';
    confirmButton.style.display = 'none';
    
    try {
        // Crear FormData para enviar el archivo
        const formData = new FormData();
        formData.append('excel_file', file);
        
        // Simular progreso
        this.updateProgress(modal, 20, 'Subiendo archivo...');
        
        // Enviar archivo al backend
        const response = await fetch(`${CONFIG.API_URL}/reclutas/import-excel`, {
            method: 'POST',
            body: formData
        });
        
        this.updateProgress(modal, 60, 'Procesando datos...');
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        this.updateProgress(modal, 100, 'Completado');
        
        // Mostrar resultados
        setTimeout(() => {
            this.showUploadResults(data, modal);
        }, 500);
        
    } catch (error) {
        console.error('Error al procesar Excel:', error);
        this.showUploadError(error.message, modal);
    }
},

/**
 * ✅ NUEVA FUNCIÓN: Actualiza la barra de progreso
 * @param {HTMLElement} modal - Modal
 * @param {number} percentage - Porcentaje de progreso
 * @param {string} text - Texto de estado
 */
updateProgress: function(modal, percentage, text) {
    const progressBar = modal.querySelector('.progress-bar');
    const progressText = modal.querySelector('.progress-text');
    
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (progressText) progressText.textContent = `${percentage}% - ${text}`;
},

/**
 * ✅ NUEVA FUNCIÓN: Muestra los resultados de la importación
 * @param {Object} data - Datos de respuesta del servidor
 * @param {HTMLElement} modal - Modal
 */
showUploadResults: function(data, modal) {
    const progressContainer = modal.querySelector('.upload-progress');
    const resultsContainer = modal.querySelector('.upload-results');
    const cancelButton = modal.querySelector('.cancel-upload');
    
    progressContainer.style.display = 'none';
    resultsContainer.style.display = 'block';
    
    let resultsHTML = '';
    
    if (data.success) {
        resultsHTML = `
            <div style="color: var(--success-color); text-align: center; margin-bottom: 15px;">
                <i class="fas fa-check-circle" style="font-size: 48px;"></i>
                <h4>¡Importación Exitosa!</h4>
            </div>
            <div style="background-color: rgba(40, 167, 69, 0.1); padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                <p><strong>Reclutas procesados:</strong> ${data.processed || 0}</p>
                <p><strong>Reclutas importados:</strong> ${data.imported || 0}</p>
                ${data.skipped > 0 ? `<p><strong>Reclutas omitidos:</strong> ${data.skipped} (ya existían)</p>` : ''}
                ${data.errors > 0 ? `<p style="color: var(--warning-color);"><strong>Errores:</strong> ${data.errors}</p>` : ''}
            </div>
        `;
        
        if (data.error_details && data.error_details.length > 0) {
            resultsHTML += `
                <details style="margin-top: 10px;">
                    <summary style="cursor: pointer; color: var(--warning-color);">Ver errores detallados</summary>
                    <ul style="margin-top: 10px; padding-left: 20px; font-size: 12px;">
                        ${data.error_details.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </details>
            `;
        }
        
        // Actualizar lista de reclutas
        setTimeout(() => {
            this.loadAndDisplayReclutas();
        }, 1000);
        
    } else {
        resultsHTML = `
            <div style="color: var(--danger-color); text-align: center; margin-bottom: 15px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px;"></i>
                <h4>Error en la Importación</h4>
                <p>${data.message || 'Error desconocido'}</p>
            </div>
        `;
    }
    
    resultsContainer.innerHTML = resultsHTML;
    
    // Cambiar botón de cancelar a cerrar
    cancelButton.innerHTML = '<i class="fas fa-check"></i> Cerrar';
    cancelButton.className = 'btn-primary';
},

/**
 * ✅ NUEVA FUNCIÓN: Muestra error en la importación
 * @param {string} errorMessage - Mensaje de error
 * @param {HTMLElement} modal - Modal
 */
showUploadError: function(errorMessage, modal) {
    const progressContainer = modal.querySelector('.upload-progress');
    const resultsContainer = modal.querySelector('.upload-results');
    const cancelButton = modal.querySelector('.cancel-upload');
    
    progressContainer.style.display = 'none';
    resultsContainer.style.display = 'block';
    
    resultsContainer.innerHTML = `
        <div style="color: var(--danger-color); text-align: center;">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 15px;"></i>
            <h4>Error al Procesar Archivo</h4>
            <p>${errorMessage}</p>
            <div style="margin-top: 15px; padding: 10px; background-color: rgba(220, 53, 69, 0.1); border-radius: 5px;">
                <small>Verifica que el archivo tenga el formato correcto y vuelve a intentarlo.</small>
            </div>
        </div>
    `;
    
    cancelButton.innerHTML = '<i class="fas fa-times"></i> Cerrar';
    cancelButton.className = 'btn-danger';
},

/**
 * ✅ NUEVA FUNCIÓN: Configura la funcionalidad de subir Excel
 */
setupExcelUpload: function() {
    // Buscar el contenedor de acciones de la sección
    const sectionActions = document.querySelector('#reclutas-section .section-actions');
    if (!sectionActions) return;
    
    // Verificar si ya existe el botón
    let excelButton = document.getElementById('upload-excel-btn');
    if (!excelButton) {
        // Crear botón de Excel
        excelButton = document.createElement('button');
        excelButton.id = 'upload-excel-btn';
        excelButton.className = 'btn-secondary';
        excelButton.innerHTML = '<i class="fas fa-file-excel"></i> Subir Excel';
        excelButton.style.marginRight = '10px';
        
        // Insertar antes del botón "Agregar Nuevo Recluta"
        const addButton = document.getElementById('open-add-recluta-modal');
        if (addButton) {
            sectionActions.insertBefore(excelButton, addButton);
        } else {
            sectionActions.appendChild(excelButton);
        }
    }
    
    // Crear input file oculto si no existe
    let fileInput = document.getElementById('excel-file-input');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'excel-file-input';
        fileInput.accept = '.xlsx,.xls';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
    }
    
    // Configurar eventos
    excelButton.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            this.handleExcelUpload(e.target.files[0]);
        }
    });
},

/**
 * ✅ NUEVA FUNCIÓN: Maneja la subida de archivo Excel
 * @param {File} file - Archivo Excel seleccionado
 */
handleExcelUpload: async function(file) {
    if (!file) return;
    
    // Validar tipo de archivo
    const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel' // .xls
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
        showError('Por favor selecciona un archivo Excel válido (.xlsx o .xls)');
        return;
    }
    
    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showError('El archivo es demasiado grande. Máximo 5MB permitido.');
        return;
    }
    
    // Mostrar modal de confirmación/progreso
    this.showExcelUploadModal(file);
},

/**
 * ✅ NUEVA FUNCIÓN: Muestra modal de confirmación para subir Excel
 * @param {File} file - Archivo Excel a procesar
 */
showExcelUploadModal: function(file) {
    // Crear modal dinámicamente
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content modal-sm">
            <div class="modal-header">
                <h3>Importar Reclutas desde Excel</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="excel-upload-info">
                    <p><strong>Archivo seleccionado:</strong> ${file.name}</p>
                    <p><strong>Tamaño:</strong> ${(file.size / 1024).toFixed(1)} KB</p>
                    
                    <div style="margin: 20px 0; padding: 15px; background-color: rgba(0, 123, 255, 0.1); border-radius: 5px;">
                        <h4 style="margin-top: 0;"><i class="fas fa-info-circle"></i> Formato Requerido</h4>
                        <p style="margin-bottom: 10px;">El archivo Excel debe tener las siguientes columnas:</p>
                        <ul style="margin-bottom: 0; padding-left: 20px;">
                            <li><strong>nombre</strong> - Nombre completo (requerido)</li>
                            <li><strong>email</strong> - Correo electrónico (requerido)</li>
                            <li><strong>telefono</strong> - Número de teléfono (requerido)</li>
                            <li><strong>puesto</strong> - Puesto al que aplica (opcional)</li>
                            <li><strong>estado</strong> - Estado: "Activo", "En proceso", "Rechazado" (opcional, por defecto "En proceso")</li>
                            <li><strong>notas</strong> - Notas adicionales (opcional)</li>
                        </ul>
                    </div>
                    
                    <div class="upload-progress" style="display: none;">
                        <div style="display: flex; align-items: center; margin: 15px 0;">
                            <i class="fas fa-spinner fa-spin" style="margin-right: 10px;"></i>
                            <span>Procesando archivo...</span>
                        </div>
                        <div style="background-color: #f0f0f0; border-radius: 10px; overflow: hidden;">
                            <div class="progress-bar" style="height: 8px; background-color: var(--primary-color); width: 0%; transition: width 0.3s;"></div>
                        </div>
                        <div class="progress-text" style="text-align: center; margin-top: 10px; font-size: 12px; color: var(--text-light);">0%</div>
                    </div>
                    
                    <div class="upload-results" style="display: none;">
                        <!-- Los resultados se mostrarán aquí -->
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary cancel-upload">
                    <i class="fas fa-times"></i> Cancelar
                </button>
                <button class="btn-primary confirm-upload">
                    <i class="fas fa-upload"></i> Procesar Archivo
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Configurar eventos
    const closeButtons = modal.querySelectorAll('.close-modal, .cancel-upload');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            document.body.removeChild(modal);
            // Limpiar input file
            const fileInput = document.getElementById('excel-file-input');
            if (fileInput) fileInput.value = '';
        });
    });
    
    const confirmButton = modal.querySelector('.confirm-upload');
    confirmButton.addEventListener('click', () => {
        this.processExcelFile(file, modal);
    });
},

/**
 * ✅ NUEVA FUNCIÓN: Procesa el archivo Excel y sube los reclutas
 * @param {File} file - Archivo Excel
 * @param {HTMLElement} modal - Modal de progreso
 */
processExcelFile: async function(file, modal) {
    const progressContainer = modal.querySelector('.upload-progress');
    const resultsContainer = modal.querySelector('.upload-results');
    const confirmButton = modal.querySelector('.confirm-upload');
    const cancelButton = modal.querySelector('.cancel-upload');
    
    // Mostrar progreso
    progressContainer.style.display = 'block';
    confirmButton.style.display = 'none';
    
    try {
        // Crear FormData para enviar el archivo
        const formData = new FormData();
        formData.append('excel_file', file);
        
        // Simular progreso
        this.updateProgress(modal, 20, 'Subiendo archivo...');
        
        // Enviar archivo al backend
        const response = await fetch(`${CONFIG.API_URL}/reclutas/import-excel`, {
            method: 'POST',
            body: formData
        });
        
        this.updateProgress(modal, 60, 'Procesando datos...');
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        this.updateProgress(modal, 100, 'Completado');
        
        // Mostrar resultados
        setTimeout(() => {
            this.showUploadResults(data, modal);
        }, 500);
        
    } catch (error) {
        console.error('Error al procesar Excel:', error);
        this.showUploadError(error.message, modal);
    }
},

/**
 * ✅ NUEVA FUNCIÓN: Actualiza la barra de progreso
 * @param {HTMLElement} modal - Modal
 * @param {number} percentage - Porcentaje de progreso
 * @param {string} text - Texto de estado
 */
updateProgress: function(modal, percentage, text) {
    const progressBar = modal.querySelector('.progress-bar');
    const progressText = modal.querySelector('.progress-text');
    
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (progressText) progressText.textContent = `${percentage}% - ${text}`;
},

/**
 * ✅ NUEVA FUNCIÓN: Muestra los resultados de la importación
 * @param {Object} data - Datos de respuesta del servidor
 * @param {HTMLElement} modal - Modal
 */
showUploadResults: function(data, modal) {
    const progressContainer = modal.querySelector('.upload-progress');
    const resultsContainer = modal.querySelector('.upload-results');
    const cancelButton = modal.querySelector('.cancel-upload');
    
    progressContainer.style.display = 'none';
    resultsContainer.style.display = 'block';
    
    let resultsHTML = '';
    
    if (data.success) {
        resultsHTML = `
            <div style="color: var(--success-color); text-align: center; margin-bottom: 15px;">
                <i class="fas fa-check-circle" style="font-size: 48px;"></i>
                <h4>¡Importación Exitosa!</h4>
            </div>
            <div style="background-color: rgba(40, 167, 69, 0.1); padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                <p><strong>Reclutas procesados:</strong> ${data.processed || 0}</p>
                <p><strong>Reclutas importados:</strong> ${data.imported || 0}</p>
                ${data.skipped > 0 ? `<p><strong>Reclutas omitidos:</strong> ${data.skipped} (ya existían)</p>` : ''}
                ${data.errors > 0 ? `<p style="color: var(--warning-color);"><strong>Errores:</strong> ${data.errors}</p>` : ''}
            </div>
        `;
        
        if (data.error_details && data.error_details.length > 0) {
            resultsHTML += `
                <details style="margin-top: 10px;">
                    <summary style="cursor: pointer; color: var(--warning-color);">Ver errores detallados</summary>
                    <ul style="margin-top: 10px; padding-left: 20px; font-size: 12px;">
                        ${data.error_details.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </details>
            `;
        }
        
        // Actualizar lista de reclutas
        setTimeout(() => {
            this.loadAndDisplayReclutas();
        }, 1000);
        
    } else {
        resultsHTML = `
            <div style="color: var(--danger-color); text-align: center; margin-bottom: 15px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px;"></i>
                <h4>Error en la Importación</h4>
                <p>${data.message || 'Error desconocido'}</p>
            </div>
        `;
    }
    
    resultsContainer.innerHTML = resultsHTML;
    
    // Cambiar botón de cancelar a cerrar
    cancelButton.innerHTML = '<i class="fas fa-check"></i> Cerrar';
    cancelButton.className = 'btn-primary';
},

/**
 * ✅ NUEVA FUNCIÓN: Muestra error en la importación
 * @param {string} errorMessage - Mensaje de error
 * @param {HTMLElement} modal - Modal
 */
showUploadError: function(errorMessage, modal) {
    const progressContainer = modal.querySelector('.upload-progress');
    const resultsContainer = modal.querySelector('.upload-results');
    const cancelButton = modal.querySelector('.cancel-upload');
    
    progressContainer.style.display = 'none';
    resultsContainer.style.display = 'block';
    
    resultsContainer.innerHTML = `
        <div style="color: var(--danger-color); text-align: center;">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 15px;"></i>
            <h4>Error al Procesar Archivo</h4>
            <p>${errorMessage}</p>
            <div style="margin-top: 15px; padding: 10px; background-color: rgba(220, 53, 69, 0.1); border-radius: 5px;">
                <small>Verifica que el archivo tenga el formato correcto y vuelve a intentarlo.</small>
            </div>
        </div>
    `;
    
    cancelButton.innerHTML = '<i class="fas fa-times"></i> Cerrar';
    cancelButton.className = 'btn-danger';
},

     /**
 * Inicializa todos los elementos y eventos de gestión de reclutas
 */
init: async function() {
    try {
        console.log('Iniciando módulo de reclutas...');
        
        // Asegurarse de tener información actualizada de rol antes de configurar UI
        await this.fetchUserRoleAndPermissions();
        
        // Configurar la UI según el rol
        this.configureUIForRole();
        
        // Cargar asesores si es necesario
        if (this.userRole === 'admin') {
            await this.loadAsesores();
            this.populateAsesorSelectors();
        }
        
        // Inicializar eventos de la interfaz
        this.initFilters();
        this.initAddReclutaForm();
        
        // ✅ REMOVED: Ya no cargamos datos aquí, se hace desde loginSuccess()
        console.log('Módulo de reclutas inicializado correctamente');
        
    } catch (error) {
        console.error('Error al inicializar módulo de reclutas:', error);
        throw new Error('Error al inicializar reclutas: ' + error.message);
    }
},

/**
 * Editar un recluta directamente (para botón en la tabla)
 * @param {number} id - ID del recluta a editar
 */
editRecluta: async function(id) {
    try {
        // Primero mostrar los detalles
        await this.viewRecluta(id);
        
        // Luego habilitar el modo de edición con un pequeño retraso
        setTimeout(() => {
            this.enableEditMode();
        }, 300);
    } catch (error) {
        console.error('Error al editar recluta:', error);
        showError('Error al cargar recluta para edición');
    }
},

    /**
     * Carga la lista de asesores disponibles
     * @returns {Promise<Array>} - Lista de asesores
     */
    loadAsesores: async function() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/asesores`);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.success) {
                this.asesores = data.asesores;
                return this.asesores;
            } else {
                throw new Error(data.message || 'Error al obtener asesores');
            }
        } catch (error) {
            console.error('Error al cargar asesores:', error);
            // No arrojar error aquí para evitar que falle todo el proceso
            this.asesores = [];
            return [];
        }
    },

    /**
     * Carga la lista de reclutas con paginación y filtros
     */
    loadReclutas: async function() {
        try {
            const queryParams = new URLSearchParams({
                page: this.currentPage,
                per_page: this.itemsPerPage,
                search: this.filters.search,
                estado: this.filters.estado !== 'todos' ? this.filters.estado : '',
                sort_by: this.filters.sortBy,
                sort_order: this.filters.sortOrder
            });
            
            // No es necesario enviar el rol como parámetro, ya que el servidor 
            // usar los datos de la sesión para aplicar permisos
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
            
            const response = await fetch(`${CONFIG.API_URL}/reclutas?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Redireccionar al login
                    document.getElementById('login-section').style.display = 'block';
                    document.getElementById('dashboard-section').style.display = 'none';
                    showNotification('Sesión expirada. Por favor inicie sesión nuevamente.', 'warning');
                    throw new Error('No autenticado');
                }
                if (response.status === 403) {
                    throw new Error('No tienes permisos para acceder a estos reclutas');
                }
                throw new Error(`Error al cargar reclutas: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            if (data.success) {
                this.reclutas = data.reclutas;
                this.totalPages = data.pages || 1;
                this.lastApiResponse = data;
                return this.reclutas;
            } else {
                throw new Error(data.message || 'Error al obtener reclutas');
            }
        } catch (error) {
            // Manejar errores específicos
            if (error.name === 'AbortError') {
                console.error('Timeout al cargar reclutas');
                throw new Error('Tiempo de espera agotado. Verifique su conexión a internet.');
            }
            
            console.error('Error al cargar reclutas:', error);
            throw error;
        }
    },

/**
     * Obtiene el rol y permisos del usuario actual
     */
    fetchUserRoleAndPermissions: async function() {
        try {
            // Usar el método de Auth para obtener rol
            const roleData = await Auth.fetchUserRole();
            
            // Almacenar información en el módulo para uso local
            if (roleData) {
                this.userRole = roleData.rol;
                this.userPermissions = roleData.permisos;
            } else {
                // Valores por defecto seguros (mínimos permisos)
                this.userRole = 'user';
                this.userPermissions = {};
            }
            
            return roleData;
        } catch (error) {
            console.error('Error al obtener rol del usuario:', error);
            // Establecer valores seguros por defecto
            this.userRole = 'user';
            this.userPermissions = {};
        }
    },

    /**
     * Carga y muestra la lista de reclutas
     */
    loadAndDisplayReclutas: async function() {
    try {
        console.log('Cargando reclutas...');
        const container = document.getElementById('reclutas-list');
        
        if (!container) return;
        
        container.innerHTML = '<tr><td colspan="8" style="text-align:center"><i class="fas fa-spinner fa-spin"></i> Cargando reclutas...</td></tr>';
        
        const reclutas = await this.loadReclutas();
        
        // AGREGAR: Obtener rol del usuario desde la respuesta
        if (this.lastApiResponse && this.lastApiResponse.user_role) {
            this.userRole = this.lastApiResponse.user_role;
            this.configureUIForRole();
        }
        
        this.renderReclutasTable(container);
        this.updatePagination();
        
        console.log(`Se cargaron ${reclutas.length} reclutas`);
        return reclutas;
    } catch (error) {
        console.error('Error al cargar y mostrar reclutas:', error);
            
            // Mostrar mensaje de error en la tabla
            const container = document.getElementById('reclutas-list');
            if (container) {
                container.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">
                            <i class="fas fa-exclamation-circle text-danger"></i> 
                            Error al cargar reclutas: ${error.message}. <button class="btn-link retry-load">Reintentar</button>
                        </td>
                    </tr>
                `;
                
                // Añadir evento para reintentar carga
                const retryButton = container.querySelector('.retry-load');
                if (retryButton) {
                    retryButton.addEventListener('click', () => this.loadAndDisplayReclutas());
                }
            }
            
            showError('Error al cargar reclutas: ' + error.message);
            throw error;
        }
    },

/**
 * Renderiza la tabla de reclutas con los datos cargados
 * @param {HTMLElement} container - Contenedor tbody de la tabla
 */
renderReclutasTable: function(container) {
    if (!container) {
        console.error('Contenedor de tabla no encontrado');
        return;
    }
    
    container.innerHTML = '';
    
    if (!this.reclutas || this.reclutas.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="8" style="text-align: center; padding: 20px;">
            <i class="fas fa-users"></i> No se encontraron reclutas. 
            <button class="btn-link" onclick="Reclutas.openAddReclutaModal()">¡Agrega tu primer recluta!</button>
        </td>`;
        container.appendChild(row);
        return;
    }
    
    this.reclutas.forEach(recluta => {
        const row = document.createElement('tr');
        
        // Determinar clase del badge según el estado
        const badgeClass = this.getEstadoBadgeClass(recluta.estado);
        
        // Determinar URL de la foto
        const fotoUrl = this.getFotoUrl(recluta.foto_url);
        
        // Generar HTML de la fila
        row.innerHTML = `
            <td><img src="${fotoUrl}" alt="${recluta.nombre}" class="recluta-foto" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"></td>
            <td>${recluta.nombre}</td>
            <td>${recluta.email}</td>
            <td>${recluta.telefono}</td>
            <td>${recluta.puesto || 'No especificado'}</td>
            <td><span class="badge ${badgeClass}">${recluta.estado}</span></td>
            ${this.userRole === 'admin' ? `<td>${recluta.asesor_nombre || 'No asignado'}</td>` : ''}
            <td>
                <button class="action-btn view-btn" title="Ver detalles" data-id="${recluta.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit-btn" title="Editar" data-id="${recluta.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" title="Eliminar" data-id="${recluta.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        // Configurar eventos de los botones de acción
        this.setupActionButtons(row, recluta.id);
        
        container.appendChild(row);
    });
},

/**
 * Obtiene la clase CSS del badge según el estado
 * @param {string} estado - Estado del recluta
 * @returns {string} - Clase CSS del badge
 */
getEstadoBadgeClass: function(estado) {
    const estadoConfig = CONFIG.ESTADOS_RECLUTA.find(e => e.value === estado);
    return estadoConfig ? estadoConfig.badgeClass : 'badge-secondary';
},

/**
 * Obtiene la URL de la foto del recluta
 * @param {string} fotoUrl - URL de la foto del recluta
 * @returns {string} - URL final de la foto
 */
getFotoUrl: function(fotoUrl) {
    if (!fotoUrl) return '/api/placeholder/40/40';
    
    if (fotoUrl.startsWith('http')) {
        return fotoUrl;
    }
    
    if (fotoUrl === 'default_profile.jpg') {
        return '/api/placeholder/40/40';
    }
    
    return `/${fotoUrl}`;
},

 /**
     * Configura la interfaz de usuario según el rol
     */
    configureUIForRole: function() {
        // Obtener rol de manera segura, usando el almacenado en este módulo
        // o consultando Auth si no está disponible
        const role = this.userRole || Auth.getUserRole() || 'user';
        
        // Establece el rol usado localmente
        this.userRole = role;
        
        // Configurar UI para no-administradores
        if (role !== 'admin') {
            // Ocultar selectores de asesor en formularios
            const asesorSelectors = document.querySelectorAll('#recluta-asesor, #edit-recluta-asesor');
            asesorSelectors.forEach(selector => {
                if (selector) {
                    const formGroup = selector.closest('.form-group');
                    if (formGroup) {
                        formGroup.style.display = 'none';
                    }
                }
            });
            
            // Ocultar columna de asesor en la tabla
            const asesorHeader = document.querySelector('#reclutas-table th:nth-child(7)');
            if (asesorHeader) {
                asesorHeader.style.display = 'none';
            }
            
            // Ocultar elementos de la columna de asesor en cada fila
            document.querySelectorAll('#reclutas-list tr').forEach(row => {
                const asesorCell = row.querySelector('td:nth-child(7)');
                if (asesorCell) asesorCell.style.display = 'none';
            });
            
            // Mostrar mensaje informativo para asesores
            if (role === 'asesor') {
                const reclutasSection = document.querySelector('#reclutas-section .section-header');
                if (reclutasSection) {
                    // Verificar si ya existe el mensaje para no duplicarlo
                    if (!reclutasSection.querySelector('.info-message')) {
                        const infoMessage = document.createElement('div');
                        infoMessage.className = 'info-message';
                        infoMessage.innerHTML = '<i class="fas fa-info-circle"></i> Vista filtrada: solo se muestran los reclutas asignados a ti.';
                        infoMessage.style.color = 'var(--primary-color)';
                        infoMessage.style.marginTop = '10px';
                        infoMessage.style.fontSize = '14px';
                        reclutasSection.appendChild(infoMessage);
                    }
                }
            }
        }
        
        console.log(`UI configurada para rol: ${role}`);
    },

    /**
     * Obtiene datos de un recluta específico
     * @param {number} id - ID del recluta
     * @returns {Promise<Object>} - Datos del recluta
     */
    getRecluta: async function(id) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/reclutas/${id}`);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.success) {
                return data.recluta;
            } else {
                throw new Error(data.message || 'Error al obtener recluta');
            }
        } catch (error) {
            console.error(`Error al obtener recluta ${id}:`, error);
            throw error;
        }
    },

    /**
     * Rellena los selectores de asesores en los formularios
     */
    populateAsesorSelectors: function() {
        const addSelector = document.getElementById('recluta-asesor');
        const editSelector = document.getElementById('edit-recluta-asesor');

        if (!this.asesores || this.asesores.length === 0) {
            // Si no hay asesores, intentar cargarlos
            this.loadAsesores()
                .then(() => this.populateAsesorSelectors())
                .catch(error => console.error('No se pudieron cargar los asesores:', error));
            return;
        }

        // Función para rellenar un selector
        const fillSelector = (selector) => {
            if (!selector) return;

            // Mantener la opción por defecto
            const defaultOption = selector.querySelector('option[value=""]');
            selector.innerHTML = '';

            if (defaultOption) {
                selector.appendChild(defaultOption);
            }

            // Añadir opciones para cada asesor
            this.asesores.forEach(asesor => {
                const option = document.createElement('option');
                option.value = asesor.id;
                option.textContent = asesor.nombre || asesor.email;
                selector.appendChild(option);
            });
        };

        // Rellenar ambos selectores
        fillSelector(addSelector);
        fillSelector(editSelector);
    },

    /**
     * Añade un nuevo recluta
     * @param {Object} reclutaData - Datos del recluta
     * @param {File} [foto] - Archivo de foto opcional
     * @returns {Promise<Object>} - Datos del recluta creado
     */
    addRecluta: async function(reclutaData, foto = null) {
        try {
            let response;

            // Si hay foto, usar FormData
            if (foto) {
                const formData = new FormData();

                // Añadir datos del recluta
                for (const key in reclutaData) {
                    formData.append(key, reclutaData[key]);
                }

                // Añadir foto
                formData.append('foto', foto);

                response = await fetch(`${CONFIG.API_URL}/reclutas`, {
                    method: 'POST',
                    body: formData
                });
            } else {
                // Sin foto, usar JSON
                response = await fetch(`${CONFIG.API_URL}/reclutas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reclutaData)
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.success) {
                // Añadir a la lista local si ya hay reclutas cargados
                if (this.reclutas.length > 0) {
                    this.reclutas.push(data.recluta);
                }

                return data.recluta;
            } else {
                throw new Error(data.message || 'Error al crear recluta');
            }
        } catch (error) {
            console.error('Error al añadir recluta:', error);
            throw error;
        }
    },

    /**
     * Actualiza un recluta existente
     * @param {number} id - ID del recluta
     * @param {Object} reclutaData - Datos actualizados
     * @param {File} [foto] - Archivo de foto opcional
     * @returns {Promise<Object>} - Datos del recluta actualizado
     */
    updateRecluta: async function(id, reclutaData, foto = null) {
        try {
            let response;

            // Si hay foto, usar FormData
            if (foto) {
                const formData = new FormData();

                // Añadir datos del recluta
                for (const key in reclutaData) {
                    formData.append(key, reclutaData[key]);
                }

                // Añadir foto
                formData.append('foto', foto);

                response = await fetch(`${CONFIG.API_URL}/reclutas/${id}`, {
                    method: 'PUT',
                    body: formData
                });
            } else {
                // Sin foto, usar JSON
                response = await fetch(`${CONFIG.API_URL}/reclutas/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reclutaData)
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.success) {
                // Actualizar en la lista local si ya está cargado
                const index = this.reclutas.findIndex(r => r.id === id);
                if (index !== -1) {
                    this.reclutas[index] = data.recluta;
                }

                return data.recluta;
            } else {
                throw new Error(data.message || 'Error al actualizar recluta');
            }
        } catch (error) {
            console.error(`Error al actualizar recluta ${id}:`, error);
            throw error;
        }
    },

    /**
     * Elimina un recluta
     * @param {number} id - ID del recluta a eliminar
     * @returns {Promise<boolean>} - True si se eliminó correctamente
     */
    deleteRecluta: async function(id) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/reclutas/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.success) {
                // Eliminar de la lista local si ya está cargado
                const index = this.reclutas.findIndex(r => r.id === id);
                if (index !== -1) {
                    this.reclutas.splice(index, 1);
                }

                return true;
            } else {
                throw new Error(data.message || 'Error al eliminar recluta');
            }
        } catch (error) {
            console.error(`Error al eliminar recluta ${id}:`, error);
            throw error;
        }
    },


    /**
     * Filtra los reclutas según los criterios especificados
     * @param {Object} filters - Filtros a aplicar
     */
    setFilters: function(filters) {
        this.filters = { ...this.filters, ...filters };
        this.currentPage = 1; // Resetear a primera página
    },

    /**
     * Cambia la página actual
     * @param {number} page - Número de página
     */
    setPage: function(page) {
        if (page > 0 && page <= this.totalPages) {
            this.currentPage = page;
        }
    },

    /**
     * Busca reclutas por texto
     * @param {string} text - Texto a buscar
     */
    searchReclutas: function(text) {
        this.filters.search = text;
        this.currentPage = 1; // Resetear a primera página
    },

    /**
     * Filtra reclutas por estado
     * @param {string} estado - Estado a filtrar
     */
    filterByEstado: function(estado) {
        this.filters.estado = estado;
        this.currentPage = 1; // Resetear a primera página
    },

    /**
     * Ordena reclutas por campo
     * @param {string} field - Campo por el que ordenar
     * @param {string} order - Dirección de ordenamiento ('asc' o 'desc')
     */
    sortBy: function(field, order = 'asc') {
        this.filters.sortBy = field;
        this.filters.sortOrder = order;
    },

    /**
     * Renderiza la lista de reclutas en una tabla
     * @param {HTMLElement} container - Elemento contenedor de la tabla
     */
    setupExcelUpload: function() {
    console.log('Configurando botones de Excel para administrador');
    
    // Buscar el contenedor de acciones de la sección
    const sectionActions = document.querySelector('#reclutas-section .section-actions');
    if (!sectionActions) {
        console.error('No se encontró el contenedor de acciones');
        return;
    }
    
    // Verificar si ya existen los botones
    let excelButton = document.getElementById('upload-excel-btn');
    let templateButton = document.getElementById('download-template-btn');
    
    // Crear botón de plantilla si no existe
    if (!templateButton) {
        templateButton = document.createElement('button');
        templateButton.id = 'download-template-btn';
        templateButton.className = 'btn-secondary';
        templateButton.innerHTML = '<i class="fas fa-download"></i> Plantilla Excel';
        templateButton.style.marginRight = '10px';
        templateButton.title = 'Descargar plantilla Excel para importación masiva';
        
        // Insertar antes del botón "Agregar Nuevo Recluta"
        const addButton = document.getElementById('open-add-recluta-modal');
        if (addButton) {
            sectionActions.insertBefore(templateButton, addButton);
        } else {
            sectionActions.appendChild(templateButton);
        }
        
        console.log('Botón de plantilla Excel creado');
    }
    
    // Crear botón de subir Excel si no existe
    if (!excelButton) {
        excelButton = document.createElement('button');
        excelButton.id = 'upload-excel-btn';
        excelButton.className = 'btn-success';
        excelButton.innerHTML = '<i class="fas fa-file-excel"></i> Subir Excel';
        excelButton.style.marginRight = '10px';
        excelButton.title = 'Importar reclutas desde archivo Excel';
        
        // Insertar antes del botón "Agregar Nuevo Recluta"
        const addButton = document.getElementById('open-add-recluta-modal');
        if (addButton) {
            sectionActions.insertBefore(excelButton, addButton);
        } else {
            sectionActions.appendChild(excelButton);
        }
        
        console.log('Botón de subir Excel creado');
    }
    
    // Mostrar los botones si estaban ocultos
    excelButton.style.display = 'inline-block';
    templateButton.style.display = 'inline-block';
    
    // Crear input file oculto si no existe
    let fileInput = document.getElementById('excel-file-input');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'excel-file-input';
        fileInput.accept = '.xlsx,.xls';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
    }
    
    // Configurar eventos (remover listeners previos)
    templateButton.replaceWith(templateButton.cloneNode(true));
    excelButton.replaceWith(excelButton.cloneNode(true));
    
    // Obtener referencias actualizadas
    templateButton = document.getElementById('download-template-btn');
    excelButton = document.getElementById('upload-excel-btn');
    
    templateButton.addEventListener('click', () => {
        console.log('Descargando plantilla Excel...');
        this.downloadExcelTemplate();
    });
    
    excelButton.addEventListener('click', () => {
        console.log('Abriendo selector de archivo Excel...');
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            console.log('Archivo Excel seleccionado:', e.target.files[0].name);
            this.handleExcelUpload(e.target.files[0]);
        }
    });
    
    console.log('Configuración de Excel completada');
},

/**
 * Configura los botones de acción para un recluta
 * @param {HTMLElement} row - Fila de la tabla
 * @param {number} reclutaId - ID del recluta
 */
setupActionButtons: function(row, reclutaId) {
    if (!row || !reclutaId) return;
    
    // Botón de ver detalles
    const viewBtn = row.querySelector('.view-btn');
    if (viewBtn) {
        viewBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Ver recluta:', reclutaId);
            this.viewRecluta(reclutaId);
        });
    }

    // Botón de editar
    const editBtn = row.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Editar recluta:', reclutaId);
            this.editRecluta(reclutaId);
        });
    }

    // Botón de eliminar
    const deleteBtn = row.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Eliminar recluta:', reclutaId);
            this.confirmDeleteRecluta(reclutaId);
        });
    }
},

    /**
     * Muestra los detalles de un recluta
     * @param {number} id - ID del recluta
     */
    viewRecluta: async function(id) {
        try {
            const data = await this.getRecluta(id);
            // Extraer el objeto recluta de la respuesta
            const recluta = data.recluta || data;
            this.currentReclutaId = id;

            // Rellenar datos en el modal
            const elements = {
                nombre: document.getElementById('detail-recluta-nombre'),
                puesto: document.getElementById('detail-recluta-puesto'),
                email: document.getElementById('detail-recluta-email'),
                telefono: document.getElementById('detail-recluta-telefono'),
                fecha: document.getElementById('detail-recluta-fecha'),
                notas: document.getElementById('detail-recluta-notas'),
                estado: document.getElementById('detail-recluta-estado'),
                foto: document.getElementById('detail-recluta-pic'),
                folio: document.getElementById('detail-recluta-folio'),
                asesor: document.getElementById('detail-recluta-asesor')
            };

            // Rellenar todos los campos
            if (elements.nombre) elements.nombre.textContent = recluta.nombre || 'N/A';
            if (elements.puesto) elements.puesto.textContent = recluta.puesto || 'N/A';
            if (elements.email) elements.email.textContent = recluta.email || 'N/A';
            if (elements.telefono) elements.telefono.textContent = recluta.telefono || 'N/A';
            if (elements.fecha) {
                const fecha = recluta.fecha_registro ? new Date(recluta.fecha_registro).toLocaleDateString() : 'N/A';
                elements.fecha.textContent = fecha;
            }
            if (elements.notas) elements.notas.textContent = recluta.notas || 'Sin notas';
            if (elements.folio) elements.folio.textContent = recluta.folio || 'Sin folio';
            if (elements.asesor) elements.asesor.textContent = recluta.asesor_nombre || 'No asignado';

            // Estado con badge
            if (elements.estado) {
                const estadoConfig = CONFIG.ESTADOS_RECLUTA.find(e => e.value === recluta.estado);
                if (estadoConfig) {
                    elements.estado.textContent = estadoConfig.label;
                    elements.estado.className = `badge ${estadoConfig.badgeClass}`;
                } else {
                    elements.estado.textContent = recluta.estado || 'N/A';
                    elements.estado.className = 'badge badge-secondary';
                }
            }

            // Mostrar foto
            if (elements.foto) {
                const fotoUrl = recluta.foto_url ?
                    (recluta.foto_url.startsWith('http') ?
                        recluta.foto_url :
                        `/${recluta.foto_url}`) :
                    "/api/placeholder/150/150";
                elements.foto.src = fotoUrl;
                elements.foto.alt = recluta.nombre || 'Foto de recluta';
            }

            // Mostrar modal de detalles
            UI.showModal('view-recluta-modal');
        } catch (error) {
            console.error('Error al cargar detalles del recluta:', error);
            showError('Error al cargar detalles del recluta');
        }
    },

/**
 * Habilita el modo de edición en el modal de detalles
 */
enableEditMode: function() {
    if (!this.currentReclutaId) return;

    const viewButtons = document.getElementById('view-mode-buttons');
    const editForm = document.getElementById('edit-mode-form');
    
    if (!viewButtons || !editForm) return;

    // Obtener datos actuales
    const recluta = this.reclutas.find(r => r.id === this.currentReclutaId);
    if (!recluta) return;

    // Rellenar formulario
    document.getElementById('edit-recluta-nombre').value = recluta.nombre || '';
    document.getElementById('edit-recluta-email').value = recluta.email || '';
    document.getElementById('edit-recluta-telefono').value = recluta.telefono || '';
    document.getElementById('edit-recluta-puesto').value = recluta.puesto || '';
    document.getElementById('edit-recluta-estado').value = recluta.estado || '';
    document.getElementById('edit-recluta-notas').value = recluta.notas || '';

    // Cambiar vista
    viewButtons.style.display = 'none';
    editForm.style.display = 'block';
},

/**
 * Cancela la edición y vuelve al modo vista
 */
cancelEdit: function() {
    const viewButtons = document.getElementById('view-mode-buttons');
    const editForm = document.getElementById('edit-mode-form');
    
    if (viewButtons) viewButtons.style.display = 'flex';
    if (editForm) editForm.style.display = 'none';
},

    /**
     * Guarda los cambios realizados en la edición del recluta
     */
    saveReclutaChanges: async function() {
        const modal = document.getElementById('edit-recluta-modal');
        if (!modal || !this.currentReclutaId) return;

        const form = modal.querySelector('form');
        if (!form) return;

        const reclutaData = {
            nombre: form.elements.edit_nombre.value,
            puesto: form.elements.edit_puesto.value,
            email: form.elements.edit_email.value,
            telefono: form.elements.edit_telefono.value,
            fecha_postulacion: form.elements.edit_fecha.value,
            notas: form.elements.edit_notas.value,
            estado: form.elements.edit_estado.value,
            asesor_id: form.elements.edit_recluta_asesor.value || null
        };

        const fotoInput = document.getElementById('edit-recluta-upload');
        const foto = fotoInput && fotoInput.files.length > 0 ? fotoInput.files[0] : null;

        try {
            const updatedRecluta = await this.updateRecluta(this.currentReclutaId, reclutaData, foto);
            showSuccess(`Recluta "${updatedRecluta.nombre}" actualizado con éxito`);
            UI.closeModal('edit-recluta-modal');
            this.loadAndDisplayReclutas(); // Recargar la lista para ver los cambios
            this.viewRecluta(this.currentReclutaId); // Volver a mostrar los detalles actualizados
        } catch (error) {
            console.error('Error al guardar cambios:', error);
            showError('Error al guardar los cambios');
        }
    },

    /**
 * Programa una entrevista para el recluta actual
 */
programarEntrevista: function() {
    if (!this.currentReclutaId) {
        showError('Error: No se puede programar entrevista');
        return;
    }
    
    const recluta = this.reclutas.find(r => r.id === this.currentReclutaId);
    if (!recluta) return;
    
    // Cerrar modal de detalles
    UI.closeModal('view-recluta-modal');
    
    // Abrir modal de programación de entrevista
    const modal = document.getElementById('schedule-interview-modal');
    if (!modal) {
        showError('No se puede mostrar el modal de entrevista');
        return;
    }
    
    // Configurar datos del candidato
    const candidatePic = document.getElementById('interview-candidate-pic');
    const candidateName = document.getElementById('interview-candidate-name');
    const candidatePuesto = document.getElementById('interview-candidate-puesto');
    const dateInput = document.getElementById('interview-date');
    const timeInput = document.getElementById('interview-time');
    
    if (candidatePic) candidatePic.src = recluta.foto_url || '/api/placeholder/40/40';
    if (candidateName) candidateName.textContent = recluta.nombre;
    if (candidatePuesto) candidatePuesto.textContent = recluta.puesto || 'No especificado';
    
    // Establecer fecha por defecto (mañana)
    if (dateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.value = tomorrow.toISOString().split('T')[0];
    }
    
    // Hora por defecto (10:00 AM)
    if (timeInput) timeInput.value = '10:00';
    
    // Mostrar modal
    UI.showModal('schedule-interview-modal');
},

    /**
 * Confirmar eliminación de recluta
 * @param {number} id - ID del recluta a eliminar
 */
confirmDeleteRecluta: function(id) {
    this.currentReclutaId = id;
    const recluta = this.reclutas.find(r => r.id === id);
    
    // Usar UI.showConfirmModal si está disponible, sino usar confirm nativo
    if (typeof UI !== 'undefined' && UI.showConfirmModal) {
        UI.showConfirmModal({
            title: 'Eliminar Recluta',
            message: `¿Estás seguro de que deseas eliminar a ${recluta ? recluta.nombre : 'este recluta'}?`,
            confirmText: 'Eliminar',
            confirmButtonClass: 'btn-danger',
            onConfirm: () => this.deleteCurrentRecluta()
        });
    } else {
        // Fallback con confirm nativo
        if (confirm(`¿Estás seguro de que deseas eliminar a ${recluta ? recluta.nombre : 'este recluta'}?`)) {
            this.deleteCurrentRecluta();
        }
    }
},

    /**
 * Elimina el recluta actualmente seleccionado
 */
deleteCurrentRecluta: async function() {
    if (!this.currentReclutaId) return;
    
    try {
        const success = await this.deleteRecluta(this.currentReclutaId);
        if (success) {
            showSuccess('Recluta eliminado con éxito');
            this.currentReclutaId = null;
            await this.loadAndDisplayReclutas(); // Recargar la lista
            
            // Cerrar modal de detalles si está abierto
            if (typeof UI !== 'undefined' && UI.closeModal) {
                UI.closeModal('view-recluta-modal');
            }
        } else {
            showError('Error al eliminar el recluta');
        }
    } catch (error) {
        console.error('Error al eliminar recluta:', error);
        showError('Error al eliminar el recluta: ' + error.message);
    }
},

    /**
     * Actualiza la información de paginación en la UI
     */
    updatePagination: function() {
        const paginationElements = {
            prevBtn: document.getElementById('prev-page'),
            nextBtn: document.getElementById('next-page'),
            totalPages: document.getElementById('total-pages'),
            currentPage: document.querySelector('.current-page')
        };

        if (!paginationElements.totalPages || !paginationElements.currentPage) return;

        paginationElements.totalPages.textContent = this.totalPages || 1;
        paginationElements.currentPage.textContent = this.currentPage;

        // Habilitar/deshabilitar botones si existen
        if (paginationElements.prevBtn) {
            paginationElements.prevBtn.disabled = this.currentPage <= 1;
            paginationElements.prevBtn.onclick = () => {
                if (this.currentPage > 1) {
                    this.setPage(this.currentPage - 1);
                    this.loadAndDisplayReclutas();
                }
            };
        }

        if (paginationElements.nextBtn) {
            paginationElements.nextBtn.disabled = this.currentPage >= this.totalPages;
            paginationElements.nextBtn.onclick = () => {
                if (this.currentPage < this.totalPages) {
                    this.setPage(this.currentPage + 1);
                    this.loadAndDisplayReclutas();
                }
            };
        }
    },

    /**
     * Inicializa los filtros y eventos de la lista de reclutas
     */
    initFilters: function() {
        // Búsqueda por texto
        const searchInput = document.getElementById('search-reclutas');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.searchReclutas(searchInput.value);
                this.loadAndDisplayReclutas();
            });
        }

        // Filtro por estado
        const filterEstado = document.getElementById('filter-estado');
        if (filterEstado) {
            filterEstado.addEventListener('change', () => {
                this.filterByEstado(filterEstado.value);
                this.loadAndDisplayReclutas();
            });
        }

        // Ordenamiento
        const sortBy = document.getElementById('sort-by');
        if (sortBy) {
            sortBy.addEventListener('change', () => {
                const [field, order] = sortBy.value.split('-');
                this.sortBy(field, order);
                this.loadAndDisplayReclutas();
            });
        }
    },

    /**
     * Inicializa los eventos del formulario de añadir recluta
     */
    initAddReclutaForm: function() {
    // Botón para abrir modal
    const addButton = document.getElementById('open-add-recluta-modal');  // Verifica este ID
    if (addButton) {
        addButton.addEventListener('click', () => {
            this.openAddReclutaModal();
        });
        console.log('Evento de botón Agregar Recluta inicializado');  // Añadir para debug
    } else {
        console.error('Botón Agregar Recluta no encontrado en el DOM'); // Añadir para debug
    }

        // Eventos del modal
        const modal = document.getElementById('add-recluta-modal');
        if (!modal) return;

        // Botón de guardar
        const saveButton = modal.querySelector('.btn-primary');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                this.saveNewRecluta();
            });
        }

        // Botón de cerrar
        const closeButtons = modal.querySelectorAll('.close-modal, .btn-secondary');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                UI.closeModal('add-recluta-modal');
            });
        });

        // Input de foto
        const fotoInput = document.getElementById('recluta-upload');
        if (fotoInput) {
            fotoInput.addEventListener('change', this.handleReclutaImageChange);
        }
    },

    /**
     * Abre el modal para añadir un nuevo recluta
     */
    openAddReclutaModal: function() {
    console.log('Intentando abrir modal...');
    const modal = document.getElementById('add-recluta-modal');
    if (!modal) {
        console.error('Modal no encontrado en el DOM');
        return;
    }
    
    // Mostrar el modal directamente en vez de usar UI.showModal
    modal.style.display = 'block';
    console.log('Modal mostrado');
    
    // Limpiar el formulario si es necesario
    const form = document.getElementById('add-recluta-form');
    if (form) form.reset();
    
    // Limpiar preview de imagen si existe
    const picPreview = document.getElementById('recluta-pic-preview');
    if (picPreview) {
        picPreview.innerHTML = '<i class="fas fa-user-circle"></i>';
    }
},

    /**
     * Maneja el evento de cambio de la imagen del recluta en el formulario
     * @param {Event} event - Evento de cambio del input de archivo
     */
    handleReclutaImageChange: function(event) {
        if (!event || !event.target || !event.target.files || !event.target.files[0]) return;

        const file = event.target.files[0];
        const previewDiv = document.getElementById('recluta-pic-preview');

        if (!previewDiv) return;

        // Verificar tamaño máximo
        if (file.size > CONFIG.MAX_UPLOAD_SIZE) {
            showError(`La imagen es demasiado grande. Máximo ${CONFIG.MAX_UPLOAD_SIZE / (1024 * 1024)}MB.`);
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            if (!e || !e.target || !e.target.result) return;

            // Limpiar el div
            previewDiv.innerHTML = '';

            // Crear imagen
            const img = document.createElement('img');
            img.src = e.target.result;
            img.classList.add('profile-pic');
            previewDiv.appendChild(img);
        };
        reader.readAsDataURL(file);
    },

        /**
     * Guarda un nuevo recluta desde el formulario de añadir
     */
    saveNewRecluta: async function() {
        const modal = document.getElementById('add-recluta-modal');
        if (!modal) return;

        const form = document.getElementById('add-recluta-form');
        if (!form) return;

        // Obtener valores usando IDs directos
        const reclutaData = {
            nombre: document.getElementById('recluta-nombre').value.trim(),
            email: document.getElementById('recluta-email').value.trim(),
            telefono: document.getElementById('recluta-telefono').value.trim(),
            estado: document.getElementById('recluta-estado').value,
            puesto: document.getElementById('recluta-puesto')?.value.trim() || '',
            notas: document.getElementById('recluta-notas')?.value.trim() || '',
            asesor_id: document.getElementById('recluta-asesor')?.value || null
        };

        // Validación
        if (!reclutaData.nombre || !reclutaData.email || !reclutaData.telefono) {
            showError('Por favor, completa todos los campos obligatorios');
            return;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(reclutaData.email)) {
            showError('Por favor, ingresa un email válido');
            return;
        }

        const saveButton = modal.querySelector('.btn-primary');
        if (saveButton) {
            saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            saveButton.disabled = true;
        }

        const fotoInput = document.getElementById('recluta-upload');
        const foto = fotoInput && fotoInput.files.length > 0 ? fotoInput.files[0] : null;

        try {
            const newRecluta = await this.addRecluta(reclutaData, foto);
            showSuccess(`Recluta "${newRecluta.nombre}" añadido con éxito`);
            UI.closeModal('add-recluta-modal');
            this.loadAndDisplayReclutas();
        } catch (error) {
            console.error('Error al guardar nuevo recluta:', error);
            showError('Error al guardar el recluta: ' + error.message);
        } finally {
            if (saveButton) {
                saveButton.innerHTML = '<i class="fas fa-save"></i> Guardar Recluta';
                saveButton.disabled = false;
            }
        }
    }
};

// Exponer la función addRecluta al ámbito global para que funcione con onclick en HTML
window.addRecluta = function() {
    Reclutas.saveNewRecluta();
};

export default Reclutas;