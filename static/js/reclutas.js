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
            
            if (!container) {
                console.error('No se encontró el contenedor de reclutas en el DOM');
                return;
            }
            
            // Mostrar estado de carga
            container.innerHTML = '<tr><td colspan="7" style="text-align:center"><i class="fas fa-spinner fa-spin"></i> Cargando reclutas...</td></tr>';
            
            // Cargar reclutas desde la API
            const reclutas = await this.loadReclutas();
            
            // Mostrar reclutas en la tabla
            this.renderReclutasTable(container);
            
            // Actualizar paginación
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
    renderReclutasTable: function(container) {
        if (!container) {
            console.error('Container no proporcionado para renderizar tabla');
            return;
        }

        container.innerHTML = '';

        if (!this.reclutas || this.reclutas.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center" style="padding: 20px;">
                        <i class="fas fa-users" style="font-size: 48px; opacity: 0.3; margin-bottom: 10px;"></i><br>
                        No se encontraron reclutas. ¡Agrega tu primer recluta!
                    </td>
                </tr>
            `; 
            return;
        }

        this.reclutas.forEach(recluta => {
            const row = document.createElement('tr');

            // Determinar URL de la foto
            const fotoUrl = recluta.foto_url ?
                (recluta.foto_url.startsWith('http') ?
                    recluta.foto_url :
                    (recluta.foto_url === 'default_profile.jpg' ?
                        "/api/placeholder/40/40" :
                        `/${recluta.foto_url}`)) :
                "/api/placeholder/40/40";

            // Crear badge de estado
            const estadoBadge = UI.createBadge(recluta.estado, CONFIG.ESTADOS_RECLUTA);

            row.innerHTML = `
                <td><img src="${fotoUrl}" alt="${recluta.nombre}" class="recluta-foto" onerror="this.src='/api/placeholder/40/40'"></td>
                <td>${recluta.nombre}</td>
                <td>${recluta.email}</td>
                <td>${recluta.telefono}</td>
                <td><code>${recluta.folio || 'Sin folio'}</code></td>
                <td id="estado-cell-${recluta.id}"></td>
                <td>${recluta.asesor_nombre || 'No asignado'}</td>
                <td>
                    <button class="action-btn view-btn" data-id="${recluta.id}" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" data-id="${recluta.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${recluta.id}" title="Eliminar">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;

            container.appendChild(row);

            // Añadir badge de estado al TD correspondiente
            const estadoCell = document.getElementById(`estado-cell-${recluta.id}`);
            if (estadoCell) {
                estadoCell.appendChild(estadoBadge);
            }

            // Configurar botones de acción usando arrow functions para mantener el contexto
            const viewBtn = row.querySelector('.view-btn');
            const editBtn = row.querySelector('.edit-btn'); 
            const deleteBtn = row.querySelector('.delete-btn');

            if (viewBtn) {
                viewBtn.addEventListener('click', () => this.viewRecluta(recluta.id));
            }
            if (editBtn) {
                editBtn.addEventListener('click', () => this.editRecluta(recluta.id));
            }
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.confirmDeleteRecluta(recluta.id));
            }
        });
    },

    /**
     * Configura los botones de acción para un recluta
     * @param {HTMLElement} row - Fila de la tabla
     * @param {number} reclutaId - ID del recluta
     */
    setupActionButtons: function(row, reclutaId) {
        // Botón de ver detalles
        const viewBtn = row.querySelector('.view-btn');
        if (viewBtn) {
            viewBtn.addEventListener('click', () => this.viewRecluta(reclutaId));
        }

        // Botón de editar
        const editBtn = row.querySelector('.edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.editRecluta(reclutaId));
        }

        // Botón de eliminar
        const deleteBtn = row.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.confirmDeleteRecluta(reclutaId));
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
     * Abre el modal de confirmación para eliminar un recluta
     * @param {number} id - ID del recluta a eliminar
     */
    confirmDeleteRecluta: function(id) {
    this.currentReclutaId = id;
    const recluta = this.reclutas.find(r => r.id === id);
    
    UI.showConfirmModal({
        title: 'Eliminar Recluta',
        message: `¿Estás seguro de que deseas eliminar a ${recluta ? recluta.nombre : 'este recluta'}?`,
        confirmText: 'Eliminar',
        confirmButtonClass: 'btn-danger',
        onConfirm: () => this.deleteCurrentRecluta()
    });
},

    /**
     * Elimina el recluta actualmente seleccionado después de la confirmación
     */
    deleteCurrentRecluta: async function() {
        if (!this.currentReclutaId) return;
        try {
            const success = await this.deleteRecluta(this.currentReclutaId);
            if (success) {
                showSuccess('Recluta eliminado con éxito');
                UI.closeModal('confirm-delete-modal');
                this.currentReclutaId = null;
                this.loadAndDisplayReclutas(); // Recargar la lista
                UI.closeModal('view-recluta-modal'); // Cerrar el modal de detalles si está abierto
            } else {
                showError('Error al eliminar el recluta');
            }
        } catch (error) {
            console.error('Error al eliminar recluta:', error);
            showError('Error al eliminar el recluta');
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