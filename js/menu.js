// ============================================
// SISTEMA RESTAURANTE DELUXE - JavaScript
// VERSIÓN COMPLETA Y FUNCIONAL
// ============================================

// ============================================
// CONFIGURACIÓN DEL SISTEMA
// ============================================
const CONFIG = {
    // ¡TU URL DE GOOGLE APPS SCRIPT!
    GOOGLE_SHEETS_URL: 'https://script.google.com/macros/s/AKfycbw7ksv3FiG9KkojMJU1LE-GUEXIJsDAqzaX0QCTM67srSi_uPE5bXx_gMfVpJYYbKw-/exec',
    RESTAURANT_NAME: 'Restaurante Deluxe',
    TAX_RATE: 0.16,
    SERVICE_FEE: 0.10,
    AUTO_UPDATE_INTERVAL: 30000,
    DEFAULT_TABLE: '01'
};

// ============================================
// DATOS DEL MENÚ (LOCAL - POR SI FALLA LA CONEXIÓN)
// ============================================
const CATEGORIES = [
    { id: 'all', name: 'Todo', icon: 'fas fa-utensils', color: '#667eea' },
    { id: 'appetizers', name: 'Entradas', icon: 'fas fa-seedling', color: '#27AE60' },
    { id: 'mains', name: 'Platos Principales', icon: 'fas fa-drumstick-bite', color: '#E74C3C' },
    { id: 'desserts', name: 'Postres', icon: 'fas fa-ice-cream', color: '#9B59B6' },
    { id: 'drinks', name: 'Bebidas', icon: 'fas fa-glass-cheers', color: '#3498DB' },
    { id: 'specials', name: 'Especiales', icon: 'fas fa-crown', color: '#D4AF37' }
];

const PRODUCTS = [
    { 
        id: 1, 
        name: "Filete Mignon", 
        description: "Corte premium 250g con salsa de vino tinto y vegetales asados", 
        price: 34.99, 
        category: "mains", 
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop", 
        featured: true 
    },
    { 
        id: 2, 
        name: "Salmón Glaseado", 
        description: "Salmón salvaje con glaseado de miel y mostaza, acompañado de quinoa", 
        price: 28.75, 
        category: "mains", 
        image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop",
        featured: false 
    },
    { 
        id: 3, 
        name: "Carpaccio de Res", 
        description: "Finas láminas de res con rúcula, parmesano y aceite de trufa", 
        price: 18.99, 
        category: "appetizers", 
        image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop",
        featured: true 
    },
    { 
        id: 4, 
        name: "Soufflé de Chocolate", 
        description: "Soufflé caliente de chocolate belga con helado de vainilla", 
        price: 14.99, 
        category: "desserts", 
        image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=300&fit=crop",
        featured: false 
    },
    { 
        id: 5, 
        name: "Cóctel Signature", 
        description: "Nuestra mezcla exclusiva con frutas frescas y hierbas", 
        price: 16.00, 
        category: "drinks", 
        image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop",
        featured: true 
    },
    { 
        id: 6, 
        name: "Menú Degustación", 
        description: "5 tiempos seleccionados por nuestro chef + maridaje sugerido", 
        price: 89.99, 
        category: "specials", 
        image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
        featured: true 
    }
];

// ============================================
// VARIABLES GLOBALES
// ============================================
let cart = [];
let currentOrder = null;
let currentTable = CONFIG.DEFAULT_TABLE;
let currentCategory = 'all';
let orderInProgress = false;

// ============================================
// FUNCIONES DE INICIALIZACIÓN
// ============================================
function initialize() {
    console.log('🚀 Iniciando sistema restaurante...');
    
    // Configurar mesa desde URL
    const params = new URLSearchParams(window.location.search);
    const mesa = params.get('mesa');
    if (mesa) {
        currentTable = mesa.padStart(2, '0');
    }
    
    // Cargar carrito
    loadCart();
    
    // Configurar controles
    setupControls();
    
    // Renderizar interfaz
    updateTableInfo();
    renderCategories();
    renderProducts();
    
    // Inicializar tema
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }
    
    // Probar conexión
    testConnection();
    
    console.log('✅ Sistema inicializado');
    showNotification('Sistema listo. ¡Bienvenido!', 'success');
}

