// Inicialización segura de Socket.io
let socket;
try {
    socket = io();
} catch (e) {
    console.warn("Socket.io no disponible (modo offline o error de carga)");
}

// Variables Globales
let currentOrder = { cliente: '', tipo: '', items: [], total: 0 };
let menuData = [];
let tempItem = {};
let myOrderId = null;
let currentStep = 1;
let editingCartIndex = -1; // Índice del producto que se está editando (-1 = nuevo)

// --- FUNCIONES GLOBALES (WINDOW) ---

window.cancelarPedido = function() {
    if (!confirm('¿Estás seguro de cancelar el pedido? Se perderán los productos seleccionados.')) return;

    // 1. Cerrar cualquier modal abierto
    document.querySelectorAll('.modal.show').forEach(el => {
        const modal = bootstrap.Modal.getInstance(el);
        if (modal) modal.hide();
    });

    // 2. Limpiar carrito
    currentOrder.items = [];
    updateCart(); // Actualiza UI (badge y total)

    // 3. Redirigir al inicio (Paso 2 si hay nombre, sino Paso 1)
    window.goToStep(localStorage.getItem('customerName') ? 2 : 1);
};

window.goToStep = function(step) {
    console.log("Navegando al paso:", step);
    currentStep = step;
    
    if (step === 2) {
        const nameInput = document.getElementById('client-name');
        const name = nameInput ? nameInput.value.trim() : '';
        
        if (!name) {
            alert("Por favor escribe tu nombre");
            return;
        }
        currentOrder.cliente = name;
        localStorage.setItem('customerName', name);
        document.getElementById('display-name').innerText = name.toUpperCase();
    }
    
    // Ocultar todos los pasos
    document.querySelectorAll('.step-container, #step-3').forEach(el => el.classList.add('hidden'));
    
    // Mostrar el paso deseado
    if(step === 3) {
        document.getElementById('step-3').classList.remove('hidden');
        document.getElementById('cart-float').style.display = 'flex';
    } else if (step === 4) {
        document.getElementById('step-status').classList.remove('hidden');
        document.getElementById('cart-float').style.display = 'none';
    } else {
        const stepEl = document.getElementById(`step-${step}`);
        if(stepEl) stepEl.classList.remove('hidden');
        document.getElementById('cart-float').style.display = 'none';
    }
    
    window.scrollTo(0,0);
};

window.setService = function(type) {
    console.log("Servicio seleccionado:", type);
    currentOrder.tipo = type;
    localStorage.setItem('serviceType', type); // Guardar para persistencia
    const infoEl = document.getElementById('order-info');
    if(infoEl) infoEl.innerText = `${currentOrder.cliente} • ${type}`;
    window.goToStep(3);
};

window.openModal = function(p) {
    editingCartIndex = -1; // Resetear modo edición
    const btn = document.querySelector('#productModal .modal-footer button');
    if(btn) btn.innerText = "AGREGAR AL PEDIDO";

    // Clonar objeto para no modificar el original del menú
    tempItem = { ...p, qty: 1, mods: [], extraPrice: 0 };
    
    document.getElementById('modal-prod-name').innerText = p.nombre;
    document.getElementById('modal-qty').innerText = "1";
    document.getElementById('modal-prod-desc').innerText = p.categoria.toUpperCase();

    // Ingredientes
    const ingDiv = document.getElementById('ingredients-section');
    if (p.ingredientes && p.ingredientes.length) {
        ingDiv.innerHTML = '<label class="fw-bold text-danger mb-2 small text-uppercase">Ingredientes (Desmarcar para quitar):</label>' +
            p.ingredientes.map(i => `
                <div class="form-check">
                    <input class="form-check-input border-secondary" type="checkbox" checked value="${i}" id="ing-${i}">
                    <label class="form-check-label text-dark" for="ing-${i}">${i}</label>
                </div>
            `).join('');
    } else ingDiv.innerHTML = '';

    // Extras
    const extDiv = document.getElementById('extras-section');
    if (p.adicionales && p.adicionales.length) {
        extDiv.innerHTML = '<label class="fw-bold text-danger mb-2 small text-uppercase">Extras (Marcar para agregar):</label>' +
            p.adicionales.map(e => `
                <div class="form-check">
                    <input class="form-check-input border-secondary" type="checkbox" value="${e.nombre}" data-price="${e.precio}" id="ext-${e.nombre}">
                    <label class="form-check-label text-dark" for="ext-${e.nombre}">${e.nombre} (+$${e.precio})</label>
                </div>
            `).join('');
    } else extDiv.innerHTML = '';

    const modalEl = document.getElementById('productModal');
    const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    modal.show();
};
window.addProduct = window.openModal; // Alias para compatibilidad

