// ============================================
// SISTEMA RESTAURANTE DELUXE - Google Apps Script
// VERSIÓN MEJORADA Y OPTIMIZADA
// ============================================

// CONFIGURACIÓN
const CONFIG = {
    SHEET_ID: "1Hmfm0Hsq71PiXuQTyaHwxYe1zvXvc0rqt9yiUNbZm9s",
    SHEET_NAMES: {
        ORDERS: "Pedidos",
        TODAY: "Hoy",
        INVENTORY: "Inventario",
        PRODUCTS: "Productos",
        TABLES: "Mesas",
        REPORTS: "Reportes"
    },
    ORDER_STATUS: {
        PENDING: "pending",
        PREPARING: "preparing", 
        READY: "ready",
        DELIVERED: "delivered"
    }
};

// ============================================
// 1. INICIALIZACIÓN DEL SISTEMA
// ============================================
function initializeSystem() {
    try {
        console.log("🏗️ Inicializando sistema de restaurante...");
        
        const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
        
        // Crear hojas si no existen
        const sheets = [
            { name: CONFIG.SHEET_NAMES.ORDERS, headers: ["ID", "Mesa", "Productos", "Total", "Estado", "Código", "Fecha", "Hora", "Timestamp"] },
            { name: CONFIG.SHEET_NAMES.TODAY, headers: ["ID", "Mesa", "Productos", "Total", "Estado", "Código", "Hora", "Notas"] },
            { name: CONFIG.SHEET_NAMES.INVENTORY, headers: ["ID", "Producto", "Categoría", "Stock", "Mínimo", "Unidad", "Proveedor", "Última Actualización"] },
            { name: CONFIG.SHEET_NAMES.PRODUCTS, headers: ["ID", "Nombre", "Descripción", "Precio", "Categoría", "Disponible", "Imagen"] },
            { name: CONFIG.SHEET_NAMES.TABLES, headers: ["Mesa", "Estado", "Orden ID", "Capacidad", "Ubicación", "Última Actualización"] },
            { name: CONFIG.SHEET_NAMES.REPORTS, headers: ["Fecha", "Total Pedidos", "Total Ventas", "Promedio Ticket", "Mesas Ocupadas", "Producto Más Vendido"] }
        ];
        
        sheets.forEach(sheetConfig => {
            let sheet = ss.getSheetByName(sheetConfig.name);
            if (!sheet) {
                console.log(`📄 Creando hoja: ${sheetConfig.name}`);
                sheet = ss.insertSheet(sheetConfig.name);
                sheet.getRange(1, 1, 1, sheetConfig.headers.length).setValues([sheetConfig.headers]);
                formatSheet(sheet, sheetConfig.name);
            }
        });
        
        // Crear datos de ejemplo iniciales
        initializeSampleData();
        
        console.log("✅ Sistema inicializado correctamente");
        return {
            success: true,
            message: "Sistema inicializado",
            sheets: Object.values(CONFIG.SHEET_NAMES)
        };
        
    } catch (error) {
        console.error("❌ Error al inicializar sistema:", error);
        return {
            success: false,
            error: error.toString()
        };
    }
}

function formatSheet(sheet, sheetName) {
    // Congelar primera fila
    sheet.setFrozenRows(1);
    
    // Formatear encabezados
    const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#2C3E50");
    headerRange.setFontColor("white");
    
    // Ajustar ancho de columnas
    sheet.autoResizeColumns(1, sheet.getLastColumn());
    
    // Formateo específico por hoja
    switch(sheetName) {
        case CONFIG.SHEET_NAMES.ORDERS:
        case CONFIG.SHEET_NAMES.TODAY:
            sheet.getRange("D:D").setNumberFormat("$#,##0.00");
            sheet.getRange("G:G").setNumberFormat("hh:mm:ss");
            break;
        case CONFIG.SHEET_NAMES.INVENTORY:
            sheet.getRange("D:E").setNumberFormat("0");
            break;
        case CONFIG.SHEET_NAMES.PRODUCTS:
            sheet.getRange("D:D").setNumberFormat("$#,##0.00");
            break;
    }
}

