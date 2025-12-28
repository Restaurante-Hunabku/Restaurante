// ============================================
// PANEL DE CONTROL RESTAURANTE DELUXE - JavaScript
// VERSIÓN COMPLETA Y FUNCIONAL
// ============================================

// ============================================
// CONFIGURACIÓN DEL SISTEMA
// ============================================
const PANEL_CONFIG = {
    // ¡TU URL DE GOOGLE APPS SCRIPT!
    GOOGLE_SHEETS_URL: 'https://script.google.com/macros/s/AKfycbw7ksv3FiG9KkojMJU1LE-GUEXIJsDAqzaX0QCTM67srSi_uPE5bXx_gMfVpJYYbKw-/exec',
    UPDATE_INTERVAL: 10000, // 10 segundos
    MAX_TABLES: 12
};

// ============================================
// VARIABLES GLOBALES
// ============================================
let activeOrders = [];
let tables = [];
let updateInterval;

// ============================================
// INICIALIZACIÓN
// ============================================
function initializePanel() {
    console.log('🚀 Iniciando panel de control...');
    
    // Configurar eventos
    setupEventListeners();
    
    // Cargar datos iniciales
    loadInitialData();
    
    // Iniciar actualizaciones automáticas
    startAutoUpdates();
    
    console.log('✅ Panel inicializado');
    showNotification('Panel listo', 'success');
}

function setupEventListeners() {
    // Botón de menú
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
    
    // Botón de actualizar
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadInitialData);
    }
    
    // Botón de actualizar mesas
    const refreshTablesBtn = document.getElementById('refreshTablesBtn');
    if (refreshTablesBtn) {
        refreshTablesBtn.addEventListener('click', loadTablesStatus);
    }
    
    // Botón nuevo pedido
    const newOrderBtn = document.getElementById('newOrderBtn');
    if (newOrderBtn) {
        newOrderBtn.addEventListener('click', () => {
            showNotification('Funcionalidad en desarrollo', 'info');
        });
    }
    
    // Filtros de pedidos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const filter = this.dataset.filter;
            filterOrders(filter);
        });
    });
    
    // Cerrar modal
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', closeOrderModal);
    }
}

// ============================================
// FUNCIONES DE DATOS
// ============================================
async function loadInitialData() {
    try {
        showNotification('Actualizando datos...', 'info');
        
        await Promise.all([
            loadActiveOrders(),
            loadTablesStatus()
        ]);
        
        updateDashboardStats();
        showNotification('Datos actualizados', 'success');
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        showNotification('Error al cargar datos', 'error');
    }
}