window.adjustQty = function(d) {
    tempItem.qty = Math.max(1, tempItem.qty + d);
    document.getElementById('modal-qty').innerText = tempItem.qty;
};

window.addToCart = function() {
    // Resetear mods para recalcular desde la UI
    tempItem.mods = [];
    tempItem.extraPrice = 0;

    // Procesar ingredientes quitados
    document.querySelectorAll('#ingredients-section input:not(:checked)').forEach(c => tempItem.mods.push(`Sin ${c.value}`));
    
    // Procesar extras agregados
    document.querySelectorAll('#extras-section input:checked').forEach(c => {
        tempItem.mods.push(`Extra ${c.value}`);
        tempItem.extraPrice += parseFloat(c.getAttribute('data-price'));
    });

    if (editingCartIndex > -1) {
        // MODO EDICIÓN: Actualizar existente
        currentOrder.items[editingCartIndex] = { ...tempItem };
        editingCartIndex = -1;
        setTimeout(() => window.openCartModal(), 200); // Reabrir carrito
    } else {
        // MODO CREACIÓN: Agregar nuevo
        currentOrder.items.push({ ...tempItem });
    }

    saveCartToStorage(); // Guardar cambios
    updateCart();
    
    const modalEl = document.getElementById('productModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if(modal) modal.hide();
    
};

window.openCartModal = function() {
    renderizarCarrito();
    const modalEl = document.getElementById('cartModal');
    const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    modal.show();
};

window.updateCartQty = function(index, delta) {
    if(currentOrder.items[index]) {
        currentOrder.items[index].qty += delta;
        if(currentOrder.items[index].qty <= 0) {
            currentOrder.items.splice(index, 1);
        }
        saveCartToStorage(); // Guardar cambios
        updateCart();
        renderizarCarrito();
    }
};

window.removeFromCart = function(index) {
    currentOrder.items.splice(index, 1);
    saveCartToStorage(); // Guardar cambios
    updateCart();
    renderizarCarrito();
};

window.editCartItem = function(index) {
    const item = currentOrder.items[index];
    const originalProduct = menuData.find(p => p.id === item.id);
    
    if (!originalProduct) return;

    // 1. Abrir modal (esto resetea la UI con los valores por defecto)
    window.openModal(originalProduct);
    
    // 2. Activar modo edición
    editingCartIndex = index;
    const btn = document.querySelector('#productModal .modal-footer button');
    if(btn) btn.innerText = "GUARDAR CAMBIOS";

    // 3. Restaurar estado del item (Cantidad)
    tempItem.qty = item.qty;
    document.getElementById('modal-qty').innerText = tempItem.qty;

    // 4. Restaurar Checkboxes (Ingredientes y Extras)
    if (item.mods) {
        item.mods.forEach(mod => {
            if (mod.startsWith('Sin ')) {
                const val = mod.substring(4);
                const cb = document.getElementById(`ing-${val}`);
                if(cb) cb.checked = false; // Desmarcar ingrediente
            } else if (mod.startsWith('Extra ')) {
                const val = mod.substring(6);
                const cb = document.getElementById(`ext-${val}`);
                if(cb) cb.checked = true; // Marcar extra
            }
        });
    }
    
    // Cerrar carrito para ver el producto
    const cartModalEl = document.getElementById('cartModal');
    const cartModal = bootstrap.Modal.getInstance(cartModalEl);
    if (cartModal) cartModal.hide();
};

window.confirmOrder = function() {
    if(currentOrder.items.length === 0) {
        alert('Agrega productos al carrito');
        return;
    }
    // El modal se cerrará automáticamente si el pedido es exitoso en enviarPedido()
    window.enviarPedido();
};

function updateCart() {
    let total = 0;
    const groups = {};
    
    // Agrupar para promociones
    currentOrder.items.forEach(i => {
        if(!groups[i.id]) groups[i.id] = { count: 0 };
        groups[i.id].count += i.qty;
        total += (i.extraPrice * i.qty);
    });

    for (const [id, grp] of Object.entries(groups)) {
        const prod = menuData.find(p => p.id === id);
        let q = grp.count;
        if (prod && prod.precios && prod.precios['1']) {
            while(q > 0) {
                if (q >= 3) { total += (prod.precios['3'] || prod.precios['1']*3); q -= 3; }
                else if (q >= 2) { total += (prod.precios['2'] || prod.precios['1']*2); q -= 2; }
                else { total += prod.precios['1']; q -= 1; }
            }
        } else if (prod) {
            total += prod.precioUnitario * q;
        }
    }
    
    currentOrder.total = total;
    
    const totalQty = currentOrder.items.reduce((sum, i) => sum + i.qty, 0);
    document.getElementById('cart-count').innerText = totalQty;

    // Actualizar etiquetas del carrito flotante
    if (document.getElementById('cart-items-label')) document.getElementById('cart-items-label').innerText = `${totalQty} ítems`;
    if (document.getElementById('cart-total-label')) document.getElementById('cart-total-label').innerText = `$${total.toFixed(2)}`;
}

function renderizarCarrito() {
    const container = document.getElementById('modal-cart-items');
    
    if(currentOrder.items.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-5" id="empty-cart">
                <i class="fas fa-shopping-cart fa-3x mb-3 opacity-50"></i>
                <p>Tu carrito está vacío</p>
            </div>`;
        document.getElementById('cart-total').innerText = '0';
        return;
    }
    
    container.innerHTML = '';
    
    currentOrder.items.forEach((item, idx) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item-modern';
        itemEl.innerHTML = `
            <img src="${item.imagen || 'https://via.placeholder.com/60'}" class="cart-item-img" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
            <div class="cart-item-info flex-grow-1 ms-3">
                <div class="fw-bold">${item.nombre}</div>
                <div class="text-muted small">$${(item.precioUnitario + item.extraPrice).toFixed(2)}</div>
                ${item.mods && item.mods.length ? `<div class="text-danger small">${item.mods.join(', ')}</div>` : ''}
            </div>
            <div class="d-flex align-items-center gap-2">
                <button class="btn btn-link text-primary p-0 me-1" onclick="window.editCartItem(${idx})">
                    <i class="fas fa-pen"></i>
                </button>
                <div class="qty-selector">
                    <button class="qty-btn-modern" onclick="window.updateCartQty(${idx}, -1)"><i class="fas fa-minus small"></i></button>
                    <span class="fw-bold mx-2" style="min-width:20px; text-align:center">${item.qty}</span>
                    <button class="qty-btn-modern" onclick="window.updateCartQty(${idx}, 1)"><i class="fas fa-plus small"></i></button>
                </div>
                <button class="btn btn-link text-danger p-0 ms-1" onclick="window.removeFromCart(${idx})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        container.appendChild(itemEl);
    });
    
    document.getElementById('cart-total').innerText = currentOrder.total;
}