// ============================================
// 2. GESTIÓN DE PEDIDOS
// ============================================
function createOrder(data) {
    try {
        console.log("➕ Creando nuevo pedido:", data);
        
        const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
        const ordersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ORDERS);
        const todaySheet = ss.getSheetByName(CONFIG.SHEET_NAMES.TODAY);
        
        // Generar ID único si no viene
        const orderId = data.id || "ORD-" + Utilities.getUuid().slice(0, 8).toUpperCase();
        const confirmationCode = data.codigo || Math.floor(100000 + Math.random() * 900000).toString();
        const now = new Date();
        
        // Preparar fila para hoja principal
        const orderRow = [
            orderId,
            data.mesa || "01",
            data.productos || "",
            parseFloat(data.total) || 0,
            CONFIG.ORDER_STATUS.PENDING,
            confirmationCode,
            Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy"),
            Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm:ss"),
            now.toISOString()
        ];
        
        // Preparar fila para hoja de hoy
        const todayRow = [
            orderId,
            data.mesa || "01",
            data.productos || "",
            parseFloat(data.total) || 0,
            CONFIG.ORDER_STATUS.PENDING,
            confirmationCode,
            Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm:ss"),
            data.notas || ""
        ];
        
        // Agregar a ambas hojas
        ordersSheet.appendRow(orderRow);
        todaySheet.appendRow(todayRow);
        
        // Actualizar estado de mesa
        updateTableStatus(data.mesa || "01", "occupied", orderId);
        
        // Actualizar inventario (simulado)
        updateInventoryFromOrder(data.productos || "");
        
        // Enviar notificación
        sendNewOrderNotification(orderId, data.mesa);
        
        SpreadsheetApp.flush();
        
        console.log(`✅ Pedido ${orderId} creado exitosamente`);
        
        return {
            success: true,
            message: "Pedido creado exitosamente",
            orderId: orderId,
            code: confirmationCode,
            mesa: data.mesa,
            total: data.total
        };
        
    } catch (error) {
        console.error("❌ Error al crear pedido:", error);
        return {
            success: false,
            error: error.toString()
        };
    }
}

function updateOrderStatus(data) {
    try {
        console.log("🔄 Actualizando estado del pedido:", data);
        
        const orderId = data.id;
        const newStatus = data.status;
        
        if (!orderId || !newStatus) {
            return {
                success: false,
                message: "Se requiere ID y estado"
            };
        }
        
        const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
        const ordersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ORDERS);
        const todaySheet = ss.getSheetByName(CONFIG.SHEET_NAMES.TODAY);
        
        // Buscar y actualizar en hoja principal
        const ordersData = ordersSheet.getDataRange().getValues();
        let updated = false;
        
        for (let i = 1; i < ordersData.length; i++) {
            if (ordersData[i][0] === orderId) {
                ordersSheet.getRange(i + 1, 5).setValue(newStatus);
                
                // Si el pedido fue entregado, actualizar mesa
                if (newStatus === CONFIG.ORDER_STATUS.DELIVERED) {
                    const mesa = ordersData[i][1];
                    updateTableStatus(mesa, "available");
                }
                
                updated = true;
                break;
            }
        }
        
        // Buscar y actualizar en hoja de hoy
        const todayData = todaySheet.getDataRange().getValues();
        for (let i = 1; i < todayData.length; i++) {
            if (todayData[i][0] === orderId) {
                todaySheet.getRange(i + 1, 5).setValue(newStatus);
                break;
            }
        }
        
        if (!updated) {
            return {
                success: false,
                message: "Pedido no encontrado"
            };
        }
        
        SpreadsheetApp.flush();
        
        // Enviar notificación de cambio de estado
        sendStatusChangeNotification(orderId, newStatus);
        
        return {
            success: true,
            message: `Estado actualizado a: ${newStatus}`
        };
        
    } catch (error) {
        console.error("❌ Error al actualizar estado:", error);
        return {
            success: false,
            error: error.toString()
        };
    }
}

