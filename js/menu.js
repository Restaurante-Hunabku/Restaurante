// ============================================
// SISTEMA RESTAURANTE DELUXE - JavaScript Completo
// ============================================

// ============================================
// CONFIGURACIÓN DEL SISTEMA
// ============================================
const CONFIG = {
    GOOGLE_SHEETS_URL: 'https://script.google.com/macros/s/AKfycbw7ksv3FiG9KkojMJU1LE-GUEXIJsDAqzaX0QCTM67srSi_uPE5bXx_gMfVpJYYbKw-/exec',
    RESTAURANT_NAME: 'Restaurante Deluxe',
    TAX_RATE: 0.16,
    SERVICE_FEE: 0.10,
    AUTO_UPDATE_INTERVAL: 30000,
    DEFAULT_TABLE: '01'
};

// ============================================
// SISTEMA DE TRADUCCIÓN (i18n)
// ============================================
const TRANSLATIONS = {
    es: {
        // Menú Principal
        'restaurant.title': '🍽️ RESTAURANTE DELUXE',
        'restaurant.subtitle': 'Experiencia gastronómica premium • Menú digital interactivo',
        'open.hours': 'Abierto: 11:00 AM - 11:00 PM',
        'reservations': 'Reservas: (123) 456-7890',
        'address': 'Dirección: Av. Gourmet 123',
        
        // Mesa
        'table.ready': 'LISTA PARA ORDENAR',
        'table.scan': 'Escanea el código QR o introduce el número de mesa',
        'table.qr': 'Código QR:',
        'table.number': 'MESA',
        
        // Categorías
        'category.all': 'Todo',
        'category.appetizers': 'Entradas',
        'category.mains': 'Platos Fuertes',
        'category.sides': 'Acompañamientos',
        'category.desserts': 'Postres',
        'category.drinks': 'Bebidas',
        'category.specials': 'Especiales',
        
        // Productos
        'product.add': 'Agregar',
        'product.quantity': 'Cantidad',
        'product.featured': '⭐ ESPECIAL',
        
        // Carrito
        'cart.title': '📋 Tu Orden Actual',
        'cart.active': 'PEDIDO ACTIVO',
        'cart.empty.title': 'Tu carrito está vacío',
        'cart.empty.message': 'Agrega productos desde el menú para comenzar',
        'cart.total': 'Total a pagar:',
        'cart.clear': 'Vaciar',
        'cart.confirm': 'Enviar Pedido',
        'cart.sent': 'Pedido Enviado',
        
        // Seguimiento
        'tracking.title': '📱 Seguimiento de tu Pedido',
        'tracking.subtitle': 'Tu pedido está en proceso',
        'tracking.steps.received': 'Recibido',
        'tracking.steps.preparing': 'Preparando',
        'tracking.steps.cooking': 'Cocinando',
        'tracking.steps.ready': 'Listo',
        'tracking.steps.delivered': 'Entregado',
        'tracking.orderId': 'ID de Pedido:',
        
        // Factura
        'invoice.title': '¡Pedido Completado!',
        'invoice.subtitle': 'Gracias por tu preferencia',
        'invoice.table': 'Mesa',
        'invoice.orderId': 'ID Pedido',
        'invoice.time': 'Hora',
        'invoice.code': 'Código',
        'invoice.details': '🍽️ Detalle del Pedido',
        'invoice.total': 'TOTAL',
        'invoice.thanks': '¡Esperamos verte pronto!',
        'invoice.satisfaction': 'Tu satisfacción es nuestra prioridad',
        'invoice.newOrder': '🍽️ Realizar Nuevo Pedido',
        
        // Notificaciones
        'notification.orderInProgress': 'No puedes modificar el pedido en progreso',
        'notification.added': 'agregado',
        'notification.removed': 'Producto eliminado',
        'notification.cartEmpty': 'El carrito ya está vacío',
        'notification.clearCart': '¿Vaciar todo el carrito?',
        'notification.cartCleared': 'Carrito vaciado',
        'notification.sending': 'Enviando pedido a cocina...',
        'notification.sent': 'Pedido enviado',
        'notification.error': 'Error de conexión con el servidor',
        'notification.ready': 'Listo para nuevo pedido',
        'notification.connection': 'Error de conexión',
        
        // Confirmaciones
        'confirm.order': '¿Enviar pedido a cocina?',
        'confirm.clear': '¿Eliminar este producto del pedido?',
        
        // Estados
        'status.pending': 'Pendiente',
        'status.preparing': 'Preparando',
        'status.cooking': 'Cocinando',
        'status.ready': 'Listo',
        'status.delivered': 'Entregado',
        
        // Botones
        'button.add': 'Agregar al Pedido',
        'button.view': 'Ver detalle',
        'button.edit': 'Editar',
        'button.delete': 'Eliminar',
        'button.save': 'Guardar',
        'button.cancel': 'Cancelar',
        'button.confirm': 'Confirmar',
        'button.back': 'Volver',
        
        // Modal
        'modal.close': 'Cerrar',
        'modal.ok': 'Aceptar',
        
        // Errores
        'error.emptyCart': 'Agrega productos al carrito primero',
        'error.connection': 'Error de conexión',
        'error.server': 'Error del servidor',
        
        // Éxito
        'success.order': 'Pedido enviado exitosamente',
        'success.update': 'Actualizado exitosamente',
        'success.save': 'Guardado exitosamente',
        
        // Sistema
        'system.ready': 'Sistema listo. ¡Bienvenido!',
        'system.loading': 'Cargando...',
        'system.theme.dark': 'Modo oscuro activado',
        'system.theme.light': 'Modo claro activado',
        'system.language': 'Idioma cambiado a'
    },
    
    en: {
        // Main Menu
        'restaurant.title': '🍽️ DELUXE RESTAURANT',
        'restaurant.subtitle': 'Premium gastronomic experience • Interactive digital menu',
        'open.hours': 'Open: 11:00 AM - 11:00 PM',
        'reservations': 'Reservations: (123) 456-7890',
        'address': 'Address: Gourmet Av. 123',
        
        // Table
        'table.ready': 'READY TO ORDER',
        'table.scan': 'Scan the QR code or enter table number',
        'table.qr': 'QR Code:',
        'table.number': 'TABLE',
        
        // Categories
        'category.all': 'All',
        'category.appetizers': 'Appetizers',
        'category.mains': 'Main Courses',
        'category.sides': 'Side Dishes',
        'category.desserts': 'Desserts',
        'category.drinks': 'Drinks',
        'category.specials': 'Specials',
        
        // Products
        'product.add': 'Add',
        'product.quantity': 'Quantity',
        'product.featured': '⭐ SPECIAL',
        
        // Cart
        'cart.title': '📋 Your Current Order',
        'cart.active': 'ACTIVE ORDER',
        'cart.empty.title': 'Your cart is empty',
        'cart.empty.message': 'Add products from the menu to start',
        'cart.total': 'Total to pay:',
        'cart.clear': 'Clear',
        'cart.confirm': 'Send Order',
        'cart.sent': 'Order Sent',
        
        // Tracking
        'tracking.title': '📱 Order Tracking',
        'tracking.subtitle': 'Your order is in process',
        'tracking.steps.received': 'Received',
        'tracking.steps.preparing': 'Preparing',
        'tracking.steps.cooking': 'Cooking',
        'tracking.steps.ready': 'Ready',
        'tracking.steps.delivered': 'Delivered',
        'tracking.orderId': 'Order ID:',
        
        // Invoice
        'invoice.title': 'Order Completed!',
        'invoice.subtitle': 'Thank you for your preference',
        'invoice.table': 'Table',
        'invoice.orderId': 'Order ID',
        'invoice.time': 'Time',
        'invoice.code': 'Code',
        'invoice.details': '🍽️ Order Details',
        'invoice.total': 'TOTAL',
        'invoice.thanks': 'We hope to see you soon!',
        'invoice.satisfaction': 'Your satisfaction is our priority',
        'invoice.newOrder': '🍽️ New Order',
        
        // Notifications
        'notification.orderInProgress': 'Cannot modify order in progress',
        'notification.added': 'added',
        'notification.removed': 'Product removed',
        'notification.cartEmpty': 'Cart is already empty',
        'notification.clearCart': 'Clear entire cart?',
        'notification.cartCleared': 'Cart cleared',
        'notification.sending': 'Sending order to kitchen...',
        'notification.sent': 'Order sent',
        'notification.error': 'Connection error with server',
        'notification.ready': 'Ready for new order',
        'notification.connection': 'Connection error',
        
        // Confirmations
        'confirm.order': 'Send order to kitchen?',
        'confirm.clear': 'Remove this product from order?',
        
        // Status
        'status.pending': 'Pending',
        'status.preparing': 'Preparing',
        'status.cooking': 'Cooking',
        'status.ready': 'Ready',
        'status.delivered': 'Delivered',
        
        // Buttons
        'button.add': 'Add to Order',
        'button.view': 'View details',
        'button.edit': 'Edit',
        'button.delete': 'Delete',
        'button.save': 'Save',
        'button.cancel': 'Cancel',
        'button.confirm': 'Confirm',
        'button.back': 'Back',
        
        // Modal
        'modal.close': 'Close',
        'modal.ok': 'OK',
        
        // Errors
        'error.emptyCart': 'Add products to cart first',
        'error.connection': 'Connection error',
        'error.server': 'Server error',
        
        // Success
        'success.order': 'Order sent successfully',
        'success.update': 'Updated successfully',
        'success.save': 'Saved successfully',
        
        // System
        'system.ready': 'System ready. Welcome!',
        'system.loading': 'Loading...',
        'system.theme.dark': 'Dark mode activated',
        'system.theme.light': 'Light mode activated',
        'system.language': 'Language changed to'
    }
};

