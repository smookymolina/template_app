/**
 * Módulo para gestionar reclutas
 */
import CONFIG from './config.js';
import { showNotification, showError, showSuccess } from './notifications.js';
import UI from './ui.js';

const Reclutas = {
    reclutas: [],
    asesores: [],
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
    
    /**
     * Carga la lista de reclutas con paginación y filtros
     * @returns {Promise<Array>} - Lista de reclutas
     * 
     * * Carga la lista de asesores disponibles
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
            throw error;
        }
    },
    
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
            
            const response = await fetch(`${CONFIG.API_URL}/reclutas?${queryParams}`);
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Redireccionar al login
                    document.getElementById('login-section').style.display = 'block';
                    document.getElementById('dashboard-section').style.display = 'none';
                    showNotification('Sesión expirada. Por favor inicie sesión nuevamente.', 'warning');
                    throw new Error('No autenticado');
                }
                throw new Error('Error al cargar reclutas');
            }
            
            const data = await response.json();
            if (data.success) {
                this.reclutas = data.reclutas;
                this.totalPages = data.pages;
                return this.reclutas;
            } else {
                throw new Error(data.message || 'Error al obtener reclutas');
            }
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
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
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!this.reclutas || this.reclutas.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center"> <!-- Actualizado a 7 columnas -->
                        No se encontraron reclutas. ¡Agrega tu primer recluta!
                    </td>
                </tr>
            `;
            return;
        }
        
        this.reclutas.forEach(recluta => {
            const row = document.createElement('tr');
            
            // Determinar URL de la foto
            const fotoUrl = recluta.foto_url || '/api/placeholder/40/40';
            
            // Crear badge de estado
            const estadoBadge = UI.createBadge(recluta.estado, CONFIG.ESTADOS_RECLUTA);
            
            row.innerHTML = `
                <td><img src="${fotoUrl}" alt="${recluta.nombre}" class="recluta-foto"></td>
                <td>${recluta.nombre}</td>
                <td>${recluta.email}</td>
                <td>${recluta.telefono}</td>
                <td id="estado-cell-${recluta.id}"></td>
                <td>${recluta.asesor_nombre || 'No asignado'}</td> <!-- Nueva columna para asesor -->
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
            
            // Configurar botones de acción
            this.setupActionButtons(row, recluta.id);
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
            const recluta = await this.getRecluta(id);
            this.currentReclutaId = id;
            
            // Rellenar datos en el modal
            const modal = document.getElementById('view-recluta-modal');
            if (!modal) return;
            
            // Elementos del modal
            const elements = {
                nombre: document.getElementById('detail-recluta-nombre'),
                puesto: document.getElementById('detail-recluta-puesto'),
                email: document.getElementById('detail-recluta-email'),
                telefono: document.getElementById('detail-recluta-telefono'),
                fecha: document.getElementById('detail-recluta-fecha'),
                notas: document.getElementById('detail-recluta-notas'),
                pic: document.getElementById('detail-recluta-pic'),
                estado: document.getElementById('detail-recluta-estado'),
                asesor: document.getElementById('detail-recluta-asesor'), // Nuevo elemento
                viewButtons: document.getElementById('view-mode-buttons'),
                editForm: document.getElementById('edit-mode-form')
            };
            
            // Rellenar datos
            if (elements.nombre) elements.nombre.textContent = recluta.nombre;
            if (elements.puesto) elements.puesto.textContent = recluta.puesto || 'No especificado';
            if (elements.email) elements.email.textContent = recluta.email;
            if (elements.telefono) elements.telefono.textContent = recluta.telefono;
            if (elements.fecha) elements.fecha.textContent = UI.formatDate(recluta.fecha_registro);
            if (elements.notas) elements.notas.textContent = recluta.notas || 'Sin notas';
            
            // Mostrar asesor si existe
            if (elements.asesor) {
                elements.asesor.textContent = recluta.asesor_nombre || 'No asignado';
            }
            
            // Resto del código igual...
            
            // Foto
            if (elements.pic) {
                elements.pic.src = recluta.foto_url || '/api/placeholder/100/100';
            }
            
            // Estado
            if (elements.estado) {
                elements.estado.textContent = '';
                elements.estado.appendChild(UI.createBadge(recluta.estado));
            }
            
            // Mostrar modo vista (ocultar formulario de edición)
            if (elements.viewButtons) elements.viewButtons.style.display = 'flex';
            if (elements.editForm) elements.editForm.style.display = 'none';
            
            // Mostrar modal
            UI.showModal('view-recluta-modal');
        } catch (error) {
            console.error(`Error al ver recluta ${id}:`, error);
            showError('Error al cargar detalles del recluta');
        }
    },
    
    /**
     * Muestra formulario para editar un recluta
     * @param {number} id - ID del recluta
     */
    editRecluta: async function(id) {
        try {
            // Primero ver los detalles (para cargar datos)
            await this.viewRecluta(id);
            
            // Luego habilitar modo edición
            this.enableEditMode();
        } catch (error) {
            console.error(`Error al editar recluta ${id}:`, error);
            showError('Error al cargar formulario de edición');
        }
    },
    
    /**
     * Habilita el modo de edición en el modal de detalles
     */
    enableEditMode: async function() {
        if (!this.currentReclutaId) {
            showError('No hay recluta seleccionado');
            return;
        }
        
        try {
            const recluta = await this.getRecluta(this.currentReclutaId);
            
            // Elementos del formulario
            const formElements = {
                nombre: document.getElementById('edit-recluta-nombre'),
                email: document.getElementById('edit-recluta-email'),
                telefono: document.getElementById('edit-recluta-telefono'),
                puesto: document.getElementById('edit-recluta-puesto'),
                estado: document.getElementById('edit-recluta-estado'),
                notas: document.getElementById('edit-recluta-notas'),
                asesor: document.getElementById('edit-recluta-asesor'), // Nuevo elemento
                viewButtons: document.getElementById('view-mode-buttons'),
                editForm: document.getElementById('edit-mode-form')
            };
            
            // Verificar si los elementos existen
            if (!formElements.nombre || !formElements.email || !formElements.telefono || 
                !formElements.viewButtons || !formElements.editForm) {
                showError('Error al cargar el formulario de edición');
                return;
            }
            
            // Rellenar formulario con datos actuales
            formElements.nombre.value = recluta.nombre;
            formElements.email.value = recluta.email;
            formElements.telefono.value = recluta.telefono;
            if (formElements.puesto) formElements.puesto.value = recluta.puesto || '';
            if (formElements.estado) formElements.estado.value = recluta.estado;
            if (formElements.notas) formElements.notas.value = recluta.notas || '';
            
            // Rellenar selector de asesor
            if (formElements.asesor) {
                // Asegurarse de que tenemos la lista de asesores
                if (!this.asesores || this.asesores.length === 0) {
                    await this.loadAsesores();
                    this.populateAsesorSelectors();
                }
                
                // Seleccionar el asesor actual
                formElements.asesor.value = recluta.asesor_id || '';
            }
            
            // Ocultar vista y mostrar edición
            formElements.viewButtons.style.display = 'none';
            formElements.editForm.style.display = 'block';
        } catch (error) {
            console.error('Error al habilitar modo edición:', error);
            showError('Error al cargar datos para edición');
        }
    },

    /**
     * Solicita confirmación para eliminar un recluta
     * @param {number} id - ID del recluta
     */
    confirmDeleteRecluta: async function(id) {
        try {
            const recluta = await this.getRecluta(id);
            
            UI.showConfirmModal({
                title: 'Eliminar Recluta',
                message: `¿Estás seguro de que deseas eliminar a ${recluta.nombre}? Esta acción no se puede deshacer.`,
                confirmText: 'Eliminar',
                confirmButtonClass: 'btn-danger',
                onConfirm: () => this.deleteReclutaAndRefresh(id)
            });
        } catch (error) {
            console.error(`Error al confirmar eliminación de recluta ${id}:`, error);
            showError('Error al preparar eliminación del recluta');
        }
    },
    
    /**
     * Elimina un recluta y actualiza la lista
     * @param {number} id - ID del recluta
     */
    deleteReclutaAndRefresh: async function(id) {
        try {
            await this.deleteRecluta(id);
            
            // Cerrar modal de detalles si está abierto
            if (this.currentReclutaId === id) {
                UI.closeModal('view-recluta-modal');
                this.currentReclutaId = null;
            }
            
            // Recargar y mostrar la lista actualizada
            await this.loadAndDisplayReclutas();
            
            showSuccess('Recluta eliminado correctamente');
        } catch (error) {
            console.error(`Error al eliminar recluta ${id}:`, error);
            showError('Error al eliminar recluta');
        }
    },
    
    /**
     * Carga y muestra la lista de reclutas
     */
    loadAndDisplayReclutas: async function() {
        try {
            await this.loadReclutas();
            
            // Renderizar tabla
            const reclutasList = document.getElementById('reclutas-list');
            if (reclutasList) {
                this.renderReclutasTable(reclutasList);
            }
            
            // Actualizar paginación
            this.updatePagination();
        } catch (error) {
            console.error('Error al cargar y mostrar reclutas:', error);
            showError('Error al cargar la lista de reclutas');
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
        const addButton = document.querySelector('.section-actions .btn-primary');
        if (addButton) {
            addButton.addEventListener('click', () => {
                this.openAddReclutaModal();

                // Cargar asesores si no están cargados
            if (!this.asesores || this.asesores.length === 0) {
                this.loadAsesores()
                    .then(() => this.populateAsesorSelectors())
                    .catch(error => console.error('No se pudieron cargar los asesores:', error));
            } else {
                this.populateAsesorSelectors();
            }
            });
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
        // Limpiar formulario
        const form = document.getElementById('add-recluta-form');
        if (form) form.reset();
        
        // Limpiar preview de imagen
        const picPreview = document.getElementById('recluta-pic-preview');
        if (picPreview) {
            picPreview.innerHTML = '<i class="fas fa-user-circle"></i>';
        }
        
        // Mostrar modal
        UI.showModal('add-recluta-modal');
    },
    
    /**
     * Maneja cambios en la imagen del recluta
     * @param {Event} event - Evento de cambio de archivo
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
     * Guarda un nuevo recluta desde el formulario
     */
    saveNewRecluta: async function() {
        try {
            // Obtener datos del formulario (incluir el nuevo campo de asesor)
            const nombre = document.getElementById('recluta-nombre')?.value;
            const email = document.getElementById('recluta-email')?.value;
            const telefono = document.getElementById('recluta-telefono')?.value;
            const estado = document.getElementById('recluta-estado')?.value;
            const puesto = document.getElementById('recluta-puesto')?.value;
            const notas = document.getElementById('recluta-notas')?.value;
            const asesor_id = document.getElementById('recluta-asesor')?.value || null;
            
            // Validar campos obligatorios
            if (!nombre || !email || !telefono || !estado) {
                showError('Por favor, completa los campos obligatorios');
                return;
            }
            
            // Construir objeto de datos
            const reclutaData = {
                nombre,
                email,
                telefono,
                estado,
                puesto: puesto || '',
                notas: notas || '',
                asesor_id: asesor_id || null
            };
            
            // Resto del código igual...
            
            // Obtener foto si existe
            const fotoInput = document.getElementById('recluta-upload');
            const foto = fotoInput && fotoInput.files && fotoInput.files[0] ? fotoInput.files[0] : null;
            
            // Mostrar estado de carga
            const saveButton = document.querySelector('#add-recluta-modal .btn-primary');
            if (saveButton) {
                saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
                saveButton.disabled = true;
            }
            
            // Enviar datos al servidor
            const nuevoRecluta = await this.addRecluta(reclutaData, foto);
            
            // Cerrar modal
            UI.closeModal('add-recluta-modal');
            
            // Recargar lista
            await this.loadAndDisplayReclutas();
            
            // Mostrar notificación
            showSuccess('Recluta añadido correctamente');
        } catch (error) {
            console.error('Error al guardar recluta:', error);
            showError('Error al guardar el recluta');
        } finally {
            // Restaurar botón
            const saveButton = document.querySelector('#add-recluta-modal .btn-primary');
            if (saveButton) {
                saveButton.innerHTML = '<i class="fas fa-save"></i> Guardar Recluta';
                saveButton.disabled = false;
            }
        }
    },
    
    /**
     * Guarda cambios de un recluta en edición
     */
    saveReclutaChanges: async function() {
        if (!this.currentReclutaId) {
            showError('No hay recluta seleccionado');
            return;
        }
        
        try {
            // Obtener elementos del formulario (incluir el nuevo campo de asesor)
            const formElements = {
                nombre: document.getElementById('edit-recluta-nombre'),
                email: document.getElementById('edit-recluta-email'),
                telefono: document.getElementById('edit-recluta-telefono'),
                puesto: document.getElementById('edit-recluta-puesto'),
                estado: document.getElementById('edit-recluta-estado'),
                notas: document.getElementById('edit-recluta-notas'),
                asesor: document.getElementById('edit-recluta-asesor'),
                saveButton: document.querySelector('.edit-mode-buttons .btn-primary')
            };
            
            // Verificar elementos obligatorios
            if (!formElements.nombre || !formElements.email || !formElements.telefono || !formElements.estado) {
                showError('Error al obtener datos del formulario');
                return;
            }
            
            // Validar datos obligatorios
            if (!formElements.nombre.value || !formElements.email.value || !formElements.telefono.value) {
                showError('Por favor, completa los campos obligatorios');
                return;
            }
            
            // Construir objeto de datos (incluir asesor_id)
            const reclutaData = {
                nombre: formElements.nombre.value,
                email: formElements.email.value,
                telefono: formElements.telefono.value,
                estado: formElements.estado.value,
                puesto: formElements.puesto ? formElements.puesto.value : '',
                notas: formElements.notas ? formElements.notas.value : '',
                asesor_id: formElements.asesor && formElements.asesor.value ? formElements.asesor.value : null
            };
            
            // Mostrar estado de carga
            if (formElements.saveButton) {
                formElements.saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
                formElements.saveButton.disabled = true;
            }
            
            // Actualizar datos
            const updatedRecluta = await this.updateRecluta(this.currentReclutaId, reclutaData);
            
            // Actualizar la vista
            this.updateReclutaDetailsView(updatedRecluta);
            
            // Volver a modo vista
            this.cancelEdit();
            
            // Actualizar la lista
            await this.loadAndDisplayReclutas();
            
            // Mostrar notificación
            showSuccess('Recluta actualizado correctamente');
        } catch (error) {
            console.error('Error al guardar cambios:', error);
            showError('Error al actualizar recluta');
        } finally {
            // Restaurar botón
            const saveButton = document.querySelector('.edit-mode-buttons .btn-primary');
            if (saveButton) {
                saveButton.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
                saveButton.disabled = false;
            }
        }
    },
    
    /**
     * Cancela el modo de edición
     */
    cancelEdit: function() {
        const viewButtons = document.getElementById('view-mode-buttons');
        const editForm = document.getElementById('edit-mode-form');
        
        if (viewButtons) viewButtons.style.display = 'flex';
        if (editForm) editForm.style.display = 'none';
    },
    
    /**
     * Actualiza la vista de detalles con datos nuevos
     * @param {Object} recluta - Datos del recluta
     */
    updateReclutaDetailsView: function(recluta) {
        if (!recluta) return;
        
        const elements = {
            nombre: document.getElementById('detail-recluta-nombre'),
            puesto: document.getElementById('detail-recluta-puesto'),
            email: document.getElementById('detail-recluta-email'),
            telefono: document.getElementById('detail-recluta-telefono'),
            fecha: document.getElementById('detail-recluta-fecha'),
            notas: document.getElementById('detail-recluta-notas'),
            pic: document.getElementById('detail-recluta-pic'),
            estado: document.getElementById('detail-recluta-estado')
        };
        
        // Actualizar datos
        if (elements.nombre) elements.nombre.textContent = recluta.nombre;
        if (elements.puesto) elements.puesto.textContent = recluta.puesto || 'No especificado';
        if (elements.email) elements.email.textContent = recluta.email;
        if (elements.telefono) elements.telefono.textContent = recluta.telefono;
        if (elements.fecha) elements.fecha.textContent = UI.formatDate(recluta.fecha_registro);
        if (elements.notas) elements.notas.textContent = recluta.notas || 'Sin notas';
        
        // Foto
        if (elements.pic) {
            elements.pic.src = recluta.foto_url || '/api/placeholder/100/100';
        }
        
        // Estado
        if (elements.estado) {
            elements.estado.textContent = '';
            elements.estado.appendChild(UI.createBadge(recluta.estado));
        }
    }
}
export default Reclutas;