function getActiveOrders() {
    try {
        console.log("📥 Obteniendo pedidos activos...");
        
        const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
        const todaySheet = ss.getSheetByName(CONFIG.SHEET_NAMES.TODAY);
        
        if (!todaySheet || todaySheet.getLastRow() <= 1) {
            return {
                success: true,
                orders: [],
                message: "No hay pedidos activos"
            };
        }
        
        const data = todaySheet.getDataRange().getValues();
        const orders = [];
        
        for (let i = 1; i < data.length; i++) {
            // Filtrar solo pedidos no entregados
            if (data[i][4] !== CONFIG.ORDER_STATUS.DELIVERED) {
                orders.push({
                    id: data[i][0] || "",
                    mesa: data[i][1] || "",
                    productos: data[i][2] || "",
                    total: data[i][3] || 0,
                    estado: data[i][4] || CONFIG.ORDER_STATUS.PENDING,
                    codigo: data[i][5] || "",
                    hora: data[i][6] || "",
                    notas: data[i][7] || ""
                });
            }
        }
        
        console.log(`✅ ${orders.length} pedidos activos encontrados`);
        
        return {
            success: true,
            orders: orders,
            total: orders.length,
            lastUpdate: new Date().toISOString()
        };
        
    } catch (error) {
        console.error("❌ Error al obtener pedidos activos:", error);
        return {
            success: false,
            orders: [],
            error: error.toString()
        };
    }
}

function getAllOrders(dateFilter) {
    try {
        console.log("📚 Obteniendo todos los pedidos...");
        
        const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
        const ordersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ORDERS);
        
        if (!ordersSheet || ordersSheet.getLastRow() <= 1) {
            return {
                success: true,
                orders: [],
                message: "No hay pedidos registrados"
            };
        }
        
        const data = ordersSheet.getDataRange().getValues();
        const orders = [];
        const today = new Date();
        
        for (let i = 1; i < data.length; i++) {
            const orderDate = data[i][6]; // Columna de fecha
            
            // Filtrar por fecha si se especifica
            if (dateFilter) {
                const filterDate = new Date(dateFilter);
                const orderDateObj = new Date(orderDate);
                if (orderDateObj.toDateString() !== filterDate.toDateString()) {
                    continue;
                }
            }
            
            orders.push({
                id: data[i][0] || "",
                mesa: data[i][1] || "",
                productos: data[i][2] || "",
                total: data[i][3] || 0,
                estado: data[i][4] || "",
                codigo: data[i][5] || "",
                fecha: data[i][6] || "",
                hora: data[i][7] || "",
                timestamp: data[i][8] || ""
            });
        }
        
        return {
            success: true,
            orders: orders,
            total: orders.length,
            filteredBy: dateFilter || "all"
        };
        
    } catch (error) {
        console.error("❌ Error al obtener todos los pedidos:", error);
        return {
            success: false,
            orders: [],
            error: error.toString()
        };
    }
}

// ============================================
// 3. GESTIÓN DE MESAS
// ============================================
function updateTableStatus(tableNumber, status, orderId = null) {
    try {
        const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
        const tablesSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.TABLES);
        
        if (!tablesSheet) return;
        
        const data = tablesSheet.getDataRange().getValues();
        let tableFound = false;
        
        for (let i = 1; i < data.length; i++) {
            if (data[i][0] === tableNumber) {
                tablesSheet.getRange(i + 1, 2).setValue(status);
                tablesSheet.getRange(i + 1, 3).setValue(orderId || "");
                tablesSheet.getRange(i + 1, 6).setValue(new Date().toISOString());
                tableFound = true;
                break;
            }
        }
        
        // Si la mesa no existe, crear nueva fila
        if (!tableFound) {
            tablesSheet.appendRow([
                tableNumber,
                status,
                orderId || "",
                4, // Capacidad por defecto
                "Sala Principal", // Ubicación
                new Date().toISOString()
            ]);
        }
        
        SpreadsheetApp.flush();
        
    } catch (error) {
        console.error("❌ Error actualizando estado de mesa:", error);
    }
}