// ============================================
// CLASE DE TRADUCCIÓN
// ============================================
class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('preferredLanguage') || 'es';
        this.translations = TRANSLATIONS;
        this.observers = [];
    }

    t(key, params = {}) {
        let translation = this.translations[this.currentLang]?.[key] || 
                        this.translations['es'][key] || 
                        key;
        
        Object.keys(params).forEach(param => {
            translation = translation.replace(`{{${param}}}`, params[param]);
        });
        
        return translation;
    }

    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLang = lang;
            localStorage.setItem('preferredLanguage', lang);
            this.notifyObservers();
            return true;
        }
        return false;
    }

    getLanguage() {
        return this.currentLang;
    }

    subscribe(observer) {
        this.observers.push(observer);
    }

    notifyObservers() {
        this.observers.forEach(observer => observer(this.currentLang));
    }

    translateDocument() {
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const params = {};
            
            element.getAttributeNames().forEach(attr => {
                if (attr.startsWith('data-i18n-')) {
                    const paramName = attr.replace('data-i18n-', '');
                    params[paramName] = element.getAttribute(attr);
                }
            });
            
            const translation = this.t(key, params);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else if (element.hasAttribute('data-i18n-html')) {
                element.innerHTML = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.value = this.currentLang;
        }
    }
}