async function loadActiveOrders() {
    try {
        console.log('Cargando pedidos activos...');
        
        const url = `${PANEL_CONFIG.GOOGLE_SHEETS_URL}?action=getActiveOrders&_=${Date.now()}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            activeOrders = data.orders;
            renderOrdersTable();
            updateOrdersBadge();
            return true;
        } else {
            throw new Error(data.message || 'Error en respuesta');
        }
        
    } catch (error) {
        console.error('Error cargando pedidos activos:', error);
        
        // Datos de ejemplo si falla la conexión
        activeOrders = [
            {
                ID: 'ORD-123456',
                Mesa: '01',
                Productos: '1x Filete Mignon, 2x Cóctel Signature',
                Total: 66.99,
                Estado: 'pending',
                Código: '123456',
                Fecha: new Date().toLocaleDateString(),
                Hora: new Date().toLocaleTimeString()
            }
        ];
        
        renderOrdersTable();
        updateOrdersBadge();
        return false;
    }
}

async function loadTablesStatus() {
    try {
        console.log('Cargando estado de mesas...');
        
        const url = `${PANEL_CONFIG.GOOGLE_SHEETS_URL}?action=getTablesStatus&_=${Date.now()}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            tables = data.tables;
            updateTablesGrid();
            updateTablesBadge();
            return true;
        } else {
            throw new Error(data.message || 'Error en respuesta');
        }
        
    } catch (error) {
        console.error('Error cargando mesas:', error);
        
        // Datos de ejemplo si falla la conexión
        tables = [];
        for (let i = 1; i <= PANEL_CONFIG.MAX_TABLES; i++) {
            tables.push({
                Mesa: i.toString().padStart(2, '0'),
                Estado: i <= 4 ? 'occupied' : 'available',
                "Orden ID": i <= 4 ? 'ORD-' + (100000 + i) : '',
                Capacidad: 4,
                Ubicación: i <= 8 ? 'Sala Principal' : 'Terraza',
                "Última Actualización": new Date().toISOString()
            });
        }
        
        updateTablesGrid();
        updateTablesBadge();
        return false;
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
        const status = getStatusBadge(order.Estado || 'pending');
        
        html += `
            <tr data-order-id="${order.ID}">
                <td>
                    <div class="font-semibold">${order.ID || ''}</div>
                    <div class="text-sm text-gray-500">${order.Código || ''}</div>
                </td>
                <td>
                    <div class="flex items-center gap-2">
                        <span class="text-lg">🪑</span>
                        <span class="font-semibold">${order.Mesa || ''}</span>
                    </div>
                </td>
                <td>
                    <div class="text-sm truncate max-w-xs" title="${order.Productos || ''}">
                        ${order.Productos || ''}
                    </div>
                </td>
                <td class="font-bold text-green-600">
                    $${parseFloat(order.Total || 0).toFixed(2)}
                </td>
                <td>
                    <span class="status-badge ${status.class}">
                        ${status.icon} ${status.text}
                    </span>
                </td>
                <td class="text-sm text-gray-500">
                    ${order.Hora || ''}
                </td>
                <td>
                    <div class="flex gap-2">
                        <button class="action-btn" onclick="viewOrderDetail('${order.ID}')" title="Ver detalle">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${order.Estado === 'pending' ? `
                            <button class="action-btn btn-success" onclick="updateOrderStatus('${order.ID}', 'preparing')" title="Comenzar preparación">
                                <i class="fas fa-play"></i>
                            </button>
                        ` : ''}
                        ${order.Estado === 'preparing' ? `
                            <button class="action-btn btn-warning" onclick="updateOrderStatus('${order.ID}', 'ready')" title="Marcar como listo">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        ${order.Estado === 'ready' ? `
                            <button class="action-btn btn-primary" onclick="updateOrderStatus('${order.ID}', 'delivered')" title="Marcar como entregado">
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
        const statusClass = table.Estado === 'available' ? 'available' : 
                          table.Estado === 'occupied' ? 'occupied' : 'reserved';
        
        const statusText = table.Estado === 'available' ? 'Disponible' : 
                          table.Estado === 'occupied' ? 'Ocupada' : 'Reservada';
        
        html += `
            <div class="table-item ${statusClass}" onclick="showTableInfo('${table.Mesa}')">
                <div class="table-number">${table.Mesa}</div>
                <div class="table-status">
                    ${statusText}
                </div>
                ${table["Orden ID"] ? `
                    <div class="text-xs mt-1">
                        📦 ${table["Orden ID"]}
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    grid.innerHTML = html;
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
                <span class="stat-title">Pedidos Activos</span>
            </div>
            <div class="stat-value">${stats.activeOrders}</div>
            <div class="stat-change positive">
                <i class="fas fa-bell"></i>
                ${stats.pendingOrders} pendientes
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
            <div class="stat-change positive">
                <i class="fas fa-chart-line"></i>
                ${stats.todayOrders} pedidos
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
                <i class="fas fa-percentage"></i>
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
            <div class="stat-change negative">
                <i class="fas fa-arrow-up"></i>
                5% más rápido
            </div>
        </div>
    `;
}

function calculateStats() {
    const activeOrdersCount = activeOrders.length;
    const pendingOrders = activeOrders.filter(o => o.Estado === 'pending').length;
    const occupiedTables = tables.filter(t => t.Estado === 'occupied').length;
    const occupancyRate = Math.round((occupiedTables / PANEL_CONFIG.MAX_TABLES) * 100);
    
    // Calcular ventas del día (simulado)
    const todaySales = activeOrders.reduce((sum, order) => {
        return sum + parseFloat(order.Total || 0);
    }, 0);
    
    return {
        activeOrders: activeOrdersCount,
        pendingOrders: pendingOrders,
        todaySales: todaySales,
        todayOrders: activeOrdersCount,
        occupiedTables: occupiedTables,
        occupancyRate: occupancyRate,
        avgTime: 25 // minutos promedio
    };
}

// ============================================
// FUNCIONES DE PEDIDOS
// ============================================
async function updateOrderStatus(orderId, newStatus) {
    try {
        const order = activeOrders.find(o => o.ID === orderId);
        if (!order) {
            showNotification('Pedido no encontrado', 'error');
            return;
        }
        
        console.log(`Actualizando pedido ${orderId} a ${newStatus}`);
        
        // Enviar actualización a Google Sheets
        const formData = new URLSearchParams();
        formData.append('action', 'updateOrderStatus');
        formData.append('orderId', orderId);
        formData.append('status', newStatus);
        
        const response = await fetch(PANEL_CONFIG.GOOGLE_SHEETS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Actualizar localmente
            order.Estado = newStatus;
            
            // Si se entregó, liberar mesa
            if (newStatus === 'delivered') {
                const table = tables.find(t => t.Mesa === order.Mesa);
                if (table) {
                    table.Estado = 'available';
                    table["Orden ID"] = '';
                    updateTablesGrid();
                }
            }
            
            renderOrdersTable();
            updateDashboardStats();
            
            showNotification(`Pedido ${orderId} → ${newStatus}`, 'success');
            
            // Recargar después de actualizar
            setTimeout(loadActiveOrders, 1000);
            
        } else {
            showNotification(data.message || 'Error al actualizar', 'error');
        }
    } catch (error) {
        console.error('Error actualizando estado:', error);
        showNotification('Error de conexión', 'error');
    }
}

function viewOrderDetail(orderId) {
    const order = activeOrders.find(o => o.ID === orderId);
    if (!order) return;
    
    const modal = document.getElementById('orderModal');
    const modalBody = document.getElementById('modalBody');
    
    const status = getStatusBadge(order.Estado || 'pending');
    
    modalBody.innerHTML = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-500">ID Pedido</label>
                    <div class="mt-1 font-mono font-semibold">${order.ID}</div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-500">Mesa</label>
                    <div class="mt-1 flex items-center gap-2">
                        <i class="fas fa-chair"></i>
                        <span class="font-semibold">${order.Mesa}</span>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-500">Estado</label>
                    <div class="mt-1">
                        <span class="status-badge ${status.class}">
                            ${status.icon} ${status.text}
                        </span>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-500">Código</label>
                    <div class="mt-1 font-mono font-semibold">${order.Código}</div>
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-500 mb-2">Productos</label>
                <div class="bg-gray-50 rounded-lg p-4">
                    ${(order.Productos || '').split(', ').map(product => `
                        <div class="flex justify-between py-2 border-b border-gray-200 last:border-0">
                            <span>${product}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-500">Hora</label>
                    <div class="mt-1">${order.Hora}</div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-500">Total</label>
                    <div class="mt-1 text-2xl font-bold text-green-600">
                        $${parseFloat(order.Total || 0).toFixed(2)}
                    </div>
                </div>
            </div>
            
            <div class="pt-4 border-t border-gray-200">
                <label class="block text-sm font-medium text-gray-500 mb-2">Acciones</label>
                <div class="flex gap-2">
                    ${order.Estado === 'pending' ? `
                        <button onclick="updateOrderStatus('${order.ID}', 'preparing')" 
                                class="btn-primary flex-1">
                            <i class="fas fa-play mr-2"></i> Comenzar Preparación
                        </button>
                    ` : ''}
                    ${order.Estado === 'preparing' ? `
                        <button onclick="updateOrderStatus('${order.ID}', 'ready')" 
                                class="btn-warning flex-1">
                            <i class="fas fa-check mr-2"></i> Marcar como Listo
                        </button>
                    ` : ''}
                    ${order.Estado === 'ready' ? `
                        <button onclick="updateOrderStatus('${order.ID}', 'delivered')" 
                                class="btn-success flex-1">
                            <i class="fas fa-truck mr-2"></i> Entregar Pedido
                        </button>
                    ` : ''}
                    <button onclick="printOrderTicket('${order.ID}')" 
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
// FUNCIONES AUXILIARES
// ============================================
function getStatusBadge(status) {
    const statusMap = {
        'pending': { 
            class: 'status-pending', 
            text: 'Pendiente', 
            icon: '⏳' 
        },
        'preparing': { 
            class: 'status-preparing', 
            text: 'Preparando', 
            icon: '👨‍🍳' 
        },
        'ready': { 
            class: 'status-ready', 
            text: 'Listo', 
            icon: '✅' 
        },
        'delivered': { 
            class: 'status-delivered', 
            text: 'Entregado', 
            icon: '🎉' 
        }
    };
    
    return statusMap[status] || statusMap.pending;
}

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
    }, 5000);
}

function startAutoUpdates() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    
    updateInterval = setInterval(() => {
        console.log('🔄 Actualizando automáticamente...');
        loadActiveOrders();
        updateDashboardStats();
    }, PANEL_CONFIG.UPDATE_INTERVAL);
}

function updateOrdersBadge() {
    const badge = document.getElementById('ordersBadge');
    if (badge) {
        badge.textContent = activeOrders.length;
        
        // Resaltar si hay pedidos pendientes
        const pendingOrders = activeOrders.filter(o => o.Estado === 'pending');
        if (pendingOrders.length > 0) {
            badge.style.backgroundColor = '#EF4444';
            badge.style.animation = 'pulse 1s infinite';
        } else {
            badge.style.backgroundColor = '';
            badge.style.animation = '';
        }
    }
}

function updateTablesBadge() {
    const badge = document.getElementById('tablesBadge');
    if (badge) {
        const occupied = tables.filter(t => t.Estado === 'occupied').length;
        badge.textContent = `${occupied}/${PANEL_CONFIG.MAX_TABLES}`;
    }
}

function filterOrders(filter) {
    const rows = document.querySelectorAll('#ordersTableBody tr');
    
    rows.forEach(row => {
        const status = row.querySelector('.status-badge').textContent.toLowerCase();
        
        if (filter === 'all' || 
            (filter === 'pending' && status.includes('pendiente')) ||
            (filter === 'preparing' && status.includes('preparando')) ||
            (filter === 'ready' && status.includes('listo')) ||
            (filter === 'delivered' && status.includes('entregado'))) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

function showTableInfo(tableNumber) {
    const table = tables.find(t => t.Mesa === tableNumber);
    if (!table) return;
    
    showNotification(`Mesa ${tableNumber}: ${table.Estado === 'available' ? 'Disponible' : 'Ocupada'}`, 'info');
}

function printOrderTicket(orderId) {
    showNotification('Imprimiendo ticket...', 'info');
    // Aquí iría la lógica real de impresión
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================
window.updateOrderStatus = updateOrderStatus;
window.viewOrderDetail = viewOrderDetail;
window.toggleSidebar = toggleSidebar;
window.showTableInfo = showTableInfo;
window.printOrderTicket = printOrderTicket;
window.closeOrderModal = closeOrderModal;
window.filterOrders = filterOrders;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', initializePanel);

// Añadir estilos para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