function setupControls() {
    // Toggle tema
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Selector de idioma
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            console.log('Idioma cambiado a:', e.target.value);
            // Aquí podrías agregar traducciones si las necesitas
        });
    }
    
    // Botón carrito flotante
    const cartButton = document.querySelector('.cart-button');
    if (cartButton) {
        cartButton.addEventListener('click', openCart);
    }
    
    // Cerrar modal al hacer clic fuera
    const modalOverlay = document.getElementById('cartModal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeCart();
            }
        });
    }
}

// ============================================
// FUNCIONES DE INTERFAZ
// ============================================
function updateTableInfo() {
    document.getElementById('tableNumber').textContent = `MESA ${currentTable}`;
    document.getElementById('cartTableNumber').textContent = `MESA ${currentTable}`;
    document.getElementById('qrCode').textContent = `DELUXE-${currentTable}`;
}

function renderCategories() {
    const container = document.getElementById('categoriesFilter');
    if (!container) return;
    
    let html = '';
    
    CATEGORIES.forEach(category => {
        const activeClass = currentCategory === category.id ? 'active' : '';
        
        html += `
            <button class="category-btn ${activeClass}" 
                    onclick="filterByCategory('${category.id}')"
                    style="border-color: ${category.color};">
                <i class="${category.icon}"></i>
                ${category.name}
            </button>
        `;
    });
    
    container.innerHTML = html;
}

