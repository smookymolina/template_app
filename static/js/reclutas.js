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
        asesor_id: 'todos',
        sortBy: 'nombre',
        sortOrder: 'asc'
    },
    currentReclutaId: null,
    asesores: [], // Añadido para almacenar la lista de asesores

    /**
 * Configura el filtro por asesor (solo para administradores)
 */
setupAsesorFilter: function() {
    if (this.userRole !== 'admin') {
        console.log('Usuario no es admin, ocultando filtro de asesor');
        const filterGroup = document.getElementById('filter-asesor-group');
        if (filterGroup) filterGroup.style.display = 'none';
        return;
    }
    
    console.log('Configurando filtro de asesor para admin');
    
    // Mostrar el filtro
    const filterGroup = document.getElementById('filter-asesor-group');
    if (filterGroup) filterGroup.style.display = 'flex';
    
    // Poblar el selector con asesores
    this.populateAsesorFilter();
    
    // Configurar evento
    const filterAsesor = document.getElementById('filter-asesor');
    if (filterAsesor) {
        filterAsesor.addEventListener('change', () => {
            this.filterByAsesor(filterAsesor.value);
            this.loadAndDisplayReclutas();
        });
    }
},

/**
 * Pobla el selector de filtro por asesor
 */
populateAsesorFilter: async function() {
    const filterAsesor = document.getElementById('filter-asesor');
    if (!filterAsesor) return;
    
    try {
        // Cargar asesores si no están cargados
        if (!this.asesores || this.asesores.length === 0) {
            await this.loadAsesores();
        }
        
        // Limpiar opciones existentes (mantener las por defecto)
        const defaultOptions = filterAsesor.querySelectorAll('option[value="todos"], option[value="sin_asignar"]');
        filterAsesor.innerHTML = '';
        
        // Restaurar opciones por defecto
        defaultOptions.forEach(option => {
            filterAsesor.appendChild(option.cloneNode(true));
        });
        
        // Si no había opciones por defecto, crearlas
        if (defaultOptions.length === 0) {
            const todosOption = document.createElement('option');
            todosOption.value = 'todos';
            todosOption.textContent = 'Todos los asesores';
            filterAsesor.appendChild(todosOption);
            
            const sinAsignarOption = document.createElement('option');
            sinAsignarOption.value = 'sin_asignar';
            sinAsignarOption.textContent = 'Sin asignar';
            filterAsesor.appendChild(sinAsignarOption);
        }
        
        // Agregar opciones de asesores
        this.asesores.forEach(asesor => {
            const option = document.createElement('option');
            option.value = asesor.id;
            option.textContent = asesor.nombre || asesor.email;
            filterAsesor.appendChild(option);
        });
        
        console.log(`Filtro de asesor poblado con ${this.asesores.length} asesores`);
        
    } catch (error) {
        console.error('Error al poblar filtro de asesor:', error);
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
    
    // Añadir clase CSS al body según el rol
    document.body.classList.remove('admin-view', 'asesor-view');
    document.body.classList.add(role === 'admin' ? 'admin-view' : 'asesor-view');
    
    if (role === 'admin') {
        this.showAsesorColumn();
        this.showAdminWelcome();
        this.setupAdminFeatures();
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
 * Configura características para administradores
 */
setupAdminFeatures: function() {
    console.log('Configurando características de administrador');
    
    // Mostrar columna de asesor
    this.showAsesorColumn();
    this.showAsesorSelectors();

    // Configurar filtro por asesor
    this.setupAsesorFilter();
    
    // Mostrar selectores de asesor en formularios
    this.showAsesorSelectors();
    
    // Cargar asesores disponibles
    this.loadAsesores().then(() => {
        this.populateAsesorSelectors();
        this.populateAsesorFilter();
    });
    
    // Mensaje de bienvenida
    this.showAdminWelcome();
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
 * Oculta botones de Excel
 */
hideExcelButtons: function() {
    // Solo ocultar el botón de subir Excel para asesores
    const uploadButton = document.getElementById('upload-excel-btn');
    if (uploadButton) uploadButton.style.display = 'none';
    
    // Mantener visible el botón de plantilla para todos los roles
    const templateButton = document.getElementById('download-template-btn');
    if (templateButton) templateButton.style.display = 'inline-block';
    
    console.log('Botón de subir Excel ocultado para asesor');
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
                <button class="action-btn delete-btn" title="Eliminar" data-id="${recluta.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
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
    
    // Añadir clase CSS al body según el rol
    document.body.classList.remove('admin-view', 'asesor-view');
    document.body.classList.add(role === 'admin' ? 'admin-view' : 'asesor-view');
    
    if (role === 'admin') {
        this.setupAdminFeatures();
        console.log('✅ Modo ADMIN activado - Botones de acción visibles');
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

};

// Exponer la función addRecluta al ámbito global para que funcione con onclick en HTML
window.addRecluta = function() {
    Reclutas.saveNewRecluta();
};

export default Reclutas;