// --- PERSISTENCIA (LOCALSTORAGE) ---
function saveCartToStorage() {
    localStorage.setItem('carrito', JSON.stringify(currentOrder.items));
}

function loadCartFromStorage() {
    const saved = localStorage.getItem('carrito');
    if (saved) {
        try {
            currentOrder.items = JSON.parse(saved);
            updateCart();
        } catch (e) {
            console.error("Error cargando carrito", e);
            localStorage.removeItem('carrito');
        }
    }
}

window.enviarPedido = async function() {
    if (currentOrder.items.length === 0) return alert("Agrega algo al carrito primero.");
    
    // Eliminamos el confirm() nativo para que el botón actúe de inmediato
    // if (confirm(`¿Confirmar orden por $${currentOrder.total}?`)) {
        // UI: Mostrar carga en el botón
        const btn = document.getElementById('btn-confirm-order');
        let originalText = '';
        if(btn) {
            originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';
        }

        try {
            const res = await fetch('/api/pedido', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(currentOrder)
            });
            
            if (res.ok) {
                const data = await res.json();
                myOrderId = data.numeroOrden;
                localStorage.setItem('lastOrderId', myOrderId); // PERSISTENCIA: Guardar ID
                const trackEl = document.getElementById('track-order-id');
                if(trackEl) trackEl.innerText = `#${myOrderId}`;
                
                updateStatusUI('PENDING_PAYMENT');
                
                // Limpiar carrito al enviar
                currentOrder.items = [];
                saveCartToStorage();
                updateCart();

                // Cerrar modal solo si fue exitoso
                try {
                    const modalEl = document.getElementById('cartModal');
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) {
                        modal.hide();
                    } else {
                        // FALLBACK: Forzar cierre manual si la instancia se perdió
                        modalEl.classList.remove('show');
                        modalEl.style.display = 'none';
                        document.body.classList.remove('modal-open');
                        const backdrop = document.querySelector('.modal-backdrop');
                        if(backdrop) backdrop.remove();
                    }
                } catch(e) { console.warn("No se pudo cerrar el modal automáticamente", e); }

                window.goToStep(4); // Usar función centralizada
            } else {
                const err = await res.json();
                alert("Error al enviar pedido: " + (err.error || "Desconocido"));
            }
        } catch(e) { 
            console.error(e);
            alert("Error de conexión: " + e.message); 
        } finally {
            // Restaurar botón
            if(btn && originalText) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }
    // }
};