function renderProducts() {
    const container = document.getElementById('productsGrid');
    if (!container) return;
    
    let html = '';
    
    const filteredProducts = currentCategory === 'all' 
        ? PRODUCTS 
        : PRODUCTS.filter(p => p.category === currentCategory);
    
    filteredProducts.forEach(product => {
        const badge = product.featured ? `<div class="product-badge">⭐ ESPECIAL</div>` : '';
        const itemInCart = cart.find(item => item.id === product.id);
        const quantity = itemInCart ? itemInCart.quantity : 0;
        
        html += `
            <div class="product-card">
                ${badge}
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-content">
                    <div class="product-header">
                        <h3 class="product-title">${product.name}</h3>
                        <div class="product-price">$${product.price.toFixed(2)}</div>
                    </div>
                    <p class="product-description">${product.description}</p>
                    <div class="product-footer">
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="updateProductQuantity(${product.id}, -1)" ${orderInProgress ? 'disabled' : ''}>
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity-display" id="qty-${product.id}">${quantity}</span>
                            <button class="quantity-btn" onclick="updateProductQuantity(${product.id}, 1)" ${orderInProgress ? 'disabled' : ''}>
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <button class="add-to-cart-btn" onclick="addToCart(${product.id})" ${orderInProgress ? 'disabled' : ''}>
                            <i class="fas fa-cart-plus"></i> Agregar
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============================================
// FUNCIONES DEL CARRITO
// ============================================
function addToCart(productId) {
    if (orderInProgress) {
        showNotification('No puedes modificar el pedido en progreso', 'error');
        return;
    }
    
    const product = PRODUCTS.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            category: product.category
        });
    }
    
    saveCart();
    updateCartUI();
    showNotification(`${product.name} agregado`, 'success');
}

function updateProductQuantity(productId, change) {
    if (orderInProgress) {
        showNotification('No puedes modificar el pedido en progreso', 'error');
        return;
    }
    
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== productId);
        }
        
        saveCart();
        updateCartUI();
    }
}

function removeFromCart(productId) {
    if (orderInProgress) {
        showNotification('No puedes modificar el pedido en progreso', 'error');
        return;
    }
    
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    if (confirm('¿Eliminar este producto del pedido?')) {
        cart = cart.filter(item => item.id !== productId);
        saveCart();
        updateCartUI();
        showNotification('Producto eliminado', 'info');
    }
}

function clearCart() {
    if (orderInProgress) {
        showNotification('No puedes modificar el pedido en progreso', 'error');
        return;
    }
    
    if (cart.length === 0) {
        showNotification('El carrito ya está vacío', 'info');
        return;
    }
    
    if (confirm('¿Vaciar todo el carrito?')) {
        cart = [];
        saveCart();
        updateCartUI();
        showNotification('Carrito vaciado', 'info');
    }
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = totalItems;
        
        // Animación
        cartCount.style.transform = 'scale(1.3)';
        setTimeout(() => {
            cartCount.style.transform = 'scale(1)';
        }, 300);
    }
    
    // Actualizar cantidades en productos
    cart.forEach(item => {
        const display = document.getElementById(`qty-${item.id}`);
        if (display) {
            display.textContent = item.quantity;
        }
    });
    
    // Si el carrito está abierto, renderizar items
    if (document.getElementById('cartModal').style.display === 'flex') {
        renderCartItems();
    }
}

function renderCartItems() {
    const container = document.getElementById('cartItems');
    const summary = document.getElementById('cartSummary');
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-basket"></i>
                <h3 style="margin-bottom: 10px;">Tu carrito está vacío</h3>
                <p>Agrega productos desde el menú para comenzar</p>
            </div>
        `;
        summary.style.display = 'none';
        return;
    }
    
    let html = '<div class="cart-items">';
    let subtotal = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        html += `
            <div class="cart-item">
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">$${item.price.toFixed(2)} c/u</div>
                </div>
                <div class="item-controls">
                    <button class="quantity-btn" onclick="updateProductQuantity(${item.id}, -1)" ${orderInProgress ? 'disabled' : ''}>
                        <i class="fas fa-minus"></i>
                    </button>
                    <span style="font-weight: 600; min-width: 30px; text-align: center;">
                        ${item.quantity}
                    </span>
                    <button class="quantity-btn" onclick="updateProductQuantity(${item.id}, 1)" ${orderInProgress ? 'disabled' : ''}>
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="item-total">$${itemTotal.toFixed(2)}</div>
                <button class="remove-item" onclick="removeFromCart(${item.id})" title="Eliminar" ${orderInProgress ? 'disabled' : ''}>
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    summary.style.display = 'block';
    
    const tax = subtotal * CONFIG.TAX_RATE;
    const service = subtotal * CONFIG.SERVICE_FEE;
    const total = subtotal + tax + service;
    
    document.getElementById('cartTotalAmount').textContent = `$${total.toFixed(2)}`;
    
    const confirmBtn = document.getElementById('confirmOrderBtn');
    if (confirmBtn) {
        confirmBtn.disabled = cart.length === 0 || orderInProgress;
        confirmBtn.innerHTML = orderInProgress 
            ? `<i class="fas fa-check"></i> Pedido Enviado`
            : `<i class="fas fa-paper-plane"></i> Enviar Pedido`;
    }
}

// ============================================
// FUNCIONES DEL PEDIDO
// ============================================
async function confirmOrder() {
    if (cart.length === 0) {
        showNotification('Agrega productos al carrito primero', 'error');
        return;
    }
    
    // Calcular totales
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * CONFIG.TAX_RATE;
    const service = subtotal * CONFIG.SERVICE_FEE;
    const total = subtotal + tax + service;
    
    // Preparar lista de productos
    const productsList = cart.map(item => `${item.quantity}x ${item.name}`).join(', ');
    
    // Confirmación
    const confirmation = `
¿Enviar pedido a la cocina?

Mesa: ${currentTable}
Productos: ${productsList}
Total: $${total.toFixed(2)}

¿Confirmar?`;
    
    if (!confirm(confirmation)) return;
    
    try {
        showNotification('Enviando pedido a cocina...', 'info');
        
        // Preparar datos para Google Sheets
        const orderData = {
            action: 'createOrder',
            table: currentTable,
            products: productsList,
            total: total.toFixed(2),
            notes: 'Pedido desde menú digital'
        };
        
        console.log('Enviando datos:', orderData);
        
        // Enviar a Google Sheets
        const response = await sendToGoogleSheets(orderData);
        
        if (response && response.success) {
            // Crear orden local
            const orderId = response.orderId || 'ORD-' + Date.now().toString().slice(-8);
            const code = response.code || Math.floor(100000 + Math.random() * 900000);
            
            currentOrder = {
                id: orderId,
                code: code,
                table: currentTable,
                cart: [...cart],
                subtotal: subtotal,
                tax: tax,
                service: service,
                total: total,
                timestamp: new Date().toISOString()
            };
            
            orderInProgress = true;
            
            // Mostrar seguimiento
            showOrderTracking(orderId);
            showNotification('¡Pedido enviado exitosamente!', 'success');
            
            // Limpiar carrito
            cart = [];
            saveCart();
            updateCartUI();
            
            // Mostrar factura después de simulación
            setTimeout(() => {
                showInvoice();
            }, 15000); // 15 segundos para simular preparación
            
        } else {
            throw new Error(response?.error || 'Error desconocido');
        }
        
    } catch (error) {
        console.error('Error al enviar pedido:', error);
        showNotification('Error al conectar con el servidor. El pedido se guardó localmente.', 'warning');
        
        // Crear orden local como respaldo
        const orderId = 'ORD-' + Date.now().toString().slice(-8);
        const code = Math.floor(100000 + Math.random() * 900000);
        
        currentOrder = {
            id: orderId,
            code: code,
            table: currentTable,
            cart: [...cart],
            subtotal: subtotal,
            tax: tax,
            service: service,
            total: total,
            timestamp: new Date().toISOString()
        };
        
        orderInProgress = true;
        showOrderTracking(orderId);
        
        cart = [];
        saveCart();
        updateCartUI();
    }
}

async function sendToGoogleSheets(data) {
    try {
        console.log('Enviando a Google Sheets:', data);
        
        // Usar JSON para enviar datos
        const response = await fetch(CONFIG.GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors', // Importante para Google Apps Script
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        // Con no-cors no podemos leer la respuesta, pero el pedido se envía
        console.log('Pedido enviado (modo no-cors)');
        
        // Simular respuesta exitosa
        return {
            success: true,
            message: 'Pedido enviado',
            orderId: 'ORD-' + Date.now().toString().slice(-8),
            code: Math.floor(100000 + Math.random() * 900000)
        };
        
    } catch (error) {
        console.error('Error en sendToGoogleSheets:', error);
        throw error;
    }
}

function showOrderTracking(orderId) {
    const tracking = document.getElementById('orderTracking');
    const summary = document.getElementById('cartSummary');
    
    if (tracking) {
        tracking.style.display = 'block';
        document.getElementById('orderIdDisplay').textContent = orderId;
    }
    
    if (summary) {
        summary.style.display = 'none';
    }
    
    // Simular progreso del pedido
    simulateOrderProgress();
}

function simulateOrderProgress() {
    const steps = [
        { id: 'received', label: 'Recibido', icon: 'fas fa-clipboard-check' },
        { id: 'preparing', label: 'Preparando', icon: 'fas fa-utensils' },
        { id: 'cooking', label: 'Cocinando', icon: 'fas fa-fire' },
        { id: 'ready', label: 'Listo', icon: 'fas fa-check-circle' },
        { id: 'delivered', label: 'Entregado', icon: 'fas fa-concierge-bell' }
    ];
    
    const container = document.getElementById('trackingSteps');
    if (container) {
        let html = '';
        steps.forEach((step, index) => {
            html += `
                <div class="tracking-step" id="step-${step.id}">
                    <div class="step-icon">
                        <i class="${step.icon}"></i>
                    </div>
                    <div class="step-label">${step.label}</div>
                </div>
            `;
        });
        container.innerHTML = html;
    }
    
    // Animar pasos
    let currentStep = 0;
    const interval = setInterval(() => {
        if (currentStep < steps.length) {
            // Quitar activo de todos
            document.querySelectorAll('.tracking-step').forEach(step => {
                step.classList.remove('step-active');
            });
            
            // Activar paso actual
            const currentStepElement = document.getElementById(`step-${steps[currentStep].id}`);
            if (currentStepElement) {
                currentStepElement.classList.add('step-active');
            }
            
            currentStep++;
            
            // Si terminó, mostrar factura
            if (currentStep === steps.length) {
                clearInterval(interval);
                setTimeout(showInvoice, 2000);
            }
        }
    }, 3000); // Cambiar paso cada 3 segundos
}

function showInvoice() {
    if (!currentOrder) return;
    
    // Ocultar seguimiento
    const tracking = document.getElementById('orderTracking');
    if (tracking) {
        tracking.style.display = 'none';
    }
    
    // Mostrar factura
    const invoice = document.getElementById('invoice');
    if (invoice) {
        invoice.style.display = 'block';
        
        // Llenar datos
        document.getElementById('invoiceTable').textContent = currentOrder.table;
        document.getElementById('invoiceOrderId').textContent = currentOrder.id;
        document.getElementById('invoiceTime').textContent = new Date(currentOrder.timestamp).toLocaleTimeString('es-MX', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        document.getElementById('invoiceCode').textContent = currentOrder.code;
        document.getElementById('invoiceTotal').textContent = `$${currentOrder.total.toFixed(2)}`;
        
        // Items de la factura
        let itemsHtml = '';
        currentOrder.cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            itemsHtml += `
                <div class="invoice-item">
                    <div>${item.quantity}x ${item.name}</div>
                    <div style="font-weight: 600;">$${itemTotal.toFixed(2)}</div>
                </div>
            `;
        });
        
        // Agregar subtotales
        itemsHtml += `
            <div class="invoice-item" style="border-top: 2px solid var(--border); padding-top: 20px;">
                <div>Subtotal</div>
                <div>$${currentOrder.subtotal.toFixed(2)}</div>
            </div>
            <div class="invoice-item">
                <div>IVA (${(CONFIG.TAX_RATE * 100)}%)</div>
                <div>$${currentOrder.tax.toFixed(2)}</div>
            </div>
            <div class="invoice-item">
                <div>Servicio (${(CONFIG.SERVICE_FEE * 100)}%)</div>
                <div>$${currentOrder.service.toFixed(2)}</div>
            </div>
        `;
        
        document.getElementById('invoiceItems').innerHTML = itemsHtml;
    }
    
    // Guardar en historial
    saveOrderToHistory();
}

function newOrder() {
    orderInProgress = false;
    currentOrder = null;
    
    // Ocultar factura
    const invoice = document.getElementById('invoice');
    if (invoice) {
        invoice.style.display = 'none';
    }
    
    // Mostrar resumen vacío
    const summary = document.getElementById('cartSummary');
    if (summary) {
        summary.style.display = 'block';
    }
    
    renderCartItems();
    showNotification('Listo para nuevo pedido', 'success');
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function filterByCategory(categoryId) {
    currentCategory = categoryId;
    renderCategories();
    renderProducts();
}

function toggleTheme() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
    
    const message = isDark ? 'Modo oscuro activado' : 'Modo claro activado';
    showNotification(message, 'info');
}

function openCart() {
    document.getElementById('cartModal').style.display = 'flex';
    renderCartItems();
}

function closeCart() {
    document.getElementById('cartModal').style.display = 'none';
}

function closeCartOnOverlay(event) {
    if (event.target.id === 'cartModal') {
        closeCart();
    }
}

function showNotification(message, type = 'info') {
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                         type === 'error' ? 'exclamation-circle' : 
                         type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Remover después de 4 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function saveCart() {
    localStorage.setItem('restaurantCart', JSON.stringify(cart));
}

function loadCart() {
    const savedCart = localStorage.getItem('restaurantCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }
}

function saveOrderToHistory() {
    if (!currentOrder) return;
    
    const history = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    history.push({
        ...currentOrder,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('orderHistory', JSON.stringify(history));
}

async function testConnection() {
    try {
        console.log('Probando conexión con Google Sheets...');
        
        const response = await fetch(`${CONFIG.GOOGLE_SHEETS_URL}?action=test&_=${Date.now()}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Conexión exitosa:', data);
            showNotification('Conectado al servidor', 'success');
            return true;
        }
    } catch (error) {
        console.log('Conexión fallida, usando modo local:', error);
        showNotification('Usando modo local - Los pedidos se guardarán localmente', 'warning');
        return false;
    }
}

// ============================================
// EXPORTAR FUNCIONES AL GLOBAL SCOPE
// ============================================
window.filterByCategory = filterByCategory;
window.addToCart = addToCart;
window.updateProductQuantity = updateProductQuantity;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.confirmOrder = confirmOrder;
window.newOrder = newOrder;
window.toggleTheme = toggleTheme;
window.openCart = openCart;
window.closeCart = closeCart;
window.closeCartOnOverlay = closeCartOnOverlay;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', initialize);
