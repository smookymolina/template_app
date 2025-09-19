/**
 * Módulo para gestionar reclutas
 * Version: 1.1 - Cache Busting + Timeline Management
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
        asesor_id: 'todos',
        sortBy: 'nombre',
        sortOrder: 'asc'
    },
    currentReclutaId: null,
    asesores: [], // Añadido para almacenar la lista de asesores
    
    // Variables para gestión de timeline
    currentTimelineData: [],
    currentEditingTimelineId: null,

    /**
     * Configura el filtro por asesor para administradores (usando el filtro unificado)
     */
    setupAdminAsesorFilter: function() {
        console.log('Configurando filtro de asesores para admin');

        // Mostrar el filtro unificado
        const filterGroup = document.getElementById('filter-gerente-asesores-group');
        if (filterGroup) filterGroup.style.display = 'flex';

        // Poblar con todos los asesores (no solo los del gerente)
        this.populateAdminAsesorFilter();

        // Configurar evento
        const filterAsesores = document.getElementById('filter-gerente-asesores');
        if (filterAsesores) {
            filterAsesores.addEventListener('change', () => {
                this.filterByAsesor(filterAsesores.value);
                this.loadAndDisplayReclutas();
            });
        }
    },

    /**
     * Configura el filtro por asesor específico para gerentes
     */
    setupGerenteAsesorFilter: function() {
        if (this.userRole !== 'gerente') {
            console.log('Usuario no es gerente, ocultando filtro de asesores del gerente');
            const filterGroup = document.getElementById('filter-gerente-asesores-group');
            if (filterGroup) filterGroup.style.display = 'none';
            return;
        }

        console.log('Configurando filtro de asesores para gerente');

        // Mostrar el filtro específico para gerente
        const filterGroup = document.getElementById('filter-gerente-asesores-group');
        if (filterGroup) filterGroup.style.display = 'flex';

        // Poblar el selector con asesores asignados al gerente
        this.populateGerenteAsesorFilter();

        // Configurar evento
        const filterGerenteAsesores = document.getElementById('filter-gerente-asesores');
        if (filterGerenteAsesores) {
            filterGerenteAsesores.addEventListener('change', () => {
                this.filterByAsesor(filterGerenteAsesores.value);
                this.loadAndDisplayReclutas();
            });
        }
    },


    /**
     * Pobla el selector de filtro por asesor específico para gerentes
     */
    populateGerenteAsesorFilter: async function() {
        const filterGerenteAsesores = document.getElementById('filter-gerente-asesores');
        if (!filterGerenteAsesores) return;

        try {
            // Cargar asesores del gerente desde el backend, confiando en la sesión del servidor
            const response = await fetch(`${CONFIG.API_URL}/gerentes/mis-asesores`);
            
            if (!response.ok) {
                // Si el servidor responde con 403 (Forbidden), significa que el usuario no es gerente.
                if (response.status === 403) {
                    console.warn('Usuario no es gerente, no se puede cargar la lista de asesores.');
                    const filterGroup = document.getElementById('filter-gerente-asesores-group');
                    if (filterGroup) filterGroup.style.display = 'none'; // Ocultar el filtro
                    return;
                }
                throw new Error(`Error al cargar asesores del gerente: ${response.status}`);
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'La respuesta del servidor no fue exitosa');
            }
            
            const asesoresAsignados = data.asesores || [];

            // Limpiar opciones existentes
            filterGerenteAsesores.innerHTML = '';

            // Añadir opciones por defecto
            const todosOption = document.createElement('option');
            todosOption.value = 'todos';
            todosOption.textContent = 'Todos (Mi Equipo)';
            filterGerenteAsesores.appendChild(todosOption);

            // Opción para el propio gerente
            if (Auth.currentUser && Auth.currentUser.id) {
                const gerenteOption = document.createElement('option');
                gerenteOption.value = Auth.currentUser.id;
                gerenteOption.textContent = 'Mis Reclutas Directos';
                filterGerenteAsesores.appendChild(gerenteOption);
            }

            // Agregar asesores asignados al gerente
            asesoresAsignados.forEach(asesor => {
                const option = document.createElement('option');
                option.value = asesor.id;
                option.textContent = asesor.nombre || asesor.email;
                filterGerenteAsesores.appendChild(option);
            });

            console.log(`Filtro de asesores de gerente poblado con ${asesoresAsignados.length} asesores.`);

        } catch (error) {
            console.error('Error al poblar filtro de asesores del gerente:', error);
            // En caso de error, ocultar el filtro para no confundir al usuario.
            const filterGroup = document.getElementById('filter-gerente-asesores-group');
            if (filterGroup) filterGroup.style.display = 'none';
        }
    },

    /**
     * Pobla el selector de filtro por asesor para administradores (todos los asesores)
     */
    populateAdminAsesorFilter: async function() {
        const filterAsesores = document.getElementById('filter-gerente-asesores');
        if (!filterAsesores) return;

        try {
            // Cargar todos los asesores si no están cargados
            if (!this.asesores || this.asesores.length === 0) {
                await this.loadAsesores();
            }

            // Limpiar opciones existentes
            filterAsesores.innerHTML = '';

            // Añadir opciones por defecto
            const todosOption = document.createElement('option');
            todosOption.value = 'todos';
            todosOption.textContent = 'Todos los asesores';
            filterAsesores.appendChild(todosOption);

            const sinAsignarOption = document.createElement('option');
            sinAsignarOption.value = 'sin_asignar';
            sinAsignarOption.textContent = 'Sin asignar';
            filterAsesores.appendChild(sinAsignarOption);

            // Agregar todos los asesores disponibles
            this.asesores.forEach(asesor => {
                const option = document.createElement('option');
                option.value = asesor.id;
                option.textContent = asesor.nombre || asesor.email;
                filterAsesores.appendChild(option);
            });

            console.log(`Filtro de asesores para admin poblado con ${this.asesores.length} asesores`);

        } catch (error) {
            console.error('Error al poblar filtro de asesores para admin:', error);
            // En caso de error, al menos mostrar las opciones básicas
            filterAsesores.innerHTML = `
                <option value="todos">Todos los asesores</option>
                <option value="sin_asignar">Sin asignar</option>
            `;
        }
    },

    /**
     * Filtra reclutas por asesor
     * @param {string} asesorId - ID del asesor ('todos', 'sin_asignar', o ID numérico)
     */
    filterByAsesor: function(asesorId) {
        this.filters.asesor_id = asesorId;
        this.currentPage = 1; // Resetear a primera página
        console.log('Filtrando por asesor:', asesorId);
    },

    /**
     * Configura la interfaz de usuario según el rol
     */
    configureUIForRole: function() {
        const role = this.userRole || Auth.getUserRole() || 'asesor';
        this.userRole = role;
        
        console.log('Configurando UI de reclutas para rol:', role);
        
        // Actualizar clases CSS según jerarquía: Admin > Gerente > Asesor
        document.body.classList.remove('admin-view', 'gerente-view', 'asesor-view');
        document.body.classList.add(`${role}-view`);
        
        if (role === 'admin') {
            this.showAsesorColumn();
            this.showAdminWelcome();
            this.setupAdminFeatures();
        } else if (role === 'gerente') {
            this.showAsesorColumn();
            this.showGerenteWelcome();
            this.setupGerenteFeatures();
        } else {
            this.hideAdminElements();
            this.hideAsesorColumn();
            this.showAsesorWelcome();
            this.setupAsesorFeatures();
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
            #reclutas-table th:nth-child(8),
            #reclutas-table td:nth-child(8) { 
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

    showGerenteWelcome: function() {
        const reclutasSection = document.getElementById('reclutas-section');
        if (reclutasSection && !reclutasSection.querySelector('.gerente-welcome')) {
            const welcomeDiv = document.createElement('div');
            welcomeDiv.className = 'gerente-welcome';
            welcomeDiv.style.cssText = `
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: white;
                padding: 15px;
                border-radius: var(--border-radius);
                margin-bottom: 20px;
                text-align: center;
            `;
            welcomeDiv.innerHTML = `
                <h4><i class="fas fa-user-tie"></i> Panel de Gerente</h4>
                <p>Supervisa el proceso completo de reclutamiento y gestiona asesores. Tienes acceso a métricas globales y distribución.</p>
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
                <h4><i class="fas fa-handshake"></i> Panel de Asesor</h4>
                <p>Gestiona tus reclutas asignados y programa entrevistas para tus candidatos.</p>
            `;
            
            const sectionHeader = reclutasSection.querySelector('.section-header');
            if (sectionHeader && sectionHeader.nextSibling) {
                reclutasSection.insertBefore(welcomeDiv, sectionHeader.nextSibling);
            }
        }
    },

    /**
     * Configura características para administradores
     */
    setupAdminFeatures: function() {
        console.log('Configurando características de administrador');

        // Mostrar columna de asesor
        this.showAsesorColumn();
        this.showAsesorSelectors();

        // Configurar filtro de asesores (usar el mismo que gerentes pero con todos los asesores)
        this.setupAdminAsesorFilter();

        // Configurar botón de distribución Excel
        this.setupDistribucionExcelButton();

        // Mostrar selectores de asesor en formularios
        this.showAsesorSelectors();

        // Cargar asesores disponibles
        this.loadAsesores().then(() => {
            this.populateAsesorSelectors();
            this.populateAdminAsesorFilter();
        });
        
        // Mensaje de bienvenida
        this.showAdminWelcome();
        
        
    },

    /**
     * ✅ NUEVA FUNCIÓN: Configura botón de distribución automática Excel
     */
    setupDistribucionExcelButton: function() {
        console.log('🔧 Configurando botón distribución Excel para admin');
        
        // Buscar contenedor de botones de sección
        const sectionActions = document.querySelector('.section-actions');
        if (!sectionActions) {
            console.error('❌ No se encontró contenedor .section-actions');
            return;
        }
        
        // Crear botón si no existe
        let distribucionBtn = document.getElementById('distribuir-excel-btn');
        if (!distribucionBtn) {
            distribucionBtn = document.createElement('button');
            distribucionBtn.id = 'distribuir-excel-btn';
            distribucionBtn.className = 'btn-primary';
            distribucionBtn.style.marginRight = '10px';
            // Texto contextual según rol
            const buttonText = this.userRole === 'admin' 
                ? '<i class="fas fa-chart-line"></i> Distribuir Reclutas a Gerentes'
                : '<i class="fas fa-chart-line"></i> Distribuir Reclutas a Asesores';
            distribucionBtn.innerHTML = buttonText;
            
            // Insertar antes del botón "Agregar Nuevo Recluta"
            const addButton = document.getElementById('open-add-recluta-modal');
            if (addButton) {
                sectionActions.insertBefore(distribucionBtn, addButton);
            } else {
                sectionActions.appendChild(distribucionBtn);
            }
        }
        
        // Configurar evento click
        distribucionBtn.addEventListener('click', () => {
            this.openDistribucionExcelModal();
        });
        
        // Crear input file oculto
        let fileInput = document.getElementById('distribucion-excel-input');
        if (!fileInput) {
            fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = 'distribucion-excel-input';
            fileInput.accept = '.xlsx,.xls';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);
            
            fileInput.addEventListener('change', (e) => {
                this.handleDistribucionExcelFile(e.target.files[0]);
            });
        }
        
        console.log('✅ Botón distribución Excel configurado');
    },

    /**
     * ✅ NUEVA FUNCIÓN: Abre modal para distribución Excel
     */
    openDistribucionExcelModal: function() {
        console.log('📤 Abriendo modal distribución Excel');
        
        // Crear modal dinámicamente
        const modalId = 'distribucion-excel-modal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-chart-line"></i> ${this.userRole === 'admin' ? 'Distribución Automática a Gerentes' : 'Distribución Automática a Mis Asesores'}</h3>
                        <span class="close-modal">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="distribucion-info">
                            <div class="info-box">
                                <h4><i class="fas fa-info-circle"></i> Información del Proceso</h4>
                                <ul>
                                    <li>📊 <strong>Función:</strong> Distribuye reclutas automáticamente entre ${this.userRole === 'admin' ? 'gerentes activos' : 'mis asesores asignados'}</li>
                                    <li>📄 <strong>Formato:</strong> Excel (.xlsx, .xls) con headers: "Fecha de creación", "Nombre", "Teléfono"</li>
                                    <li>⚖️ <strong>Distribución:</strong> Equitativa entre ${this.userRole === 'admin' ? 'gerentes no fijados' : 'asesores no fijados'}</li>
                                    <li>🔍 <strong>Validación:</strong> Evita duplicados de teléfono</li>
                                </ul>
                            </div>
                            <div class="file-drop-zone" id="distribucion-drop-zone">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <p>Haz clic para seleccionar archivo Excel</p>
                                <small>o arrastra y suelta aquí</small>
                            </div>
                            <div class="progress-container" id="distribucion-progress" style="display: none;">
                                <div class="progress-bar">
                                    <div class="progress-fill" id="distribucion-progress-fill"></div>
                                </div>
                                <p id="distribucion-status">Procesando...</p>
                            </div>
                            <div class="results-container" id="distribucion-results" style="display: none;">
                                <div class="summary-stats-container">
                                    <div class="stat-item">
                                        <span class="stat-label">Total Reclutas:</span>
                                        <span class="stat-value" id="total-reclutas-summary">0</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Reclutas Fijos:</span>
                                        <span class="stat-value" id="reclutas-fijos-summary">0</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Reclutas Flexibles:</span>
                                        <span class="stat-value" id="reclutas-flexibles-summary">0</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Asesores Flexibles:</span>
                                        <span class="stat-value" id="asesores-flexibles-summary">0</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Promedio Flexible:</span>
                                        <span class="stat-value" id="promedio-flexible-summary">0</span>
                                    </div>
                                </div>
                                <!-- Resultados se mostrarán aquí -->
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary close-modal">
                            <i class="fas fa-times"></i> Cerrar
                        </button>
                        <button type="button" class="btn-primary" id="confirm-distribucion" style="display: none;">
                            <i class="fas fa-check"></i> Confirmar Distribución
                        </button>
                        <button type="button" class="btn-success" id="save-asesor-distribution" style="display: none;">
                            <i class="fas fa-save"></i> Guardar Cambios
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Configurar eventos del modal
            this.setupDistribucionModalEvents(modal);
        }
        
        // Resetear modal
        this.resetDistribucionModal();
        
        // Mostrar modal
        modal.style.display = 'block';
    },

    /**
     * ✅ NUEVA FUNCIÓN: Configura eventos del modal distribución
     */
    setupDistribucionModalEvents: function(modal) {
        // Cerrar modal
        const closeButtons = modal.querySelectorAll('.close-modal');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        });
        
        // Drop zone
        const dropZone = modal.querySelector('#distribucion-drop-zone');
        if (dropZone) {
            dropZone.addEventListener('click', () => {
                document.getElementById('distribucion-excel-input').click();
            });
            
            // Drag & drop
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });
            
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over');
            });
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleDistribucionExcelFile(files[0]);
                }
            });
        }
        
        // Botón confirmar
        const confirmBtn = modal.querySelector('#confirm-distribucion');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.executeDistribucionExcel();
            });
        }

        // Botón guardar cambios de asesor
        const saveAsesorBtn = modal.querySelector('#save-asesor-distribution');
        if (saveAsesorBtn) {
            saveAsesorBtn.addEventListener('click', () => {
                this.saveAsesorDistribution();
            });
        }
    },

    /**
     * ✅ NUEVA FUNCIÓN: Maneja archivo Excel seleccionado
     */
    handleDistribucionExcelFile: function(file) {
        console.log('📄 Archivo seleccionado:', file.name);
        
        // Validar archivo
        if (!file) return;
        
        if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
            showError('Solo se permiten archivos Excel (.xlsx, .xls)');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB
            showError('El archivo es demasiado grande (máximo 10MB)');
            return;
        }
        
        // Mostrar información del archivo
        const dropZone = document.getElementById('distribucion-drop-zone');
        if (dropZone) {
            dropZone.innerHTML = `
                <i class="fas fa-file-excel"></i>
                <p><strong>${file.name}</strong></p>
                <small>Tamaño: ${(file.size / 1024 / 1024).toFixed(2)} MB</small>
            `;
            dropZone.style.backgroundColor = '#e8f5e8';
            dropZone.style.borderColor = '#28a745';
        }
        
        // Mostrar botón confirmar
        const confirmBtn = document.getElementById('confirm-distribucion');
        if (confirmBtn) {
            confirmBtn.style.display = 'inline-block';
            confirmBtn.dataset.file = file.name;
        }
        
        // Guardar archivo para posterior uso
        this.selectedDistribucionFile = file;
    },

    /**
     * ✅ NUEVA FUNCIÓN: Ejecuta la distribución Excel
     */
    executeDistribucionExcel: async function() {
        if (!this.selectedDistribucionFile) {
            showError('No hay archivo seleccionado');
            return;
        }
        
        console.log('🚀 Ejecutando distribución Excel...');

        // Asegurarse de que los asesores estén cargados antes de procesar los resultados
        if (this.asesores.length === 0) {
            console.log('Cargando asesores antes de la distribución...');
            await this.loadAsesores();
        }
        
        // Mostrar progress
        this.showDistribucionProgress();
        
        try {
            // Preparar FormData
            const formData = new FormData();
            formData.append('excel_file', this.selectedDistribucionFile);
            
            // Enviar al backend
            const response = await fetch(`${CONFIG.API_URL}/reclutas/distribuir-excel`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showDistribucionResults(data);
                showSuccess(`¡Distribución exitosa! ${data.exitosos} reclutas procesados`);
            } else {
                this.hideDistribucionProgress();
                showError(data.message || 'Error en la distribución');
            }
            
        } catch (error) {
            console.error('❌ Error en distribución:', error);
            this.hideDistribucionProgress();
            showError('Error al conectar con el servidor');
        }
    },

    /**
     * ✅ NUEVA FUNCIÓN: Muestra progress bar
     */
    showDistribucionProgress: function() {
        const progressContainer = document.getElementById('distribucion-progress');
        const confirmBtn = document.getElementById('confirm-distribucion');
        
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
        if (confirmBtn) {
            confirmBtn.style.display = 'none';
        }
        
        // Animar progress bar
        let progress = 0;
        const progressFill = document.getElementById('distribucion-progress-fill');
        const statusText = document.getElementById('distribucion-status');
        
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            
            if (progressFill) {
                progressFill.style.width = progress + '%';
            }
            if (statusText) {
                statusText.textContent = progress < 30 ? 'Leyendo Excel...' :
                                       progress < 60 ? 'Validando datos...' :
                                       progress < 90 ? 'Distribuyendo reclutas...' :
                                       'Finalizando...';
            }
        }, 200);
        
        this.distribucionInterval = interval;
    },

    /**
     * ✅ NUEVA FUNCIÓN: Oculta progress bar
     */
    hideDistribucionProgress: function() {
        const progressContainer = document.getElementById('distribucion-progress');
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }
        
        if (this.distribucionInterval) {
            clearInterval(this.distribucionInterval);
        }
    },

    /**
     * ✅ NUEVA FUNCIÓN: Muestra resultados de distribución
     */
    showDistribucionResults: function(data) {
        this.hideDistribucionProgress();
        
        const resultsContainer = document.getElementById('distribucion-results');
        if (!resultsContainer) return;
        
        // Preparar HTML de resultados
        console.log('DEBUG: this.asesores before map:', this.asesores);
        const distributionRows = Object.entries(data.distribucion || {})
            .map(([email, distribData]) => {
                const asesor = this.asesores.find(a => a.email === email);
                const asesorId = asesor ? String(asesor.id) : ''; // Ensure asesorId is a string
                const asesorDisplay = asesor ? (asesor.nombre || asesor.email) : email; // Usar nombre o email si no hay nombre
                const count = distribData.count; // Get count from the object
                const isFixed = distribData.is_fixed; // Get is_fixed from the object
                return `<tr>
                            <td>${asesorDisplay}</td>
                            <td>
                                <input type="number" class="form-control reclutas-input" data-asesor-id="${asesorId}" value="${count}" min="0">
                                reclutas
                                <label class="checkbox-container fixed-checkbox-label">
                                    <input type="checkbox" class="fixed-checkbox" data-asesor-id="${asesorId}" ${isFixed ? 'checked' : ''}>
                                    <span class="checkbox-label">Fijo</span>
                                </label>
                            </td>
                        </tr>`;
            }).join('');
        
        const errorsHtml = data.errores_detalle && data.errores_detalle.length > 0 ? 
            `<div class="errors-section">
                <h5><i class="fas fa-exclamation-triangle"></i> Errores Encontrados (${data.errores})</h5>
                <ul>
                    ${data.errores_detalle.map(err => `<li>Fila ${err.fila}: ${err.error}</li>`).join('')}
                </ul>
            </div>` : '';
        
        const summaryHtml = `
            <div class="summary-stats-container">
                <div class="stat-item">
                    <span class="stat-label">Total reclutas</span>
                    <span class="stat-value" id="total-reclutas-summary">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Reclutas fijos</span>
                    <span class="stat-value" id="reclutas-fijos-summary">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Reclutas flexibles</span>
                    <span class="stat-value" id="reclutas-flexibles-summary">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Asesores flexibles</span>
                    <span class="stat-value" id="asesores-flexibles-summary">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Promedio flexible</span>
                    <span class="stat-value" id="promedio-flexible-summary">0</span>
                </div>
            </div>`;

        const resultsHtml = `
            <div class="results-summary">
                <h4><i class="fas fa-check-circle"></i> Distribuci?n Completada</h4>
                <div class="summary-stats">
                    <div class="stat-item">
                        <span class="stat-label">Total Procesados:</span>
                        <span class="stat-value">${data.total_procesados}</span>
                    </div>
                    <div class="stat-item success">
                        <span class="stat-label">Exitosos:</span>
                        <span class="stat-value">${data.exitosos}</span>
                    </div>
                    ${data.errores > 0 ? `
                    <div class="stat-item error">
                        <span class="stat-label">Errores:</span>
                        <span class="stat-value">${data.errores}</span>
                    </div>` : ''}
                </div>
            </div>
            <div class="distribution-table">
                <h5><i class="fas fa-users"></i> Distribuci?n por Asesor</h5>
                <table>
                    <thead>
                        <tr><th>Asesor</th><th>Reclutas Asignados</th></tr>
                    </thead>
                    <tbody>
                        ${distributionRows}
                    </tbody>
                </table>
            </div>
            ${errorsHtml}
            <div class="results-actions">
                <button class="btn-primary" onclick="Reclutas.loadAndDisplayReclutas()">
                    <i class="fas fa-sync"></i> Actualizar Lista
                </button>
            </div>`;

        resultsContainer.innerHTML = `${summaryHtml}
            <div class="distribution-results">
                ${resultsHtml}
            </div>`;
        
        resultsContainer.style.display = 'block';

        // Mostrar el botón de guardar cambios de asesor
        const saveAsesorBtn = document.getElementById('save-asesor-distribution');
        if (saveAsesorBtn) {
            saveAsesorBtn.style.display = 'inline-block';
        }
        
        // Completar progress bar
        const progressFill = document.getElementById('distribucion-progress-fill');
        if (progressFill) {
            progressFill.style.width = '100%';
        }
        
        setTimeout(() => {
            this.hideDistribucionProgress();
        }, 1000);

        // Store initial distribution data for recalculations
        this.currentDistributionData = data;

        // Attach event listeners to inputs and checkboxes
        const reclutasInputs = resultsContainer.querySelectorAll('.reclutas-input');
        reclutasInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                // Pass the element that triggered the event
                this.recalculateDistribution(e.target);
            });
        });

        const fixedCheckboxes = resultsContainer.querySelectorAll('.fixed-checkbox');
        fixedCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const asesorId = e.target.dataset.asesorId;
                const input = resultsContainer.querySelector(`.reclutas-input[data-asesor-id="${asesorId}"]`);
                if (e.target.checked) {
                    // If fixed, disable input
                    input.readOnly = true;
                } else {
                    // If not fixed, enable input
                    input.readOnly = false;
                }
                // Pass the checkbox that was changed to recalculate
                this.recalculateDistribution(e.target);
            });
        });

        // Initial recalculation to set up summary and flexible distribution
        this.recalculateDistribution();
    },

    /**
     * ✅ FUNCIÓN CORREGIDA: Recalcula la distribución de reclutas
     * @param {HTMLElement} [editedElement] - El elemento (input o checkbox) que disparó el evento.
     */


    recalculateDistribution: function(editedElement = null) {
        console.log('Recalculando distribucion...');

        if (!this.currentDistributionData || typeof this.currentDistributionData.exitosos === 'undefined') {
            console.warn('No hay datos de distribucion actuales para recalcular.');
            return;
        }

        const resultsContainer = document.getElementById('distribucion-results');
        if (!resultsContainer) {
            console.warn('No se encontro el contenedor de resultados para recalcular distribucion.');
            return;
        }

        const reclutasInputs = Array.from(resultsContainer.querySelectorAll('.reclutas-input'));
        const totalReclutasGeneral = Number(this.currentDistributionData.exitosos) || 0;

        let totalFixedReclutas = 0;
        const flexibleAsesoresInputs = [];
        const manuallyEditedFlexibleInputs = new Map();

        reclutasInputs.forEach(input => {
            const asesorId = input.dataset.asesorId;
            const checkbox = resultsContainer.querySelector(`.fixed-checkbox[data-asesor-id="${asesorId}"]`);
            const count = parseInt(input.value, 10) || 0;

            if (checkbox && checkbox.checked) {
                totalFixedReclutas += count;
                input.readOnly = true;
            } else {
                input.readOnly = false;
                flexibleAsesoresInputs.push(input);

                if (editedElement === input) {
                    manuallyEditedFlexibleInputs.set(asesorId, count);
                }
            }
        });

        let remainingFlexibleReclutas = totalReclutasGeneral - totalFixedReclutas;

        manuallyEditedFlexibleInputs.forEach(value => {
            remainingFlexibleReclutas -= value;
        });

        const targetFlexibleInputs = flexibleAsesoresInputs.filter(input => !manuallyEditedFlexibleInputs.has(input.dataset.asesorId));

        if (remainingFlexibleReclutas < 0) {
            showError(`La suma de reclutas fijos y asignaciones manuales excede el total de reclutas (${totalReclutasGeneral}). Ajuste las cantidades.`);
            targetFlexibleInputs.forEach(input => { input.value = 0; });
            remainingFlexibleReclutas = 0;
        } else if (targetFlexibleInputs.length > 0) {
            const basePerAsesor = Math.floor(remainingFlexibleReclutas / targetFlexibleInputs.length);
            let remainder = remainingFlexibleReclutas % targetFlexibleInputs.length;

            targetFlexibleInputs.forEach(input => {
                let assigned = basePerAsesor;
                if (remainder > 0) {
                    assigned += 1;
                    remainder -= 1;
                }
                input.value = assigned;
            });
        } else if (remainingFlexibleReclutas > 0 && flexibleAsesoresInputs.length > 0) {
            console.warn(`Quedan ${remainingFlexibleReclutas} reclutas sin asignar porque todos los asesores flexibles han sido asignados manualmente.`);
        }

        let currentTotalAssigned = 0;
        reclutasInputs.forEach(input => {
            currentTotalAssigned += parseInt(input.value, 10) || 0;
        });

        const totalFlexibleCalculated = currentTotalAssigned - totalFixedReclutas;
        const unassignedReclutas = totalReclutasGeneral - currentTotalAssigned;

        const summaryContainer = resultsContainer.querySelector('.summary-stats-container');
        if (!summaryContainer) {
            console.warn('No se encontro el contenedor de resumen para actualizar.');
            return;
        }

        let warningMessage = summaryContainer.querySelector('.no-asignados-warning');
        if (unassignedReclutas > 0) {
            if (!warningMessage) {
                warningMessage = document.createElement('div');
                warningMessage.className = 'stat-item error no-asignados-warning';
                summaryContainer.appendChild(warningMessage);
            }
            warningMessage.innerHTML = `
                <span class="stat-label"><i class="fas fa-exclamation-triangle"></i> No Asignados:</span>
                <span class="stat-value">${unassignedReclutas}</span>
            `;
        } else if (warningMessage) {
            warningMessage.remove();
        }

        const totalSummaryEl = document.getElementById('total-reclutas-summary');
        const fixedSummaryEl = document.getElementById('reclutas-fijos-summary');
        const flexibleSummaryEl = document.getElementById('reclutas-flexibles-summary');
        const asesoresSummaryEl = document.getElementById('asesores-flexibles-summary');
        const promedioSummaryEl = document.getElementById('promedio-flexible-summary');

        if (!totalSummaryEl || !fixedSummaryEl || !flexibleSummaryEl || !asesoresSummaryEl || !promedioSummaryEl) {
            console.warn('No se encontraron los elementos de resumen para actualizar.');
            return;
        }

        totalSummaryEl.textContent = totalReclutasGeneral;
        fixedSummaryEl.textContent = totalFixedReclutas;
        flexibleSummaryEl.textContent = totalFlexibleCalculated;
        asesoresSummaryEl.textContent = flexibleAsesoresInputs.length;

        const promedio = flexibleAsesoresInputs.length > 0 ? (totalFlexibleCalculated / flexibleAsesoresInputs.length).toFixed(2) : '0.00';
        promedioSummaryEl.textContent = promedio;
    },

    /**
     * ✅ NUEVA FUNCIÓN: Guarda la distribución de reclutas por asesor
     */
    saveAsesorDistribution: async function() {
        console.log('💾 Guardando distribución de reclutas por asesor...');
        const reclutasInputs = document.querySelectorAll('.reclutas-input');
        const distributionData = {};

        reclutasInputs.forEach(input => {
            const asesorId = input.dataset.asesorId;
            const count = parseInt(input.value, 10);
            const isFixed = document.querySelector(`.fixed-checkbox[data-asesor-id="${asesorId}"]`)?.checked || false;
            if (asesorId && !isNaN(count) && count >= 0) {
                distributionData[asesorId] = { count: count, is_fixed: isFixed };
            }
        });

        if (Object.keys(distributionData).length === 0) {
            showError('No hay datos válidos para guardar.');
            return;
        }

        const saveButton = document.getElementById('save-asesor-distribution');
        if (saveButton) {
            saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            saveButton.disabled = true;
        }

        try {
            const response = await fetch(`${CONFIG.API_URL}/reclutas/redistribuir-manual`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ distribution: distributionData })
            });

            const data = await response.json();

            if (data.success) {
                showSuccess('Distribución actualizada y reclutas redistribuidos.');
                // Recargar la tabla de distribución para reflejar los cambios
                this.showDistribucionResults(data);
                this.loadAndDisplayReclutas(); // Recargar la lista principal de reclutas
            } else {
                showError(data.message || 'Error al guardar la distribución.');
            }
        } catch (error) {
            console.error('❌ Error al guardar la distribución:', error);
            showError('Error al conectar con el servidor para guardar la distribución.');
        } finally {
            if (saveButton) {
                saveButton.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
                saveButton.disabled = false;
            }
        }
    },

    /**
     * ✅ NUEVA FUNCIÓN: Resetea modal de distribución
     */
    resetDistribucionModal: function() {
        // Resetear drop zone
        const dropZone = document.getElementById('distribucion-drop-zone');
        if (dropZone) {
            dropZone.innerHTML = `
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Haz clic para seleccionar archivo Excel</p>
                <small>o arrastra y suelta aquí</small>
            `;
            dropZone.style.backgroundColor = '';
            dropZone.style.borderColor = '';
        }
        
        // Ocultar elementos
        const elementsToHide = ['distribucion-progress', 'distribucion-results', 'confirm-distribucion'];
        elementsToHide.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
        
        // Limpiar archivo seleccionado
        this.selectedDistribucionFile = null;
        
        // Limpiar input
        const fileInput = document.getElementById('distribucion-excel-input');
        if (fileInput) fileInput.value = '';
    },

    /**
     * Configura características para gerentes
     */
    setupGerenteFeatures: function() {
        console.log('Configurando características de gerente');

        // Mostrar columna de asesor (como admin)
        this.showAsesorColumn();
        this.showAsesorSelectors();

        // Configurar filtro específico para gerentes (sus asesores asignados)
        this.setupGerenteAsesorFilter();

        // Los gerentes NO pueden subir/distribuir Excel (solo admins)
        
        // Mostrar selectores de asesor en formularios
        this.showAsesorSelectors();
        
        // Cargar asesores disponibles
        this.loadAsesores().then(() => {
            this.populateAsesorSelectors();
            this.populateAsesorFilter();
        });

        // Mensaje de bienvenida
        this.showGerenteWelcome();
        
        
    },

    /**
     * Configura características para asesores
     */
    setupAsesorFeatures: function() {
        console.log('Configurando características de asesor');
        
        // Ocultar columna de asesor
        this.hideAsesorColumn();
        
        // Ocultar selectores de asesor
        this.hideAsesorSelectors();
        
        // Mensaje de bienvenida
        this.showAsesorWelcome();
        
        
    },

    

    /**
     * ✅ NUEVA FUNCIÓN: Muestra selectores de asesor
     */
    showAsesorSelectors: function() {
        const asesorSelectors = document.querySelectorAll('.asesor-selector-group');
        asesorSelectors.forEach(group => {
            if (group) group.style.display = 'block';
        });
        
        console.log('Selectores de asesor mostrados');
    },

    /**
     * ✅ NUEVA FUNCIÓN: Oculta selectores de asesor
     */
    hideAsesorSelectors: function() {
        const asesorSelectors = document.querySelectorAll('.asesor-selector-group');
        asesorSelectors.forEach(group => {
            if (group) group.style.display = 'none';
        });
        
        console.log('Selectores de asesor ocultados');
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
            
            // Eventos de teclado para modales
            document.addEventListener('keydown', function(e) {
                // Cerrar submodal con Escape
                if (e.key === 'Escape') {
                    const timelineModal = document.getElementById('timeline-management-modal');
                    if (timelineModal && timelineModal.style.display === 'flex') {
                        Reclutas.closeTimelineModal();
                    }
                }
            });
            
            console.log('Módulo de reclutas inicializado correctamente');
            
        } catch (error) {
            console.error('Error al inicializar módulo de reclutas:', error);
            throw new Error('Error al inicializar reclutas: ' + error.message);
        }
    },

    /**
     * Muestra los detalles de un recluta en el modal
     * @param {number} id - ID del recluta a ver
     */
    viewRecluta: async function(id) {
        try {
            console.log('👁️ Viendo detalles del recluta:', id);
            
            // Verificar que el modal existe
            if (!this.ensureModalsInitialized()) {
                showError('Error: El modal de detalles no está disponible');
                return;
            }
            
            const modal = document.getElementById('view-recluta-modal');
            if (!modal) {
                showError('No se puede mostrar los detalles del recluta');
                return;
            }
            
            // Obtener datos del recluta
            const recluta = await this.getRecluta(id);
            this.currentReclutaId = id;
            
            // Rellenar elementos del modal
            const elements = {
                pic: document.getElementById('detail-recluta-pic'),
                nombre: document.getElementById('detail-recluta-nombre'),
                email: document.getElementById('detail-recluta-email'),
                telefono: document.getElementById('detail-recluta-telefono'),
                puesto: document.getElementById('detail-recluta-puesto'),
                folio: document.getElementById('detail-recluta-folio'),
                estado: document.getElementById('detail-recluta-estado'),
                asesor: document.getElementById('detail-recluta-asesor'),
                fecha: document.getElementById('detail-recluta-fecha'),
                notas: document.getElementById('detail-recluta-notas')
            };
            
            // Verificar elementos críticos
            const missingElements = [];
            ['nombre', 'email', 'telefono', 'estado'].forEach(key => {
                if (!elements[key]) missingElements.push(key);
            });
            
            if (missingElements.length > 0) {
                console.error('Elementos faltantes en modal:', missingElements);
                showError('Error: El modal no está completo');
                return;
            }
            
            // Rellenar datos
            if (elements.pic) {
                elements.pic.src = recluta.foto_url || '/api/placeholder/100/100';
            }
            if (elements.nombre) elements.nombre.textContent = recluta.nombre || 'N/A';
            if (elements.email) elements.email.textContent = recluta.email || 'N/A';
            if (elements.telefono) elements.telefono.textContent = recluta.telefono || 'N/A';
            if (elements.puesto) elements.puesto.textContent = recluta.puesto || 'No especificado';
            if (elements.folio) elements.folio.textContent = recluta.folio || 'N/A';
            if (elements.asesor) elements.asesor.textContent = recluta.asesor_nombre || 'No asignado';
            if (elements.fecha) {
                elements.fecha.textContent = recluta.fecha_registro 
                    ? new Date(recluta.fecha_registro).toLocaleDateString('es-ES')
                    : 'N/A';
            }
            if (elements.notas) elements.notas.textContent = recluta.notas || 'Sin notas';
            
            // Configurar badge de estado
            if (elements.estado) {
                const badgeClass = this.getEstadoBadgeClass(recluta.estado);
                elements.estado.className = `badge ${badgeClass}`;
                elements.estado.textContent = recluta.estado;
            }
            
            // Asegurar que está en modo vista (no edición)
            this.cancelEdit();
            
            // Mostrar modal
            UI.showModal('view-recluta-modal');
            
            console.log('✅ Modal de detalles mostrado correctamente');
            
        } catch (error) {
            console.error('❌ Error al ver recluta:', error);
            showError('Error al cargar los detalles: ' + error.message);
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
                asesor_id: this.filters.asesor_id !== 'todos' ? this.filters.asesor_id : '', 
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
            console.log('Reclutas: loadAndDisplayReclutas - Cargando reclutas...');
            const container = document.getElementById('reclutas-list');
            
            if (!container) {
                console.warn('Reclutas: loadAndDisplayReclutas - Contenedor #reclutas-list no encontrado.');
                return;
            }
            
            container.innerHTML = '<tr><td colspan="8" style="text-align:center"><i class="fas fa-spinner fa-spin"></i> Cargando reclutas...</td></tr>';
            
            const reclutas = await this.loadReclutas();
            console.log('Reclutas: loadAndDisplayReclutas - Reclutas cargados:', reclutas);
            
            // AGREGAR: Obtener rol del usuario desde la respuesta
            if (this.lastApiResponse && this.lastApiResponse.user_role) {
                this.userRole = this.lastApiResponse.user_role;
                this.configureUIForRole();
            }
            
            this.renderReclutasTable(container);
            this.updatePagination();
            
            console.log(`Reclutas: Se cargaron ${reclutas.length} reclutas`);
            return reclutas;
        } catch (error) {
            console.error('Reclutas: loadAndDisplayReclutas - Error al cargar y mostrar reclutas:', error);
                
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
            // ✅ CORREGIR COLSPAN - Siempre 9 columnas en HTML, CSS oculta las necesarias
            const colspan = '9';
            row.innerHTML = `<td colspan="${colspan}" style="text-align: center; padding: 20px;">
                <i class="fas fa-users"></i> No se encontraron reclutas. 
                <button class="btn-link" onclick="Reclutas.openAddReclutaModal()">¡Agrega tu primer recluta!</button>
            </td>`;
            container.appendChild(row);
            return;
        }
        
        this.reclutas.forEach(recluta => {
            const row = document.createElement('tr');
            
            const badgeClass = this.getEstadoBadgeClass(recluta.estado);
            const fotoUrl = this.getFotoUrl(recluta.foto_url);
            
            // ✅ SIEMPRE RENDERIZAR TODAS LAS COLUMNAS - CSS se encarga de ocultar
            row.innerHTML = `
                <td><img src="${fotoUrl}" alt="${recluta.nombre}" class="recluta-foto" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"></td>
                <td>${recluta.nombre}</td>
                <td>${recluta.email}</td>
                <td>${recluta.telefono}</td>
                <td>${recluta.puesto || 'No especificado'}</td>
                <td><span class="folio-display">${recluta.folio || 'N/A'}</span></td>
                <td><span class="badge ${badgeClass}">${recluta.estado}</span></td>
                <td class="asesor-column">${recluta.asesor_nombre || 'No asignado'}</td>
                <td class="actions-column">
                    <button class="action-btn view-btn" title="Ver detalles" data-id="${recluta.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" title="Editar" data-id="${recluta.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${['admin', 'gerente'].includes(this.userRole) ? `
                    <button class="action-btn delete-btn" title="Eliminar" data-id="${recluta.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    ` : ''}
                </td>
            `;
            
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
        const role = this.userRole || Auth.getUserRole() || 'asesor';
        this.userRole = role;
        
        console.log('🔧 Configurando UI de reclutas para rol:', role);
        
        // Añadir clase CSS al body según el rol (Jerarquía: Admin > Gerente > Asesor)
        document.body.classList.remove('admin-view', 'gerente-view', 'asesor-view');
        document.body.classList.add(`${role}-view`);
        
        if (role === 'admin') {
            this.setupAdminFeatures();
            console.log('✅ Modo ADMIN activado - Botones de acción visibles');
        } else if (role === 'gerente') {
            this.setupGerenteFeatures();
            console.log('✅ Modo GERENTE activado - Botones de acción visibles');
        } else {
            this.setupAsesorFeatures();
            console.log('✅ Modo ASESOR activado - Botones de acción visibles');
        }
        
        // ✅ VERIFICAR que los botones de acción sean visibles para AMBOS roles
        setTimeout(() => {
            const actionButtons = document.querySelectorAll('.action-btn');
            console.log(`🔍 Botones de acción encontrados: ${actionButtons.length}`);
            if (actionButtons.length === 0) {
                console.error('❌ NO se encontraron botones de acción - Problema en renderizado');
            }
        }, 1000);
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
        // Solo ejecutar si es admin
        if (this.userRole !== 'admin') {
            console.log('Saltando población de asesores - usuario no es admin');
            return;
        }
        
        const addSelector = document.getElementById('recluta-asesor');
        const editSelector = document.getElementById('edit-recluta-asesor');

        if (!this.asesores || this.asesores.length === 0) {
            console.log('No hay asesores cargados, intentando cargar...');
            this.loadAsesores()
                .then(() => this.populateAsesorSelectors())
                .catch(error => console.error('No se pudieron cargar los asesores:', error));
            return;
        }

        // Función para rellenar un selector
        const fillSelector = (selector) => {
            if (!selector) return;

            // Limpiar opciones existentes excepto la por defecto
            const defaultOption = selector.querySelector('option[value=""]');
            selector.innerHTML = '';

            // Restaurar opción por defecto
            if (defaultOption) {
                selector.appendChild(defaultOption.cloneNode(true));
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = '-- Seleccionar asesor --';
                selector.appendChild(option);
            }

            // Añadir opciones para cada asesor
            this.asesores.forEach(asesor => {
                const option = document.createElement('option');
                option.value = asesor.id;
                option.textContent = asesor.nombre || asesor.email;
                selector.appendChild(option);
            });
            
            console.log(`Selector poblado con ${this.asesores.length} asesores`);
        };

        // Rellenar ambos selectores
        fillSelector(addSelector);
        fillSelector(editSelector);
        
        console.log('Selectores de asesor poblados correctamente');
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
     * Configura los botones de acción para un recluta
     * @param {HTMLElement} row - Fila de la tabla
     * @param {number} reclutaId - ID del recluta
     */
    setupActionButtons: function(row, reclutaId) {
        if (!row || !reclutaId) {
            console.error('❌ setupActionButtons: Falta row o reclutaId');
            return;
        }
        
        console.log(`🔧 Configurando botones para recluta ${reclutaId}`);
        
        // Botón de ver detalles
        const viewBtn = row.querySelector('.view-btn');
        if (viewBtn) {
            // Limpiar eventos previos
            const newViewBtn = viewBtn.cloneNode(true);
            viewBtn.parentNode.replaceChild(newViewBtn, viewBtn);
            
            newViewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('👁️ Click en Ver recluta:', reclutaId);
                this.viewRecluta(reclutaId);
            });
            console.log('✅ Botón Ver configurado');
        } else {
            console.error('❌ Botón Ver NO encontrado');
        }

        // Botón de editar
        const editBtn = row.querySelector('.edit-btn');
        if (editBtn) {
            // Limpiar eventos previos
            const newEditBtn = editBtn.cloneNode(true);
            editBtn.parentNode.replaceChild(newEditBtn, editBtn);
            
            newEditBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('✏️ Click en Editar recluta:', reclutaId);
                this.editRecluta(reclutaId);
            });
            console.log('✅ Botón Editar configurado');
        } else {
            console.error('❌ Botón Editar NO encontrado');
        }

        // Botón de eliminar
        const deleteBtn = row.querySelector('.delete-btn');
        if (deleteBtn) {
            // Limpiar eventos previos
            const newDeleteBtn = deleteBtn.cloneNode(true);
            deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
            
            newDeleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🗑️ Click en Eliminar recluta:', reclutaId);
                this.confirmDeleteRecluta(reclutaId);
            });
            console.log('✅ Botón Eliminar configurado');
        } else {
            console.error('❌ Botón Eliminar NO encontrado');
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
     * Verifica si los modales están correctamente inicializados
     */
    ensureModalsInitialized: function() {
        // Verificar que el modal de detalles existe
        const viewModal = document.getElementById('view-recluta-modal');
        if (!viewModal) {
            console.error('Modal view-recluta-modal no encontrado');
            return false;
        }

        // Verificar que todos los elementos necesarios existen
        const requiredElements = [
            'detail-recluta-nombre',
            'detail-recluta-email', 
            'detail-recluta-telefono',
            'detail-recluta-estado',
            'view-mode-buttons',
            'edit-mode-form'
        ];

        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.error('Elementos faltantes en el modal:', missingElements);
            return false;
        }

        return true;
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
        if (!this.currentReclutaId) return;

        // Obtener datos del formulario de edición
        const reclutaData = {
            nombre: document.getElementById('edit-recluta-nombre')?.value || '',
            email: document.getElementById('edit-recluta-email')?.value || '',
            telefono: document.getElementById('edit-recluta-telefono')?.value || '',
            puesto: document.getElementById('edit-recluta-puesto')?.value || '',
            estado: document.getElementById('edit-recluta-estado')?.value || '',
            notas: document.getElementById('edit-recluta-notas')?.value || ''
        };

        // Validaciones básicas
        if (!reclutaData.nombre || !reclutaData.email || !reclutaData.telefono) {
            showError('Completa todos los campos requeridos');
            return;
        }

        const saveButton = document.querySelector('[data-action="save-changes"]');
        if (saveButton) {
            saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            saveButton.disabled = true;
        }

        try {
            const updatedRecluta = await this.updateRecluta(this.currentReclutaId, reclutaData);
            showSuccess(`Recluta "${updatedRecluta.nombre}" actualizado con éxito`);
            
            // Volver al modo vista
            this.cancelEdit();
            
            // Actualizar la vista de detalles
            this.viewRecluta(this.currentReclutaId);
            
            // Recargar la lista
            this.loadAndDisplayReclutas();
            
        } catch (error) {
            console.error('Error al guardar cambios:', error);
            showError('Error al guardar los cambios: ' + error.message);
        } finally {
            if (saveButton) {
                saveButton.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
                saveButton.disabled = false;
            }
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
     * NUEVO: Cambia el estado de un recluta
     * @param {number} reclutaId - ID del recluta
     * @param {string} nuevoEstado - Nuevo estado
     * @param {string} estadoActual - Estado actual
     */
    changeReclutaEstado: async function(reclutaId, nuevoEstado, estadoActual) {
        try {
            // Mostrar confirmación
            if (!confirm(`¿Cambiar estado de "${estadoActual}" a "${nuevoEstado}"?`)) {
                // Restaurar valor anterior si cancela
                const select = document.querySelector(`select[data-id="${reclutaId}"]`);
                if (select) select.value = estadoActual;
                return;
            }

            // Desactivar select durante el proceso
            const select = document.querySelector(`select[data-id="${reclutaId}"]`);
            if (select) {
                select.disabled = true;
                select.style.opacity = '0.5';
            }

            // Actualizar en el servidor
            const response = await fetch(`${CONFIG.API_URL}/reclutas/${reclutaId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.success) {
                // Actualizar en la lista local
                const reclutaIndex = this.reclutas.findIndex(r => r.id === reclutaId);
                if (reclutaIndex !== -1) {
                    this.reclutas[reclutaIndex].estado = nuevoEstado;
                }

                // Actualizar visualmente el badge
                const badge = select.parentNode.querySelector('.badge');
                if (badge) {
                    badge.className = `badge ${this.getEstadoBadgeClass(nuevoEstado)}`;
                    badge.textContent = nuevoEstado;
                }

                // Actualizar dataset del select
                select.dataset.current = nuevoEstado;
                
                showSuccess(`Estado cambiado a "${nuevoEstado}" exitosamente`);
                console.log(`Estado actualizado: ${estadoActual} → ${nuevoEstado}`);
            } else {
                throw new Error(data.message || 'Error al actualizar estado');
            }

        } catch (error) {
            console.error('Error al cambiar estado:', error);
            showError('Error al cambiar estado: ' + error.message);
            
            // Restaurar valor anterior en caso de error
            const select = document.querySelector(`select[data-id="${reclutaId}"]`);
            if (select) select.value = estadoActual;
        } finally {
            // Reactivar select
            const select = document.querySelector(`select[data-id="${reclutaId}"]`);
            if (select) {
                select.disabled = false;
                select.style.opacity = '1';
            }
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
        const addButton = document.getElementById('open-add-recluta-modal');
        if (addButton) {
            addButton.addEventListener('click', () => {
                this.openAddReclutaModal();
            });
            console.log('Evento de botón Agregar Recluta inicializado');
        } else {
            console.error('Botón Agregar Recluta no encontrado en el DOM');
        }

        const modal = document.getElementById('add-recluta-modal');
        if (!modal) return;

        // ✅ ELIMINAR ONCLICK Y USAR SOLO EVENT LISTENER
        const saveButton = modal.querySelector('.btn-primary');
        if (saveButton) {
            // Limpiar cualquier onclick existente
            saveButton.removeAttribute('onclick');
            saveButton.addEventListener('click', () => {
                this.saveNewRecluta();
            });
        }

        const closeButtons = modal.querySelectorAll('.close-modal, .btn-secondary');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                UI.closeModal('add-recluta-modal');
            });
        });

        const fotoInput = document.getElementById('recluta-upload');
        if (fotoInput) {
            fotoInput.addEventListener('change', this.handleReclutaImageChange);
        }
    },

    /**
     * Abrir modal con verificaciones
     */
    openAddReclutaModal: function() {
        console.log('🔄 Abriendo modal de agregar recluta...');
        
        const modal = document.getElementById('add-recluta-modal');
        if (!modal) {
            console.error('❌ Modal add-recluta-modal no encontrado');
            showError('Error: No se puede abrir el formulario');
            return;
        }
        
        // Verificar que los elementos del formulario existan
        if (!this.verifyFormElements()) {
            showError('Error: El formulario no está completo. Recarga la página.');
            return;
        }
        
        // Mostrar modal
        modal.style.display = 'block';
        console.log('✅ Modal mostrado correctamente');
        
        // Limpiar formulario
        const form = document.getElementById('add-recluta-form');
        if (form) {
            form.reset();
            
            // Establecer valor por defecto para estado
            const estadoSelect = document.getElementById('recluta-estado');
            if (estadoSelect) {
                estadoSelect.value = 'En proceso';
            }
        }
        
        // Limpiar preview de imagen
        const picPreview = document.getElementById('recluta-pic-preview');
        if (picPreview) {
            picPreview.innerHTML = '<i class="fas fa-user-circle"></i>';
        }
        
        // Si es admin, asegurar que el selector de asesor esté poblado
        if (this.userRole === 'admin' && this.asesores && this.asesores.length > 0) {
            this.populateAsesorSelectors();
        }
        
        // Enfocar el primer campo
        const nombreInput = document.getElementById('recluta-nombre');
        if (nombreInput) {
            setTimeout(() => nombreInput.focus(), 100);
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
     * 🔥 FUNCIÓN CORREGIDA: Guarda un nuevo recluta con validación defensiva
     */
    saveNewRecluta: async function() {
        console.log('🔄 Iniciando guardado de nuevo recluta...');
        
        const modal = document.getElementById('add-recluta-modal');
        if (!modal) {
            console.error('❌ Modal add-recluta-modal no encontrado');
            showError('Error: Modal no encontrado');
            return;
        }

        const form = document.getElementById('add-recluta-form');
        if (!form) {
            console.error('❌ Formulario add-recluta-form no encontrado');
            showError('Error: Formulario no encontrado');
            return;
        }

        // 🛡️ VALIDACIÓN DEFENSIVA: Verificar que todos los elementos existan
        const elementos = {
            nombre: document.getElementById('recluta-nombre'),
            email: document.getElementById('recluta-email'),
            telefono: document.getElementById('recluta-telefono'),
            estado: document.getElementById('recluta-estado'),
            puesto: document.getElementById('recluta-puesto'),
            notas: document.getElementById('recluta-notas'),
            asesor: document.getElementById('recluta-asesor')
        };

        // Verificar elementos críticos (requeridos)
        const elementosRequeridos = ['nombre', 'email', 'telefono', 'estado'];
        const elementosFaltantes = [];

        for (const campo of elementosRequeridos) {
            if (!elementos[campo]) {
                elementosFaltantes.push(campo);
            }
        }

        if (elementosFaltantes.length > 0) {
            console.error('❌ Elementos faltantes en el DOM:', elementosFaltantes);
            showError(`Error: Campos faltantes en el formulario: ${elementosFaltantes.join(', ')}`);
            return;
        }

        // 📝 EXTRACCIÓN SEGURA DE DATOS
        const reclutaData = {
            nombre: elementos.nombre.value?.trim() || '',
            email: elementos.email.value?.trim() || '',
            telefono: elementos.telefono.value?.trim() || '',
            estado: elementos.estado.value || 'En proceso',
            puesto: elementos.puesto?.value?.trim() || '',
            notas: elementos.notas?.value?.trim() || '',
            asesor_id: elementos.asesor?.value || null
        };

        console.log('📋 Datos extraídos:', reclutaData);

        // 🔍 VALIDACIONES FRONTEND
        if (!reclutaData.nombre) {
            showError('El nombre es requerido');
            elementos.nombre.focus();
            return;
        }

        if (!reclutaData.email) {
            showError('El email es requerido');
            elementos.email.focus();
            return;
        }

        if (!reclutaData.telefono) {
            showError('El teléfono es requerido');
            elementos.telefono.focus();
            return;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(reclutaData.email)) {
            showError('Por favor, ingresa un email válido');
            elementos.email.focus();
            return;
        }

        // 🔄 ESTADO DE CARGA
        const saveButton = modal.querySelector('.btn-primary');
        const originalButtonHTML = saveButton?.innerHTML;
        
        if (saveButton) {
            saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            saveButton.disabled = true;
        }

        try {
            // 📸 MANEJO DE FOTO
            const fotoInput = document.getElementById('recluta-upload');
            const foto = fotoInput && fotoInput.files && fotoInput.files.length > 0 ? fotoInput.files[0] : null;

            if (foto) {
                console.log('📸 Foto seleccionada:', foto.name, 'Tamaño:', foto.size);
            }

            // 🚀 ENVIAR DATOS AL SERVIDOR
            console.log('🚀 Enviando datos al servidor...');
            const newRecluta = await this.addRecluta(reclutaData, foto);
            
            console.log('✅ Recluta creado exitosamente:', newRecluta);
            showSuccess(`Recluta "${newRecluta.nombre}" añadido con éxito`);
            
            // 🔄 ACTUALIZAR INTERFAZ
            if (typeof UI !== 'undefined' && UI.closeModal) {
                UI.closeModal('add-recluta-modal');
            } else {
                modal.style.display = 'none';
            }
            
            // Limpiar formulario
            form.reset();
            const picPreview = document.getElementById('recluta-pic-preview');
            if (picPreview) {
                picPreview.innerHTML = '<i class="fas fa-user-circle"></i>';
            }
            
            // Recargar lista de reclutas
            await this.loadAndDisplayReclutas();

        } catch (error) {
            console.error('❌ Error al guardar recluta:', error);
            
            // Mostrar error específico si está disponible
            let errorMessage = 'Error al guardar el recluta';
            if (error.message) {
                errorMessage += ': ' + error.message;
            }
            
            showError(errorMessage);
            
        } finally {
            // 🔄 RESTAURAR ESTADO DEL BOTÓN
            if (saveButton && originalButtonHTML) {
                saveButton.innerHTML = originalButtonHTML;
                saveButton.disabled = false;
            }
        }
    },

    /**
     * Verificar si el DOM está listo para el formulario
     */
    verifyFormElements: function() {
        const requiredElements = [
            'recluta-nombre',
            'recluta-email', 
            'recluta-telefono',
            'recluta-estado'
        ];
        
        const missing = [];
        requiredElements.forEach(id => {
            if (!document.getElementById(id)) {
                missing.push(id);
            }
        });
        
        if (missing.length > 0) {
            console.warn('⚠️ Elementos faltantes en el formulario:', missing);
            return false;
        }
        
        console.log('✅ Todos los elementos del formulario están presentes');
        return true;
    },

    /**
     * 🎯 FUNCIONES DE GESTIÓN DE TIMELINE - NUEVAS
     */

    /**
     * Abre el submodal de gestión de timeline
     */
    openTimelineModal: function() {
        if (!this.currentReclutaId) {
            showError('No hay un recluta seleccionado');
            return;
        }

        console.log('🎯 Abriendo gestión de timeline para recluta:', this.currentReclutaId);
        
        const modal = document.getElementById('timeline-management-modal');
        if (!modal) {
            showError('El modal de timeline no está disponible');
            return;
        }

        // Mostrar modal
        modal.style.display = 'flex';
        
        // Cargar datos de timeline desde backend
        this.fetchAndRenderTimeline();
    },

    /**
     * Obtiene del backend los eventos de timeline y renderiza la lista/estadísticas
     */
    fetchAndRenderTimeline: async function() {
        try {
            const resp = await fetch(`${CONFIG.API_URL}/reclutas/${this.currentReclutaId}/timeline`);
            const data = await resp.json();
            if (resp.ok && data.success) {
                this.currentTimelineData = (data.items || []).map(e => ({
                    id: e.id,
                    date: e.date,
                    status: e.status,
                    title: e.title,
                    description: e.description || ''
                }));
            } else {
                this.currentTimelineData = [];
            }
        } catch (e) {
            console.error('Error cargando timeline:', e);
            this.currentTimelineData = [];
        }
        this.renderTimelineList();
        this.updateTimelineStats();
    },

    /**
     * Cierra el submodal de timeline
     */
    closeTimelineModal: function() {
        const modal = document.getElementById('timeline-management-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Cancelar formulario si está abierto
        this.cancelTimelineForm();
    },

    /**
     * Carga los datos de timeline (simulados por ahora)
     */
    loadTimelineData: function() {
        console.log('📊 Cargando datos de timeline...');
        
        // Datos simulados hasta implementar backend
        this.currentTimelineData = [
            {
                id: 1,
                date: '2025-08-28',
                status: 'completed',
                title: 'Recepción de CV',
                description: 'Se recibió y procesó el currículum vitae del candidato.'
            },
            {
                id: 2,
                date: '2025-08-30',
                status: 'completed',
                title: 'Primera Entrevista',
                description: 'Entrevista inicial telefónica realizada exitosamente.'
            },
            {
                id: 3,
                date: '2025-09-02',
                status: 'pending',
                title: 'Entrevista Técnica',
                description: 'Programada entrevista técnica con el equipo de desarrollo.'
            }
        ];
        
        this.renderTimelineList();
        this.updateTimelineStats();
    },

    /**
     * Renderiza la lista de eventos de timeline
     */
    renderTimelineList: function() {
        const container = document.getElementById('timeline-list');
        const emptyState = document.getElementById('empty-timeline');
        
        if (!container) return;
        
        if (!this.currentTimelineData || this.currentTimelineData.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        // Ordenar por fecha
        const sortedData = [...this.currentTimelineData].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        const html = sortedData.map(item => {
            const formattedDate = new Date(item.date).toLocaleDateString('es-ES');
            const statusIcons = {
                completed: 'fas fa-check-circle',
                pending: 'fas fa-clock',
                cancelled: 'fas fa-times-circle'
            };
            const statusTexts = {
                completed: 'Completado',
                pending: 'Pendiente',
                cancelled: 'Cancelado'
            };

            return `
                <div class="timeline-item" data-id="${item.id}">
                    <div class="timeline-item-header">
                        <div class="timeline-item-date">${formattedDate}</div>
                        <div class="timeline-item-status ${item.status}">
                            <i class="${statusIcons[item.status]}"></i> ${statusTexts[item.status]}
                        </div>
                    </div>
                    <div class="timeline-item-title">${item.title}</div>
                    <div class="timeline-item-description">${item.description || 'Sin descripción'}</div>
                    <div class="timeline-item-actions">
                        <button class="btn btn-outline" onclick="(window.reclutaManager || window.Reclutas).editTimelineItem(${item.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-danger" onclick="(window.reclutaManager || window.Reclutas).deleteTimelineItemApi(${item.id})">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
    },

    /**
     * Actualiza las estadísticas de timeline
     */
    updateTimelineStats: function() {
        if (!this.currentTimelineData) return;
        
        const total = this.currentTimelineData.length;
        const completed = this.currentTimelineData.filter(item => item.status === 'completed').length;
        const pending = this.currentTimelineData.filter(item => item.status === 'pending').length;
        
        const totalElement = document.getElementById('total-eventos');
        const completedElement = document.getElementById('eventos-completados');
        const pendingElement = document.getElementById('eventos-pendientes');
        
        if (totalElement) totalElement.textContent = total;
        if (completedElement) completedElement.textContent = completed;
        if (pendingElement) pendingElement.textContent = pending;
    },

    /**
     * Agrega un nuevo evento de timeline
     */
    addTimelineItem: function() {
        this.currentEditingTimelineId = null;
        
        // Resetear formulario
        const form = document.getElementById('timeline-form');
        const formTitle = document.getElementById('form-title');
        
        if (formTitle) formTitle.textContent = 'Agregar Evento de Timeline';
        
        // Limpiar campos
        document.getElementById('event-date').value = '';
        document.getElementById('event-status').value = 'pending';
        document.getElementById('event-title').value = '';
        document.getElementById('event-description').value = '';
        
        // Mostrar formulario
        if (form) form.style.display = 'block';
        
        // Scroll al formulario
        form.scrollIntoView({ behavior: 'smooth' });
    },

    /**
     * Edita un evento existente
     */
    editTimelineItem: function(id) {
        const item = this.currentTimelineData.find(item => item.id === id);
        if (!item) {
            showError('Evento no encontrado');
            return;
        }
        
        this.currentEditingTimelineId = id;
        
        // Rellenar formulario
        const formTitle = document.getElementById('form-title');
        if (formTitle) formTitle.textContent = 'Editar Evento de Timeline';
        
        document.getElementById('event-date').value = item.date;
        document.getElementById('event-status').value = item.status;
        document.getElementById('event-title').value = item.title;
        document.getElementById('event-description').value = item.description || '';
        
        // Mostrar formulario
        const form = document.getElementById('timeline-form');
        if (form) {
            form.style.display = 'block';
            form.scrollIntoView({ behavior: 'smooth' });
        }
    },

    /**
     * Guarda un evento de timeline (nuevo o editado)
     */
    saveTimelineItem: function() {
        const date = document.getElementById('event-date').value;
        const status = document.getElementById('event-status').value;
        const title = document.getElementById('event-title').value;
        const description = document.getElementById('event-description').value;
        
        // Validaciones básicas
        if (!date || !status || !title) {
            showError('Por favor completa todos los campos obligatorios');
            return;
        }
        
        const eventData = {
            date,
            status,
            title,
            description: description || ''
        };
        
        if (this.currentEditingTimelineId) {
            // Editar existente
            const index = this.currentTimelineData.findIndex(item => item.id === this.currentEditingTimelineId);
            if (index !== -1) {
                this.currentTimelineData[index] = {
                    ...eventData,
                    id: this.currentEditingTimelineId
                };
            }
            showSuccess('Evento actualizado correctamente');
        } else {
            // Crear nuevo
            const newId = Math.max(...this.currentTimelineData.map(item => item.id), 0) + 1;
            this.currentTimelineData.push({
                ...eventData,
                id: newId
            });
            showSuccess('Evento creado correctamente');
        }
        
        // Actualizar vista
        this.renderTimelineList();
        this.updateTimelineStats();
        this.cancelTimelineForm();
        
        // TODO: Aquí se implementará la llamada al backend
        console.log('💾 Datos de timeline actualizados:', this.currentTimelineData);
    },

    /**
     * Elimina un evento de timeline
     */
    deleteTimelineItem: function(id) {
        if (!confirm('¿Estás seguro de que deseas eliminar este evento?')) {
            return;
        }
        
        this.currentTimelineData = this.currentTimelineData.filter(item => item.id !== id);
        
        this.renderTimelineList();
        this.updateTimelineStats();
        
        showSuccess('Evento eliminado correctamente');
        
        // TODO: Aquí se implementará la llamada al backend
        console.log('🗑️ Evento eliminado, timeline actualizada:', this.currentTimelineData);
    },

    /**
     * Cancela el formulario de timeline
     */
    cancelTimelineForm: function() {
        const form = document.getElementById('timeline-form');
        if (form) form.style.display = 'none';
        
        this.currentEditingTimelineId = null;
    },

    /**
     * Muestra vista previa del timeline para el portal público
     */
    previewTimeline: function() {
        console.log('👁️ Vista previa del timeline:', this.currentTimelineData);
        
        // Por ahora solo mostrar alerta
        showSuccess('Vista previa: Esta funcionalidad abrirá una simulación del portal público');
        
        // TODO: Implementar ventana de previsualización
    }

};

// Exponer funciones al ámbito global
window.addRecluta = function() {
    Reclutas.saveNewRecluta();
};

// Exponer reclutaManager para uso en onclick del HTML
// Métodos API para persistir eventos (nuevos, no invasivos)
Reclutas.saveTimelineItemApi = async function() {
    const date = document.getElementById('event-date').value;
    const status = document.getElementById('event-status').value;
    const title = document.getElementById('event-title').value;
    const description = document.getElementById('event-description').value;
    if (!date || !status || !title) { showError('Por favor completa todos los campos obligatorios'); return; }
    const payload = { date, status, title, description: description || '' };
    try {
        let url = `${CONFIG.API_URL}/reclutas/${Reclutas.currentReclutaId}/timeline`;
        let method = 'POST';
        if (Reclutas.currentEditingTimelineId) {
            url = `${url}/${Reclutas.currentEditingTimelineId}`;
            method = 'PUT';
        }
        const resp = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await resp.json();
        if (!resp.ok || !data.success) throw new Error(data.message || 'No se pudo guardar el evento');
        showSuccess(Reclutas.currentEditingTimelineId ? 'Evento actualizado correctamente' : 'Evento creado correctamente');
        await Reclutas.fetchAndRenderTimeline();
        Reclutas.cancelTimelineForm();
    } catch (e) {
        console.error('Error guardando evento:', e);
        showError(e.message || 'Error al guardar el evento');
    }
};

Reclutas.deleteTimelineItemApi = async function(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este evento?')) return;
    try {
        const resp = await fetch(`${CONFIG.API_URL}/reclutas/${Reclutas.currentReclutaId}/timeline/${id}`, { method: 'DELETE' });
        const data = await resp.json();
        if (!resp.ok || !data.success) throw new Error(data.message || 'No se pudo eliminar el evento');
        showSuccess('Evento eliminado correctamente');
        await Reclutas.fetchAndRenderTimeline();
    } catch (e) {
        console.error('Error eliminando evento:', e);
        showError(e.message || 'Error al eliminar el evento');
    }
};

// ==============================
// Gestión de Documentos (submodal)
// ==============================
Reclutas.openDocumentsModal = function() {
    if (!Reclutas.currentReclutaId) { showError('No hay un recluta seleccionado'); return; }
    const modal = document.getElementById('documents-management-modal');
    if (!modal) { showError('El modal de documentos no está disponible'); return; }
    modal.style.display = 'flex';
    Reclutas.fetchAndRenderDocumentos();
};

Reclutas.closeDocumentsModal = function() {
    const modal = document.getElementById('documents-management-modal');
    if (modal) modal.style.display = 'none';
};

Reclutas.fetchAndRenderDocumentos = async function() {
    try {
        const resp = await fetch(`${CONFIG.API_URL}/reclutas/${Reclutas.currentReclutaId}/documentos`);
        const data = await resp.json();
        if (!resp.ok || !data.success) throw new Error(data.message || 'No se pudieron cargar los documentos');
        Reclutas.renderDocumentosList(data.documentos || []);
    } catch (e) {
        console.error('Error cargando documentos:', e);
        showError(e.message || 'Error al cargar documentos');
        Reclutas.renderDocumentosList([]);
    }
};

Reclutas.renderDocumentosList = function(items) {
    const list = document.getElementById('recluta-documentos-list');
    const empty = document.getElementById('empty-documentos');
    if (!list) return;
    
    // Actualizar estadísticas
    const totalDocs = items ? items.length : 0;
    const totalSize = items ? items.reduce((sum, d) => sum + (d.tamano || 0), 0) : 0;
    const sizeFormatted = Reclutas.formatFileSize(totalSize);
    
    const totalDocsEl = document.getElementById('total-documentos');
    const sizeDocsEl = document.getElementById('size-documentos');
    if (totalDocsEl) totalDocsEl.textContent = totalDocs;
    if (sizeDocsEl) sizeDocsEl.textContent = sizeFormatted;
    
    if (!items || items.length === 0) {
        if (empty) empty.style.display = 'block';
        list.innerHTML = empty ? empty.outerHTML : '<div class="empty-documents">No hay documentos</div>';
        return;
    }
    if (empty) empty.style.display = 'none';
    
    const html = items.map(d => `
        <div class="document-item" data-id="${d.id}" style="display: flex; align-items: center; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 16px; background: white; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.05);" 
             onmouseover="this.style.boxShadow='0 8px 25px rgba(0,0,0,0.1)'; this.style.transform='translateY(-2px)';" 
             onmouseout="this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)'; this.style.transform='translateY(0)';">
            
            <div class="document-icon" style="width: 56px; height: 56px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 20px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">
                <i class="fas fa-file-pdf" style="color: white; font-size: 24px;"></i>
            </div>
            
            <div class="document-info" style="flex: 1; min-width: 0; margin-right: 20px;">
                <div class="document-name" style="font-weight: 700; color: #1a202c; margin-bottom: 6px; word-break: break-word; font-size: 16px;">${d.nombre || 'Documento sin nombre'}</div>
                <div class="document-meta" style="font-size: 13px; color: #718096; display: flex; align-items: center; gap: 16px;">
                    <span style="display: flex; align-items: center; gap: 4px;">
                        <i class="fas fa-calendar-alt" style="color: #4299e1;"></i> 
                        ${d.fecha_subida ? new Date(d.fecha_subida).toLocaleDateString('es-ES') : 'Fecha desconocida'}
                    </span>
                    ${d.tamano ? `<span style="display: flex; align-items: center; gap: 4px;">
                        <i class="fas fa-hdd" style="color: #38b2ac;"></i> 
                        ${Reclutas.formatFileSize(d.tamano)}
                    </span>` : ''}
                    <span style="display: flex; align-items: center; gap: 4px;">
                        <i class="fas fa-shield-alt" style="color: #48bb78;"></i> 
                        PDF Seguro
                    </span>
                </div>
            </div>
            
            <div class="document-actions" style="display: flex; gap: 12px; align-items: center;">
                <!-- Botón Vista Previa -->
                <button class="doc-btn doc-btn-preview" 
                        onclick="event.stopPropagation(); Reclutas.previewDocument('${d.url}', '${d.nombre}')" 
                        title="Vista previa del documento" 
                        style="padding: 10px 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3); z-index: 10; position: relative;"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(102, 126, 234, 0.3)';">
                    <i class="fas fa-eye"></i>
                    <span>Vista Previa</span>
                </button>
                
                <!-- Botón Descargar -->
                <button class="doc-btn doc-btn-download" 
                        onclick="event.stopPropagation(); Reclutas.downloadDocument('${d.url}', '${d.nombre}')" 
                        title="Descargar documento" 
                        style="padding: 10px 16px; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; border: none; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(72, 187, 120, 0.3); z-index: 10; position: relative;"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(72, 187, 120, 0.4)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(72, 187, 120, 0.3)';">
                    <i class="fas fa-download"></i>
                    <span>Descargar</span>
                </button>
                
                <!-- Botón Eliminar -->
                <button class="doc-btn doc-btn-delete" 
                        onclick="event.stopPropagation(); Reclutas.deleteDocumentoWithConfirmation(${d.id}, '${d.nombre}')" 
                        title="Eliminar documento permanentemente" 
                        style="padding: 10px 16px; background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%); color: white; border: none; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(245, 101, 101, 0.3); z-index: 10; position: relative;"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(245, 101, 101, 0.4)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(245, 101, 101, 0.3)';">
                    <i class="fas fa-trash-alt"></i>
                    <span>Eliminar</span>
                </button>
            </div>
        </div>
    `).join('');
    list.innerHTML = html;
};

// Función auxiliar para formatear tamaño de archivos
Reclutas.formatFileSize = function(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

Reclutas.uploadDocumento = async function() {
    if (!Reclutas.currentReclutaId) { showError('No hay un recluta seleccionado'); return; }
    const input = document.getElementById('recluta-documento');
    if (!input || !input.files || !input.files[0]) { showError('Selecciona un archivo PDF'); return; }
    const file = input.files[0];
    
    // Validación final
    if (!file.name.toLowerCase().endsWith('.pdf') || file.type !== 'application/pdf') { 
        showError('Solo se permiten archivos PDF válidos'); 
        Reclutas.resetUploadState(); 
        return; 
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB límite
        showError('El archivo no puede ser mayor a 10MB'); 
        Reclutas.resetUploadState();
        return; 
    }
    
    // Mostrar progreso
    const uploadBtn = document.getElementById('upload-btn');
    const uploadProgress = document.getElementById('upload-progress');
    const uploadProgressFill = document.querySelector('.upload-progress-fill');
    const uploadProgressText = document.querySelector('.upload-progress-text');
    
    try {
        // Deshabilitar botón y mostrar progreso
        if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
        }
        if (uploadProgress) uploadProgress.style.display = 'block';
        if (uploadProgressText) uploadProgressText.textContent = 'Subiendo documento...';
        
        // Simular progreso
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 90) progress = 90;
            if (uploadProgressFill) uploadProgressFill.style.width = `${progress}%`;
        }, 100);
        
        const fd = new FormData();
        fd.append('documento', file);
        
        const resp = await fetch(`${CONFIG.API_URL}/reclutas/${Reclutas.currentReclutaId}/documentos`, { 
            method: 'POST', 
            body: fd 
        });
        const data = await resp.json();
        
        clearInterval(progressInterval);
        if (uploadProgressFill) uploadProgressFill.style.width = '100%';
        if (uploadProgressText) uploadProgressText.textContent = 'Completado';
        
        if (!resp.ok || !data.success) throw new Error(data.message || 'No se pudo subir el documento');
        
        showSuccess('Documento subido correctamente');
        await Reclutas.fetchAndRenderDocumentos();
        
        // Reset después de éxito
        setTimeout(() => {
            Reclutas.resetUploadState();
        }, 1000);
        
    } catch (e) {
        console.error('Error subiendo documento:', e);
        showError(e.message || 'Error al subir el documento');
        Reclutas.resetUploadState();
    }
};

// Función para resetear el estado de upload
Reclutas.resetUploadState = function() {
    const input = document.getElementById('recluta-documento');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadProgress = document.getElementById('upload-progress');
    const uploadZone = document.getElementById('upload-zone');
    
    // Resetear input
    if (input) input.value = '';
    
    // Resetear botón
    if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Subir Documento';
    }
    
    // Ocultar progreso
    if (uploadProgress) uploadProgress.style.display = 'none';
    
    // Resetear zona de upload
    if (uploadZone) {
        uploadZone.style.borderColor = '#cbd5e0';
        uploadZone.style.background = '#f7fafc';
        const content = uploadZone.querySelector('.upload-zone-content');
        if (content) {
            content.innerHTML = `
                <i class="fas fa-cloud-upload-alt" style="font-size: 48px; color: #667eea; margin-bottom: 16px;"></i>
                <h4 style="color: #2d3748; margin: 0 0 8px 0; font-weight: 600;">Arrastra tu archivo PDF aquí</h4>
                <p style="color: #718096; margin: 0 0 16px 0;">o haz clic para seleccionar un archivo</p>
                <div class="upload-file-info">
                    <small style="color: #a0aec0;"><i class="fas fa-info-circle"></i> Solo archivos PDF, máximo 10MB</small>
                </div>
            `;
        }
    }
};

// Función mejorada para vista previa de documentos
Reclutas.previewDocument = function(url, nombre) {
    try {
        // Abrir en nueva ventana con características específicas para PDF
        const previewWindow = window.open(
            `/uploads/${url}`, 
            'document-preview', 
            'width=1000,height=800,scrollbars=yes,resizable=yes,toolbar=no,location=no,status=no'
        );
        
        if (!previewWindow) {
            // Fallback si se bloquea popup
            const link = document.createElement('a');
            link.href = `/uploads/${url}`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.click();
        } else {
            previewWindow.document.title = `Vista Previa: ${nombre}`;
        }
        
        // Mostrar notificación de éxito
        showSuccess(`Abriendo vista previa de "${nombre}"`);
    } catch (e) {
        console.error('Error al abrir vista previa:', e);
        showError('No se pudo abrir la vista previa del documento');
    }
};

// Función mejorada para descarga directa
Reclutas.downloadDocument = function(url, nombre) {
    try {
        // Crear elemento de descarga temporal
        const link = document.createElement('a');
        link.href = `/uploads/${url}`;
        link.download = nombre || 'documento.pdf';
        link.style.display = 'none';
        
        // Agregar al DOM, hacer clic y remover
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Mostrar notificación de éxito
        showSuccess(`Descargando "${nombre}"`);
    } catch (e) {
        console.error('Error al descargar documento:', e);
        showError('No se pudo descargar el documento');
    }
};

// Función mejorada para eliminar con confirmación avanzada
Reclutas.deleteDocumentoWithConfirmation = async function(id, nombre) {
    // Crear modal de confirmación personalizado
    const confirmModal = `
        <div id="delete-confirm-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 32px; border-radius: 16px; max-width: 500px; margin: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
                        <i class="fas fa-exclamation-triangle" style="color: white; font-size: 28px;"></i>
                    </div>
                    <h3 style="color: #2d3748; margin-bottom: 8px; font-weight: 700;">¿Eliminar Documento?</h3>
                    <p style="color: #718096; margin: 0; font-size: 14px;">Esta acción no se puede deshacer</p>
                </div>
                
                <div style="background: #f7fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <i class="fas fa-file-pdf" style="color: #ef4444; font-size: 20px;"></i>
                        <div>
                            <div style="font-weight: 600; color: #2d3748; font-size: 14px;">${nombre}</div>
                            <div style="font-size: 12px; color: #718096;">Documento PDF</div>
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button onclick="document.getElementById('delete-confirm-modal').remove()" style="padding: 12px 24px; background: #e2e8f0; color: #4a5568; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                        Cancelar
                    </button>
                    <button onclick="Reclutas.confirmDeleteDocument(${id})" style="padding: 12px 24px; background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                        Sí, Eliminar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Insertar modal en el DOM
    document.body.insertAdjacentHTML('beforeend', confirmModal);
};

// Función para confirmar eliminación
Reclutas.confirmDeleteDocument = async function(id) {
    // Cerrar modal
    const modal = document.getElementById('delete-confirm-modal');
    if (modal) modal.remove();
    
    try {
        const resp = await fetch(`${CONFIG.API_URL}/documentos/${id}`, { method: 'DELETE' });
        const data = await resp.json();
        if (!resp.ok || !data.success) throw new Error(data.message || 'No se pudo eliminar el documento');
        showSuccess('Documento eliminado correctamente');
        await Reclutas.fetchAndRenderDocumentos();
    } catch (e) {
        console.error('Error eliminando documento:', e);
        showError(e.message || 'Error al eliminar documento');
    }
};

// Función para exportar todos los documentos
Reclutas.exportAllDocuments = async function() {
    if (!Reclutas.currentReclutaId) {
        showError('No hay un recluta seleccionado');
        return;
    }
    
    try {
        // Obtener datos del recluta actual para el nombre
        const resp = await fetch(`${CONFIG.API_URL}/reclutas/${Reclutas.currentReclutaId}/documentos`);
        const data = await resp.json();
        
        if (!data.success || !data.documentos || data.documentos.length === 0) {
            showError('No hay documentos para exportar');
            return;
        }
        
        showSuccess(`Preparando descarga de ${data.documentos.length} documentos...`);
        
        // Descargar cada documento con un pequeño delay
        data.documentos.forEach((doc, index) => {
            setTimeout(() => {
                Reclutas.downloadDocument(doc.url, doc.nombre);
            }, index * 500); // 500ms entre cada descarga
        });
        
    } catch (e) {
        console.error('Error al exportar documentos:', e);
        showError('Error al exportar los documentos');
    }
};

// Función original para compatibilidad
Reclutas.deleteDocumento = async function(id) {
    return Reclutas.deleteDocumentoWithConfirmation(id, 'Documento');
};

// Función global para validar archivos PDF
window.validatePDFFile = function(input) {
    if (!input.files || !input.files[0]) {
        const uploadBtn = document.getElementById('upload-btn');
        if (uploadBtn) uploadBtn.disabled = true;
        return false;
    }
    const file = input.files[0];
    
    if (!file.name.toLowerCase().endsWith('.pdf') || file.type !== 'application/pdf') {
        showError('Solo se permiten archivos PDF válidos');
        input.value = '';
        const uploadBtn = document.getElementById('upload-btn');
        if (uploadBtn) uploadBtn.disabled = true;
        return false;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB límite
        showError('El archivo no puede ser mayor a 10MB');
        input.value = '';
        const uploadBtn = document.getElementById('upload-btn');
        if (uploadBtn) uploadBtn.disabled = true;
        return false;
    }
    
    // Activar botón de subida
    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn) {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = `<i class="fas fa-upload"></i> Subir "${file.name}"`;
    }
    
    // Actualizar zona de upload
    const uploadZone = document.getElementById('upload-zone');
    if (uploadZone) {
        uploadZone.style.borderColor = '#48bb78';
        uploadZone.style.background = '#f0fff4';
        const content = uploadZone.querySelector('.upload-zone-content');
        if (content) {
            content.innerHTML = `
                <i class="fas fa-check-circle" style="font-size: 48px; color: #48bb78; margin-bottom: 16px;"></i>
                <h4 style="color: #2d3748; margin: 0 0 8px 0; font-weight: 600;">Archivo seleccionado</h4>
                <p style="color: #718096; margin: 0 0 16px 0;">${file.name} (${Reclutas.formatFileSize(file.size)})</p>
                <small style="color: #48bb78;"><i class="fas fa-info-circle"></i> Listo para subir</small>
            `;
        }
    }
    
    return true;
};

// Función global para manejar drag & drop
window.handleFileDrop = function(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const input = document.getElementById('recluta-documento');
        if (input) {
            // Crear un nuevo objeto FileList
            const dt = new DataTransfer();
            dt.items.add(files[0]);
            input.files = dt.files;
            validatePDFFile(input);
        }
    }
};

// Mejorar la función de hacer clic en la zona de upload
window.clickUploadZone = function() {
    const input = document.getElementById('recluta-documento');
    if (input) {
        input.style.pointerEvents = 'auto';
        input.click();
        setTimeout(() => {
            input.style.pointerEvents = 'none';
        }, 100);
    }
};

window.reclutaManager = Reclutas;

// Exportar y registrar globalmente para compatibilidad
window.Reclutas = Reclutas;
window.reclutaManager = Reclutas; // Alias unificado

export default Reclutas;




