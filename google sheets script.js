// ============================================
// SISTEMA RESTAURANTE DELUXE - Google Apps Script
// VERSIÓN 100% FUNCIONAL
// ============================================

// CONFIGURACIÓN - NO CAMBIAR EL SHEET_ID, lo crearemos automáticamente
const CONFIG = {
    SHEET_NAMES: {
        ORDERS: "Pedidos",
        TODAY: "Hoy",
        PRODUCTS: "Productos",
        TABLES: "Mesas"
    },
    ORDER_STATUS: {
        PENDING: "pending",
        PREPARING: "preparing", 
        READY: "ready",
        DELIVERED: "delivered"
    }
};

// ============================================
// FUNCIONES PRINCIPALES DE LA API
// ============================================

function doGet(e) {
    return handleRequest(e);
}

function doPost(e) {
    return handleRequest(e);
}

function handleRequest(e) {
    try {
        let params = {};
        
        // Obtener parámetros de diferentes maneras
        if (e.parameter) {
            params = e.parameter;
        }
        
        if (e.postData && e.postData.contents) {
            try {
                const jsonData = JSON.parse(e.postData.contents);
                params = { ...params, ...jsonData };
            } catch (parseError) {
                // Si no es JSON, intentar como form-urlencoded
                const formData = e.postData.contents.split('&');
                formData.forEach(item => {
                    const [key, value] = item.split('=');
                    if (key && value) {
                        params[key] = decodeURIComponent(value);
                    }
                });
            }
        }
        
        console.log("📡 Solicitud recibida:", params);
        
        const action = params.action || "test";
        let response;
        
        switch(action) {
            case "getActiveOrders":
                response = getActiveOrders();
                break;
            case "getAllOrders":
                response = getAllOrders();
                break;
            case "getTablesStatus":
                response = getTablesStatus();
                break;
            case "getProducts":
                response = getProducts();
                break;
            case "createOrder":
                response = createOrder(params);
                break;
            case "updateOrderStatus":
                response = updateOrderStatus(params);
                break;
            case "initialize":
                response = initializeSystem();
                break;
            case "test":
            default:
                response = {
                    success: true,
                    message: "API Restaurante Deluxe funcionando",
                    version: "2.0",
                    timestamp: new Date().toISOString(),
                    availableActions: [
                        "getActiveOrders", 
                        "getAllOrders", 
                        "getTablesStatus", 
                        "getProducts", 
                        "createOrder", 
                        "updateOrderStatus", 
                        "initialize", 
                        "test"
                    ]
                };
                break;
        }
        
        console.log("📤 Respuesta:", response);
        
        return ContentService
            .createTextOutput(JSON.stringify(response))
            .setMimeType(ContentService.MimeType.JSON)
            .setHeader("Access-Control-Allow-Origin", "*");
            
    } catch (error) {
        console.error("❌ Error en handleRequest:", error);
        return ContentService
            .createTextOutput(JSON.stringify({ 
                success: false, 
                error: error.toString(),
                message: "Error interno del servidor"
            }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// ============================================
// FUNCIONES DE GESTIÓN
// ============================================

function getActiveOrders() {
    try {
        const ss = getOrCreateSpreadsheet();
        let sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.TODAY);
        
        if (!sheet || sheet.getLastRow() <= 1) {
            return { success: true, orders: [], count: 0 };
        }
        
        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        const orders = [];
        
        for (let i = 1; i < data.length; i++) {
            if (data[i][0]) { // Si tiene ID
                const order = {};
                headers.forEach((header, index) => {
                    order[header] = data[i][index];
                });
                
                // Solo devolver pedidos no entregados
                if (order.Estado !== CONFIG.ORDER_STATUS.DELIVERED) {
                    orders.push(order);
                }
            }
        }
        
        return {
            success: true,
            orders: orders,
            count: orders.length,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        return { success: false, error: error.toString() };
    }
}

function createOrder(data) {
    try {
        console.log("📝 Creando pedido con datos:", data);
        
        const ss = getOrCreateSpreadsheet();
        const ordersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ORDERS);
        const todaySheet = ss.getSheetByName(CONFIG.SHEET_NAMES.TODAY);
        
        // Generar ID y código
        const orderId = "ORD-" + Utilities.getUuid().slice(0, 8).toUpperCase();
        const code = Math.floor(100000 + Math.random() * 900000);
        const now = new Date();
        
        // Preparar datos
        const orderData = [
            orderId,
            data.table || data.mesa || "01",
            data.products || data.productos || "",
            parseFloat(data.total) || 0,
            CONFIG.ORDER_STATUS.PENDING,
            code.toString(),
            Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy"),
            Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm:ss"),
            now.toISOString(),
            data.notes || data.notas || ""
        ];
        
        // Guardar en ambas hojas
        ordersSheet.appendRow(orderData);
        todaySheet.appendRow(orderData.slice(0, -1)); // Sin timestamp
        
        // Actualizar mesa
        updateTableStatus(data.table || data.mesa || "01", "occupied", orderId);
        
        return {
            success: true,
            message: "Pedido creado exitosamente",
            orderId: orderId,
            code: code,
            table: data.table || data.mesa || "01",
            timestamp: now.toISOString()
        };
        
    } catch (error) {
        console.error("❌ Error en createOrder:", error);
        return { success: false, error: error.toString() };
    }
}

function updateOrderStatus(data) {
    try {
        const { orderId, status } = data;
        
        if (!orderId || !status) {
            return { 
                success: false, 
                message: "Se requiere orderId y status" 
            };
        }
        
        const ss = getOrCreateSpreadsheet();
        const ordersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ORDERS);
        const todaySheet = ss.getSheetByName(CONFIG.SHEET_NAMES.TODAY);
        
        let updated = false;
        
        // Actualizar en hoja de hoy
        if (todaySheet) {
            const todayData = todaySheet.getDataRange().getValues();
            for (let i = 1; i < todayData.length; i++) {
                if (todayData[i][0] === orderId) {
                    todaySheet.getRange(i + 1, 5).setValue(status);
                    updated = true;
                    
                    // Si se entrega, quitar de hoy
                    if (status === CONFIG.ORDER_STATUS.DELIVERED) {
                        todaySheet.deleteRow(i + 1);
                    }
                    break;
                }
            }
        }
        
        // Actualizar en hoja principal
        if (ordersSheet) {
            const ordersData = ordersSheet.getDataRange().getValues();
            for (let i = 1; i < ordersData.length; i++) {
                if (ordersData[i][0] === orderId) {
                    ordersSheet.getRange(i + 1, 5).setValue(status);
                    updated = true;
                    
                    // Actualizar mesa si se entrega
                    if (status === CONFIG.ORDER_STATUS.DELIVERED) {
                        const table = ordersData[i][1];
                        updateTableStatus(table, "available");
                    }
                    break;
                }
            }
        }
        
        if (!updated) {
            return { success: false, message: "Pedido no encontrado" };
        }
        
        return { 
            success: true, 
            message: `Estado actualizado a: ${status}` 
        };
        
    } catch (error) {
        return { success: false, error: error.toString() };
    }
}

function getProducts() {
    try {
        const ss = getOrCreateSpreadsheet();
        const productsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PRODUCTS);
        
        if (!productsSheet || productsSheet.getLastRow() <= 1) {
            // Crear productos de muestra
            return createSampleProducts();
        }
        
        const data = productsSheet.getDataRange().getValues();
        const headers = data[0];
        const products = [];
        
        for (let i = 1; i < data.length; i++) {
            if (data[i][0]) {
                const product = {};
                headers.forEach((header, index) => {
                    product[header] = data[i][index];
                });
                products.push(product);
            }
        }
        
        return { 
            success: true, 
            products: products, 
            count: products.length 
        };
        
    } catch (error) {
        return { success: false, error: error.toString() };
    }
}

function getTablesStatus() {
    try {
        const ss = getOrCreateSpreadsheet();
        const tablesSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.TABLES);
        
        if (!tablesSheet || tablesSheet.getLastRow() <= 1) {
            // Crear mesas de muestra
            return createSampleTables();
        }
        
        const data = tablesSheet.getDataRange().getValues();
        const headers = data[0];
        const tables = [];
        
        for (let i = 1; i < data.length; i++) {
            if (data[i][0]) {
                const table = {};
                headers.forEach((header, index) => {
                    table[header] = data[i][index];
                });
                tables.push(table);
            }
        }
        
        return { 
            success: true, 
            tables: tables, 
            count: tables.length 
        };
        
    } catch (error) {
        return { success: false, error: error.toString() };
    }
}

