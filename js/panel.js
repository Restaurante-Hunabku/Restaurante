// ============================================
// PANEL DE CONTROL RESTAURANTE DELUXE - JavaScript
// ============================================

// ============================================
// CONFIGURACIÓN DEL SISTEMA
// ============================================
const PANEL_CONFIG = {
    GOOGLE_SHEETS_URL: 'https://script.google.com/macros/s/AKfycbw7ksv3FiG9KkojMJU1LE-GUEXIJsDAqzaX0QCTM67srSi_uPE5bXx_gMfVpJYYbKw-/exec?action=test',
    UPDATE_INTERVAL: 15000, // 15 segundos
    NOTIFICATION_TIMEOUT: 5000,
    MAX_TABLES: 20,
    INVENTORY_THRESHOLD: 10 // Nivel mínimo de inventario
};

// ============================================
// VARIABLES GLOBALES
// ============================================
let activeOrders = [];
let allOrders = [];
let tables = [];
let inventory = [];
let salesData = {};
let productsData = {};
let updateInterval;
let salesChart;
let productsChart;

// ============================================
// CLASES AUXILIARES
// ============================================
class Order {
    constructor(data) {
        this.id = data.id || '';
        this.table = data.mesa || '';
        this.products = data.productos || '';
        this.total = parseFloat(data.total) || 0;
        this.status = data.estado || 'pending';
        this.code = data.codigo || '';
        this.timestamp = data.timestamp || new Date().toISOString();
        this.createdAt = data.fecha || new Date().toLocaleString();
    }

    getFormattedTime() {
        const date = new Date(this.timestamp);
        return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    }

    getStatusBadge() {
        const statusMap = {
            'pending': { class: 'status-pending', text: 'Pendiente', icon: '⏳' },
            'preparing': { class: 'status-preparing', text: 'Preparando', icon: '👨‍🍳' },
            'ready': { class: 'status-ready', text: 'Listo', icon: '✅' },
            'delivered': { class: 'status-delivered', text: 'Entregado', icon: '🎉' }
        };
        
        return statusMap[this.status] || statusMap.pending;
    }
}

class Table {
    constructor(number, status = 'available') {
        this.number = number;
        this.status = status;
        this.orderId = null;
        this.occupancyTime = null;
    }

    updateStatus(newStatus, orderId = null) {
        this.status = newStatus;
        this.orderId = orderId;
        if (newStatus === 'occupied') {
            this.occupancyTime = new Date();
        } else if (newStatus === 'available') {
            this.occupancyTime = null;
        }
    }

    getOccupancyDuration() {
        if (!this.occupancyTime) return null;
        const diff = new Date() - new Date(this.occupancyTime);
        const minutes = Math.floor(diff / 60000);
        return `${minutes} min`;
    }
}

// ============================================
// FUNCIONES DE INICIALIZACIÓN
// ============================================
function initializePanel() {
    console.log('🚀 Iniciando panel de control...');
    
    // Configurar eventos
    setupEventListeners();
    
    // Cargar datos iniciales
    loadInitialData();
    
    // Iniciar actualizaciones automáticas
    startAutoUpdates();
    
    // Configurar gráficos
    initializeCharts();
    
    console.log('✅ Panel inicializado');
    showNotification('Panel listo', 'success');
}

function setupEventListeners() {
    // Botón de menú
    document.getElementById('menuToggle')?.addEventListener('click', toggleSidebar);
    
    // Botón de actualizar
    document.getElementById('refreshBtn')?.addEventListener('click', loadAllData);
    
    // Botón de nuevo pedido
    document.getElementById('newOrderBtn')?.addEventListener('click', showNewOrderModal);
    
    // Botón de actualizar mesas
    document.getElementById('refreshTablesBtn')?.addEventListener('click', updateTablesStatus);
    
    // Filtros de pedidos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const filter = this.dataset.filter;
            filterOrders(filter);
        });
    });
    
    // Botones de periodo en gráficos
    document.querySelectorAll('[data-period]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('[data-period]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            updateSalesChart(this.dataset.period);
        });
    });
    
    // Botones de tipo en gráficos de productos
    document.querySelectorAll('[data-type]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('[data-type]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            updateProductsChart(this.dataset.type);
        });
    });
    
    // Cerrar modales
    document.getElementById('modalClose')?.addEventListener('click', closeOrderModal);
    document.getElementById('newOrderModalClose')?.addEventListener('click', closeNewOrderModal);
    document.getElementById('cancelNewOrder')?.addEventListener('click', closeNewOrderModal);
    
    // Crear nuevo pedido
    document.getElementById('createNewOrder')?.addEventListener('click', createManualOrder);
}

