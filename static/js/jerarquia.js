
// 🏗️ GESTIÓN DE JERARQUÍA ORGANIZACIONAL
import { showNotification, showError, showSuccess } from './notifications.js';

const Jerarquia = {
    
    init: function() {
        const currentUser = this.getCurrentUser();
        if (!currentUser || currentUser.rol !== 'admin') {
            console.warn('Jerarquía: acceso restringido. Solo administradores pueden usar este módulo.');
            return;
        }

        console.log('Jerarquía: inicializando módulo para administrador.');
        this.setupHierarchicalMetrics();
        this.mostrarJerarquiaCompleta();
    },

    /**
     * Configurar métricas jerárquicas según rol
     */
    setupHierarchicalMetrics: function() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;

        console.log('🏗️ Configurando métricas jerárquicas para rol:', currentUser.rol);

        if (currentUser.rol === 'admin') {
            this.setupAdminHierarchicalMetrics();
        } else if (currentUser.rol === 'gerente') {
            this.setupGerenteHierarchicalMetrics();
        }
        // El rol 'asesor' no tiene métricas en esta sección.
    },

    /**
     * Métricas jerárquicas para Admin
     */
    setupAdminHierarchicalMetrics: async function() {
        try {
            console.log('📊 Configurando métricas admin: Total gerentes, asesores sin asignar, distribución general');
            
            const [gerentesResponse, asesoresResponse] = await Promise.all([
                fetch('/api/asesores?rol=gerente'),
                fetch('/api/asesores?rol=asesor&sin_gerente=true')
            ]);

            const gerentesData = await gerentesResponse.json();
            const asesoresSinGerenteData = await asesoresResponse.json();

            if (gerentesData.success && asesoresSinGerenteData.success) {
                this.displayAdminMetrics({
                    totalGerentes: gerentesData.asesores?.length || 0,
                    asesoresSinAsignar: asesoresSinGerenteData.asesores?.length || 0,
                });
            }

        } catch (error) {
            console.error('❌ Error obteniendo métricas admin:', error);
        }
    },

    /**
     * Métricas jerárquicas para Gerente
     */
    setupGerenteHierarchicalMetrics: async function() {
        try {
            console.log('📊 Configurando métricas gerente: Mis asesores activos, reclutas por distribuir, rendimiento equipo');
            
            const asesoresResponse = await fetch('/api/gerentes/mis-asesores');
            const asesoresData = await asesoresResponse.json();

            if (asesoresData.success) {
                const misAsesores = asesoresData.asesores;
                // Nota: los reclutas por distribuir se obtendrían de otra fuente o endpoint
                this.displayGerenteMetrics({
                    misAsesoresActivos: misAsesores.length,
                    reclutasPorDistribuir: 0, // Placeholder
                });
            }

        } catch (error) {
            console.error('❌ Error obteniendo métricas gerente:', error);
        }
    },

    /**
     * Mostrar métricas para Admin en la sección de gerentes
     */
    displayAdminMetrics: function(metrics) {
        const metricsContainer = this.getOrCreateMetricsContainer('admin');
        if (!metricsContainer) return;
        
        metricsContainer.innerHTML = `
            <div class="metrics-grid admin-metrics">
                <div class="metric-card">
                    <div class="metric-icon"><i class="fas fa-user-tie"></i></div>
                    <div class="metric-content">
                        <h3>${metrics.totalGerentes}</h3>
                        <p>Total Gerentes</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon"><i class="fas fa-user-slash"></i></div>
                    <div class="metric-content">
                        <h3>${metrics.asesoresSinAsignar}</h3>
                        <p>Asesores Sin Asignar</p>
                    </div>
                </div>
                <div class="metric-card action-card">
                    <div class="metric-content">
                        <button class="btn-primary btn-small" onclick="Jerarquia.mostrarAsignacionAsesores()">
                            <i class="fas fa-user-plus"></i> Asignar Asesores
                        </button>
                    </div>
                </div>
                 <div class="metric-card action-card">
                    <div class="metric-content">
                        <button class="btn-secondary btn-small" onclick="Jerarquia.mostrarJerarquiaCompleta()">
                            <i class="fas fa-sitemap"></i> Ver Jerarquía
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Mostrar métricas para Gerente en la sección de gerentes
     */
    displayGerenteMetrics: function(metrics) {
        const metricsContainer = this.getOrCreateMetricsContainer('gerente');
        if (!metricsContainer) return;
        
        metricsContainer.innerHTML = `
            <div class="metrics-grid gerente-metrics">
                <div class="metric-card">
                    <div class="metric-icon"><i class="fas fa-users"></i></div>
                    <div class="metric-content">
                        <h3>${metrics.misAsesoresActivos}</h3>
                        <p>Mis Asesores Activos</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon"><i class="fas fa-user-clock"></i></div>
                    <div class="metric-content">
                        <h3>${metrics.reclutasPorDistribuir}</h3>
                        <p>Reclutas Por Distribuir</p>
                    </div>
                </div>
                <div class="metric-card action-card">
                    <div class="metric-content">
                        <button class="btn-primary btn-small" onclick="Jerarquia.redistribuirReclutasGerente()">
                            <i class="fas fa-exchange-alt"></i> Redistribuir a Asesores
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Obtener o crear contenedor de métricas en la sección de gerentes
     */
    getOrCreateMetricsContainer: function(role) {
        const section = document.getElementById('gestion-gerentes-section');
        if (!section) return null;

        let container = document.getElementById(`metrics-gerentes-${role}-container`);
        if (!container) {
            const sectionHeader = section.querySelector('.section-header');
            if (sectionHeader) {
                container = document.createElement('div');
                container.id = `metrics-gerentes-${role}-container`;
                container.className = 'hierarchical-metrics-container';
                sectionHeader.insertAdjacentElement('afterend', container);
                console.log(`✅ Contenedor de métricas para ${role} creado en sección de gerentes.`);
            }
        }
        return container;
    },

    /**
     * Obtener usuario actual (helper)
     */
    getCurrentUser: function() {
        if (window.getCurrentUser && typeof window.getCurrentUser === 'function') {
            return window.getCurrentUser();
        }
        return null;
    },

    // --- Funciones de la sección de gerentes ---

    mostrarJerarquiaCompleta: async function() {
        console.log('Mostrando jerarquía completa...');
        const container = document.getElementById('jerarquia-container');
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Cargando Jerarquía...</div>';

        try {
            const response = await fetch('/api/gerentes/jerarquia');
            const data = await response.json();

            if (data.success) {
                this.renderJerarquia(data.jerarquia);
            } else {
                throw new Error(data.message || 'Error al cargar la jerarquía.');
            }
        } catch (error) {
            console.error('Error en mostrarJerarquiaCompleta:', error);
            container.innerHTML = '<div class="error-message">No se pudo cargar la jerarquía.</div>';
            showError(error.message);
        }
    },

    renderJerarquia: function(jerarquia) {
        const container = document.getElementById('jerarquia-container');
        if (!container) return;

        if (!jerarquia || jerarquia.length === 0) {
            container.innerHTML = '<div class="info-placeholder">No hay gerentes para mostrar.</div>';
            return;
        }

        const totalAsesores = jerarquia.reduce((sum, item) => sum + ((item.asesores || []).length), 0);

        const headerHtml = `
            <div class="jerarquia-header">
                <h3><i class="fas fa-sitemap"></i> Estructura Organizacional Completa</h3>
                <div class="jerarquia-stats">
                    <span class="stat-item">
                        <i class="fas fa-user-tie"></i>
                        ${jerarquia.length} Gerentes
                    </span>
                    <span class="stat-item">
                        <i class="fas fa-users"></i>
                        ${totalAsesores} Asesores
                    </span>
                </div>
            </div>
        `;

        const treeHtml = jerarquia.map(item => this.renderGerenteCard(item)).join('');
        container.innerHTML = `${headerHtml}<div class="jerarquia-tree">${treeHtml}</div>`;
    },

    renderGerenteCard: function(item) {
        const gerente = item.gerente || item;
        const asesores = item.asesores || [];
        const resumenEquipoHtml = this.renderEstadoSummary(item.resumen_equipo);
        const resumenGerenteHtml = this.renderEstadoSummary(gerente.resumen_estados);
        const reclutasDirectos = item.reclutas_directos || [];

        const directosHtml = reclutasDirectos.length
            ? `
                <div class="reclutas-section">
                    <div class="section-subtitle">
                        <h5><i class="fas fa-user-check"></i> Reclutas directos del gerente</h5>
                        <span class="section-count">${reclutasDirectos.length}</span>
                    </div>
                    <div class="reclutas-cards">
                        ${this.renderReclutasList(reclutasDirectos)}
                    </div>
                </div>
            `
            : '';

        const asesoresHtml = asesores.length
            ? asesores.map(asesor => this.renderAsesorItem(asesor, gerente.id)).join('')
            : this.renderEmptyAsesores(gerente.id);

        return `
            <div class="gerente-card" data-gerente-id="${gerente.id}">
                <div class="gerente-header" onclick="Jerarquia.toggleGerenteExpansion(${gerente.id})">
                    <div class="gerente-info">
                        <div class="gerente-avatar">
                            <i class="fas fa-user-tie"></i>
                        </div>
                        <div class="gerente-details">
                            <h4>${gerente.nombre || gerente.email}</h4>
                            <p class="gerente-email">${gerente.email}</p>
                        </div>
                    </div>
                    <div class="gerente-stats">
                        <span class="stat-badge" title="Asesores">
                            <i class="fas fa-users"></i> ${asesores.length}
                        </span>
                        <span class="stat-badge" title="Reclutas totales">
                            <i class="fas fa-clipboard-list"></i> ${item.reclutas_total || 0}
                        </span>
                        <i class="fas fa-chevron-down expand-icon" id="expand-${gerente.id}"></i>
                    </div>
                </div>
                <div class="gerente-body" id="gerente-body-${gerente.id}" style="display: none;">
                    <div class="gerente-summaries">
                        <div class="summary-block">
                            <h5>Resumen del gerente</h5>
                            ${resumenGerenteHtml}
                        </div>
                        <div class="summary-block">
                            <h5>Resumen del equipo</h5>
                            ${resumenEquipoHtml}
                        </div>
                    </div>
                    ${directosHtml}
                    <div class="asesores-list">
                        <div class="section-subtitle">
                            <h5><i class="fas fa-users"></i> Asesores asignados</h5>
                            <span class="section-count">${asesores.length}</span>
                        </div>
                        ${asesoresHtml}
                    </div>
                </div>
            </div>
        `;
    },

    renderEstadoSummary: function(resumen) {
        if (!resumen || Object.keys(resumen).length === 0) {
            return '<div class="estado-summary empty"><span>Sin movimientos registrados</span></div>';
        }

        const order = ['activo', 'en proceso', 'rechazado'];
        const entries = Object.entries(resumen).sort((a, b) => {
            const estadoA = (a[0] || '').toLowerCase();
            const estadoB = (b[0] || '').toLowerCase();
            const idxA = order.indexOf(estadoA);
            const idxB = order.indexOf(estadoB);
            const weightA = idxA === -1 ? order.length : idxA;
            const weightB = idxB === -1 ? order.length : idxB;
            return weightA - weightB;
        });

        const badges = entries.map(([estado, total]) => {
            const toneClass = this.getEstadoToneClass(estado);
            return `<span class="estado-badge ${toneClass}">${this.formatEstado(estado)} (${total})</span>`;
        }).join('');

        return `<div class="estado-summary">${badges}</div>`;
    },

    renderEmptyAsesores: function(gerenteId) {
        return `
            <div class="empty-asesores">
                <i class="fas fa-info-circle"></i>
                <p>No hay asesores asignados a este gerente</p>
                <button class="btn-sm btn-primary" onclick="event.stopPropagation(); Jerarquia.abrirAsignacionAsesor(${gerenteId});">
                    <i class="fas fa-user-plus"></i> Asignar Asesor
                </button>
            </div>
        `;
    },

    renderAsesorItem: function(asesor, gerenteId) {
        const totalReclutas = asesor.total_reclutas || (Array.isArray(asesor.reclutas) ? asesor.reclutas.length : 0);
        const resumenHtml = this.renderEstadoSummary(asesor.resumen_estados);
        const reclutas = asesor.reclutas || [];

        return `
            <div class="asesor-item" data-asesor-id="${asesor.id}">
                <div class="asesor-header" onclick="Jerarquia.toggleAsesorExpansion(${gerenteId}, ${asesor.id})">
                    <div class="asesor-info">
                        <div class="asesor-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="asesor-details">
                            <h5>${asesor.nombre || asesor.email}</h5>
                            <p class="asesor-email">${asesor.email}</p>
                        </div>
                    </div>
                    <div class="asesor-stats">
                        <button class="btn-icon btn-sm" title="Reasignar Asesor" onclick="event.stopPropagation(); Jerarquia.reasignarAsesor(${asesor.id}, '${asesor.nombre || asesor.email}');">
                            <i class="fas fa-random"></i>
                        </button>
                        <span class="reclutas-count" title="Reclutas asignados">
                            <i class="fas fa-clipboard-list"></i> ${totalReclutas}
                        </span>
                        <i class="fas fa-chevron-down expand-icon" id="asesor-expand-${asesor.id}"></i>
                    </div>
                </div>
                <div class="asesor-resumen">
                    ${resumenHtml}
                </div>
                <div class="reclutas-list" id="asesor-reclutas-${asesor.id}" style="display: none;">
                    ${this.renderReclutasList(reclutas)}
                </div>
            </div>
        `;
    },

    renderReclutasList: function(reclutas) {
        if (!Array.isArray(reclutas) || reclutas.length === 0) {
            return '<div class="empty-reclutas"><i class="fas fa-info-circle"></i> Sin reclutas asignados</div>';
        }

        return reclutas.map(recluta => {
            const estadoClass = this.getEstadoToneClass(recluta.estado);
            return `
                <div class="recluta-item" data-recluta-id="${recluta.id}">
                    <div class="recluta-info">
                        <h5>${recluta.nombre || recluta.email || 'Recluta sin nombre'}</h5>
                        <p>${recluta.email || 'Sin correo registrado'}</p>
                        ${recluta.telefono ? `<p>${recluta.telefono}</p>` : ''}
                    </div>
                    <div class="recluta-meta">
                        <span class="estado-badge ${estadoClass}">${this.formatEstado(recluta.estado)}</span>
                        ${recluta.folio ? `<span class="recluta-folio">Folio: ${recluta.folio}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    formatEstado: function(estado) {
        if (!estado) return 'Sin estado';
        const value = estado.toString().trim().toLowerCase();
        return value.charAt(0).toUpperCase() + value.slice(1);
    },

    getEstadoToneClass: function(estado) {
        const value = (estado || '').toString().toLowerCase();
        if (value.includes('activo')) return 'estado-activo';
        if (value.includes('proceso')) return 'estado-en-proceso';
        if (value.includes('rechaz')) return 'estado-rechazado';
        return '';
    },

    toggleGerenteExpansion: function(gerenteId) {
        const body = document.getElementById(`gerente-body-${gerenteId}`);
        const expandIcon = document.getElementById(`expand-${gerenteId}`);

        if (body && expandIcon) {
            const isExpanded = body.style.display !== 'none';
            body.style.display = isExpanded ? 'none' : '';
            expandIcon.classList.toggle('fa-chevron-down', isExpanded);
            expandIcon.classList.toggle('fa-chevron-up', !isExpanded);
        }
    },

    toggleAsesorExpansion: function(gerenteId, asesorId) {
        const list = document.getElementById(`asesor-reclutas-${asesorId}`);
        const expandIcon = document.getElementById(`asesor-expand-${asesorId}`);

        if (list && expandIcon) {
            const isExpanded = list.style.display !== 'none';
            list.style.display = isExpanded ? 'none' : '';
            expandIcon.classList.toggle('fa-chevron-down', isExpanded);
            expandIcon.classList.toggle('fa-chevron-up', !isExpanded);
        }
    },

    verReclutasAsesor: async function(asesorId) {
        try {
            console.log('Viendo reclutas del asesor:', asesorId);

            const response = await fetch(`/api/reclutas?asesor_id=${asesorId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                this.mostrarModalReclutasAsesor(asesorId, data.reclutas);
            } else {
                showError(data.message || 'Error al cargar reclutas del asesor');
            }

        } catch (error) {
            console.error('Error cargando reclutas del asesor:', error);
            showError('Error de conexión al cargar reclutas del asesor');
        }
    },

    mostrarModalReclutasAsesor: function(asesorId, reclutas) {
        // Crear modal dinámico para mostrar reclutas
        const modalHtml = `
            <div id="modalReclutasAsesor" class="modal">
                <div class="modal-content modal-lg">
                    <div class="modal-header">
                        <h3><i class="fas fa-clipboard-list"></i> Reclutas del Asesor</h3>
                        <span class="close-modal" onclick="this.closest('.modal').remove()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="reclutas-list">
                            ${reclutas.length > 0 ?
                                reclutas.map(recluta => `
                                    <div class="recluta-item">
                                        <div class="recluta-info">
                                            <h5>${recluta.nombre}</h5>
                                            <p>${recluta.puesto || 'Sin puesto'}</p>
                                            <span class="estado-badge estado-${(recluta.estado || 'activo').toLowerCase()}">
                                                ${recluta.estado || 'Activo'}
                                            </span>
                                        </div>
                                        <div class="recluta-meta">
                                            <p><i class="fas fa-envelope"></i> ${recluta.email}</p>
                                            <p><i class="fas fa-phone"></i> ${recluta.telefono}</p>
                                            <p><i class="fas fa-calendar"></i> ${new Date(recluta.fecha_registro).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                `).join('')
                                : '<div class="empty-state"><i class="fas fa-inbox"></i><p>No hay reclutas asignados</p></div>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Mostrar modal
        const modal = document.getElementById('modalReclutasAsesor');
        if (modal) {
            modal.style.display = 'block';
        }
    },

    abrirAsignacionAsesor: function(gerenteId) {
        console.log('Abriendo asignación de asesor para gerente:', gerenteId);
        // Reutilizar la función principal de asignación, pasando el ID del gerente
        this.mostrarAsignacionAsesores(gerenteId);
    },

    reasignarAsesor: async function(asesorId, asesorNombre) {
        console.log(`Iniciando reasignación para asesor: ${asesorNombre} (ID: ${asesorId})`);
        
        try {
            // 1. Obtener la lista de todos los gerentes
            const response = await fetch('/api/asesores?rol=gerente');
            const data = await response.json();

            if (!data.success) {
                showError(data.message || 'No se pudo cargar la lista de gerentes.');
                return;
            }

            const gerentes = data.asesores;

            // 2. Crear y mostrar un modal para la reasignación
            const modalHtml = `
                <div id="modalReasignarAsesor" class="modal" style="display: block;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Reasignar Asesor</h3>
                            <span class="close-modal" onclick="this.closest('.modal').remove()">&times;</span>
                        </div>
                        <div class="modal-body">
                            <p>Selecciona un nuevo gerente para el asesor <strong>${asesorNombre}</strong>.</p>
                            <div class="form-group">
                                <label for="selectNuevoGerente">Nuevo Gerente:</label>
                                <select id="selectNuevoGerente" class="form-control">
                                    <option value="">-- Selecciona un gerente --</option>
                                    ${gerentes.map(g => `<option value="${g.id}">${g.nombre || g.email}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
                            <button type="button" class="btn-primary" onclick="Jerarquia.ejecutarReasignacion(${asesorId})">Reasignar</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);

        } catch (error) {
            console.error('Error en reasignarAsesor:', error);
            showError('Error de conexión al intentar reasignar.');
        }
    },

    ejecutarReasignacion: async function(asesorId) {
        const nuevoGerenteId = document.getElementById('selectNuevoGerente').value;

        if (!nuevoGerenteId) {
            showNotification('Debes seleccionar un nuevo gerente.', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/gerentes/reasignar-asesor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    asesor_id: parseInt(asesorId),
                    nuevo_gerente_id: parseInt(nuevoGerenteId)
                })
            });

            const data = await response.json();

            if (data.success) {
                showSuccess(data.message || 'Asesor reasignado con éxito.');
                document.getElementById('modalReasignarAsesor').remove();
                // Actualización dinámica en lugar de recarga completa
                this.actualizarVistaReasignacion(data.asesor, data.antiguo_gerente, data.nuevo_gerente);
            } else {
                showError(data.message || 'Ocurrió un error durante la reasignación.');
            }
        } catch (error) {
            console.error('Error en ejecutarReasignacion:', error);
            showError('Error de conexión al ejecutar la reasignación.');
        }
    },

    actualizarVistaReasignacion: function(asesor, antiguoGerente, nuevoGerente) {
        console.log(`Reasignando dinámicamente: ${asesor.nombre} de ${antiguoGerente.nombre} a ${nuevoGerente.nombre}`);

        // 1. Eliminar el item del asesor de la lista del antiguo gerente
        const asesorItem = document.querySelector(`.asesor-item[data-asesor-id="${asesor.id}"]`);
        if (asesorItem) {
            asesorItem.remove();
        }

        // 2. Actualizar contadores del antiguo gerente
        const antiguoGerenteCard = document.querySelector(`.gerente-card[data-gerente-id="${antiguoGerente.id}"]`);
        if (antiguoGerenteCard) {
            // Contador en el header
            const statBadge = antiguoGerenteCard.querySelector('.gerente-stats .stat-badge[title="Asesores"]');
            if (statBadge) {
                const currentCount = Math.max(0, (parseInt(statBadge.innerText.trim(), 10) || 0) - 1);
                statBadge.innerHTML = `<i class="fas fa-users"></i> ${currentCount}`;
            }
            // Contador en el subtítulo
            const sectionCount = antiguoGerenteCard.querySelector('.asesores-list .section-subtitle .section-count');
            if (sectionCount) {
                const currentCount = Math.max(0, (parseInt(sectionCount.innerText.trim(), 10) || 0) - 1);
                sectionCount.innerText = currentCount;

                // Si se queda sin asesores, añadir el placeholder
                if (currentCount === 0) {
                     const asesoresListContainer = antiguoGerenteCard.querySelector('.asesores-list');
                     if(asesoresListContainer){
                        asesoresListContainer.insertAdjacentHTML('beforeend', this.renderEmptyAsesores(antiguoGerente.id));
                     }
                }
            }
        }

        // 3. Añadir el item del asesor a la lista del nuevo gerente
        const nuevoGerenteCard = document.querySelector(`.gerente-card[data-gerente-id="${nuevoGerente.id}"]`);
        if (nuevoGerenteCard) {
            const asesoresListContainer = nuevoGerenteCard.querySelector('.asesores-list');
            if (asesoresListContainer) {
                // Eliminar placeholder si existe
                const emptyPlaceholder = asesoresListContainer.querySelector('.empty-asesores');
                if (emptyPlaceholder) {
                    emptyPlaceholder.remove();
                }
                // Añadir asesor
                asesoresListContainer.insertAdjacentHTML('beforeend', this.renderAsesorItem(asesor, nuevoGerente.id));

                // Actualizar contadores
                const statBadge = nuevoGerenteCard.querySelector('.gerente-stats .stat-badge[title="Asesores"]');
                 if (statBadge) {
                    const currentCount = (parseInt(statBadge.innerText.trim(), 10) || 0) + 1;
                    statBadge.innerHTML = `<i class="fas fa-users"></i> ${currentCount}`;
                }
                const sectionCount = asesoresListContainer.querySelector('.section-subtitle .section-count');
                 if (sectionCount) {
                    const currentCount = (parseInt(sectionCount.innerText.trim(), 10) || 0) + 1;
                    sectionCount.innerText = currentCount;
                }
            }
        }
    },

    mostrarAsignacionAsesores: async function(gerenteId = null) {
        try {
            console.log('Cargando modal de asignación de asesores...');

            // Obtener gerentes y TODOS los asesores activos (para permitir reasignación)
            const [gerentesResponse, asesoresResponse] = await Promise.all([
                fetch('/api/asesores?rol=gerente'),
                fetch('/api/asesores?rol=asesor')
            ]);

            const gerentesData = await gerentesResponse.json();
            const asesoresData = await asesoresResponse.json();

            if (gerentesData.success && asesoresData.success) {
                // Pasar todos los asesores (con o sin gerente) para permitir reasignación
                const todosLosAsesores = asesoresData.asesores;

                this.mostrarModalAsignacionAsesores(gerentesData.asesores, todosLosAsesores, gerenteId);
            } else {
                showError('Error al cargar datos para asignación');
            }

        } catch (error) {
            console.error('Error cargando asignación:', error);
            showError('Error de conexión al cargar asignación');
        }
    },

    mostrarModalAsignacionAsesores: function(gerentes, todosLosAsesores, gerenteId = null) {
        // Separar asesores sin gerente para el mensaje informativo
        const asesoresSinGerente = todosLosAsesores.filter(a => !a.gerente_id);

        const modalHtml = `
            <div id="modalAsignacionAsesores" class="modal">
                <div class="modal-content modal-lg">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-plus"></i> Asignar/Reasignar Asesores a Gerentes</h3>
                        <span class="close-modal" onclick="this.closest('.modal').remove()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="asignacion-container">
                            <div class="asignacion-form">
                                <div class="form-group">
                                    <label for="selectGerente">Seleccionar Gerente:</label>
                                    <select id="selectGerente" class="form-control">
                                        <option value="">-- Selecciona un gerente --</option>
                                        ${gerentes.map(gerente =>
                                            `<option value="${gerente.id}" ${gerente.id === gerenteId ? 'selected' : ''}>${gerente.nombre || gerente.email}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="selectAsesor">Seleccionar Asesor:</label>
                                    <select id="selectAsesor" class="form-control">
                                        <option value="">-- Selecciona un asesor --</option>
                                        ${todosLosAsesores.map(asesor => {
                                            const gerenteInfo = asesor.gerente_nombre
                                                ? ` - Gerente actual: ${asesor.gerente_nombre}`
                                                : ' - Sin gerente';
                                            return `<option value="${asesor.id}" data-gerente-id="${asesor.gerente_id || ''}">${asesor.nombre || asesor.email}${gerenteInfo}</option>`;
                                        }).join('')}
                                    </select>
                                </div>
                                <div class="form-actions">
                                    <button class="btn-primary" onclick="Jerarquia.ejecutarAsignacionAsesor()">
                                        <i class="fas fa-check"></i> Asignar/Reasignar Asesor
                                    </button>
                                </div>
                            </div>

                            <div class="asignaciones-actuales">
                                <h4>Asignaciones Actuales</h4>
                                <div class="gerentes-asignados">
                                    ${gerentes.map(gerente => `
                                        <div class="gerente-asignacion">
                                            <h5>${gerente.nombre || gerente.email}</h5>
                                            <p>${gerente.total_asesores || 0} asesores asignados</p>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>

                        ${asesoresSinGerente.length === 0 && todosLosAsesores.length > 0 ?
                            '<div class="info-message"><i class="fas fa-info-circle"></i> Todos los asesores ya tienen gerente asignado. Puede reasignarlos seleccionando uno de la lista.</div>'
                            : ''
                        }
                        ${todosLosAsesores.length === 0 ?
                            '<div class="info-message"><i class="fas fa-info-circle"></i> No hay asesores registrados en el sistema.</div>'
                            : ''
                        }
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = document.getElementById('modalAsignacionAsesores');
        if (modal) {
            modal.style.display = 'block';
        }
    },

    ejecutarAsignacionAsesor: async function() {
        const gerenteId = document.getElementById('selectGerente')?.value;
        const asesorId = document.getElementById('selectAsesor')?.value;
        const selectAsesor = document.getElementById('selectAsesor');
        const selectedOption = selectAsesor?.selectedOptions[0];
        const asesorGerenteActualId = selectedOption?.dataset?.gerenteId;

        if (!gerenteId || !asesorId) {
            showNotification('Selecciona ambos: gerente y asesor', 'warning');
            return;
        }

        // Validar que no se esté asignando al mismo gerente que ya tiene
        if (asesorGerenteActualId && parseInt(asesorGerenteActualId) === parseInt(gerenteId)) {
            showNotification('El asesor ya está asignado a este gerente', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/gerentes/asignar-asesor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gerente_id: parseInt(gerenteId),
                    asesor_id: parseInt(asesorId)
                })
            });

            const data = await response.json();

            if (data.success) {
                showSuccess(data.message || 'Asesor asignado correctamente.');
                document.getElementById('modalAsignacionAsesores')?.remove();

                // Si fue reasignación, actualizar también la vista del gerente anterior
                if (data.antiguo_gerente) {
                    this.actualizarVistaReasignacion(data.asesor, data.antiguo_gerente, data.gerente);
                } else {
                    // Asignación nueva (asesor sin gerente previo)
                    this.actualizarVistaAsignacion(data.gerente, data.asesor);
                }
            } else {
                showError(data.message || 'Error en la asignación');
            }

        } catch (error) {
            console.error('Error ejecutando asignación:', error);
            showError('Error de conexión en la asignación');
        }
    },

    actualizarVistaAsignacion: function(gerente, asesor) {
        console.log('Actualizando vista dinámicamente para:', gerente, asesor);

        const gerenteCard = document.querySelector(`.gerente-card[data-gerente-id="${gerente.id}"]`);
        if (!gerenteCard) {
            console.warn('No se encontró la tarjeta del gerente para actualizar.');
            // Si la tarjeta no está, una recarga puede ser un fallback válido
            this.mostrarJerarquiaCompleta();
            return;
        }

        // 1. Eliminar al asesor del modal si aún estuviera visible
        const asesorOption = document.querySelector(`#selectAsesor option[value="${asesor.id}"]`);
        if (asesorOption) {
            asesorOption.remove();
        }

        // 2. Renderizar el item del nuevo asesor
        const asesorHtml = this.renderAsesorItem(asesor, gerente.id);
        
        // 3. Encontrar la lista de asesores del gerente
        const asesoresListContainer = gerenteCard.querySelector('.asesores-list');
        if (asesoresListContainer) {
            // Eliminar el placeholder si existe
            const emptyPlaceholder = asesoresListContainer.querySelector('.empty-asesores');
            if (emptyPlaceholder) {
                emptyPlaceholder.remove();
            }
            
            // Añadir el nuevo asesor
            asesoresListContainer.insertAdjacentHTML('beforeend', asesorHtml);
        }

        // 4. Actualizar el contador de asesores del gerente
        const statBadge = gerenteCard.querySelector('.gerente-stats .stat-badge');
        if (statBadge && statBadge.title.toLowerCase() === 'asesores') {
            const currentCount = parseInt(statBadge.innerText.trim(), 10) || 0;
            statBadge.innerHTML = `<i class="fas fa-users"></i> ${currentCount + 1}`;
        }

        // 5. Actualizar el contador en el subtítulo de la sección de asesores
        const sectionCount = asesoresListContainer.querySelector('.section-subtitle .section-count');
        if (sectionCount) {
            const currentCount = parseInt(sectionCount.innerText.trim(), 10) || 0;
            sectionCount.innerText = currentCount + 1;
        }

        // 6. Actualizar métricas globales
        this.setupAdminHierarchicalMetrics();
    },

    redistribuirReclutasGerente: async function() {
        try {
            console.log('Cargando modal de redistribución para gerente...');

            // Obtener información del dashboard del gerente
            const response = await fetch('/api/reclutas/dashboard-gerente');
            const data = await response.json();

            if (data.success) {
                this.mostrarModalRedistribucionGerente(data);
            } else {
                showError(data.message || 'Error al cargar información del gerente');
            }

        } catch (error) {
            console.error('Error cargando redistribución:', error);
            showError('Error de conexión al cargar redistribución');
        }
    },

    mostrarModalRedistribucionGerente: function(dashboardData) {
        const misReclutas = dashboardData.mis_reclutas || [];
        const asesores = dashboardData.asesores || [];

        const modalHtml = `
            <div id="modalRedistribucionGerente" class="modal">
                <div class="modal-content modal-lg">
                    <div class="modal-header">
                        <h3><i class="fas fa-share-alt"></i> Redistribuir Mis Reclutas</h3>
                        <span class="close-modal" onclick="this.closest('.modal').remove()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="redistribucion-info">
                            <h4>Reclutas Disponibles para Redistribuir: <span class="badge">${misReclutas.length}</span></h4>
                        </div>

                        ${misReclutas.length === 0 ?
                            '<div class="info-message"><i class="fas fa-info-circle"></i> No tienes reclutas para redistribuir</div>'
                            : `
                            <div class="redistribucion-container">
                                <div class="reclutas-section">
                                    <h5>Seleccionar Reclutas:</h5>
                                    <div class="reclutas-checkbox-list">
                                        ${misReclutas.map(recluta => `
                                            <label class="checkbox-item">
                                                <input type="checkbox" name="reclutaSelect" value="${recluta.id}">
                                                <span class="checkbox-label">
                                                    <strong>${recluta.nombre}</strong> - ${recluta.puesto || 'Sin puesto'}
                                                    <small>(${recluta.estado || 'Activo'})</small>
                                                </span>
                                            </label>
                                        `).join('')}
                                    </div>
                                    <div class="selection-controls">
                                        <button type="button" class="btn-sm btn-secondary" onclick="Jerarquia.selectAllReclutas(true)">
                                            Seleccionar Todos
                                        </button>
                                        <button type="button" class="btn-sm btn-secondary" onclick="Jerarquia.selectAllReclutas(false)">
                                            Deseleccionar Todos
                                        </button>
                                    </div>
                                </div>

                                <div class="asesores-section">
                                    <h5>Asignar a Asesor:</h5>
                                    <select id="selectAsesorDestino" class="form-control">
                                        <option value="">-- Selecciona un asesor --</option>
                                        ${asesores.map(asesor => `
                                            <option value="${asesor.id}">
                                                ${asesor.nombre || asesor.email} (${asesor.total_reclutas || 0} reclutas)
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>

                                <div class="form-actions">
                                    <button class="btn-primary" onclick="Jerarquia.ejecutarRedistribucionGerente()">
                                        <i class="fas fa-share-alt"></i> Redistribuir Seleccionados
                                    </button>
                                </div>
                            </div>
                            `
                        }

                        ${asesores.length === 0 ?
                            '<div class="warning-message"><i class="fas fa-exclamation-triangle"></i> No tienes asesores asignados para redistribuir</div>'
                            : ''
                        }
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = document.getElementById('modalRedistribucionGerente');
        if (modal) {
            modal.style.display = 'block';
        }
    },

    selectAllReclutas: function(select) {
        const checkboxes = document.querySelectorAll('input[name="reclutaSelect"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = select;
        });
    },

    ejecutarRedistribucionGerente: async function() {
        const selectedReclutas = Array.from(document.querySelectorAll('input[name="reclutaSelect"]:checked'))
            .map(checkbox => parseInt(checkbox.value));

        const asesorDestino = document.getElementById('selectAsesorDestino')?.value;

        if (selectedReclutas.length === 0) {
            showNotification('Selecciona al menos un recluta', 'warning');
            return;
        }

        if (!asesorDestino) {
            showNotification('Selecciona un asesor destino', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/gerentes/redistribuir-reclutas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    recluta_ids: selectedReclutas,
                    asesor_id: parseInt(asesorDestino)
                })
            });

            const data = await response.json();

            if (data.success) {
                showNotification(`${data.redistribuidos} reclutas redistribuidos exitosamente`, 'success');
                document.getElementById('modalRedistribucionGerente')?.remove();

                // Recargar vista del equipo
                this.verMiEquipo();
            } else {
                showError(data.message || 'Error en la redistribución');
            }

        } catch (error) {
            console.error('Error ejecutando redistribución:', error);
            showError('Error de conexión en la redistribución');
        }
    },

    verMiEquipo: function() {
        console.log('Recargando la vista de jerarquía para reflejar cambios...');
        this.mostrarJerarquiaCompleta();
    }
};

export default Jerarquia;