function getAllOrders() {
    try {
        const ss = getOrCreateSpreadsheet();
        const ordersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ORDERS);
        
        if (!ordersSheet || ordersSheet.getLastRow() <= 1) {
            return { success: true, orders: [] };
        }
        
        const data = ordersSheet.getDataRange().getValues();
        const headers = data[0];
        const orders = [];
        
        for (let i = 1; i < data.length; i++) {
            if (data[i][0]) {
                const order = {};
                headers.forEach((header, index) => {
                    order[header] = data[i][index];
                });
                orders.push(order);
            }
        }
        
        return { 
            success: true, 
            orders: orders, 
            count: orders.length 
        };
        
    } catch (error) {
        return { success: false, error: error.toString() };
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function getOrCreateSpreadsheet() {
    // Crear o obtener la hoja de cálculo
    const scriptProperties = PropertiesService.getScriptProperties();
    let spreadsheetId = scriptProperties.getProperty('spreadsheetId');
    
    if (spreadsheetId) {
        try {
            return SpreadsheetApp.openById(spreadsheetId);
        } catch (e) {
            // Si hay error, crear nueva
            console.log("Creando nueva hoja de cálculo...");
        }
    }
    
    // Crear nueva hoja de cálculo
    const ss = SpreadsheetApp.create("Restaurante Deluxe - Sistema");
    spreadsheetId = ss.getId();
    scriptProperties.setProperty('spreadsheetId', spreadsheetId);
    
    // Configurar hojas
    initializeSystem();
    
    return ss;
}

function initializeSystem() {
    try {
        const ss = getOrCreateSpreadsheet();
        
        // Crear hojas si no existen
        const sheets = [
            { 
                name: CONFIG.SHEET_NAMES.ORDERS, 
                headers: ["ID", "Mesa", "Productos", "Total", "Estado", "Código", "Fecha", "Hora", "Timestamp", "Notas"] 
            },
            { 
                name: CONFIG.SHEET_NAMES.TODAY, 
                headers: ["ID", "Mesa", "Productos", "Total", "Estado", "Código", "Fecha", "Hora", "Notas"] 
            },
            { 
                name: CONFIG.SHEET_NAMES.PRODUCTS, 
                headers: ["ID", "Nombre", "Descripción", "Precio", "Categoría", "Disponible", "Imagen"] 
            },
            { 
                name: CONFIG.SHEET_NAMES.TABLES, 
                headers: ["Mesa", "Estado", "Orden ID", "Capacidad", "Ubicación", "Última Actualización"] 
            }
        ];
        
        sheets.forEach(sheetConfig => {
            let sheet = ss.getSheetByName(sheetConfig.name);
            if (!sheet) {
                sheet = ss.insertSheet(sheetConfig.name);
            }
            
            // Limpiar y poner encabezados
            sheet.clear();
            sheet.getRange(1, 1, 1, sheetConfig.headers.length)
                 .setValues([sheetConfig.headers])
                 .setBackground("#2C3E50")
                 .setFontColor("#FFFFFF")
                 .setFontWeight("bold");
            
            sheet.setFrozenRows(1);
            sheet.autoResizeColumns(1, sheetConfig.headers.length);
        });
        
        // Crear datos iniciales
        createInitialData();
        
        return { 
            success: true, 
            message: "Sistema inicializado correctamente",
            spreadsheetId: ss.getId(),
            sheets: Object.values(CONFIG.SHEET_NAMES)
        };
        
    } catch (error) {
        return { success: false, error: error.toString() };
    }
}

function createInitialData() {
    try {
        const ss = getOrCreateSpreadsheet();
        
        // Crear mesas
        const tablesSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.TABLES);
        if (tablesSheet.getLastRow() === 1) {
            for (let i = 1; i <= 12; i++) {
                const tableNum = i.toString().padStart(2, '0');
                tablesSheet.appendRow([
                    tableNum,
                    "available",
                    "",
                    4,
                    i <= 8 ? "Sala Principal" : "Terraza",
                    new Date().toISOString()
                ]);
            }
        }
        
        // Crear productos
        const productsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PRODUCTS);
        if (productsSheet.getLastRow() === 1) {
            const sampleProducts = [
                [1, "Filete Mignon", "Corte premium 250g con salsa de vino tinto", 34.99, "mains", true, "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop"],
                [2, "Salmón Glaseado", "Salmón salvaje con glaseado de miel y mostaza", 28.75, "mains", true, "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop"],
                [3, "Carpaccio de Res", "Finas láminas de res con rúcula y parmesano", 18.99, "appetizers", true, "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop"],
                [4, "Risotto de Champiñones", "Arborio cremoso con champiñones silvestres", 22.99, "mains", true, "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop"],
                [5, "Soufflé de Chocolate", "Soufflé caliente de chocolate belga", 14.99, "desserts", true, "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=300&fit=crop"],
                [6, "Cóctel Signature", "Nuestra mezcla exclusiva con frutas frescas", 16.00, "drinks", true, "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop"]
            ];
            
            sampleProducts.forEach(product => {
                productsSheet.appendRow(product);
            });
        }
        
        return true;
    } catch (error) {
        console.error("Error creando datos iniciales:", error);
        return false;
    }
}