function getTablesStatus() {
    try {
        const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
        const tablesSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.TABLES);
        
        if (!tablesSheet || tablesSheet.getLastRow() <= 1) {
            return { tables: [] };
        }
        
        const data = tablesSheet.getDataRange().getValues();
        const tables = [];
        
        for (let i = 1; i < data.length; i++) {
            tables.push({
                mesa: data[i][0] || "",
                estado: data[i][1] || "available",
                ordenId: data[i][2] || "",
                capacidad: data[i][3] || 4,
                ubicacion: data[i][4] || "",
                ultimaActualizacion: data[i][5] || ""
            });
        }
        
        return {
            success: true,
            tables: tables,
            total: tables.length,
            ocupadas: tables.filter(t => t.estado === "occupied").length,
            disponibles: tables.filter(t => t.estado === "available").length
        };
        
    } catch (error) {
        console.error("❌ Error obteniendo estado de mesas:", error);
        return {
            success: false,
            error: error.toString()
        };
    }
}

// ============================================
// 4. INVENTARIO
// ============================================
function updateInventoryFromOrder(productsString) {
    try {
        // Esta función simula la actualización de inventario
        // En producción, se analizaría el string de productos y se reduciría el stock
        console.log("📦 Actualizando inventario para pedido:", productsString);
        
        // Aquí iría la lógica real de actualización de inventario
        
    } catch (error) {
        console.error("❌ Error actualizando inventario:", error);
    }
}

function getInventory() {
    try {
        const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
        const inventorySheet = ss.getSheetByName(CONFIG.SHEET_NAMES.INVENTORY);
        
        if (!inventorySheet || inventorySheet.getLastRow() <= 1) {
            return { inventory: [] };
        }
        
        const data = inventorySheet.getDataRange().getValues();
        const inventory = [];
        
        for (let i = 1; i < data.length; i++) {
            inventory.push({
                id: data[i][0] || "",
                producto: data[i][1] || "",
                categoria: data[i][2] || "",
                stock: data[i][3] || 0,
                minimo: data[i][4] || 0,
                unidad: data[i][5] || "",
                proveedor: data[i][6] || "",
                ultimaActualizacion: data[i][7] || ""
            });
        }
        
        // Identificar productos con inventario bajo
        const lowInventory = inventory.filter(item => item.stock <= item.minimo);
        
        return {
            success: true,
            inventory: inventory,
            lowInventory: lowInventory,
            total: inventory.length,
            lowCount: lowInventory.length
        };
        
    } catch (error) {
        console.error("❌ Error obteniendo inventario:", error);
        return {
            success: false,
            error: error.toString()
        };
    }
}

// ============================================
// 5. PRODUCTOS
// ============================================
function getProducts() {
    try {
        const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
        const productsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PRODUCTS);
        
        if (!productsSheet || productsSheet.getLastRow() <= 1) {
            return initializeSampleProducts();
        }
        
        const data = productsSheet.getDataRange().getValues();
        const products = [];
        
        for (let i = 1; i < data.length; i++) {
            products.push({
                id: data[i][0] || "",
                nombre: data[i][1] || "",
                descripcion: data[i][2] || "",
                precio: data[i][3] || 0,
                categoria: data[i][4] || "",
                disponible: data[i][5] || true,
                imagen: data[i][6] || ""
            });
        }
        
        return {
            success: true,
            products: products,
            total: products.length
        };
        
    } catch (error) {
        console.error("❌ Error obteniendo productos:", error);
        return {
            success: false,
            error: error.toString()
        };
    }
}