function loadInitialData() {
    Promise.all([
        loadActiveOrders(),
        loadAllOrdersHistory(),
        initializeTables(),
        loadInventory()
    ]).then(() => {
        updateDashboardStats();
        updateTablesGrid();
        checkLowInventory();
    }).catch(error => {
        console.error('Error cargando datos iniciales:', error);
        showNotification('Error cargando datos', 'error');
    });
}

// ============================================
// FUNCIONES DE DATOS
// ============================================
async function loadActiveOrders() {
    try {
        const response = await fetch(`${PANEL_CONFIG.GOOGLE_SHEETS_URL}?action=getActiveOrders&_=${Date.now()}`);
        const data = await response.json();
        
        if (data.success) {
            activeOrders = data.orders.map(order => new Order(order));
            renderOrdersTable();
            updateOrdersBadge();
        } else {
            throw new Error(data.message || 'Error al cargar pedidos');
        }
    } catch (error) {
        console.error('Error cargando pedidos activos:', error);
        activeOrders = [];
        renderOrdersTable();
    }
}

async function loadAllOrdersHistory() {
    try {
        const response = await fetch(`${PANEL_CONFIG.GOOGLE_SHEETS_URL}?action=getAllOrders&_=${Date.now()}`);
        const data = await response.json();
        
        if (data.success) {
            allOrders = data.orders.map(order => new Order(order));
            processSalesData();
        }
    } catch (error) {
        console.error('Error cargando historial:', error);
        allOrders = [];
    }
}

function initializeTables() {
    tables = [];
    for (let i = 1; i <= PANEL_CONFIG.MAX_TABLES; i++) {
        const tableNumber = i.toString().padStart(2, '0');
        tables.push(new Table(tableNumber, 'available'));
    }
    
    // Marcar mesas ocupadas según pedidos activos
    activeOrders.forEach(order => {
        const table = tables.find(t => t.number === order.table);
        if (table) {
            table.updateStatus('occupied', order.id);
        }
    });
}

async function loadInventory() {
    try {
        // Datos de ejemplo - en producción vendrían de Google Sheets
        inventory = [
            { id: 1, name: 'Carne de Res', category: 'Carnes', current: 15, min: 20, unit: 'kg' },
            { id: 2, name: 'Pollo', category: 'Carnes', current: 8, min: 15, unit: 'kg' },
            { id: 3, name: 'Salmón', category: 'Pescados', current: 5, min: 10, unit: 'kg' },
            { id: 4, name: 'Queso Mozzarella', category: 'Lácteos', current: 3, min: 8, unit: 'kg' },
            { id: 5, name: 'Tomates', category: 'Vegetales', current: 12, min: 20, unit: 'kg' },
            { id: 6, name: 'Cerveza Artesanal', category: 'Bebidas', current: 24, min: 48, unit: 'unidades' }
        ];
        
        renderInventory();
    } catch (error) {
        console.error('Error cargando inventario:', error);
        inventory = [];
    }
}

