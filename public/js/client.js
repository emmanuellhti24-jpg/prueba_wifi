let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let usuario = localStorage.getItem('clientName');
let inventario = []; // Aquí cargaremos los productos

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar productos desde el API
    try {
        const res = await fetch('/api/inventory'); // O /api/products
        const data = await res.json();
        inventario = data.data || [];
    } catch (e) { console.error("Error cargando menú"); }

    // 2. Revisar paso actual
    if (usuario) {
        document.getElementById('lblNombre').innerText = usuario;
        document.getElementById('user-info').classList.remove('d-none');
        irAPaso(2); // Saltar bienvenida
    } else {
        irAPaso(1);
    }
    
    actualizarBadge();
});

// --- NAVEGACIÓN WIZARD ---
function irAPaso(n) {
    // Ocultar todos
    [1,2,3,4].forEach(i => document.getElementById(`step-${i}`).classList.add('d-none'));
    // Mostrar actual
    document.getElementById(`step-${n}`).classList.remove('d-none');

    // Mostrar FAB solo en paso 3
    if(n === 3) {
        document.getElementById('fab-cart').classList.remove('d-none');
        renderMenu();
    } else {
        document.getElementById('fab-cart').classList.add('d-none');
    }
}

// --- ACCIONES USUARIO ---
function guardarNombre() {
    const nombre = document.getElementById('inputNombre').value;
    if(nombre.trim().length > 0) {
        localStorage.setItem('clientName', nombre);
        usuario = nombre;
        location.reload(); // Recargar para aplicar lógica inicial
    }
}

function borrarUsuario() {
    if(confirm("¿Cerrar sesión y borrar datos?")) {
        localStorage.clear();
        location.reload();
    }
}

function elegirServicio(tipo) {
    localStorage.setItem('servicio', tipo);
    irAPaso(3);
}

// --- LÓGICA MENÚ Y CARRITO ---
function renderMenu() {
    const container = document.getElementById('menu-grid');
    container.innerHTML = '';

    inventario.forEach(prod => {
        // Solo mostrar items con precio definido (asumiendo que son productos finales)
        if(prod.seccion === 'General' || prod.precio > 0) { 
            container.innerHTML += `
            <div class="col-6 col-md-4">
                <div class="card product-card h-100" onclick="agregarAlCarrito('${prod._id}')">
                    <div class="card-body text-center">
                        <h5 class="card-title fw-bold">${prod.nombre}</h5>
                        <p class="text-primary fw-bold fs-5">$${prod.precio || 0}</p>
                        <button class="btn btn-sm btn-outline-dark rounded-pill">Agregar +</button>
                    </div>
                </div>
            </div>`;
        }
    });
}

function agregarAlCarrito(id) {
    const prod = inventario.find(p => p._id === id);
    if (!prod) return; //Producto no existente
    const existente = carrito.find(c => c._id === id);

    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({ ...prod, cantidad: 1 });
    }
    
    guardarCarrito();
    // Feedback visual vibrante (opcional)
    if(navigator.vibrate) navigator.vibrate(50);
        actualizarContador()
}

function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarBadge();
}

function actualizarBadge() {
    const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    document.getElementById('cart-count').innerText = total;
}

    function actualizarContador() {
        document.getElementById('cart-count').innerText = currentOrder.items.reduce((sum, i) => sum + i.qty, 0);
    }
// --- MODAL CARRITO ---
const modalCarrito = new bootstrap.Modal(document.getElementById('modalCarrito'));

function abrirCarrito() {
    const container = document.getElementById('cart-items');
    let total = 0;
    container.innerHTML = '';

    // <div class="text-center text-muted py-5" id="empty-cart">
    if(carrito.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">Tu carrito está vacío ☹️</p>';
    } else {
        carrito.forEach((item, index) => {
            const subtotal = (item.precio || 0) * item.cantidad;
            total += subtotal;
            container.innerHTML += `
                <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                    <div>
                        <h6 class="mb-0 fw-bold">${item.nombre}</h6>
                        <small class="text-muted">$${item.precio} x ${item.cantidad}</small>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <button class="btn btn-sm btn-outline-secondary" onclick="cambiarCant(${index}, -1)">-</button>
                        <span class="fw-bold">${item.cantidad}</span>
                        <button class="btn btn-sm btn-outline-secondary" onclick="cambiarCant(${index}, 1)">+</button>
                        <button class="btn btn-sm btn-danger ms-2" onclick="borrarItem(${index})">🗑️</button>
                    </div>
                </div>
            `;
        });
    }

    document.getElementById('cart-total').innerText = total;
    modalCarrito.show();
}

function cambiarCant(index, delta) {
    carrito[index].cantidad += delta;
    if(carrito[index].cantidad <= 0) carrito.splice(index, 1);
    guardarCarrito();
    abrirCarrito(); // Re-renderizar
}

function borrarItem(index) {
    carrito.splice(index, 1);
    guardarCarrito();
    abrirCarrito();
}

function cancelarPedido() {
    if(confirm("¿Estás seguro de cancelar el pedido? Se perderán los productos seleccionados.")) {
        localStorage.removeItem('carrito');
        carrito = [];
        actualizarBadge();
        
        // Cerrar modales si hay abiertos
        const modalEl = document.getElementById('modalCarrito');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        // Redirigir según si hay usuario
        if (usuario) {
            irAPaso(2);
        } else {
            irAPaso(1);
        }
    }
}

async function enviarPedido() {
    if(carrito.length === 0) return alert("El carrito está vacío");

    const orden = {
        cliente: usuario,
        tipo: localStorage.getItem('servicio'),
        items: carrito,
        total: carrito.reduce((sum, item) => sum + ((item.precio || 0) * item.cantidad), 0)
    };

    try {
        const res = await fetch('/api/pedido', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(orden)
        });

        if (res.ok) {
            const data = await res.json();
            console.log("Orden enviada:", data);
            
            localStorage.removeItem('carrito');
            carrito = [];
            actualizarBadge();
            modalCarrito.hide();
            
            // Mostrar ID de orden en paso 4 si existe el elemento
            const orderIdEl = document.getElementById('track-order-id');
            if(orderIdEl) orderIdEl.innerText = `#${data.numeroOrden}`;
            
            irAPaso(4);
        } else {
            alert("Error al enviar el pedido. Intenta nuevamente.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión al enviar el pedido.");
    }
}