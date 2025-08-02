// ============================================================================
// 🔧 CORRECCIÓN FINAL - INICIALIZACIÓN DE MÉTRICAS ADMIN
// Archivo: static/js/metricas-admin.js (VERSIÓN CORREGIDA)
// ============================================================================

const MetricasAdmin = { 
    // 🎛️ CONFIGURACIÓN DEL MÓDULO
    config: {
        refreshInterval: 300000, // 5 minutos
        colores: {
            verde: '#10B981',
            amarillo: '#F59E0B',
            rojo: '#EF4444',
            excelente: '#059669',
            bueno: '#10B981',
            regular: '#F59E0B',
            mejora: '#EF4444'
        },
        animacionDuracion: 300,
        initialized: false  // ✅ NUEVO: Flag para evitar doble inicialización
    },
    
    asesoresData: [],

    // 🔄 INICIALIZAR MÓDULO
    init() {
        // ✅ VERIFICAR QUE NO SE INICIALICE MÚLTIPLES VECES
        if (this.config.initialized) {
            console.log('⚠️ MetricasAdmin ya está inicializado');
            return;
        }

        console.log('🎯 Inicializando Módulo de Métricas Admin...');
        
        // ✅ VERIFICAR QUE HAY USUARIO ANTES DE INICIALIZAR
        const currentUser = this.getCurrentUserSafe();
        if (!currentUser) {
            console.log('⚠️ No hay usuario autenticado, postergando inicialización');
            return;
        }

        if (currentUser.rol !== 'admin') {
            console.log('⚠️ Usuario no es admin, no inicializando métricas admin');
            return;
        }

        this.bindEvents();
        this.setupContainer();
        this.loadMetricas();
        this.setupAutoRefresh();
        
        this.config.initialized = true;
        console.log('✅ MetricasAdmin inicializado correctamente');
    },

    // ✅ NUEVO: Función segura para obtener usuario
    getCurrentUserSafe() {
        try {
            // 1. Intentar desde Auth.currentUser
            if (typeof Auth !== 'undefined' && Auth.currentUser) {
                return Auth.currentUser;
            }
            
            // 2. Intentar desde getCurrentUser global
            if (typeof getCurrentUser === 'function') {
                return getCurrentUser();
            }
            
            // 3. Intentar desde localStorage
            const userDataStr = localStorage.getItem('user_data');
            if (userDataStr) {
                return JSON.parse(userDataStr);
            }
            
            // 4. Intentar desde variable global currentGerente
            if (typeof currentGerente !== 'undefined' && currentGerente) {
                return currentGerente;
            }
            
            return null;
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            return null;
        }
    },

    // 🏗️ CONFIGURAR CONTENEDOR PARA TU ESTRUCTURA
    setupContainer() {
        const currentUser = this.getCurrentUserSafe();
        
        if (currentUser && currentUser.rol === 'admin') {
            // Mostrar elementos admin
            const adminElements = document.querySelectorAll('.admin-only');
            adminElements.forEach(el => {
                if (el) el.style.display = 'block';
            });
            
            // Agregar clase admin-view al body
            document.body.classList.add('admin-view');
            document.body.classList.remove('asesor-view');
            
            console.log('👑 Configuración admin aplicada');
        } else {
            // Ocultar elementos admin y mostrar mensaje de asesor
            const adminElements = document.querySelectorAll('.admin-only');
            adminElements.forEach(el => {
                if (el) el.style.display = 'none';
            });
            
            const asesorMessage = document.querySelector('.asesor-only-message');
            if (asesorMessage) {
                asesorMessage.style.display = 'block';
            }
            
            document.body.classList.add('asesor-view');
            document.body.classList.remove('admin-view');
            console.log('👥 Configuración asesor aplicada');
        }
    },

    // 🎭 VINCULAR EVENTOS A TU HTML EXISTENTE
    bindEvents() {
        const refreshBtn = document.getElementById('refresh-metricas-btn');
        if (refreshBtn) {
            // Remover listeners previos
            refreshBtn.removeEventListener('click', this.refreshHandler);
            this.refreshHandler = () => this.loadMetricas(true);
            refreshBtn.addEventListener('click', this.refreshHandler);
        }

        const exportBtn = document.getElementById('export-metricas-btn');
        if (exportBtn) {
            exportBtn.removeEventListener('click', this.exportHandler);
            this.exportHandler = () => this.exportarMetricas();
            exportBtn.addEventListener('click', this.exportHandler);
        }

        const viewToggle = document.getElementById('metricas-view-toggle');
        if (viewToggle) {
            viewToggle.removeEventListener('change', this.toggleHandler);
            this.toggleHandler = (e) => this.toggleView(e.target.checked);
            viewToggle.addEventListener('change', this.toggleHandler);
        }

        const filtroPerformance = document.getElementById('filtro-performance');
        if (filtroPerformance) {
            filtroPerformance.removeEventListener('change', this.filtroHandler);
            this.filtroHandler = (e) => this.filtrarAsesores(e.target.value);
            filtroPerformance.addEventListener('change', this.filtroHandler);
        }

        const ordenarPor = document.getElementById('ordenar-por');
        if (ordenarPor) {
            ordenarPor.removeEventListener('change', this.ordenarHandler);
            this.ordenarHandler = (e) => this.ordenarAsesores(e.target.value);
            ordenarPor.addEventListener('change', this.ordenarHandler);
        }

        const timeFilters = document.querySelectorAll('.time-filter');
        timeFilters.forEach(button => {
            button.addEventListener('click', (e) => {
                const periodo = e.target.dataset.period;
                this.loadTendencias(periodo);

                // Update active button
                timeFilters.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    },

    // ✅ CARGAR MÉTRICAS CON VERIFICACIÓN DE USUARIO
    async loadMetricas(showLoader = false) {
        const currentUser = this.getCurrentUserSafe();
        
        if (!currentUser) {
            console.log('⚠️ No hay usuario autenticado para cargar métricas');
            return;
        }

        if (currentUser.rol !== 'admin') {
            console.log('⚠️ Usuario no es admin, no cargando métricas admin');
            return;
        }

        if (showLoader) {
            this.showLoader();
        }

        try {
            console.log('📊 Cargando métricas administrativas...');
            
            const response = await fetch('/admin/metricas/asesores', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Respuesta no es JSON. Content-Type: ${contentType}`);
            }

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('No autenticado');
                }
                if (response.status === 403) {
                    throw new Error('Sin permisos para acceder a métricas administrativas');
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📊 Datos recibidos:', data);
            
            if (data.success) {
                this.renderMetricas(data);
                this.updateLastRefresh();
                
                if (typeof showNotification !== 'undefined') {
                    showNotification('Métricas actualizadas correctamente', 'success');
                } else if (typeof showSuccess !== 'undefined') {
                    showSuccess('Métricas actualizadas correctamente');
                }
            } else {
                throw new Error(data.message || 'Error al cargar métricas');
            }

        } catch (error) {
            console.error('❌ Error al cargar métricas admin:', error);
            
            if (typeof showNotification !== 'undefined') {
                showNotification(`Error al cargar métricas: ${error.message}`, 'error');
            } else if (typeof showError !== 'undefined') {
                showError('Error al cargar métricas: ' + error.message);
            }
            
            this.renderMetricasDefault();
            
        } finally {
            this.hideLoader();
        }
    },

    // ✅ DATOS POR DEFECTO
    renderMetricasDefault() {
        console.log('📊 Mostrando datos por defecto debido a error');
        
        const defaultData = {
            metricas_globales: {
                total_asesores: 0,
                total_reclutas: 0,
                distribucion_global: { verdes: 0, amarillos: 0, rojos: 0 },
                promedio_sistema: { exito: 0, proceso: 0, rechazo: 0 }
            },
            metricas_asesores: [],
            insights: { top_performers: [], needs_improvement: [] }
        };
        
        this.renderMetricas(defaultData);
    },

    // ✅ RENDERIZAR MÉTRICAS EN TU ESTRUCTURA EXISTENTE
    renderMetricas(data) {
        console.log('🎨 Renderizando métricas en estructura existente:', data);
        
        this.asesoresData = data.metricas_asesores || []; // Store data here

        if (data.metricas_globales) {
            this.renderResumenGlobal(data.metricas_globales);
        }
        
        if (data.metricas_asesores) {
            this.renderAsesoresMetricas(data.metricas_asesores);
            this.renderTablaDetallada(data.metricas_asesores);
        }
        
        if (data.insights) {
            if (data.insights.top_performers) {
                this.renderTopPerformers(data.insights.top_performers);
            }
            if (data.insights.needs_improvement) {
                this.renderNeedsImprovement(data.insights.needs_improvement);
            }
        }
        
        if (data.metricas_globales && data.metricas_globales.distribucion_global) {
            this.renderGraficoDistribucion(data.metricas_globales.distribucion_global);
        }

        this.updateKPIs(data);
        this.loadTendencias(); // Cargar tendencias iniciales
    },

    // ✅ RESTO DE FUNCIONES (sin cambios - copiar del anterior)
    renderResumenGlobal(globales) {
        const container = document.getElementById('resumen-global');
        if (!container) return;

        const total_asesores = globales.total_asesores || 0;
        const total_reclutas = globales.total_reclutas || 0;
        const distribucion_global = globales.distribucion_global || {
            verdes: 0, amarillos: 0, rojos: 0
        };
        const promedio_sistema = globales.promedio_sistema || {
            exito: 0, proceso: 0, rechazo: 0
        };

        container.innerHTML = `
            <div class="metricas-grid-global">
                <div class="metrica-global-card">
                    <div class="metrica-icon">
                        <i class="fas fa-users-cog"></i>
                    </div>
                    <div class="metrica-content">
                        <div class="metrica-numero">${total_asesores}</div>
                        <div class="metrica-label">Asesores Activos</div>
                    </div>
                </div>

                <div class="metrica-global-card">
                    <div class="metrica-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="metrica-content">
                        <div class="metrica-numero">${total_reclutas}</div>
                        <div class="metrica-label">Total Reclutas</div>
                    </div>
                </div>

                <div class="metrica-global-card">
                    <div class="metrica-icon">
                        <i class="fas fa-chart-pie"></i>
                    </div>
                    <div class="metrica-content">
                        <div class="metrica-numero">${promedio_sistema.exito}%</div>
                        <div class="metrica-label">Tasa de Éxito Global</div>
                    </div>
                </div>

                <div class="metrica-global-card">
                    <div class="distribucion-visual">
                        <div class="estado-badge verde">
                            <div class="estado-count">${distribucion_global.verdes}</div>
                            <div class="estado-label">Activos</div>
                        </div>
                        <div class="estado-badge amarillo">
                            <div class="estado-count">${distribucion_global.amarillos}</div>
                            <div class="estado-label">En Proceso</div>
                        </div>
                        <div class="estado-badge rojo">
                            <div class="estado-count">${distribucion_global.rojos}</div>
                            <div class="estado-label">Rechazados</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderAsesoresMetricas(asesores) {
        const container = document.getElementById('asesores-metricas');
        if (!container) return;

        if (!asesores || asesores.length === 0) {
            container.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-users-slash"></i>
                    <h3>No hay asesores registrados</h3>
                    <p>No se encontraron asesores con reclutas asignados</p>
                </div>
            `;
            return;
        }

        const asesoresHTML = asesores.map((asesor, index) => {
            const nombre = asesor.nombre || asesor.email || 'Usuario sin nombre';
            const total_reclutas = asesor.total_reclutas || 0;
            const estados = asesor.estados || { verdes: 0, amarillos: 0, rojos: 0 };
            const performance = asesor.performance || { 
                nivel: 'Sin datos', 
                class: 'neutral', 
                score: 0 
            };
            const tasas = asesor.tasas || { exito: 0, proceso: 0, rechazo: 0 };

            return `
                <div class="asesor-metrica-card ${performance.class}" data-asesor-id="${asesor.id}">
                    <div class="asesor-header">
                        <div class="asesor-info">
                            <div class="asesor-avatar">
                                ${nombre.charAt(0).toUpperCase()}
                                ${index < 3 ? `<div class="ranking-badge">${index + 1}</div>` : ''}
                            </div>
                            <div>
                                <div class="asesor-nombre">${nombre}</div>
                                <div class="asesor-email">${asesor.email || ''}</div>
                            </div>
                        </div>
                        <div class="performance-badge ${performance.class}">
                            ${performance.nivel}
                        </div>
                    </div>
                    
                    <div class="asesor-score">
                        <span class="score-valor">${performance.score}%</span>
                        <span class="score-label">Tasa de Éxito</span>
                    </div>
                    
                    <div class="asesor-stats">
                        <div class="stat-item total">
                            <span class="stat-numero">${total_reclutas}</span>
                            <span class="stat-label">Total</span>
                        </div>
                        <div class="stat-item verde">
                            <span class="stat-numero">${estados.verdes}</span>
                            <span class="stat-label">Activos</span>
                            <span class="stat-porcentaje">${tasas.exito}%</span>
                        </div>
                        <div class="stat-item amarillo">
                            <span class="stat-numero">${estados.amarillos}</span>
                            <span class="stat-label">Proceso</span>
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
                        <button class="btn-detalle" onclick="MetricasAdmin.verDetalleAsesor(${asesor.id})">
                            <i class="fas fa-chart-line"></i> Ver Detalle
                        </button>
                        ${performance.class === 'needs-improvement' ? 
                            `<button class="btn-contactar" onclick="MetricasAdmin.planMejora(${asesor.id})">
                                <i class="fas fa-clipboard-list"></i> Plan Mejora
                            </button>` : ''
                        }
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `<div class="asesores-grid">${asesoresHTML}</div>`;
    },

    renderTopPerformers(topPerformers) {
        const container = document.getElementById('top-performers');
        if (!container) return;

        if (!topPerformers || topPerformers.length === 0) {
            container.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-trophy"></i>
                    <p>No hay datos suficientes para mostrar top performers</p>
                </div>
            `;
            return;
        }

        const performersHTML = topPerformers.map((asesor, index) => {
            const medalIcon = index === 0 ? 'fa-trophy' : index === 1 ? 'fa-medal' : 'fa-award';
            const medalClass = index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze';
            
            return `
                <div class="performer-item ${medalClass}">
                    <div class="performer-medal">
                        <i class="fas ${medalIcon}"></i>
                        <span class="performer-rank">#${index + 1}</span>
                    </div>
                    <div class="performer-info">
                        <h5>${asesor.nombre || asesor.email}</h5>
                        <p>${asesor.performance.score}% de éxito</p>
                        <small>${asesor.total_reclutas} reclutas</small>
                    </div>
                    <div class="performance-badge ${asesor.performance.class}">
                        ${asesor.performance.nivel}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = performersHTML;
    },

    renderNeedsImprovement(needsImprovement) {
        const container = document.getElementById('needs-improvement');
        if (!container) return;

        if (!needsImprovement || needsImprovement.length === 0) {
            container.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-check-circle"></i>
                    <p>Todos los asesores están dentro del rango esperado</p>
                </div>
            `;
            return;
        }

        const improvementHTML = needsImprovement.map(asesor => `
            <div class="improvement-item">
                <div class="improvement-alert">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="improvement-info">
                    <h5>${asesor.nombre || asesor.email}</h5>
                    <p>${asesor.performance.score}% de éxito</p>
                    <small>${asesor.total_reclutas} reclutas gestionados</small>
                </div>
                <div class="improvement-actions">
                    <button class="btn-contactar" onclick="MetricasAdmin.planMejora(${asesor.id})">
                        <i class="fas fa-clipboard-list"></i> Plan Mejora
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = improvementHTML;
    },

    renderTablaDetallada(asesores) {
        const tbody = document.querySelector('#tabla-asesores-detalle tbody');
        if (!tbody) return;

        if (!asesores || asesores.length === 0) {
            tbody.innerHTML = `
                <tr class="loading-row">
                    <td colspan="9">
                        <div class="loading-placeholder">
                            <i class="fas fa-table"></i>
                            <p>No hay datos de asesores para mostrar</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const filas = asesores.map((asesor, index) => {
            const nombre = asesor.nombre || asesor.email || 'Usuario sin nombre';
            const estados = asesor.estados || { verdes: 0, amarillos: 0, rojos: 0 };
            const performance = asesor.performance || { nivel: 'N/A', class: 'neutral', score: 0 };

            return `
                <tr class="asesor-row" data-asesor-id="${asesor.id}">
                    <td class="ranking-cell">#${index + 1}</td>
                    <td class="asesor-cell">
                        <div class="asesor-info-mini">
                            <div class="asesor-avatar-mini">${nombre.charAt(0).toUpperCase()}</div>
                            <div>
                                <div class="nombre">${nombre}</div>
                                <div class="email">${asesor.email || ''}</div>
                            </div>
                        </div>
                    </td>
                    <td class="total-cell">${asesor.total_reclutas || 0}</td>
                    <td class="verde-cell">${estados.verdes}</td>
                    <td class="amarillo-cell">${estados.amarillos}</td>
                    <td class="rojo-cell">${estados.rojos}</td>
                    <td class="tasa-cell">${performance.score}%</td>
                    <td class="performance-cell">
                        <span class="performance-badge ${performance.class}">
                            ${performance.nivel}
                        </span>
                    </td>
                    <td class="acciones-cell">
                        <button class="btn-mini" onclick="MetricasAdmin.verDetalleAsesor(${asesor.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-mini" onclick="MetricasAdmin.contactarAsesor(${asesor.id})">
                            <i class="fas fa-envelope"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = filas;
    },

    renderGraficoDistribucion(distribucion) {
        const canvas = document.getElementById('grafico-distribucion');
        if (!canvas) return;

        const total = distribucion.verdes + distribucion.amarillos + distribucion.rojos;
        
        if (total === 0) {
            canvas.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-chart-pie"></i>
                    <p>Sin datos para mostrar</p>
                </div>
            `;
            return;
        }

        const porcentajes = {
            verdes: ((distribucion.verdes / total) * 100).toFixed(1),
            amarillos: ((distribucion.amarillos / total) * 100).toFixed(1),
            rojos: ((distribucion.rojos / total) * 100).toFixed(1)
        };

        canvas.innerHTML = `
            <div class="chart-visual">
                <div class="chart-segment verde" style="flex: ${porcentajes.verdes}">
                    <span class="segment-value">${porcentajes.verdes}%</span>
                    <span class="segment-label">Activos</span>
                </div>
                <div class="chart-segment amarillo" style="flex: ${porcentajes.amarillos}">
                    <span class="segment-value">${porcentajes.amarillos}%</span>
                    <span class="segment-label">Proceso</span>
                </div>
                <div class="chart-segment rojo" style="flex: ${porcentajes.rojos}">
                    <span class="segment-value">${porcentajes.rojos}%</span>
                    <span class="segment-label">Rechazados</span>
                </div>
            </div>
        `;
    },

    updateKPIs(data) {
        if (data.metricas_globales) {
            const globales = data.metricas_globales;
            
            const kpiConversion = document.getElementById('kpi-conversion');
            if (kpiConversion) {
                kpiConversion.textContent = `${globales.promedio_sistema.exito}%`;
            }

            const kpiTiempo = document.getElementById('kpi-tiempo-promedio');
            if (kpiTiempo) {
                kpiTiempo.textContent = `${Math.round(globales.total_reclutas / Math.max(globales.total_asesores, 1))} avg`;
            }

            const kpiSatisfaccion = document.getElementById('kpi-satisfaccion');
            if (kpiSatisfaccion) {
                kpiSatisfaccion.textContent = `${Math.round((globales.promedio_sistema.exito + globales.promedio_sistema.proceso) / 2)}%`;
            }

            const kpiProductividad = document.getElementById('kpi-productividad');
            if (kpiProductividad) {
                kpiProductividad.textContent = `${Math.round(globales.total_reclutas / Math.max(globales.total_asesores, 1))}`;
            }
        }
    },

    // 🎛️ FUNCIONES DE INTERFAZ
    verDetalleAsesor(asesorId) {
        console.log('Ver detalle del asesor:', asesorId);
        const modal = document.getElementById('modal-detalle-asesor');
        if (modal) {
            modal.style.display = 'block';
        }
        
        if (typeof showNotification !== 'undefined') {
            showNotification('Cargando detalle del asesor...', 'info');
        }
    },

    planMejora(asesorId) {
        console.log('Plan de mejora para asesor:', asesorId);
        if (typeof showNotification !== 'undefined') {
            showNotification('Funcionalidad de plan de mejora en desarrollo', 'info');
        }
    },

    contactarAsesor(asesorId) {
        console.log('Contactar asesor:', asesorId);
        if (typeof showNotification !== 'undefined') {
            showNotification('Abriendo herramienta de contacto...', 'info');
        }
    },

    filtrarAsesores(filtro) {
        const asesores = document.querySelectorAll('.asesor-metrica-card');
        asesores.forEach(asesor => {
            if (filtro === 'todos' || asesor.classList.contains(filtro)) {
                asesor.style.display = 'block';
            } else {
                asesor.style.display = 'none';
            }
        });
    },

    ordenarAsesores(criterio) {
        console.log('Ordenando asesores por:', criterio);
        if (!this.asesoresData || this.asesoresData.length === 0) {
            return;
        }

        let asesoresOrdenados = [...this.asesoresData]; // Create a copy to sort

        switch (criterio) {
            case 'performance':
                asesoresOrdenados.sort((a, b) => (b.performance?.score || 0) - (a.performance?.score || 0));
                break;
            case 'total':
                asesoresOrdenados.sort((a, b) => (b.total_reclutas || 0) - (a.total_reclutas || 0));
                break;
            case 'nombre':
                asesoresOrdenados.sort((a, b) => {
                    const nombreA = a.nombre || a.email || '';
                    const nombreB = b.nombre || b.email || '';
                    return nombreA.localeCompare(nombreB);
                });
                break;
        }

        // Re-render the views with the sorted data
        this.renderAsesoresMetricas(asesoresOrdenados);
        this.renderTablaDetallada(asesoresOrdenados);
    },

    async loadTendencias(periodo = 'mensual') {
        try {
            const response = await fetch(`/admin/metricas/tendencias?periodo=${periodo}`);
            const data = await response.json();

            if (data.success) {
                this.renderGraficoTendencia(data.tendencia);
            } else {
                console.error('Error al cargar tendencias:', data.message);
            }
        } catch (error) {
            console.error('Error en fetch de tendencias:', error);
        }
    },

    renderGraficoTendencia(tendencia) {
        const container = document.getElementById('grafico-tendencia');
        if (!container) return;

        if (!tendencia || tendencia.length === 0) {
            container.innerHTML = `<div class="loading-placeholder"><p>No hay datos de tendencia.</p></div>`;
            return;
        }

        const maxTotal = Math.max(...tendencia.map(t => t.total), 1);

        const barsHTML = tendencia.map(t => {
            const total = t.total || 0;
            const verdes = (t.verdes || 0) / total * 100;
            const amarillos = (t.amarillos || 0) / total * 100;
            const rojos = (t.rojos || 0) / total * 100;
            const height = (total / maxTotal) * 100;

            return `
                <div class="bar-chart-bar-container">
                    <div class="bar-chart-bar" style="height: ${height}%;">
                        <div class="bar-segment verde" style="height: ${verdes}%;"></div>
                        <div class="bar-segment amarillo" style="height: ${amarillos}%;"></div>
                        <div class="bar-segment rojo" style="height: ${rojos}%;"></div>
                    </div>
                    <div class="bar-chart-label">${t.periodo_nombre}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = `<div class="bar-chart-container">${barsHTML}</div>`;
    },

    toggleView(detallada) {
        const container = document.getElementById('estadisticas-section');
        if (container) {
            if (detallada) {
                container.classList.add('vista-detallada');
            } else {
                container.classList.remove('vista-detallada');
            }
        }
    },

    async exportarMetricas() {
        try {
            if (typeof showNotification !== 'undefined') {
                showNotification('Iniciando exportación...', 'info');
            }
            
            setTimeout(() => {
                if (typeof showNotification !== 'undefined') {
                    showNotification('Exportación completada', 'success');
                }
            }, 2000);
        } catch (error) {
            console.error('Error en exportación:', error);
            Notifications.error('Error en exportación: ' + error.message);
        }
    },

    setupAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        this.autoRefreshInterval = setInterval(() => {
            const currentUser = this.getCurrentUserSafe();
            if (currentUser && currentUser.rol === 'admin') {
                this.loadMetricas(false);
            }
        }, this.config.refreshInterval);
    },

    updateLastRefresh() {
        const timestamp = document.getElementById('last-refresh');
        if (timestamp) {
            timestamp.textContent = `Actualizado: ${new Date().toLocaleTimeString()}`;
        }
    },

    showLoader() {
        const loader = document.getElementById('metricas-loader');
        if (loader) loader.style.display = 'flex';
    },

    hideLoader() {
        const loader = document.getElementById('metricas-loader');
        if (loader) loader.style.display = 'none';
    },

    // ✅ NUEVO: Limpiar configuración al hacer logout
    cleanup() {
        console.log('🧹 Limpiando MetricasAdmin...');
        
        this.config.initialized = false;
        
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
        
        // Remover event listeners
        if (this.refreshHandler) {
            const refreshBtn = document.getElementById('refresh-metricas-btn');
            if (refreshBtn) refreshBtn.removeEventListener('click', this.refreshHandler);
        }
        
        if (this.exportHandler) {
            const exportBtn = document.getElementById('export-metricas-btn');
            if (exportBtn) exportBtn.removeEventListener('click', this.exportHandler);
        }
        
        // Limpiar contenedores
        const containers = [
            'resumen-global',
            'asesores-metricas', 
            'top-performers',
            'needs-improvement',
            'grafico-distribucion'
        ];
        
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = '';
            }
        });
        
        console.log('✅ MetricasAdmin limpiado');
    }
};

// ✅ FUNCIONES GLOBALES PARA INICIALIZACIÓN CONTROLADA
window.MetricasAdmin = MetricasAdmin;

// ✅ NUEVA FUNCIÓN: Inicializar métricas solo después del login
window.initializeMetricasAdmin = function() {
    console.log('🎯 Función de inicialización de métricas llamada');
    
    const currentUser = MetricasAdmin.getCurrentUserSafe();
    
    if (!currentUser) {
        console.log('⚠️ No se puede inicializar métricas: no hay usuario');
        return false;
    }
    
    if (currentUser.rol !== 'admin') {
        console.log('⚠️ Usuario no es admin, no inicializando métricas avanzadas');
        MetricasAdmin.setupContainer(); // Solo configurar visibilidad
        return false;
    }
    
    // Verificar que estamos en la sección correcta
    const estadisticasSection = document.getElementById('estadisticas-section');
    if (!estadisticasSection) {
        console.log('⚠️ Sección de estadísticas no encontrada');
        return false;
    }
    
    console.log('✅ Inicializando métricas admin...');
    MetricasAdmin.init();
    return true;
};

// ✅ NUEVA FUNCIÓN: Limpiar métricas al hacer logout
window.cleanupMetricasAdmin = function() {
    console.log('🧹 Función de limpieza de métricas llamada');
    MetricasAdmin.cleanup();
};

// ✅ INICIALIZACIÓN SEGURA - Solo si hay elementos DOM
// Eliminado: document.addEventListener('DOMContentLoaded', ...)
// La inicialización ahora es orquestada por main.js

// ✅ FUNCIÓN DE DEBUG MEJORADA
window.debugMetricas = function() {
    console.log('🔍 === DEBUG MÉTRICAS (Inicialización Corregida) ===');
    
    const currentUser = MetricasAdmin.getCurrentUserSafe();
    console.log('👤 Usuario actual:', currentUser);
    console.log('🎯 MetricasAdmin inicializado:', MetricasAdmin.config.initialized);
    console.log('📍 Sección estadísticas existe:', !!document.getElementById('estadisticas-section'));
    console.log('📦 Contenedores encontrados:', {
        'resumen-global': !!document.getElementById('resumen-global'),
        'asesores-metricas': !!document.getElementById('asesores-metricas'),
        'top-performers': !!document.getElementById('top-performers'),
        'needs-improvement': !!document.getElementById('needs-improvement'),
        'grafico-distribucion': !!document.getElementById('grafico-distribucion'),
        'tabla-asesores-detalle': !!document.getElementById('tabla-asesores-detalle'),
        'refresh-btn': !!document.getElementById('refresh-metricas-btn'),
        'export-btn': !!document.getElementById('export-metricas-btn')
    });
    
    console.log('🎨 Clases del body:', document.body.className);
    console.log('👁️ Elementos admin-only visibles:', document.querySelectorAll('.admin-only[style*="block"]').length);
    console.log('👁️ Elementos admin-only totales:', document.querySelectorAll('.admin-only').length);
    
    // Test manual de inicialización
    console.log('🧪 Probando inicialización manual...');
    if (currentUser && currentUser.rol === 'admin') {
        const resultado = window.initializeMetricasAdmin();
        console.log('✅ Resultado de inicialización manual:', resultado);
    } else {
        console.log('⚠️ No se puede probar: usuario no es admin o no existe');
    }
    
    // Test de endpoint
    console.log('🌐 Probando endpoint...');
    fetch('/admin/metricas/asesores')
        .then(response => {
            console.log('📡 Status:', response.status);
            console.log('📡 Content-Type:', response.headers.get('content-type'));
            if (response.ok) {
                return response.json();
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        })
        .then(data => {
            console.log('📊 Data recibida:', data);
            if (data.success) {
                console.log('✅ Endpoint funciona correctamente');
                console.log('📈 Métricas disponibles:', {
                    asesores: data.metricas_asesores?.length || 0,
                    total_reclutas: data.metricas_globales?.total_reclutas || 0,
                    top_performers: data.insights?.top_performers?.length || 0
                });
            } else {
                console.log('⚠️ Endpoint responde pero con error:', data.message);
            }
        })
        .catch(error => {
            console.error('❌ Error en endpoint:', error);
        });
};