window.abrirLoginStaff = function() { 
    const modalEl = document.getElementById('loginModal');
    const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    modal.show(); 
};

window.login = async function() {
    const u = document.getElementById('login-user').value;
    const p = document.getElementById('login-pass').value;
    try {
        const res = await fetch('/api/login', { 
            method:'POST', 
            headers:{'Content-Type':'application/json'}, 
            body:JSON.stringify({username:u, password:p}) 
        });
        
        const data = await res.json();
        if(res.ok) {
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('role', data.role);
            window.location.href = '/staff.html';
        } else {
            alert(data.detail || "Error de credenciales");
        }
    } catch(e) {
        console.error(e);
        alert("Error de conexión");
    }
};

window.resetOrder = function() {
    localStorage.removeItem('lastOrderId');
    // Recargar la página asegura un estado limpio y recupera el nombre correctamente
    window.location.reload();
};

// --- FUNCIONES INTERNAS ---

function renderMenu(products) {
    const container = document.getElementById('menu-grid');
    if (!products || products.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-white"><p>No hay productos disponibles.</p></div>';
        return;
    }

    container.innerHTML = products.map(p => {
        const pString = JSON.stringify(p).replace(/"/g, '&quot;');
        return `
            <div class="product-card-modern" onclick="window.openModal(${pString})">
                <div class="product-img-container">
                    ${p.imagen ? 
                        `<img src="${p.imagen}" class="product-img-modern" alt="${p.nombre}">` : 
                        `<div class="product-img-modern" style="background: linear-gradient(135deg, #D35400 0%, #E67E22 100%);"></div>`
                    }
                </div>
                <div class="product-body">
                    <div>
                        <div class="product-title">${p.nombre}</div>
                        <div class="product-price-tag">${getDisplayPrice(p)}</div>
                    </div>
                    <button class="btn-add-modern" onclick="event.stopPropagation(); window.addProduct(${pString})">
                        AGREGAR <i class="fas fa-plus-circle ms-1"></i>
                    </button>
                </div>
            </div>
    `}).join('');

    function agregarAlCarrito(id) {
        //  Find index  existing product in the cart
        const productIndex = carrito.findIndex(item => item.productoId === id);
        if (productIndex !== -1) {
            // Product exists
            carrito[productIndex].cantidad++;
        } else {
            // New product
            const product = menuData.find(item => item.id === id);
            if (!product) return console.warn("Producto no encontrado en menú");
            carrito.push({ ...product, cantidad: 1 });
        }
        // Actualiza UI
        updateCartUI();
        // Actualiza Local Storage
        saveCart();
    }
    
    
    // Agregar Título y Botones al contenedor
    container.innerHTML = `<h2 class="w-100 text-center text-white mb-4">MENÚ</h2>` + container.innerHTML + `
        <div class="w-100 d-flex justify-content-center flex-wrap gap-3 mt-4">
            <button id="pedir-btn" onclick="window.openCartModal()">PEDIR</button>
            <button id="cancel-btn" onclick="window.cancelarPedido()">Cancelar</button>
        </div>
    `;
}

function getDisplayPrice(p) {
    if (p.precios && (p.precios['1'] || p.precios['1'] === 0)) {
        return `1x$${p.precios['1']} | 2x$${p.precios['2']} | 3x$${p.precios['3']}`;
    }
    return `$${p.precioUnitario}`;
}

function updateStatusUI(status, pedidoData = null) {
    const txt = document.getElementById('track-status-text');
    const msg = document.getElementById('track-msg');
    const bar = document.getElementById('status-bar');
    const btnNew = document.getElementById('btn-new-order');
    
    txt.className = 'status-display';

    // Mapeo de estados a información visual
    const estadosInfo = {
        'PENDING_PAYMENT': {
            texto: '💰 RECIBIDO',
            mensaje: '¡Pedido recibido! Pasa a pagar a caja para continuar.',
            progreso: 20,
            clase: 'status-IN_KITCHEN',
            colorBarra: 'bg-warning'
        },
        'IN_KITCHEN': {
            texto: '🍳 EN COCINA',
            mensaje: 'Tu pedido ha sido pagado y enviado a cocina.',
            progreso: 40,
            clase: 'status-PREPARING',
            colorBarra: 'bg-info'
        },
        'PREPARING': {
            texto: '👨‍🍳 PREPARANDO',
            mensaje: 'Estamos preparando tus alimentos con mucho cuidado...',
            progreso: 70,
            clase: 'status-PREPARING',
            colorBarra: 'bg-primary'
        },
        'READY': {
            texto: '✅ LISTO',
            mensaje: '¡Tu pedido está listo! Pasa a recogerlo.',
            progreso: 95,
            clase: 'status-READY',
            colorBarra: 'bg-success',
            sonido: true
        },
        'COMPLETED': {
            texto: '📦 ENTREGADO',
            mensaje: '¡Gracias por tu compra! Esperamos verte pronto.',
            progreso: 100,
            clase: 'status-READY',
            colorBarra: 'bg-success'
        }
    };

    const info = estadosInfo[status] || estadosInfo['PENDING_PAYMENT'];
    
    // Actualizar UI
    txt.innerText = info.texto;
    txt.classList.add(info.clase);
    msg.innerText = info.mensaje;
    bar.style.width = info.progreso + '%';
    bar.className = 'progress-bar ' + info.colorBarra;
    
    // Mostrar botón de nuevo pedido si está completado
    if (status === 'COMPLETED') {
        btnNew.classList.remove('hidden');
    } else {
        btnNew.classList.add('hidden');
    }

    // Reproducir sonido si está listo
    if (info.sonido) {
        try { 
            new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg').play().catch(e=>{}); 
        } catch(e){}
    }

    // Log para debugging
    console.log(`📊 Estado actualizado: ${status} (${info.texto})`);
}

// --- INICIO ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar menú (Siempre necesario por si se hace otro pedido)
    fetch('/api/products')
        .then(res => res.json())
        .then(data => {
            // Aplanar estructura
            menuData = [...(data.hamburguesas||[]), ...(data.extras||[]), ...(data.hotdogs||[]), ...(data.bebidas||[])];
            renderMenu(menuData);
            updateCart(); // Recalcular totales una vez cargado el menú
        })
        .catch(err => {
            console.error(err);
            document.getElementById('menu-grid').innerHTML = '<div class="col-12 text-center text-white">Error conectando con servidor.</div>';
        });

    // 2. Verificar si hay un pedido activo (Prioridad)
    const lastId = localStorage.getItem('lastOrderId');
    if (lastId) {
        myOrderId = parseInt(lastId);
        document.getElementById('track-order-id').innerText = `#${myOrderId}`;
        window.goToStep(4); // Ir directo a status
        
        // Recuperar estado real del servidor
        fetch(`/api/pedido/${myOrderId}/status`)
            .then(r => r.json())
            .then(data => {
                if(data.error) {
                    console.warn("Pedido no encontrado, reiniciando...");
                    localStorage.removeItem('lastOrderId');
                    window.location.reload();
                } else {
                    updateStatusUI(data.estado);
                }
            })
            .catch(e => console.error("Error recuperando estado:", e));
    } else {
        // 3. Si no hay pedido activo, restaurar flujo normal
        const savedName = localStorage.getItem('customerName');
        const savedService = localStorage.getItem('serviceType');
        
        if (savedName) {
            const nameInput = document.getElementById('client-name');
            if (nameInput) nameInput.value = savedName;
            window.goToStep(2);
            
            // Si ya hay servicio seleccionado, ir al menú
            if (savedService) {
                currentOrder.tipo = savedService;
                const infoEl = document.getElementById('order-info');
                if(infoEl) infoEl.innerText = `${savedName} • ${savedService}`;
                window.goToStep(3);
            }
        }
        // Cargar carrito guardado
        loadCartFromStorage();
    }

    // Listeners de Socket - Actualizaciones en tiempo real
    if(socket) {
        socket.on('actualizacion-pedido', (pedido) => {
            if (myOrderId && pedido.numeroOrden === myOrderId) {
                console.log('🔔 Actualización recibida:', pedido);
                updateStatusUI(pedido.status, pedido);
                
                // Mostrar notificación visual si el navegador lo soporta
                if ('Notification' in window && Notification.permission === 'granted') {
                    const estadosLegibles = {
                        'PENDING_PAYMENT': 'Recibido',
                        'IN_KITCHEN': 'En Cocina',
                        'PREPARING': 'Preparando',
                        'READY': 'Listo',
                        'COMPLETED': 'Entregado'
                    };
                    
                    new Notification('Momoy\'s Burger', {
                        body: `Tu pedido #${myOrderId} está ${estadosLegibles[pedido.status]}`,
                        icon: '/favicon.ico'
                    });
                }
            }
        });
        
        // Solicitar permisos de notificación al cargar
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
});