const i18n = new I18n();

// ============================================
// DATOS DEL MENÚ
// ============================================
const CATEGORIES = [
    { id: 'all', name: 'category.all', icon: 'fas fa-utensils', color: '#667eea' },
    { id: 'appetizers', name: 'category.appetizers', icon: 'fas fa-seedling', color: '#27AE60' },
    { id: 'mains', name: 'category.mains', icon: 'fas fa-drumstick-bite', color: '#E74C3C' },
    { id: 'sides', name: 'category.sides', icon: 'fas fa-carrot', color: '#F39C12' },
    { id: 'desserts', name: 'category.desserts', icon: 'fas fa-ice-cream', color: '#9B59B6' },
    { id: 'drinks', name: 'category.drinks', icon: 'fas fa-glass-cheers', color: '#3498DB' },
    { id: 'specials', name: 'category.specials', icon: 'fas fa-crown', color: '#D4AF37' }
];

const PRODUCTS = [
    { 
        id: 1, 
        name: "Carpaccio de Res", 
        description: "Finas láminas de res con rúcula, parmesano y aceite de trufa", 
        price: 18.99, 
        category: "appetizers", 
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop", 
        featured: true
    },
    { 
        id: 2, 
        name: "Tartar de Atún", 
        description: "Atún fresco con aguacate, salsa ponzu y wasabi", 
        price: 16.50, 
        category: "appetizers", 
        image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop",
        featured: true
    },
    { 
        id: 3, 
        name: "Filete Mignon", 
        description: "Corte premium 250g con salsa de vino tinto y vegetales asados", 
        price: 34.99, 
        category: "mains", 
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop",
        featured: true
    },
    { 
        id: 4, 
        name: "Salmón Glaseado", 
        description: "Salmón salvaje con glaseado de miel y mostrada, acompañado de quinoa", 
        price: 28.75, 
        category: "mains", 
        image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop",
        featured: false
    },
    { 
        id: 5, 
        name: "Risotto de Champiñones", 
        description: "Arborio cremoso con champiñones silvestres y trufa", 
        price: 22.99, 
        category: "mains", 
        image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop",
        featured: false
    },
    { 
        id: 6, 
        name: "Menú Degustación", 
        description: "5 tiempos seleccionados por nuestro chef + maridaje sugerido", 
        price: 89.99, 
        category: "specials", 
        image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
        featured: true
    },
    { 
        id: 7, 
        name: "Langosta Thermidor", 
        description: "Langosta gratinada con salsa thermidor y espárragos", 
        price: 65.50, 
        category: "specials", 
        image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&h=300&fit=crop",
        featured: true
    },
    { 
        id: 8, 
        name: "Soufflé de Chocolate", 
        description: "Soufflé caliente de chocolate belga con helado de vainilla", 
        price: 14.99, 
        category: "desserts", 
        image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=300&fit=crop",
        featured: false
    },
    { 
        id: 9, 
        name: "Crème Brûlée", 
        description: "Crema de vainilla con caramelo crujiente", 
        price: 12.50, 
        category: "desserts", 
        image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop",
        featured: false
    },
    { 
        id: 10, 
        name: "Cóctel Signature", 
        description: "Nuestra mezcla exclusiva con frutas frescas y hierbas", 
        price: 16.00, 
        category: "drinks", 
        image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop",
        featured: true
    },
    { 
        id: 11, 
        name: "Vino Tinto Reserva", 
        description: "Copa de vino tinto reserva de nuestra selección premium", 
        price: 12.00, 
        category: "drinks", 
        image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop",
        featured: false
    },
    { 
        id: 12, 
        name: "Agua Mineral con Gas", 
        description: "Agua mineral premium 750ml", 
        price: 5.50, 
        category: "drinks", 
        image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=300&fit=crop",
        featured: false
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
let darkMode = localStorage.getItem('darkMode') === 'true';
let autoUpdateInterval;

// ============================================
// FUNCIONES DE INICIALIZACIÓN
// ============================================
function initialize() {
    console.log('🚀 Iniciando sistema restaurante...');
    
    // Configurar tema
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }
    
    // Obtener mesa de URL
    const params = new URLSearchParams(window.location.search);
    const mesa = params.get('mesa');
    if (mesa) {
        currentTable = mesa.padStart(2, '0');
    }
    
    // Configurar mesa
    updateTableInfo();
    
    // Cargar carrito del localStorage
    loadCart();
    
    // Inicializar sistema de traducción
    initializeI18n();
    
    // Generar categorías y productos
    renderCategories();
    renderProducts();
    
    // Iniciar actualizaciones automáticas
    startAutoUpdates();
    
    console.log('✅ Sistema inicializado');
    showNotification('system.ready', 'success');
}

function initializeI18n() {
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = i18n.getLanguage();
        languageSelect.addEventListener('change', (e) => {
            const newLang = e.target.value;
            if (i18n.setLanguage(newLang)) {
                i18n.translateDocument();
                updateDynamicTranslations();
                
                const langName = newLang === 'es' ? 'Español' : 'English';
                showNotification('system.language', 'info', { language: langName });
                
                renderCategories();
                renderProducts();
                
                if (document.getElementById('cartModal').style.display === 'flex') {
                    renderCartItems();
                }
            }
        });
    }
    
    i18n.subscribe((lang) => {
        console.log(`🌐 Idioma cambiado a: ${lang}`);
    });
    
    i18n.translateDocument();
}

