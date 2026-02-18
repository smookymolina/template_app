/**
 * Panel Administrativo de Reclutas — Rol Gerente
 * Permite al gerente ver y reasignar los reclutas de su equipo.
 * Los endpoints /gerente/panel/* ya filtran el acceso en el servidor.
 */

import { showError, showSuccess } from './notifications.js';

const escapeHtml = (value) => {
    if (value === undefined || value === null) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

const GerentePanel = {
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

    // =========================================================================
    // INICIALIZACIÓN
    // =========================================================================

    init() {
        console.log('🛡️ Inicializando Panel Administrativo de Gerente...');
        this.setupEventListeners();
        this.loadData();
    },

    setupEventListeners() {
        document.getElementById('gp-apply-filters')?.addEventListener('click', () => this.applyFilters());
        document.getElementById('gp-search')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.applyFilters();
        });

        // Selección
        document.getElementById('gp-select-all-checkbox')?.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
        document.getElementById('gp-select-all')?.addEventListener('click', () => this.selectAll());
        document.getElementById('gp-clear-selection')?.addEventListener('click', () => this.clearSelection());

        // Acciones en lote
        document.getElementById('gp-bulk-assign')?.addEventListener('click', () => this.bulkAssign());

        // Paginación
        document.getElementById('gp-prev-page')?.addEventListener('click', () => this.previousPage());
        document.getElementById('gp-next-page')?.addEventListener('click', () => this.nextPage());
    },

    // =========================================================================
    // CARGA DE DATOS
    // =========================================================================

    async loadData() {
        try {
            this.showLoading();
            await this.loadSupportData();
            await this.loadReclutas();
        } catch (error) {
            console.error('❌ Error cargando datos del panel de gerente:', error);
            showError('Error al cargar datos del panel de gerente');
        } finally {
            this.hideLoading();
        }
    },

    async loadSupportData() {
        try {
            const response = await fetch('/gerente/panel/support-data', {
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (!data?.success) throw new Error(data?.message || 'Respuesta inválida');

            this.asesores = Array.isArray(data.asesores) ? data.asesores : [];
            this.populateFilters();
            console.log(`✅ Cargados ${this.asesores.length} asesores del equipo`);
        } catch (error) {
            console.error('❌ Error cargando catálogos:', error);
            showError('Error al cargar la lista de asesores');
        }
    },

    async loadReclutas() {
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                per_page: this.itemsPerPage,
                search: this.filters.search,
                estado: this.filters.estado,
                asesor_id: this.filters.asesor_id
            });

            const response = await fetch(`/gerente/panel/reclutas?${params}`, {
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            if (!data?.success) throw new Error(data?.message || 'Respuesta inválida');

            this.reclutas = Array.isArray(data.reclutas) ? data.reclutas : [];
            const pagination = data.pagination || {
                page: 1, pages: 1, per_page: this.itemsPerPage,
                total: this.reclutas.length, has_next: false, has_prev: false
            };

            this.updatePagination(pagination);
            this.renderReclutas();
            console.log(`✅ Cargados ${this.reclutas.length} reclutas (página ${this.currentPage})`);
        } catch (error) {
            console.error('❌ Error cargando reclutas:', error);
            showError('Error al cargar lista de reclutas');
        }
    },

    // =========================================================================
    // RENDERIZADO
    // =========================================================================

    renderReclutas() {
        const tbody = document.getElementById('gp-reclutas-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.reclutas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="no-data">
                        <i class="fas fa-search"></i>
                        <p>No se encontraron reclutas en tu equipo</p>
                    </td>
                </tr>`;
            return;
        }

        this.reclutas.forEach(recluta => {
            const estadoEtiqueta = (recluta.estado || 'Sin estado').toString();
            const estadoSlug = estadoEtiqueta
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'sin-estado';

            let fechaRegistro = 'Sin fecha';
            if (recluta.fecha_registro) {
                const f = new Date(recluta.fecha_registro);
                if (!Number.isNaN(f.valueOf())) fechaRegistro = f.toLocaleDateString();
            }

            const asesorOptions = this.asesores.map(a =>
                `<option value="${a.id}" ${a.id == recluta.asesor_id ? 'selected' : ''}>${escapeHtml(a.nombre || a.email)}</option>`
            ).join('');

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="gp-recluta-checkbox"
                           data-id="${recluta.id}"
                           ${this.selectedReclutas.has(recluta.id) ? 'checked' : ''}>
                </td>
                <td><code>${escapeHtml(recluta.folio || 'S/F')}</code></td>
                <td>${escapeHtml(recluta.nombre || 'Sin nombre')}</td>
                <td>${escapeHtml(recluta.email || 'Sin email')}</td>
                <td>${escapeHtml(recluta.telefono || 'Sin teléfono')}</td>
                <td>
                    <span class="status-badge status-${estadoSlug}">
                        ${escapeHtml(estadoEtiqueta)}
                    </span>
                </td>
                <td>${escapeHtml(recluta.asesor_nombre || 'Sin asignar')}</td>
                <td>${escapeHtml(fechaRegistro)}</td>
                <td>
                    <div class="action-buttons">
                        <select class="gp-single-asesor-select single-asesor-select" data-id="${recluta.id}"
                                title="Selecciona un asesor para ${escapeHtml(recluta.nombre || 'este recluta')}">
                            <option value="">Cambiar asesor...</option>
                            ${asesorOptions}
                        </select>
                        <button class="btn-sm btn-warning gp-single-assign"
                                data-id="${recluta.id}"
                                title="Asignar asesor a ${escapeHtml(recluta.nombre || 'este recluta')}">
                            <i class="fas fa-user-edit" aria-hidden="true"></i>
                        </button>
                    </div>
                </td>`;
            tbody.appendChild(row);
        });

        this.setupRowEventListeners();
        this.updateSelectionUI();
    },

    setupRowEventListeners() {
        // Checkboxes individuales
        document.querySelectorAll('.gp-recluta-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                if (e.target.checked) this.selectedReclutas.add(id);
                else this.selectedReclutas.delete(id);
                this.updateSelectionUI();
            });
        });

        // Feedback visual al cambiar select
        document.querySelectorAll('.gp-single-asesor-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const btn = document.querySelector(`.gp-single-assign[data-id="${id}"]`);
                if (e.target.value !== '' && btn) {
                    btn.classList.add('btn-pending-change');
                    btn.style.animation = 'pulse 2s infinite';
                    const opt = e.target.options[e.target.selectedIndex];
                    btn.title = `Confirmar cambio a: ${opt.text}`;
                } else if (btn) {
                    btn.classList.remove('btn-pending-change');
                    btn.style.animation = '';
                }
            });
        });

        // Asignación individual
        document.querySelectorAll('.gp-single-assign').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('.gp-single-assign').dataset.id);
                const select = document.querySelector(`.gp-single-asesor-select[data-id="${id}"]`);
                if (!select || select.value === '') {
                    showError('Primero selecciona un asesor del dropdown');
                    select?.focus();
                    return;
                }
                const asesorId = parseInt(select.value);
                this.assignSingle(id, asesorId, btn);
            });
        });
    },

    // =========================================================================
    // FILTROS Y SELECCIÓN
    // =========================================================================

    applyFilters() {
        this.filters.search = document.getElementById('gp-search')?.value || '';
        this.filters.estado = document.getElementById('gp-estado-filter')?.value || '';
        this.filters.asesor_id = document.getElementById('gp-asesor-filter')?.value || '';
        this.currentPage = 1;
        this.clearSelection();
        this.loadReclutas();
    },

    selectAll() {
        this.selectedReclutas.clear();
        this.reclutas.forEach(r => this.selectedReclutas.add(r.id));
        document.querySelectorAll('.gp-recluta-checkbox').forEach(cb => cb.checked = true);
        const chk = document.getElementById('gp-select-all-checkbox');
        if (chk) chk.checked = true;
        this.updateSelectionUI();
    },

    clearSelection() {
        this.selectedReclutas.clear();
        document.querySelectorAll('.gp-recluta-checkbox').forEach(cb => cb.checked = false);
        const chk = document.getElementById('gp-select-all-checkbox');
        if (chk) chk.checked = false;
        this.updateSelectionUI();
    },

    toggleSelectAll(checked) {
        if (checked) this.selectAll();
        else this.clearSelection();
    },

    updateSelectionUI() {
        const count = this.selectedReclutas.size;
        const bulkActions = document.getElementById('gp-bulk-actions');
        const countEl = document.getElementById('gp-selected-count');
        if (countEl) countEl.textContent = `${count} seleccionado${count !== 1 ? 's' : ''}`;
        if (bulkActions) bulkActions.style.display = count > 0 ? 'flex' : 'none';
    },

    // =========================================================================
    // ACCIONES
    // =========================================================================

    async bulkAssign() {
        if (this.selectedReclutas.size === 0) {
            showError('Selecciona al menos un recluta');
            return;
        }

        const select = document.getElementById('gp-bulk-asesor');
        const asesorId = select?.value;

        if (!asesorId) {
            showError('Selecciona un asesor para reasignar');
            return;
        }

        const asesorName = this.asesores.find(a => a.id == asesorId)?.nombre || 'Desconocido';

        if (!confirm(`¿Reasignar ${this.selectedReclutas.size} reclutas a "${asesorName}"?`)) return;

        try {
            this.showLoading();

            const response = await fetch('/gerente/panel/reclutas/bulk-assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recluta_ids: Array.from(this.selectedReclutas),
                    asesor_id: parseInt(asesorId)
                })
            });

            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || `HTTP ${response.status}`);

            showSuccess(`✅ ${data.cambios.length} reclutas reasignados a "${asesorName}"`);
            this.clearSelection();
            await this.loadReclutas();
        } catch (error) {
            console.error('❌ Error en reasignación masiva:', error);
            showError(`Error al reasignar: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    },

    async assignSingle(reclutaId, asesorId, btn) {
        const asesorName = this.asesores.find(a => a.id == asesorId)?.nombre || 'Desconocido';
        const originalHTML = btn?.innerHTML;

        try {
            if (btn) {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                btn.disabled = true;
                btn.style.opacity = '0.7';
            }

            const response = await fetch(`/gerente/panel/reclutas/${reclutaId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ asesor_id: asesorId })
            });

            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.message || `HTTP ${response.status}`);

            if (btn) {
                btn.innerHTML = '<i class="fas fa-check"></i>';
                btn.style.background = '#28a745';
                setTimeout(() => {
                    btn.classList.remove('btn-pending-change');
                    btn.style.animation = '';
                }, 600);
            }

            showSuccess(`✅ Asesor cambiado a "${asesorName}"`);
            setTimeout(() => this.loadReclutas(), 800);
        } catch (error) {
            console.error('❌ Error en asignación individual:', error);
            showError(`Error al asignar: ${error.message}`);
            if (btn && originalHTML) {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.classList.remove('btn-pending-change');
                btn.style.animation = '';
            }
        }
    },

    // =========================================================================
    // PAGINACIÓN
    // =========================================================================

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.clearSelection();
            this.loadReclutas();
        }
    },

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.clearSelection();
            this.loadReclutas();
        }
    },

    updatePagination(pagination) {
        if (!pagination) return;
        this.totalPages = pagination.pages || 1;

        const prevBtn = document.getElementById('gp-prev-page');
        const nextBtn = document.getElementById('gp-next-page');
        const pageInfo = document.getElementById('gp-page-info');
        const paginationInfo = document.getElementById('gp-pagination-info');

        if (prevBtn) prevBtn.disabled = !pagination.has_prev;
        if (nextBtn) nextBtn.disabled = !pagination.has_next;
        if (pageInfo) pageInfo.textContent = `Página ${pagination.page} de ${pagination.pages}`;

        if (paginationInfo) {
            const start = ((pagination.page - 1) * pagination.per_page) + 1;
            const end = Math.min(pagination.page * pagination.per_page, pagination.total);
            paginationInfo.textContent = `Mostrando ${start} - ${end} de ${pagination.total} reclutas`;
        }
    },

    // =========================================================================
    // FILTROS — POBLAR SELECTS
    // =========================================================================

    populateFilters() {
        const filterSelect = document.getElementById('gp-asesor-filter');
        const bulkSelect = document.getElementById('gp-bulk-asesor');

        if (filterSelect) {
            const baseOptions = `<option value="">Todos mis asesores</option>`;
            const asesorOptions = this.asesores.map(a =>
                `<option value="${a.id}">${escapeHtml(a.nombre || a.email)}</option>`
            ).join('');
            filterSelect.innerHTML = baseOptions + asesorOptions;
        }

        if (bulkSelect) {
            const baseOptions = `<option value="">Seleccionar asesor...</option>`;
            const asesorOptions = this.asesores.map(a =>
                `<option value="${a.id}">${escapeHtml(a.nombre || a.email)}</option>`
            ).join('');
            bulkSelect.innerHTML = baseOptions + asesorOptions;
        }
    },

    // =========================================================================
    // LOADING
    // =========================================================================

    showLoading() {
        this.isLoading = true;
        const loader = document.getElementById('gp-loading');
        if (loader) loader.style.display = 'flex';
    },

    hideLoading() {
        this.isLoading = false;
        const loader = document.getElementById('gp-loading');
        if (loader) loader.style.display = 'none';
    }
};

// ============================================================================
// INICIALIZACIÓN GLOBAL
// ============================================================================

window.GerentePanel = GerentePanel;

function initializeGerentePanel() {
    const section = document.getElementById('gerente-panel-section');
    if (!section) {
        console.warn('⚠️ Sección gerente-panel-section no encontrada en el DOM');
        return;
    }

    if (GerentePanel.isInitialized) {
        console.log('✅ Panel de Gerente ya inicializado, recargando datos...');
        GerentePanel.loadData();
        return;
    }

    console.log('🚀 Inicializando Panel de Gerente...');
    GerentePanel.init();
    GerentePanel.isInitialized = true;
}

document.addEventListener('DOMContentLoaded', () => {
    // Escuchar navegación a la sección
    document.addEventListener('sectionChanged', (event) => {
        if (event.detail && event.detail.section === 'gerente-panel-section') {
            console.log('📍 Navegando al Panel de Gerente...');
            setTimeout(() => initializeGerentePanel(), 100);
        }
    });
});

window.initializeGerentePanel = initializeGerentePanel;

export default GerentePanel;