// ============================================
// FUNCIONES DE INTERFAZ
// ============================================
function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    
    if (activeOrders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center" style="padding: 40px;">
                    <div style="font-size: 3rem; color: var(--panel-gray-300); margin-bottom: 16px;">
                        📭
                    </div>
                    <h3 style="color: var(--panel-gray-500); margin-bottom: 8px;">
                        No hay pedidos activos
                    </h3>
                    <p style="color: var(--panel-gray-400);">
                        Los pedidos aparecerán aquí cuando los clientes ordenen
                    </p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    activeOrders.forEach(order => {
        const status = order.getStatusBadge();
        const timeAgo = order.getFormattedTime();
        
        html += `
            <tr data-order-id="${order.id}">
                <td>
                    <div class="font-semibold">${order.id}</div>
                    <div class="text-sm text-gray-500">${order.code}</div>
                </td>
                <td>
                    <div class="flex items-center gap-2">
                        <span class="text-lg">🪑</span>
                        <span class="font-semibold">${order.table}</span>
                    </div>
                </td>
                <td>
                    <div class="text-sm truncate max-w-xs" title="${order.products}">
                        ${order.products}
                    </div>
                </td>
                <td class="font-bold text-green-600">
                    $${order.total.toFixed(2)}
                </td>
                <td>
                    <span class="status-badge ${status.class}">
                        ${status.icon} ${status.text}
                    </span>
                </td>
                <td class="text-sm text-gray-500">
                    ${timeAgo}
                </td>
                <td>
                    <div class="flex gap-2">
                        <button class="action-btn" onclick="viewOrderDetail('${order.id}')" title="Ver detalle">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${order.status === 'pending' ? `
                            <button class="action-btn btn-success" onclick="updateOrderStatus('${order.id}', 'preparing')" title="Comenzar preparación">
                                <i class="fas fa-play"></i>
                            </button>
                        ` : ''}
                        ${order.status === 'preparing' ? `
                            <button class="action-btn btn-warning" onclick="updateOrderStatus('${order.id}', 'ready')" title="Marcar como listo">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        ${order.status === 'ready' ? `
                            <button class="action-btn btn-primary" onclick="updateOrderStatus('${order.id}', 'delivered')" title="Marcar como entregado">
                                <i class="fas fa-truck"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function updateTablesGrid() {
    const grid = document.getElementById('tablesGrid');
    if (!grid) return;
    
    let html = '';
    
    tables.forEach(table => {
        const duration = table.getOccupancyDuration();
        const statusText = table.status === 'available' ? 'Disponible' : 
                          table.status === 'occupied' ? 'Ocupada' : 'Reservada';
        
        html += `
            <div class="table-item ${table.status}" onclick="showTableInfo('${table.number}')">
                <div class="table-number">${table.number}</div>
                <div class="table-status">
                    ${statusText}
                </div>
                ${duration ? `
                    <div class="text-xs mt-2 text-gray-500">
                        ⏱️ ${duration}
                    </div>
                ` : ''}
                ${table.orderId ? `
                    <div class="text-xs mt-1">
                        📦 ${table.orderId}
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

function renderInventory() {
    const container = document.getElementById('inventoryItems');
    if (!container) return;
    
    if (inventory.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-box-open text-4xl mb-4"></i>
                <p>No hay datos de inventario</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    let hasLowInventory = false;
    
    inventory.forEach(item => {
        const percentage = (item.current / item.min) * 100;
        const isLow = item.current <= item.min;
        
        if (isLow) hasLowInventory = true;
        
        html += `
            <div class="inventory-item ${isLow ? 'border-warning' : ''}">
                <div class="inventory-info">
                    <h4>${item.name}</h4>
                    <p>${item.category} • Mínimo: ${item.min}${item.unit}</p>
                </div>
                <div class="inventory-stock">
                    <span class="stock-level ${isLow ? 'text-warning' : 'text-success'}">
                        ${item.current}${item.unit}
                    </span>
                    <div class="stock-progress">
                        <div class="stock-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Mostrar/ocultar sección de inventario bajo
    const section = document.getElementById('lowInventorySection');
    if (section) {
        section.style.display = hasLowInventory ? 'block' : 'none';
    }
}

function updateDashboardStats() {
    const stats = calculateStats();
    const grid = document.getElementById('statsGrid');
    
    if (!grid) return;
    
    grid.innerHTML = `
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon">
                    <i class="fas fa-receipt"></i>
                </div>
                <span class="stat-title">Pedidos Hoy</span>
            </div>
            <div class="stat-value">${stats.todayOrders}</div>
            <div class="stat-change positive">
                <i class="fas fa-arrow-up"></i>
                ${stats.orderChange}% vs ayer
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon">
                    <i class="fas fa-money-bill-wave"></i>
                </div>
                <span class="stat-title">Ventas Hoy</span>
            </div>
            <div class="stat-value">$${stats.todaySales.toFixed(2)}</div>
            <div class="stat-change ${stats.salesChange >= 0 ? 'positive' : 'negative'}">
                <i class="fas fa-arrow-${stats.salesChange >= 0 ? 'up' : 'down'}"></i>
                ${Math.abs(stats.salesChange)}% vs ayer
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon">
                    <i class="fas fa-users"></i>
                </div>
                <span class="stat-title">Mesas Ocupadas</span>
            </div>
            <div class="stat-value">${stats.occupiedTables}/${PANEL_CONFIG.MAX_TABLES}</div>
            <div class="stat-change positive">
                <i class="fas fa-chair"></i>
                ${stats.occupancyRate}% ocupación
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <span class="stat-title">Tiempo Promedio</span>
            </div>
            <div class="stat-value">${stats.avgTime} min</div>
            <div class="stat-change ${stats.timeChange >= 0 ? 'negative' : 'positive'}">
                <i class="fas fa-arrow-${stats.timeChange >= 0 ? 'up' : 'down'}"></i>
                ${Math.abs(stats.timeChange)}% vs ayer
            </div>
        </div>
    `;
}

function calculateStats() {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    const todayOrders = allOrders.filter(order => 
        new Date(order.timestamp).toDateString() === today
    );
    
    const yesterdayOrders = allOrders.filter(order => 
        new Date(order.timestamp).toDateString() === yesterday
    );
    
    const todaySales = todayOrders.reduce((sum, order) => sum + order.total, 0);
    const yesterdaySales = yesterdayOrders.reduce((sum, order) => sum + order.total, 0);
    
    const occupiedTables = tables.filter(table => table.status === 'occupied').length;
    const occupancyRate = Math.round((occupiedTables / PANEL_CONFIG.MAX_TABLES) * 100);
    
    const orderChange = yesterdayOrders.length > 0 ? 
        Math.round(((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100) : 100;
    
    const salesChange = yesterdaySales > 0 ? 
        Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100) : 100;
    
    // Calcular tiempo promedio de preparación (ejemplo)
    const avgTime = 25; // minutos
    const timeChange = -5; // mejoría del 5%
    
    return {
        todayOrders: todayOrders.length,
        todaySales,
        occupiedTables,
        occupancyRate,
        orderChange,
        salesChange,
        avgTime,
        timeChange
    };
}

// ============================================
// FUNCIONES DE PEDIDOS
// ============================================
async function updateOrderStatus(orderId, newStatus) {
    try {
        const order = activeOrders.find(o => o.id === orderId);
        if (!order) {
            showNotification('Pedido no encontrado', 'error');
            return;
        }
        
        const response = await fetch(PANEL_CONFIG.GOOGLE_SHEETS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                action: 'updateOrderStatus',
                id: orderId,
                status: newStatus
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            order.status = newStatus;
            
            // Actualizar estado de la mesa si es necesario
            if (newStatus === 'delivered') {
                const table = tables.find(t => t.number === order.table);
                if (table) {
                    table.updateStatus('available');
                    updateTablesGrid();
                }
            }
            
            renderOrdersTable();
            updateDashboardStats();
            
            showNotification(`Pedido ${orderId} actualizado a: ${newStatus}`, 'success');
            
            // Enviar notificación a cocina si es necesario
            if (newStatus === 'preparing') {
                sendKitchenNotification(order);
            }
        } else {
            showNotification(data.message || 'Error al actualizar', 'error');
        }
    } catch (error) {
        console.error('Error actualizando estado:', error);
        showNotification('Error de conexión', 'error');
    }
}

function viewOrderDetail(orderId) {
    const order = activeOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const modal = document.getElementById('orderModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-500">ID Pedido</label>
                    <div class="mt-1 font-mono font-semibold">${order.id}</div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-500">Mesa</label>
                    <div class="mt-1 flex items-center gap-2">
                        <i class="fas fa-chair"></i>
                        <span class="font-semibold">${order.table}</span>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-500">Estado</label>
                    <div class="mt-1">
                        <span class="status-badge ${order.getStatusBadge().class}">
                            ${order.getStatusBadge().icon} ${order.getStatusBadge().text}
                        </span>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-500">Código</label>
                    <div class="mt-1 font-mono font-semibold">${order.code}</div>
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-500 mb-2">Productos</label>
                <div class="bg-gray-50 rounded-lg p-4">
                    ${order.products.split(', ').map(product => `
                        <div class="flex justify-between py-2 border-b border-gray-200 last:border-0">
                            <span>${product}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-500">Hora</label>
                    <div class="mt-1">${order.getFormattedTime()}</div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-500">Total</label>
                    <div class="mt-1 text-2xl font-bold text-green-600">
                        $${order.total.toFixed(2)}
                    </div>
                </div>
            </div>
            
            <div class="pt-4 border-t border-gray-200">
                <label class="block text-sm font-medium text-gray-500 mb-2">Acciones</label>
                <div class="flex gap-2">
                    ${order.status === 'pending' ? `
                        <button onclick="updateOrderStatus('${order.id}', 'preparing')" 
                                class="btn-primary flex-1">
                            <i class="fas fa-play mr-2"></i> Comenzar Preparación
                        </button>
                    ` : ''}
                    ${order.status === 'preparing' ? `
                        <button onclick="updateOrderStatus('${order.id}', 'ready')" 
                                class="btn-warning flex-1">
                            <i class="fas fa-check mr-2"></i> Marcar como Listo
                        </button>
                    ` : ''}
                    ${order.status === 'ready' ? `
                        <button onclick="updateOrderStatus('${order.id}', 'delivered')" 
                                class="btn-success flex-1">
                            <i class="fas fa-truck mr-2"></i> Entregar Pedido
                        </button>
                    ` : ''}
                    <button onclick="printOrderTicket('${order.id}')" 
                            class="btn-secondary flex-1">
                        <i class="fas fa-print mr-2"></i> Imprimir Ticket
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// ============================================
// FUNCIONES DE GRÁFICOS
// ============================================
function initializeCharts() {
    // Gráfico de ventas
    const salesCtx = document.getElementById('salesChart');
    if (salesCtx) {
        salesChart = new Chart(salesCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Ventas',
                    data: [],
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    // Gráfico de productos
    const productsCtx = document.getElementById('productsChart');
    if (productsCtx) {
        productsChart = new Chart(productsCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Cantidad',
                    data: [],
                    backgroundColor: '#10B981',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    updateSalesChart('today');
    updateProductsChart('quantity');
}

function updateSalesChart(period) {
    if (!salesChart) return;
    
    // Datos de ejemplo - en producción vendrían del servidor
    const sampleData = {
        today: {
            labels: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'],
            data: [120, 190, 300, 500, 250, 400, 320, 480, 560, 610, 540, 420]
        },
        week: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            data: [1200, 1900, 3000, 2500, 2800, 3500, 3200]
        },
        month: {
            labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
            data: [5200, 6800, 7200, 6100]
        }
    };
    
    const data = sampleData[period] || sampleData.today;
    
    salesChart.data.labels = data.labels;
    salesChart.data.datasets[0].data = data.data;
    salesChart.update();
}

function updateProductsChart(type) {
    if (!productsChart) return;
    
    // Datos de ejemplo
    const products = [
        { name: 'Filete Mignon', quantity: 45, revenue: 1579.55 },
        { name: 'Salmón Glaseado', quantity: 38, revenue: 1092.50 },
        { name: 'Risotto', quantity: 52, revenue: 1194.48 },
        { name: 'Carpaccio', quantity: 29, revenue: 550.71 },
        { name: 'Cóctel Signature', quantity: 67, revenue: 1072.00 },
        { name: 'Soufflé', quantity: 41, revenue: 614.59 }
    ];
    
    productsChart.data.labels = products.map(p => p.name);
    productsChart.data.datasets[0].data = products.map(p => type === 'revenue' ? p.revenue : p.quantity);
    productsChart.data.datasets[0].backgroundColor = type === 'revenue' ? '#8B5CF6' : '#10B981';
    productsChart.data.datasets[0].label = type === 'revenue' ? 'Ingresos ($)' : 'Cantidad';
    
    if (type === 'revenue') {
        productsChart.options.scales.y.ticks = {
            callback: function(value) {
                return '$' + value;
            }
        };
    } else {
        productsChart.options.scales.y.ticks = {
            callback: function(value) {
                return value;
            }
        };
    }
    
    productsChart.update();
}

// ============================================
// FUNCIONES DE INVENTARIO
// ============================================
function checkLowInventory() {
    const lowItems = inventory.filter(item => item.current <= item.min);
    
    if (lowItems.length > 0) {
        const section = document.getElementById('lowInventorySection');
        if (section) {
            section.style.display = 'block';
        }
        
        // Mostrar notificación solo si es la primera vez
        if (!localStorage.getItem('inventoryNotificationShown')) {
            showNotification(`${lowItems.length} productos con inventario bajo`, 'warning');
            localStorage.setItem('inventoryNotificationShown', 'true');
            
            // Resetear después de 1 hora
            setTimeout(() => {
                localStorage.removeItem('inventoryNotificationShown');
            }, 3600000);
        }
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('collapsed');
}

function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        background: ${type === 'success' ? '#10B981' : 
                     type === 'error' ? '#EF4444' : 
                     type === 'warning' ? '#F59E0B' : '#3B82F6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 400px;
    `;
    
    const icon = type === 'success' ? '✅' : 
                 type === 'error' ? '❌' : 
                 type === 'warning' ? '⚠️' : 'ℹ️';
    
    notification.innerHTML = `
        <span style="font-size: 1.2rem;">${icon}</span>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, PANEL_CONFIG.NOTIFICATION_TIMEOUT);
}

function startAutoUpdates() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    
    updateInterval = setInterval(() => {
        loadActiveOrders();
        updateDashboardStats();
        checkLowInventory();
    }, PANEL_CONFIG.UPDATE_INTERVAL);
}

function loadAllData() {
    showNotification('Actualizando datos...', 'info');
    loadInitialData();
}

function updateTablesStatus() {
    // Simular actualización de estado de mesas
    tables.forEach(table => {
        if (table.status === 'occupied' && Math.random() > 0.7) {
            table.updateStatus('available');
        } else if (table.status === 'available' && Math.random() > 0.8) {
            table.updateStatus('occupied');
        }
    });
    
    updateTablesGrid();
    updateDashboardStats();
    showNotification('Estado de mesas actualizado', 'success');
}

// ============================================
// MODALES
// ============================================
function showNewOrderModal() {
    const modal = document.getElementById('newOrderModal');
    const tableSelect = document.getElementById('selectTable');
    const productsContainer = document.getElementById('newOrderProducts');
    
    // Llenar select de mesas disponibles
    tableSelect.innerHTML = '<option value="">Seleccionar mesa...</option>';
    tables.filter(table => table.status === 'available').forEach(table => {
        tableSelect.innerHTML += `<option value="${table.number}">Mesa ${table.number}</option>`;
    });
    
    // Llenar lista de productos (simulada)
    const sampleProducts = [
        { id: 1, name: 'Filete Mignon', price: 34.99 },
        { id: 2, name: 'Salmón Glaseado', price: 28.75 },
        { id: 3, name: 'Risotto de Champiñones', price: 22.99 },
        { id: 4, name: 'Carpaccio de Res', price: 18.99 },
        { id: 5, name: 'Soufflé de Chocolate', price: 14.99 },
        { id: 6, name: 'Cóctel Signature', price: 16.00 }
    ];
    
    productsContainer.innerHTML = sampleProducts.map(product => `
        <div class="product-item flex justify-between items-center p-3 border-b border-gray-200 last:border-0">
            <div>
                <div class="font-medium">${product.name}</div>
                <div class="text-sm text-gray-500">$${product.price.toFixed(2)}</div>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="decrementProduct(${product.id})" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    -
                </button>
                <span id="product-qty-${product.id}" class="w-8 text-center">0</span>
                <button onclick="incrementProduct(${product.id})" class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    +
                </button>
            </div>
        </div>
    `).join('');
    
    modal.classList.add('active');
    updateNewOrderSummary();
}

function closeNewOrderModal() {
    document.getElementById('newOrderModal').classList.remove('active');
    resetNewOrderForm();
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', initializePanel);

// Exportar funciones necesarias
window.updateOrderStatus = updateOrderStatus;
window.viewOrderDetail = viewOrderDetail;
window.toggleSidebar = toggleSidebar;
window.showNewOrderModal = showNewOrderModal;
window.closeNewOrderModal = closeNewOrderModal;
window.createManualOrder = createManualOrder;
window.updateTablesStatus = updateTablesStatus;
window.printOrderTicket = function(orderId) {
    showNotification('Imprimiendo ticket...', 'info');
    // Aquí iría la lógica real de impresión
};

// Funciones auxiliares para el modal de nuevo pedido
let newOrderCart = {};

window.incrementProduct = function(productId) {
    if (!newOrderCart[productId]) {
        newOrderCart[productId] = { quantity: 0, price: 0, name: '' };
    }
    newOrderCart[productId].quantity++;
    document.getElementById(`product-qty-${productId}`).textContent = newOrderCart[productId].quantity;
    updateNewOrderSummary();
};

window.decrementProduct = function(productId) {
    if (newOrderCart[productId] && newOrderCart[productId].quantity > 0) {
        newOrderCart[productId].quantity--;
        if (newOrderCart[productId].quantity === 0) {
            delete newOrderCart[productId];
        }
        document.getElementById(`product-qty-${productId}`).textContent = newOrderCart[productId]?.quantity || 0;
        updateNewOrderSummary();
    }
};

function updateNewOrderSummary() {
    const summary = document.getElementById('newOrderSummary');
    const itemsContainer = document.getElementById('newOrderItems');
    const totalElement = document.getElementById('newOrderTotal');
    
    const items = Object.values(newOrderCart).filter(item => item.quantity > 0);
    
    if (items.length === 0) {
        summary.style.display = 'none';
        return;
    }
    
    summary.style.display = 'block';
    
    let total = 0;
    itemsContainer.innerHTML = items.map(item => {
        const itemTotal = item.quantity * item.price;
        total += itemTotal;
        return `
            <div class="flex justify-between py-2 border-b border-gray-200">
                <span>${item.quantity}x ${item.name}</span>
                <span>$${itemTotal.toFixed(2)}</span>
            </div>
        `;
    }).join('');
    
    totalElement.textContent = `$${total.toFixed(2)}`;
}

function resetNewOrderForm() {
    newOrderCart = {};
    document.getElementById('selectTable').value = '';
    document.querySelectorAll('[id^="product-qty-"]').forEach(el => {
        el.textContent = '0';
    });
    document.getElementById('newOrderSummary').style.display = 'none';
}

async function createManualOrder() {
    const tableSelect = document.getElementById('selectTable');
    const tableNumber = tableSelect.value;
    
    if (!tableNumber) {
        showNotification('Selecciona una mesa', 'error');
        return;
    }
    
    const items = Object.values(newOrderCart).filter(item => item.quantity > 0);
    if (items.length === 0) {
        showNotification('Agrega productos al pedido', 'error');
        return;
    }
    
    try {
        // Aquí iría la lógica real para crear el pedido en Google Sheets
        showNotification('Creando pedido manual...', 'info');
        
        // Simulación
        setTimeout(() => {
            showNotification('Pedido creado exitosamente', 'success');
            closeNewOrderModal();
            
            // Actualizar datos
            loadActiveOrders();
            updateTablesStatus();
        }, 1000);
        
    } catch (error) {
        console.error('Error creando pedido:', error);
        showNotification('Error al crear pedido', 'error');
    }
}