// ============================================
// FUNCIONES DE INTERFAZ
// ============================================
function updateTableInfo() {
    document.getElementById('tableNumber').textContent = `${i18n.t('table.number')} ${currentTable}`;
    document.getElementById('cartTableNumber').textContent = `${i18n.t('table.number')} ${currentTable}`;
    document.getElementById('qrCode').textContent = `DELUXE-${currentTable}`;
}

function renderCategories() {
    const container = document.getElementById('categoriesFilter');
    if (!container) return;
    
    let html = '';
    
    CATEGORIES.forEach(category => {
        const activeClass = currentCategory === category.id ? 'active' : '';
        const translatedName = i18n.t(category.name);
        
        html += `
            <button class="category-btn ${activeClass}" 
                    onclick="filterByCategory('${category.id}')"
                    style="border-color: ${category.color};">
                <i class="${category.icon}"></i>
                ${translatedName}
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
        const badge = product.featured ? `<div class="product-badge">${i18n.t('product.featured')}</div>` : '';
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
                            <button class="quantity-btn" onclick="updateProductQuantity(${product.id}, -1)">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity-display" id="qty-${product.id}">${quantity}</span>
                            <button class="quantity-btn" onclick="updateProductQuantity(${product.id}, 1)">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                            <i class="fas fa-cart-plus"></i> ${i18n.t('button.add')}
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function updateDynamicTranslations() {
    // Actualizar botones dinámicos
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        if (!btn.hasAttribute('data-i18n')) {
            btn.innerHTML = `<i class="fas fa-cart-plus"></i> ${i18n.t('button.add')}`;
        }
    });
    
    // Actualizar títulos dinámicos
    const modalTitle = document.querySelector('.modal-header h2');
    if (modalTitle && !modalTitle.hasAttribute('data-i18n')) {
        modalTitle.innerHTML = `<i class="fas fa-receipt"></i> ${i18n.t('cart.title')}`;
    }
}

// ============================================
// FUNCIONES DEL CARRITO
// ============================================
function addToCart(productId) {
    if (orderInProgress) {
        showNotification('notification.orderInProgress', 'error');
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
    showNotification('notification.added', 'success', { product: product.name });
}

function updateProductQuantity(productId, change) {
    if (orderInProgress) {
        showNotification('notification.orderInProgress', 'error');
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
        showNotification('notification.orderInProgress', 'error');
        return;
    }
    
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    if (confirm(i18n.t('confirm.clear'))) {
        cart = cart.filter(item => item.id !== productId);
        saveCart();
        updateCartUI();
        showNotification('notification.removed', 'info');
    }
}

function clearCart() {
    if (orderInProgress) {
        showNotification('notification.orderInProgress', 'error');
        return;
    }
    
    if (cart.length === 0) {
        showNotification('notification.cartEmpty', 'info');
        return;
    }
    
    if (confirm(i18n.t('notification.clearCart'))) {
        cart = [];
        saveCart();
        updateCartUI();
        showNotification('notification.cartCleared', 'info');
    }
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = totalItems;
    
    cart.forEach(item => {
        const display = document.getElementById(`qty-${item.id}`);
        if (display) {
            display.textContent = item.quantity;
        }
    });
    
    document.getElementById('confirmOrderBtn').disabled = cart.length === 0;
    
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
                <h3 style="margin-bottom: 10px;">${i18n.t('cart.empty.title')}</h3>
                <p>${i18n.t('cart.empty.message')}</p>
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
                    <div class="item-price">$${item.price.toFixed(2)} ${i18n.t('product.quantity')}</div>
                </div>
                <div class="item-controls">
                    <button class="quantity-btn" onclick="updateProductQuantity(${item.id}, -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span style="font-weight: 600; min-width: 30px; text-align: center;">
                        ${item.quantity}
                    </span>
                    <button class="quantity-btn" onclick="updateProductQuantity(${item.id}, 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="item-total">$${itemTotal.toFixed(2)}</div>
                <button class="remove-item" onclick="removeFromCart(${item.id})" title="${i18n.t('button.delete')}">
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
    confirmBtn.innerHTML = orderInProgress 
        ? `<i class="fas fa-check"></i> ${i18n.t('cart.sent')}`
        : `<i class="fas fa-paper-plane"></i> ${i18n.t('cart.confirm')}`;
    
    if (orderInProgress) {
        confirmBtn.disabled = true;
        confirmBtn.style.background = '#4CAF50';
    }
}

// ============================================
// FUNCIONES DEL PEDIDO
// ============================================
async function confirmOrder() {
    if (cart.length === 0) {
        showNotification('error.emptyCart', 'error');
        return;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * CONFIG.TAX_RATE;
    const service = subtotal * CONFIG.SERVICE_FEE;
    const total = subtotal + tax + service;
    
    const orderId = 'ORD-' + Date.now().toString().slice(-8);
    const confirmationCode = Math.floor(100000 + Math.random() * 900000);
    
    const orderSummary = `
${i18n.t('confirm.order')}

${i18n.t('invoice.table')}: ${currentTable}
${i18n.t('invoice.orderId')}: ${orderId}
${i18n.t('invoice.time')}: ${new Date().toLocaleTimeString(i18n.getLanguage() === 'es' ? 'es-MX' : 'en-US')}
${i18n.t('invoice.code')}: ${confirmationCode}

${i18n.t('invoice.details')}:
${cart.map(item => `  ${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}`).join('\n')}

SUBTOTAL: $${subtotal.toFixed(2)}
IVA (16%): $${tax.toFixed(2)}
SERVICIO (10%): $${service.toFixed(2)}
TOTAL: $${total.toFixed(2)}
`;
    
    if (!confirm(orderSummary)) return;
    
    try {
        showNotification('notification.sending', 'info');
        
        const orderData = {
            action: 'crearPedido',
            id: orderId,
            mesa: currentTable,
            productos: cart.map(item => `${item.quantity}x ${item.name}`).join(', '),
            subtotal: subtotal.toFixed(2),
            iva: tax.toFixed(2),
            servicio: service.toFixed(2),
            total: total.toFixed(2),
            codigo: confirmationCode.toString()
        };
        
        const response = await sendToGoogleSheets(orderData);
        
        if (response.success) {
            currentOrder = {
                id: orderId,
                code: confirmationCode,
                table: currentTable,
                cart: [...cart],
                subtotal,
                tax,
                service,
                total,
                timestamp: new Date().toISOString()
            };
            
            orderInProgress = true;
            showOrderTracking(orderId);
            showNotification('notification.sent', 'success', { orderId: orderId });
            
            cart = [];
            updateCartUI();
            
        } else {
            showNotification('notification.error', 'error');
        }
        
    } catch (error) {
        console.error('Error al enviar pedido:', error);
        showNotification('notification.connection', 'error');
    }
}

async function sendToGoogleSheets(data) {
    try {
        const formData = new URLSearchParams();
        for (const key in data) {
            formData.append(key, data[key]);
        }
        
        const response = await fetch(CONFIG.GOOGLE_SHEETS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });
        
        return await response.json();
        
    } catch (error) {
        console.error('Error en sendToGoogleSheets:', error);
        throw error;
    }
}

function showOrderTracking(orderId) {
    const tracking = document.getElementById('orderTracking');
    tracking.style.display = 'block';
    document.getElementById('orderIdDisplay').textContent = orderId;
    document.getElementById('cartSummary').style.display = 'none';
    
    const steps = [
        { id: 'received', label: 'tracking.steps.received', icon: 'fas fa-clipboard-check' },
        { id: 'preparing', label: 'tracking.steps.preparing', icon: 'fas fa-utensils' },
        { id: 'cooking', label: 'tracking.steps.cooking', icon: 'fas fa-fire' },
        { id: 'ready', label: 'tracking.steps.ready', icon: 'fas fa-check-circle' },
        { id: 'delivered', label: 'tracking.steps.delivered', icon: 'fas fa-concierge-bell' }
    ];
    
    let html = '';
    steps.forEach((step, index) => {
        const activeClass = index === 0 ? 'step-active' : '';
        html += `
            <div class="tracking-step ${activeClass}" id="step-${step.id}">
                <div class="step-icon">
                    <i class="${step.icon}"></i>
                </div>
                <div class="step-label">${i18n.t(step.label)}</div>
            </div>
        `;
    });
    
    document.getElementById('trackingSteps').innerHTML = html;
    simulateOrderProgress();
}

function simulateOrderProgress() {
    const steps = ['received', 'preparing', 'cooking', 'ready', 'delivered'];
    let currentStep = 0;
    
    const interval = setInterval(() => {
        if (currentStep < steps.length) {
            document.querySelectorAll('.tracking-step').forEach(step => {
                step.classList.remove('step-active');
            });
            document.getElementById(`step-${steps[currentStep]}`).classList.add('step-active');
            
            currentStep++;
            
            if (currentStep === steps.length) {
                clearInterval(interval);
                setTimeout(showInvoice, 2000);
            }
        }
    }, 3000);
}

function showInvoice() {
    if (!currentOrder) return;
    
    document.getElementById('orderTracking').style.display = 'none';
    const invoice = document.getElementById('invoice');
    invoice.style.display = 'block';
    
    document.getElementById('invoiceTable').textContent = currentOrder.table;
    document.getElementById('invoiceOrderId').textContent = currentOrder.id;
    document.getElementById('invoiceTime').textContent = new Date(currentOrder.timestamp).toLocaleTimeString(i18n.getLanguage() === 'es' ? 'es-MX' : 'en-US');
    document.getElementById('invoiceCode').textContent = currentOrder.code;
    document.getElementById('invoiceTotal').textContent = `$${currentOrder.total.toFixed(2)}`;
    
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
    
    itemsHtml += `
        <div class="invoice-item" style="border-top: 2px solid var(--border); padding-top: 20px;">
            <div>Subtotal</div>
            <div>$${currentOrder.subtotal.toFixed(2)}</div>
        </div>
        <div class="invoice-item">
            <div>IVA (16%)</div>
            <div>$${currentOrder.tax.toFixed(2)}</div>
        </div>
        <div class="invoice-item">
            <div>Servicio (10%)</div>
            <div>$${currentOrder.service.toFixed(2)}</div>
        </div>
    `;
    
    document.getElementById('invoiceItems').innerHTML = itemsHtml;
    saveInvoiceToHistory();
}

function newOrder() {
    orderInProgress = false;
    currentOrder = null;
    
    document.getElementById('invoice').style.display = 'none';
    document.getElementById('cartSummary').style.display = 'block';
    renderCartItems();
    
    showNotification('notification.ready', 'success');
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
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', darkMode);
    
    const message = darkMode ? 'system.theme.dark' : 'system.theme.light';
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

function showNotification(key, type = 'info', params = {}) {
    const message = i18n.t(key, params);
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 30px;
        right: 30px;
        padding: 20px 25px;
        background: ${type === 'error' ? 'var(--danger)' : 
                    type === 'info' ? 'var(--info)' : 
                    type === 'warning' ? 'var(--warning)' : 'var(--success)'};
        color: white;
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        z-index: 3000;
        animation: slideInRight 0.3s ease, fadeOut 0.3s ease 3.7s;
        display: flex;
        align-items: center;
        gap: 15px;
        font-weight: 500;
        min-width: 300px;
        max-width: 400px;
    `;
    
    const icono = type === 'error' ? '❌' : 
                  type === 'info' ? 'ℹ️' : 
                  type === 'warning' ? '⚠️' : '✅';
    
    notification.innerHTML = `
        <span style="font-size: 1.5rem;">${icono}</span>
        <span style="flex: 1;">${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
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

function saveInvoiceToHistory() {
    if (!currentOrder) return;
    
    const history = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    history.push({
        ...currentOrder,
        date: new Date().toISOString()
    });
    
    if (history.length > 50) {
        history.shift();
    }
    
    localStorage.setItem('orderHistory', JSON.stringify(history));
}

function startAutoUpdates() {
    autoUpdateInterval = setInterval(() => {
        console.log('🔄 Verificando actualizaciones...');
    }, CONFIG.AUTO_UPDATE_INTERVAL);
}

// ============================================
// INICIALIZACIÓN
// ============================================
window.onload = initialize;

// Agregar animaciones CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;
document.head.appendChild(style);
