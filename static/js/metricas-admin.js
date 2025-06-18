// ============================================================================
// Métricas Administrativas por Asesor
// Archivo: static/js/metricas-admin.js
// ============================================================================

const MetricasAdmin = { 
    // 🎛️ CONFIGURACIÓN DEL MÓDULO
    config: {
        refreshInterval: 300000, // 5 minutos
        colores: {
            verde: '#10B981',    // Verde éxito - Activo
            amarillo: '#F59E0B', // Amarillo proceso - En proceso
            rojo: '#EF4444',     // Rojo rechazo - Rechazado
            excelente: '#059669',
            bueno: '#10B981',
            regular: '#F59E0B',
            mejora: '#EF4444'
        },
        animacionDuracion: 300
    },

    // 🔄 INICIALIZAR MÓDULO
    init() {
        console.log('🎯 Inicializando Módulo de Métricas Admin...');
        this.bindEvents();
        this.loadMetricas();
        this.setupAutoRefresh();
    },

    // 🎭 VINCULAR EVENTOS
    bindEvents() {
        // Botón de actualizar métricas
        const refreshBtn = document.getElementById('refresh-metricas-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadMetricas(true));
        }

        // Botón de exportar
        const exportBtn = document.getElementById('export-metricas-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportarMetricas());
        }

        // Toggle para vista detallada/resumida
        const viewToggle = document.getElementById('metricas-view-toggle');
        if (viewToggle) {
            viewToggle.addEventListener('change', (e) => {
                this.toggleView(e.target.checked);
            });
        }
    },

    async loadMetricas(showLoader = false) {
    if (showLoader) {
        this.showLoader();
    }

    try {
        // CAMBIO: Usar la ruta correcta sin duplicar '/admin'
        const response = await fetch('/admin/metricas/asesores', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success) {
            this.renderMetricas(data);
            this.updateLastRefresh();
            // CAMBIO: Usar showNotification en lugar de Notifications.show
            if (typeof showNotification !== 'undefined') {
                showNotification('Métricas actualizadas correctamente', 'success');
            }
        } else {
            throw new Error(data.message || 'Error al cargar métricas');
        }

    } catch (error) {
        console.error('❌ Error al cargar métricas:', error);
        if (typeof showError !== 'undefined') {
            showError('Error al cargar métricas: ' + error.message);
        }
    } finally {
        this.hideLoader();
    }
},

    // 🎨 RENDERIZAR MÉTRICAS EN LA INTERFAZ
    renderMetricas(data) {
        this.renderResumenGlobal(data.metricas_globales);
        this.renderTarjetasAsesores(data.metricas_asesores);
        this.renderTopPerformers(data.insights.top_performers);
        this.renderNeedsImprovement(data.insights.needs_improvement);
        this.renderGraficos(data);
    },

    // 📊 RENDERIZAR RESUMEN GLOBAL
    renderResumenGlobal(globales) {
        const container = document.getElementById('resumen-global');
        if (!container) return;

        const { total_asesores, total_reclutas, distribucion_global, promedio_sistema } = globales;

        container.innerHTML = `
            <div class="metricas-grid-global">
                <div class="metrica-global-card">
                    <div class="metrica-icon">
                        <i class="fas fa-users-cog"></i>
                    </div>
                    <div class="metrica-content">
                        <h4>Total Asesores</h4>
                        <p class="metrica-numero">${total_asesores}</p>
                        <small>Asesores activos</small>
                    </div>
                </div>

                <div class="metrica-global-card">
                    <div class="metrica-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="metrica-content">
                        <h4>Total Reclutas</h4>
                        <p class="metrica-numero">${total_reclutas}</p>
                        <small>En todo el sistema</small>
                    </div>
                </div>

                <div class="metrica-global-card distribucion-card">
                    <h4>Distribución Global</h4>
                    <div class="distribucion-visual">
                        <div class="estado-badge verde">
                            <span class="estado-count">${distribucion_global.verdes}</span>
                            <span class="estado-label">Activos</span>
                        </div>
                        <div class="estado-badge amarillo">
                            <span class="estado-count">${distribucion_global.amarillos}</span>
                            <span class="estado-label">En Proceso</span>
                        </div>
                        <div class="estado-badge rojo">
                            <span class="estado-count">${distribucion_global.rojos}</span>
                            <span class="estado-label">Rechazados</span>
                        </div>
                    </div>
                </div>

                <div class="metrica-global-card promedio-card">
                    <h4>Promedio del Sistema</h4>
                    <div class="promedio-visual">
                        <div class="promedio-item">
                            <span class="promedio-valor verde">${promedio_sistema.exito}%</span>
                            <span class="promedio-label">Tasa de Éxito</span>
                        </div>
                        <div class="promedio-item">
                            <span class="promedio-valor amarillo">${promedio_sistema.proceso}%</span>
                            <span class="promedio-label">En Proceso</span>
                        </div>
                        <div class="promedio-item">
                            <span class="promedio-valor rojo">${promedio_sistema.rechazo}%</span>
                            <span class="promedio-label">Rechazos</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // 👥 RENDERIZAR TARJETAS DE ASESORES
    renderTarjetasAsesores(asesores) {
        const container = document.getElementById('asesores-metricas');
        if (!container) return;

        if (asesores.length === 0) {
            container.innerHTML = `
                <div class="no-data-message">
                    <i class="fas fa-users-slash"></i>
                    <h3>No hay asesores registrados</h3>
                    <p>No se encontraron asesores con reclutas asignados</p>
                </div>
            `;
            return;
        }

        const tarjetasHTML = asesores.map((asesor, index) => {
            const { estados, tasas, performance } = asesor;
            const ranking = index + 1;
            
            return `
                <div class="asesor-metrica-card ${performance.class}" data-asesor-id="${asesor.id}">
                    <div class="asesor-header">
                        <div class="asesor-info">
                            <div class="asesor-avatar">
                                <i class="fas fa-user-tie"></i>
                                <span class="ranking-badge">#${ranking}</span>
                            </div>
                            <div class="asesor-datos">
                                <h4 class="asesor-nombre">${asesor.nombre}</h4>
                                <p class="asesor-email">${asesor.email}</p>
                                <span class="performance-badge ${performance.class}">
                                    ${performance.nivel}
                                </span>
                            </div>
                        </div>
                        <div class="asesor-score">
                            <span class="score-valor">${performance.score}%</span>
                            <span class="score-label">Éxito</span>
                        </div>
                    </div>

                    <div class="asesor-stats">
                        <div class="stat-item total">
                            <span class="stat-numero">${asesor.total_reclutas}</span>
                            <span class="stat-label">Total</span>
                        </div>
                        <div class="stat-item verde">
                            <span class="stat-numero">${estados.verdes}</span>
                            <span class="stat-label">Activos</span>
                            <span class="stat-porcentaje">${tasas.exito}%</span>
                        </div>
                        <div class="stat-item amarillo">
                            <span class="stat-numero">${estados.amarillos}</span>
                            <span class="stat-label">En Proceso</span>
                            <span class="stat-porcentaje">${tasas.proceso}%</span>
                        </div>
                        <div class="stat-item rojo">
                            <span class="stat-numero">${estados.rojos}</span>
                            <span class="stat-label">Rechazados</span>
                            <span class="stat-porcentaje">${tasas.rechazo}%</span>
                        </div>
                    </div>

                    <div class="asesor-progress">
                        <div class="progress-bar">
                            <div class="progress-fill verde" style="width: ${tasas.exito}%"></div>
                            <div class="progress-fill amarillo" style="width: ${tasas.proceso}%"></div>
                            <div class="progress-fill rojo" style="width: ${tasas.rechazo}%"></div>
                        </div>
                    </div>

                    <div class="asesor-actions">
                        <button class="btn-detalle" onclick="MetricasAdmin.verDetalle(${asesor.id})">
                            <i class="fas fa-chart-line"></i> Ver Detalle
                        </button>
                        <button class="btn-contactar" onclick="MetricasAdmin.contactarAsesor('${asesor.email}')">
                            <i class="fas fa-envelope"></i> Contactar
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="asesores-grid">
                ${tarjetasHTML}
            </div>
        `;

        // Aplicar animaciones escalonadas
        this.animateCards();
    },

    // 🏆 RENDERIZAR TOP PERFORMERS
    renderTopPerformers(topPerformers) {
        const container = document.getElementById('top-performers');
        if (!container) return;

        if (topPerformers.length === 0) {
            container.innerHTML = '<p class="no-data">No hay datos suficientes</p>';
            return;
        }

        const topHTML = topPerformers.map((asesor, index) => `
            <div class="top-performer-item">
                <div class="performer-ranking">
                    <span class="ranking-number">${index + 1}</span>
                    <i class="fas fa-trophy"></i>
                </div>
                <div class="performer-info">
                    <h5>${asesor.nombre}</h5>
                    <p>${asesor.performance.score}% de éxito</p>
                </div>
                <div class="performer-stats">
                    <span class="stat-verde">${asesor.estados.verdes}</span>
                    <span class="stat-total">/${asesor.total_reclutas}</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = topHTML;
    },

    // ⚠️ RENDERIZAR ASESORES QUE NECESITAN MEJORA
    renderNeedsImprovement(needsImprovement) {
        const container = document.getElementById('needs-improvement');
        if (!container) return;

        if (needsImprovement.length === 0) {
            container.innerHTML = '<p class="no-data">Todos los asesores están dentro del rango esperado</p>';
            return;
        }

        const improvementHTML = needsImprovement.map(asesor => `
            <div class="improvement-item">
                <div class="improvement-alert">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="improvement-info">
                    <h5>${asesor.nombre}</h5>
                    <p>${asesor.performance.score}% de éxito</p>
                </div>
                <div class="improvement-actions">
                    <button class="btn-sm btn-warning" onclick="MetricasAdmin.planMejora(${asesor.id})">
                        <i class="fas fa-clipboard-list"></i> Plan
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = improvementHTML;
    },

    // 📈 RENDERIZAR GRÁFICOS
    renderGraficos(data) {
        this.renderGraficoDistribucion(data.metricas_globales.distribucion_global);
        this.renderGraficoComparativa(data.metricas_asesores);
    },

    // 🥧 GRÁFICO DE DISTRIBUCIÓN
    renderGraficoDistribucion(distribucion) {
        const canvas = document.getElementById('grafico-distribucion');
        if (!canvas) return;

        // Implementar gráfico de dona/pie usando Chart.js o similar
        // Por simplicidad, aquí una representación visual básica
        const total = distribucion.verdes + distribucion.amarillos + distribucion.rojos;
        const porcentajes = {
            verdes: (distribucion.verdes / total * 100).toFixed(1),
            amarillos: (distribucion.amarillos / total * 100).toFixed(1),
            rojos: (distribucion.rojos / total * 100).toFixed(1)
        };

        canvas.innerHTML = `
            <div class="grafico-simple">
                <div class="grafico-segmento verde" style="height: ${porcentajes.verdes}%">
                    <span>${porcentajes.verdes}%</span>
                </div>
                <div class="grafico-segmento amarillo" style="height: ${porcentajes.amarillos}%">
                    <span>${porcentajes.amarillos}%</span>
                </div>
                <div class="grafico-segmento rojo" style="height: ${porcentajes.rojos}%">
                    <span>${porcentajes.rojos}%</span>
                </div>
            </div>
            <div class="grafico-leyenda">
                <div class="leyenda-item verde">Activos (${distribucion.verdes})</div>
                <div class="leyenda-item amarillo">En Proceso (${distribucion.amarillos})</div>
                <div class="leyenda-item rojo">Rechazados (${distribucion.rojos})</div>
            </div>
        `;
    },

    // 📊 GRÁFICO COMPARATIVO
    renderGraficoComparativa(asesores) {
        const container = document.getElementById('grafico-comparativa');
        if (!container) return;

        const top5 = asesores.slice(0, 5);
        const barsHTML = top5.map(asesor => `
            <div class="comparativa-bar">
                <div class="bar-label">${asesor.nombre.substring(0, 15)}...</div>
                <div class="bar-container">
                    <div class="bar-fill" style="width: ${asesor.performance.score}%"></div>
                    <span class="bar-value">${asesor.performance.score}%</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <h4>Top 5 Asesores por Tasa de Éxito</h4>
            <div class="comparativa-chart">
                ${barsHTML}
            </div>
        `;
    },

    // 🎬 ANIMACIONES DE TARJETAS
    animateCards() {
        const cards = document.querySelectorAll('.asesor-metrica-card');
        cards.forEach((card, index) => {
            card.style.animation = `slideInUp ${this.config.animacionDuracion}ms ease-out ${index * 50}ms both`;
        });
    },

    // 🔍 VER DETALLE DE ASESOR
    async verDetalle(asesorId) {
    try {
        // CAMBIO: Usar ruta correcta directa
        const response = await fetch(`/admin/metricas/asesor/${asesorId}/detalle`);
        const data = await response.json();

        if (data.success) {
            this.mostrarModalDetalle(data);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        if (typeof showError !== 'undefined') {
            showError('Error al cargar detalle: ' + error.message);
        }
    }
},

    // 📧 CONTACTAR ASESOR
    contactarAsesor(email) {
        window.location.href = `mailto:${email}?subject=Seguimiento de Métricas de Reclutamiento`;
    },

    // 📋 PLAN DE MEJORA
    planMejora(asesorId) {
        // Abrir modal para crear plan de mejora
        Notifications.show('Funcionalidad de plan de mejora en desarrollo', 'info');
    },

    // 📥 EXPORTAR MÉTRICAS
    async exportarMetricas() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/admin/metricas/exportar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ formato: 'excel' })
            });

            const data = await response.json();
            if (data.success) {
                window.open(data.download_url, '_blank');
                Notifications.show('Exportación iniciada', 'success');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            Notifications.show('Error en exportación: ' + error.message, 'error');
        }
    },

    // 🔄 AUTO-REFRESH
    setupAutoRefresh() {
        setInterval(() => {
            this.loadMetricas(false);
        }, this.config.refreshInterval);
    },

    // 🕐 ACTUALIZAR TIMESTAMP
    updateLastRefresh() {
        const timestamp = document.getElementById('last-refresh');
        if (timestamp) {
            timestamp.textContent = new Date().toLocaleTimeString();
        }
    },

    // 🔄 LOADERS
    showLoader() {
        const loader = document.getElementById('metricas-loader');
        if (loader) loader.style.display = 'flex';
    },

    hideLoader() {
        const loader = document.getElementById('metricas-loader');
        if (loader) loader.style.display = 'none';
    }
};

// 🚀 AUTO-INICIALIZACIÓN AL CARGAR
document.addEventListener('DOMContentLoaded', () => {
    // Solo inicializar si estamos en la página de métricas y el usuario es admin
    if (document.getElementById('metricas-admin-container') && window.currentUser?.rol === 'admin') {
        MetricasAdmin.init();
    }
});

// 🌐 EXPORTAR PARA USO GLOBAL
window.MetricasAdmin = MetricasAdmin;

window.debugMetricas = function() {
    console.log('🔍 === DEBUG MÉTRICAS ===');
    console.log('CONFIG.API_URL:', CONFIG?.API_URL);
    console.log('CONFIG.ADMIN_URL:', CONFIG?.ADMIN_URL);
    console.log('MetricasAdmin disponible:', typeof MetricasAdmin !== 'undefined');
    console.log('Usuario actual:', getCurrentUser());
    console.log('Sección estadísticas existe:', !!document.getElementById('estadisticas-section'));
    
    // Test de endpoints
    fetch('/admin/metricas/asesores')
        .then(response => {
            console.log('Endpoint admin response status:', response.status);
            return response.json();
        })
        .then(data => console.log('Admin data:', data))
        .catch(error => console.error('Admin endpoint error:', error));
};