// ============================================
// 6. REPORTES Y ESTADÍSTICAS
// ============================================
function getDailyReport(date = null) {
    try {
        const targetDate = date ? new Date(date) : new Date();
        const dateString = Utilities.formatDate(targetDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
        
        const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
        const ordersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.ORDERS);
        
        if (!ordersSheet || ordersSheet.getLastRow() <= 1) {
            return {
                success: true,
                date: dateString,
                orders: 0,
                sales: 0,
                average: 0
            };
        }
        
        const data = ordersSheet.getDataRange().getValues();
        let dailyOrders = 0;
        let dailySales = 0;
        
        for (let i = 1; i < data.length; i++) {
            const orderDate = data[i][6]; // Columna de fecha
            if (orderDate.includes(dateString.split('-')[2])) { // Comparar día
                dailyOrders++;
                dailySales += parseFloat(data[i][3]) || 0;
            }
        }
        
        const averageTicket = dailyOrders > 0 ? dailySales / dailyOrders : 0;
        
        return {
            success: true,
            date: dateString,
            orders: dailyOrders,
            sales: dailySales,
            average: averageTicket
        };
        
    } catch (error) {
        console.error("❌ Error generando reporte diario:", error);
        return {
            success: false,
            error: error.toString()
        };
    }
}

// ============================================
// 7. NOTIFICACIONES
// ============================================
function sendNewOrderNotification(orderId, table) {
    try {
        // En producción, aquí se integraría con un servicio de notificaciones
        // como Email, Slack, WhatsApp, etc.
        console.log(`📢 NUEVO PEDIDO: ${orderId} para Mesa ${table}`);
        
        // Ejemplo: Enviar email al administrador
        /*
        MailApp.sendEmail({
            to: "admin@restaurante.com",
            subject: `Nuevo Pedido #${orderId}`,
            body: `Se ha recibido un nuevo pedido:\n\nID: ${orderId}\nMesa: ${table}\nHora: ${new Date().toLocaleString()}`
        });
        */
        
    } catch (error) {
        console.error("❌ Error enviando notificación:", error);
    }
}

function sendStatusChangeNotification(orderId, newStatus) {
    try {
        console.log(`📢 CAMBIO DE ESTADO: Pedido ${orderId} -> ${newStatus}`);
        
        // Aquí se enviarían notificaciones al personal correspondiente
        
    } catch (error) {
        console.error("❌ Error enviando notificación de cambio:", error);
    }
}

// ============================================
// 8. DATOS DE EJEMPLO
// ============================================
function initializeSampleData() {
    try {
        console.log("🎨 Creando datos de ejemplo...");
        
        const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
        
        // Productos de ejemplo
        const sampleProducts = [
            [1, "Filete Mignon", "Corte premium 250g con salsa de vino tinto", 34.99, "Plato Principal", true, "https://images.unsplash.com/photo-1546833999-b9f581a1996d"],
            [2, "Salmón Glaseado", "Salmón salvaje con glaseado de miel y mostaza", 28.75, "Plato Principal", true, "https://images.unsplash.com/photo-1467003909585-2f8a72700288"],
            [3, "Risotto de Champiñones", "Arborio cremoso con champiñones silvestres", 22.99, "Plato Principal", true, "https://images.unsplash.com/photo-1476124369491-e7addf5db371"],
            [4, "Carpaccio de Res", "Finas láminas de res con rúcula y parmesano", 18.99, "Entrada", true, "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351"],
            [5, "Soufflé de Chocolate", "Soufflé caliente de chocolate belga", 14.99, "Postre", true, "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e"],
            [6, "Cóctel Signature", "Nuestra mezcla exclusiva con frutas frescas", 16.00, "Bebida", true, "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b"]
        ];
        
        const productsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PRODUCTS);
        if (productsSheet.getLastRow() <= 1) {
            sampleProducts.forEach(product => {
                productsSheet.appendRow(product);
            });
        }
        
        // Mesas de ejemplo
        const sampleTables = [
            ["01", "available", "", 4, "Sala Principal"],
            ["02", "available", "", 4, "Sala Principal"],
            ["03", "available", "", 6, "Terraza"],
            ["04", "available", "", 2, "Barra"],
            ["05", "available", "", 8, "Sala Privada"]
        ];
        
        const tablesSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.TABLES);
        if (tablesSheet.getLastRow() <= 1) {
            sampleTables.forEach(table => {
                tablesSheet.appendRow([...table, new Date().toISOString()]);
            });
        }
        
        // Inventario de ejemplo
        const sampleInventory = [
            [1, "Carne de Res", "Carnes", 25, 10, "kg", "Carnicería Premium"],
            [2, "Salmón", "Pescados", 15, 5, "kg", "Pescadería Fresca"],
            [3, "Queso Parmesano", "Lácteos", 8, 3, "kg", "Quesería Artesanal"],
            [4, "Champiñones", "Vegetales", 12, 4, "kg", "Granja Orgánica"],
            [5, "Vino Tinto", "Bebidas", 36, 12, "botellas", "Bodega Selecta"]
        ];
        
        const inventorySheet = ss.getSheetByName(CONFIG.SHEET_NAMES.INVENTORY);
        if (inventorySheet.getLastRow() <= 1) {
            sampleInventory.forEach(item => {
                inventorySheet.appendRow([...item, new Date().toISOString()]);
            });
        }
        
        SpreadsheetApp.flush();
        console.log("✅ Datos de ejemplo creados exitosamente");
        
    } catch (error) {
        console.error("❌ Error creando datos de ejemplo:", error);
    }
}