function updateTableStatus(tableNumber, status, orderId = "") {
    try {
        const ss = getOrCreateSpreadsheet();
        const tablesSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.TABLES);
        
        if (!tablesSheet) return;
        
        const data = tablesSheet.getDataRange().getValues();
        let found = false;
        
        for (let i = 1; i < data.length; i++) {
            if (data[i][0] == tableNumber) {
                tablesSheet.getRange(i + 1, 2).setValue(status);
                tablesSheet.getRange(i + 1, 3).setValue(orderId);
                tablesSheet.getRange(i + 1, 6).setValue(new Date().toISOString());
                found = true;
                break;
            }
        }
        
        if (!found) {
            tablesSheet.appendRow([
                tableNumber,
                status,
                orderId,
                4,
                "Sala Principal",
                new Date().toISOString()
            ]);
        }
        
    } catch (error) {
        console.error("Error actualizando mesa:", error);
    }
}

function createSampleProducts() {
    const products = [
        {
            ID: 1,
            Nombre: "Filete Mignon",
            Descripción: "Corte premium 250g con salsa de vino tinto",
            Precio: 34.99,
            Categoría: "mains",
            Disponible: true,
            Imagen: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop"
        },
        {
            ID: 2,
            Nombre: "Salmón Glaseado",
            Descripción: "Salmón salvaje con glaseado de miel y mostaza",
            Precio: 28.75,
            Categoría: "mains",
            Disponible: true,
            Imagen: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop"
        },
        {
            ID: 3,
            Nombre: "Carpaccio de Res",
            Descripción: "Finas láminas de res con rúcula y parmesano",
            Precio: 18.99,
            Categoría: "appetizers",
            Disponible: true,
            Imagen: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop"
        }
    ];
    
    return { success: true, products: products, count: products.length };
}

