/**
 * 🔒 PANEL ADMINISTRATIVO DE RECLUTAS - SOLO ADMIN
 * Gestión avanzada exclusiva para administradores
 */

import CONFIG from './config.js';
import { showNotification, showError, showSuccess } from './notifications.js';

const AdminReclutasManagement = {
    // Estado
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 50,
    reclutas: [],
    asesores: [],
    selectedReclutas: new Set(),
    isLoading: false,
    isInitialized: false,

    // Filtros
    filters: {
        search: '',
        estado: '',
        asesor_id: ''
    },

    /**
     * 🚀 INICIALIZAR MÓDULO
     */
    init: function() {
        console.log('🔒 Inicializando Panel Administrativo de Reclutas...');
        console.log('🔍 Estado inicial:', {
            currentPage: this.currentPage,
            filters: this.filters,
            selectedCount: this.selectedReclutas.size
        });
        this.setupEventListeners();
        this.loadData();
    },

    /**
     * 🎯 CONFIGURAR EVENT LISTENERS
     */
    setupEventListeners: function() {
        // Filtros
        document.getElementById('admin-apply-filters')?.addEventListener('click', () => this.applyFilters());
        document.getElementById('admin-search')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.applyFilters();
        });

        // Selección
        document.getElementById('admin-select-all-checkbox')?.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
        document.getElementById('admin-select-all')?.addEventListener('click', () => this.selectAll());
        document.getElementById('admin-clear-selection')?.addEventListener('click', () => this.clearSelection());

        // Acciones en lote
        document.getElementById('admin-bulk-assign')?.addEventListener('click', () => this.bulkAssignAsesor());
        document.getElementById('admin-bulk-delete')?.addEventListener('click', () => this.bulkDeleteReclutas());

        // Paginación
        document.getElementById('admin-prev-page')?.addEventListener('click', () => this.previousPage());
        document.getElementById('admin-next-page')?.addEventListener('click', () => this.nextPage());
    },

    /**
     * 📊 CARGAR DATOS INICIALES
     */
    async loadData() {
        try {
            this.showLoading();
            await Promise.all([
                this.loadReclutas(),
                this.loadAsesores()
            ]);
            this.hideLoading();
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            showError('Error al cargar datos del panel administrativo');
            this.hideLoading();
        }
    },

    /**
     * 👥 CARGAR LISTA DE RECLUTAS
     */
    async loadReclutas() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                per_page: this.itemsPerPage,
                search: this.filters.search,
                estado: this.filters.estado,
                asesor_id: this.filters.asesor_id
            });

            const response = await fetch(`/admin/reclutas/management?${params}`, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (!data.success) throw new Error(data.message);

            this.reclutas = data.reclutas;
            this.updatePagination(data.pagination);
            this.renderReclutas();

            console.log(`✅ Cargados ${this.reclutas.length} reclutas para página ${this.currentPage}`);
            console.log('🔍 Filtros aplicados:', this.filters);
        } catch (error) {
            console.error('❌ Error cargando reclutas:', error);
            showError('Error al cargar lista de reclutas');
        }
    },

    /**
     * 👤 CARGAR LISTA DE ASESORES
     */
    async loadAsesores() {
        try {
            const response = await fetch('/admin/reclutas/management', {
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (!data.success) throw new Error(data.message);

            this.asesores = data.asesores || [];
            this.populateAsesorFilters();

            console.log(`✅ Cargados ${this.asesores.length} asesores:`, this.asesores.map(a => a.nombre));
        } catch (error) {
            console.error('❌ Error cargando asesores:', error);
            showError('Error al cargar lista de asesores');
        }
    },

    /**
     * 🎨 RENDERIZAR TABLA DE RECLUTAS
     */
    renderReclutas() {
        const tbody = document.getElementById('admin-reclutas-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.reclutas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="no-data">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron reclutas</p>
                    </td>
                </tr>
            `;
            return;
        }

        this.reclutas.forEach(recluta => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="recluta-checkbox"
                           data-id="${recluta.id}"
                           ${this.selectedReclutas.has(recluta.id) ? 'checked' : ''}>
                </td>
                <td><code>${recluta.folio}</code></td>
                <td>${recluta.nombre}</td>
                <td>${recluta.email}</td>
                <td>${recluta.telefono}</td>
                <td>
                    <span class="status-badge status-${recluta.estado.toLowerCase().replace(' ', '-')}">
                        ${recluta.estado}
                    </span>
                </td>
                <td>${recluta.asesor_nombre || 'Sin asignar'}</td>
                <td>${new Date(recluta.fecha_registro).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <select class="single-asesor-select" data-id="${recluta.id}"
                                title="Selecciona un nuevo asesor para ${recluta.nombre}">
                            <option value="">Cambiar asesor...</option>
                            <option value="null" ${!recluta.asesor_id ? 'selected' : ''}>Sin asesor</option>
                            ${this.asesores.map(a =>
                                `<option value="${a.id}" ${a.id == recluta.asesor_id ? 'selected' : ''}>${a.nombre}</option>`
                            ).join('')}
                        </select>
                        <button class="btn-sm btn-warning single-assign"
                                data-id="${recluta.id}"
                                title="Asignar asesor seleccionado a ${recluta.nombre}"
                                aria-label="Asignar asesor a ${recluta.nombre}">
                            <i class="fas fa-user-edit" aria-hidden="true"></i>
                        </button>
                        <button class="btn-sm btn-danger single-delete"
                                data-id="${recluta.id}"
                                title="Eliminar a ${recluta.nombre} permanentemente"
                                aria-label="Eliminar a ${recluta.nombre}">
                            <i class="fas fa-trash" aria-hidden="true"></i>
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(row);
        });

        // Event listeners para acciones individuales
        this.setupRowEventListeners();
        this.updateSelectionUI();
    },

    /**
     * 🎯 CONFIGURAR EVENTOS DE FILAS
     */
    setupRowEventListeners() {
        // Checkboxes individuales
        document.querySelectorAll('.recluta-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                if (e.target.checked) {
                    this.selectedReclutas.add(id);
                } else {
                    this.selectedReclutas.delete(id);
                }
                this.updateSelectionUI();
            });
        });

        // Select de asesor - mostrar feedback visual
        document.querySelectorAll('.single-asesor-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const assignBtn = document.querySelector(`.single-assign[data-id="${id}"]`);

                if (e.target.value !== '' && assignBtn) {
                    // Destacar el botón cuando hay un cambio pendiente
                    assignBtn.classList.add('btn-pending-change');
                    assignBtn.style.animation = 'pulse 2s infinite';

                    // Actualizar tooltip
                    const selectedOption = e.target.options[e.target.selectedIndex];
                    assignBtn.title = `Confirmar cambio a: ${selectedOption.text}`;
                } else if (assignBtn) {
                    assignBtn.classList.remove('btn-pending-change');
                    assignBtn.style.animation = '';
                    const recluta = this.reclutas.find(r => r.id === parseInt(id));
                    assignBtn.title = `Asignar asesor seleccionado a ${recluta?.nombre || 'este recluta'}`;
                }
            });
        });

        // Asignación individual
        document.querySelectorAll('.single-assign').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('.single-assign').dataset.id);
                const select = document.querySelector(`.single-asesor-select[data-id="${id}"]`);
                const asesorId = select.value === '' ? null : (select.value === 'null' ? null : parseInt(select.value));

                if (select.value === '') {
                    showError('Primero selecciona un asesor del dropdown');
                    select.focus();
                    return;
                }

                this.assignSingleRecluta(id, asesorId);
            });
        });

        // Eliminación individual
        document.querySelectorAll('.single-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('.single-delete').dataset.id);
                const recluta = this.reclutas.find(r => r.id === id);
                this.deleteSingleRecluta(id, recluta?.nombre || 'Recluta');
            });
        });
    },

    /**
     * 🔍 APLICAR FILTROS
     */
    applyFilters() {
        this.filters.search = document.getElementById('admin-search')?.value || '';
        this.filters.estado = document.getElementById('admin-estado-filter')?.value || '';
        this.filters.asesor_id = document.getElementById('admin-asesor-filter')?.value || '';

        console.log('🔍 Aplicando filtros:', this.filters);

        this.currentPage = 1;
        this.clearSelection();
        this.loadReclutas();
    },

    /**
     * ✅ SELECCIONAR TODOS
     */
    selectAll() {
        this.selectedReclutas.clear();
        this.reclutas.forEach(r => this.selectedReclutas.add(r.id));
        this.updateSelectionUI();

        // Actualizar checkboxes
        document.querySelectorAll('.recluta-checkbox').forEach(cb => cb.checked = true);
        document.getElementById('admin-select-all-checkbox').checked = true;
    },

    /**
     * ❌ LIMPIAR SELECCIÓN
     */
    clearSelection() {
        this.selectedReclutas.clear();
        this.updateSelectionUI();

        // Actualizar checkboxes
        document.querySelectorAll('.recluta-checkbox').forEach(cb => cb.checked = false);
        document.getElementById('admin-select-all-checkbox').checked = false;
    },

    /**
     * 🔄 TOGGLE SELECCIONAR TODOS
     */
    toggleSelectAll(checked) {
        if (checked) {
            this.selectAll();
        } else {
            this.clearSelection();
        }
    },

    /**
     * 🎨 ACTUALIZAR UI DE SELECCIÓN
     */
    updateSelectionUI() {
        const count = this.selectedReclutas.size;
        const bulkActions = document.getElementById('admin-bulk-actions');
        const selectedCount = document.getElementById('admin-selected-count');

        if (selectedCount) {
            selectedCount.textContent = `${count} seleccionado${count !== 1 ? 's' : ''}`;
        }

        if (bulkActions) {
            bulkActions.style.display = count > 0 ? 'flex' : 'none';
        }
    },

    /**
     * 👥 ASIGNACIÓN EN LOTE
     */
    async bulkAssignAsesor() {
        if (this.selectedReclutas.size === 0) {
            showError('Selecciona al menos un recluta');
            return;
        }

        const asesorSelect = document.getElementById('admin-bulk-asesor');
        const asesorId = asesorSelect.value;

        if (!asesorId && asesorId !== 'null') {
            showError('Selecciona un asesor');
            return;
        }

        const asesorName = asesorId === 'null' ? 'Sin asignar' :
                          this.asesores.find(a => a.id == asesorId)?.nombre || 'Desconocido';

        if (!confirm(`¿Reasignar ${this.selectedReclutas.size} reclutas a "${asesorName}"?`)) return;

        try {
            this.showLoading();

            const response = await fetch('/admin/reclutas/bulk-assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recluta_ids: Array.from(this.selectedReclutas),
                    asesor_id: asesorId === 'null' ? null : parseInt(asesorId)
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            showSuccess(`✅ ${data.cambios.length} reclutas reasignados exitosamente`);
            this.clearSelection();
            await this.loadReclutas();

        } catch (error) {
            console.error('❌ Error en asignación masiva:', error);
            showError(`Error al reasignar: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    },

    /**
     * 🗑️ ELIMINACIÓN EN LOTE
     */
    async bulkDeleteReclutas() {
        if (this.selectedReclutas.size === 0) {
            showError('Selecciona al menos un recluta');
            return;
        }

        const count = this.selectedReclutas.size;
        if (!confirm(`⚠️ ¿ELIMINAR ${count} recluta${count !== 1 ? 's' : ''}?\n\nEsta acción NO se puede deshacer.`)) return;

        try {
            this.showLoading();

            const response = await fetch('/admin/reclutas/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recluta_ids: Array.from(this.selectedReclutas)
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            showSuccess(`🗑️ ${data.eliminados.cantidad} reclutas eliminados exitosamente`);
            this.clearSelection();
            await this.loadReclutas();

        } catch (error) {
            console.error('❌ Error en eliminación masiva:', error);
            showError(`Error al eliminar: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    },

    /**
     * 👤 ASIGNACIÓN INDIVIDUAL
     */
    async assignSingleRecluta(reclutaId, asesorId) {
        const asesorName = asesorId === null || asesorId === undefined ? 'Sin asignar' :
                          this.asesores.find(a => a.id == asesorId)?.nombre || 'Desconocido';

        const assignBtn = document.querySelector(`.single-assign[data-id="${reclutaId}"]`);
        const originalText = assignBtn?.innerHTML;

        try {
            // Feedback visual inmediato
            if (assignBtn) {
                assignBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                assignBtn.disabled = true;
                assignBtn.style.opacity = '0.7';
            }

            const response = await fetch(`/admin/reclutas/${reclutaId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ asesor_id: asesorId })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            // Animación de éxito
            if (assignBtn) {
                assignBtn.innerHTML = '<i class="fas fa-check"></i>';
                assignBtn.style.background = '#28a745';
                assignBtn.style.animation = 'buttonSuccess 0.6s ease';

                setTimeout(() => {
                    assignBtn.classList.remove('btn-pending-change');
                    assignBtn.style.animation = '';
                }, 600);
            }

            showSuccess(`✅ Asesor cambiado a "${asesorName}"`);

            // Recargar datos después de un breve delay
            setTimeout(async () => {
                await this.loadReclutas();
            }, 800);

        } catch (error) {
            console.error('❌ Error en asignación individual:', error);
            showError(`Error al asignar: ${error.message}`);

            // Restaurar botón en caso de error
            if (assignBtn && originalText) {
                assignBtn.innerHTML = originalText;
                assignBtn.disabled = false;
                assignBtn.style.opacity = '1';
                assignBtn.classList.remove('btn-pending-change');
                assignBtn.style.animation = '';
            }
        }
    },

    /**
     * 🗑️ ELIMINACIÓN INDIVIDUAL
     */
    async deleteSingleRecluta(reclutaId, reclutaName) {
        if (!confirm(`⚠️ ¿ELIMINAR a "${reclutaName}"?\n\nEsta acción NO se puede deshacer.`)) return;

        try {
            this.showLoading();

            const response = await fetch('/admin/reclutas/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recluta_ids: [reclutaId] })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            showSuccess(`🗑️ "${reclutaName}" eliminado exitosamente`);
            await this.loadReclutas();

        } catch (error) {
            console.error('❌ Error en eliminación individual:', error);
            showError(`Error al eliminar: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    },

    /**
     * 📄 PAGINACIÓN - PÁGINA ANTERIOR
     */
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.clearSelection();
            this.loadReclutas();
        }
    },

    /**
     * 📄 PAGINACIÓN - PÁGINA SIGUIENTE
     */
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.clearSelection();
            this.loadReclutas();
        }
    },

    /**
     * 🎨 ACTUALIZAR INFORMACIÓN DE PAGINACIÓN
     */
    updatePagination(pagination) {
        this.totalPages = pagination.pages;

        const prevBtn = document.getElementById('admin-prev-page');
        const nextBtn = document.getElementById('admin-next-page');
        const pageInfo = document.getElementById('admin-page-info');
        const paginationInfo = document.getElementById('admin-pagination-info');

        if (prevBtn) prevBtn.disabled = !pagination.has_prev;
        if (nextBtn) nextBtn.disabled = !pagination.has_next;

        if (pageInfo) pageInfo.textContent = `Página ${pagination.page} de ${pagination.pages}`;

        if (paginationInfo) {
            const start = ((pagination.page - 1) * pagination.per_page) + 1;
            const end = Math.min(pagination.page * pagination.per_page, pagination.total);
            paginationInfo.textContent = `Mostrando ${start} - ${end} de ${pagination.total} reclutas`;
        }
    },

    /**
     * 🎨 POBLAR FILTROS DE ASESORES
     */
    populateAsesorFilters() {
        console.log('🎨 Poblando filtros de asesores...', this.asesores);

        const filterSelect = document.getElementById('admin-asesor-filter');
        const bulkSelect = document.getElementById('admin-bulk-asesor');

        if (filterSelect) {
            // Opciones base para filtros
            const baseOptions = `
                <option value="">Todos</option>
                <option value="sin_asignar">Sin asignar</option>
            `;
            const asesorOptions = this.asesores.map(a =>
                `<option value="${a.id}">${a.nombre}</option>`
            ).join('');

            filterSelect.innerHTML = baseOptions + asesorOptions;
            console.log('🎯 Filtro de asesor poblado con', this.asesores.length, 'asesores');
        }

        if (bulkSelect) {
            // Opciones base para acciones en lote
            const baseOptions = `
                <option value="">Seleccionar asesor...</option>
                <option value="null">Desasignar asesor</option>
            `;
            const asesorOptions = this.asesores.map(a =>
                `<option value="${a.id}">${a.nombre}</option>`
            ).join('');

            bulkSelect.innerHTML = baseOptions + asesorOptions;
            console.log('🎯 Selector bulk poblado con', this.asesores.length, 'asesores');
        }
    },

    /**
     * ⏳ MOSTRAR INDICADOR DE CARGA
     */
    showLoading() {
        this.isLoading = true;
        const loader = document.getElementById('admin-loading');
        if (loader) loader.style.display = 'flex';
    },

    /**
     * ✅ OCULTAR INDICADOR DE CARGA
     */
    hideLoading() {
        this.isLoading = false;
        const loader = document.getElementById('admin-loading');
        if (loader) loader.style.display = 'none';
    }
};

// 🚀 INICIALIZACIÓN GLOBAL PARA INTEGRACIÓN CON NAVEGACIÓN
window.AdminReclutasManagement = AdminReclutasManagement;

// 🚀 AUTO-INICIALIZACIÓN ROBUSTA
document.addEventListener('DOMContentLoaded', () => {
    const section = document.getElementById('admin-reclutas-management');
    const loginSection = document.getElementById('login-section');

    // Solo inicializar si la sección existe Y el login NO está visible (usuario ya autenticado)
    if (section && !AdminReclutasManagement.isInitialized) {
        const isLoginVisible = loginSection && loginSection.style.display !== 'none';

        if (!isLoginVisible) {
            console.log('🚀 Inicializando Panel Administrativo de Reclutas al cargar la página...');
            AdminReclutasManagement.init();
            AdminReclutasManagement.isInitialized = true;
        }
    }

    // Adicionalmente, escuchar por cambios de sección si la app es una SPA (Single Page Application)
    // para inicializar el panel si se navega a él dinámicamente.
    document.addEventListener('sectionChanged', (event) => {
        if (event.detail && event.detail.section === 'admin-reclutas-management' && !AdminReclutasManagement.isInitialized) {
            console.log('🚀 Inicializando Panel Administrativo de Reclutas por evento sectionChanged...');
            AdminReclutasManagement.init();
            AdminReclutasManagement.isInitialized = true;
        }
    });
});

export default AdminReclutasManagement;