// ============================================
// 9. API - doGet
// ============================================
function doGet(e) {
    try {
        console.log("📡 GET recibido:", e?.parameter);
        
        const action = e?.parameter?.action || "getActiveOrders";
        let response;
        
        switch(action) {
            case "getActiveOrders":
                response = getActiveOrders();
                break;
                
            case "getAllOrders":
                const dateFilter = e?.parameter?.date;
                response = getAllOrders(dateFilter);
                break;
                
            case "getTablesStatus":
                response = getTablesStatus();
                break;
                
            case "getInventory":
                response = getInventory();
                break;
                
            case "getProducts":
                response = getProducts();
                break;
                
            case "getDailyReport":
                const date = e?.parameter?.date;
                response = getDailyReport(date);
                break;
                
            case "initialize":
                response = initializeSystem();
                break;
                
            case "test":
                response = {
                    success: true,
                    message: "API funcionando correctamente",
                    timestamp: new Date().toISOString(),
                    version: "2.0.0"
                };
                break;
                
            default:
                response = {
                    success: false,
                    message: "Acción no válida",
                    actions: ["getActiveOrders", "getAllOrders", "getTablesStatus", "getInventory", "getProducts", "getDailyReport", "initialize", "test"]
                };
        }
        
        return createJsonResponse(response);
        
    } catch (error) {
        console.error("❌ Error en doGet:", error);
        return createJsonResponse({
            success: false,
            error: error.toString()
        });
    }
}

// ============================================
// 10. API - doPost
// ============================================
function doPost(e) {
    try {
        console.log("📡 POST recibido");
        
        let data = {};
        
        if (e.postData && e.postData.contents) {
            const contentType = e.postData.type || "";
            
            if (contentType.includes("application/json")) {
                try {
                    data = JSON.parse(e.postData.contents);
                } catch (parseError) {
                    console.error("Error parseando JSON:", parseError);
                }
            } else if (contentType.includes("application/x-www-form-urlencoded")) {
                const params = e.postData.contents.split("&");
                params.forEach(param => {
                    const [key, value] = param.split("=");
                    if (key && value) {
                        data[key] = decodeURIComponent(value);
                    }
                });
            }
        }
        
        if (Object.keys(data).length === 0 && e.parameter) {
            data = e.parameter;
        }
        
        console.log("📄 Datos procesados:", data);
        
        const action = data.action || "";
        let response;
        
        switch(action) {
            case "createOrder":
                response = createOrder(data);
                break;
                
            case "updateOrderStatus":
                response = updateOrderStatus(data);
                break;
                
            case "updateTableStatus":
                response = updateTableStatus(data.table, data.status, data.orderId);
                break;
                
            case "initializeSystem":
                response = initializeSystem();
                break;
                
            case "addProduct":
                response = addProduct(data);
                break;
                
            case "updateInventory":
                response = updateInventory(data);
                break;
                
            default:
                response = {
                    success: false,
                    message: "Acción no válida en POST"
                };
        }
        
        return createJsonResponse(response);
        
    } catch (error) {
        console.error("❌ Error en doPost:", error);
        return createJsonResponse({
            success: false,
            error: error.toString()
        });
    }
}