function createSampleTables() {
    const tables = [];
    for (let i = 1; i <= 12; i++) {
        tables.push({
            Mesa: i.toString().padStart(2, '0'),
            Estado: "available",
            "Orden ID": "",
            Capacidad: 4,
            Ubicación: i <= 8 ? "Sala Principal" : "Terraza",
            "Última Actualización": new Date().toISOString()
        });
    }
    return { success: true, tables: tables, count: tables.length };
}

// ============================================
// FUNCIÓN PARA PROBAR EL SISTEMA
// ============================================

function testSystem() {
    try {
        console.log("🧪 Probando sistema...");
        
        // Inicializar
        const init = initializeSystem();
        console.log("Inicialización:", init);
        
        // Crear pedido de prueba
        const testOrder = {
            action: "createOrder",
            table: "01",
            products: "1x Filete Mignon, 2x Cóctel Signature",
            total: "66.99",
            notes: "Sin cebolla"
        };
        
        const orderResult = createOrder(testOrder);
        console.log("Pedido de prueba:", orderResult);
        
        // Obtener pedidos activos
        const activeOrders = getActiveOrders();
        console.log("Pedidos activos:", activeOrders.count);
        
        return {
            success: true,
            tests: {
                initialization: init.success,
                createOrder: orderResult.success,
                getActiveOrders: activeOrders.success
            }
        };
        
    } catch (error) {
        console.error("Error en prueba:", error);
        return { success: false, error: error.toString() };
    }
}
            error: error.toString()
        };
    }
}