// ============================================
// 11. FUNCIONES AUXILIARES
// ============================================
function createJsonResponse(data) {
    return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader("Access-Control-Allow-Origin", "*")
        .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function addProduct(data) {
    try {
        const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
        const productsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PRODUCTS);
        
        const newProduct = [
            data.id || Utilities.getUuid().slice(0, 8),
            data.nombre || "",
            data.descripcion || "",
            parseFloat(data.precio) || 0,
            data.categoria || "",
            data.disponible || true,
            data.imagen || ""
        ];
        
        productsSheet.appendRow(newProduct);
        SpreadsheetApp.flush();
        
        return {
            success: true,
            message: "Producto agregado exitosamente"
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.toString()
        };
    }
}

function updateInventory(data) {
    try {
        const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
        const inventorySheet = ss.getSheetByName(CONFIG.SHEET_NAMES.INVENTORY);
        
        const dataRange = inventorySheet.getDataRange().getValues();
        let updated = false;
        
        for (let i = 1; i < dataRange.length; i++) {
            if (dataRange[i][0] === data.id) {
                inventorySheet.getRange(i + 1, 4).setValue(data.stock);
                inventorySheet.getRange(i + 1, 8).setValue(new Date().toISOString());
                updated = true;
                break;
            }
        }
        
        if (!updated) {
            return {
                success: false,
                message: "Producto no encontrado en inventario"
            };
        }
        
        SpreadsheetApp.flush();
        
        return {
            success: true,
            message: "Inventario actualizado"
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.toString()
        };
    }
}

// ============================================
// 12. FUNCIÓN DE PRUEBA
// ============================================
function testSystem() {
    try {
        console.log("🧪 Ejecutando pruebas del sistema...");
        
        // Prueba 1: Inicialización
        const initResult = initializeSystem();
        console.log("Prueba 1 - Inicialización:", initResult.success ? "✅" : "❌");
        
        // Prueba 2: Crear pedido de prueba
        const testOrder = {
            mesa: "01",
            productos: "2x Filete Mignon, 1x Cóctel Signature",
            total: "85.98",
            notas: "Sin cebolla"
        };
        
        const createResult = createOrder(testOrder);
        console.log("Prueba 2 - Crear pedido:", createResult.success ? "✅" : "❌");
        
        // Prueba 3: Obtener pedidos activos
        const activeResult = getActiveOrders();
        console.log("Prueba 3 - Pedidos activos:", activeResult.success ? "✅" : "❌");
        
        // Prueba 4: Actualizar estado
        if (createResult.success) {
            const updateResult = updateOrderStatus({
                id: createResult.orderId,
                status: "preparing"
            });
            console.log("Prueba 4 - Actualizar estado:", updateResult.success ? "✅" : "❌");
        }
        
        // Prueba 5: Obtener productos
        const productsResult = getProducts();
        console.log("Prueba 5 - Obtener productos:", productsResult.success ? "✅" : "❌");
        
        return {
            success: true,
            tests: {
                initialization: initResult.success,
                createOrder: createResult.success,
                getActiveOrders: activeResult.success,
                updateStatus: createResult.success,
                getProducts: productsResult.success
            },
            message: "Pruebas completadas"
        };
        
    } catch (error) {
        console.error("❌ Error en pruebas:", error);
        return {
            success: false,
            error: error.toString()
        };
    }
}