const API_URL = '/api';
let token = localStorage.getItem('token');
let role = localStorage.getItem('role');
let socket;

// --- ESTADO Y CACHÉ ---
let currentRecipe = [];
let inventoryList = [];

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    if (!token) {
        window.location.href = '/';
        return;
    }
    
    socket = io();
    document.getElementById('user-role-badge').innerText = role.toUpperCase();
    
    aplicarPermisos(role);
    setupSocketListeners();
    
    // Cargar la pestaña inicial
    switchTab('orders');
});

function aplicarPermisos(userRole) {
    const allTabs = document.querySelectorAll('.nav-pills-custom .btn');
    allTabs.forEach(tab => {
        const tabName = tab.dataset.tab;
        let isVisible = false;

        if (userRole === 'admin') {
            isVisible = true;
        } else if (userRole === 'cashier') {
            isVisible = ['orders'].includes(tabName);
        } else if (userRole === 'cook') {
            isVisible = ['orders', 'inventory'].includes(tabName);
        }

        tab.style.display = isVisible ? 'inline-block' : 'none';
    });
}

function setupSocketListeners() {
    socket.on('nuevo-pedido', (pedido) => {
        new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(() => {});
        loadOrders();
    });
    socket.on('actualizacion-pedido', loadOrders);
}

function switchTab(tabName) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('d-none'));
    document.querySelectorAll('.nav-pills-custom .btn').forEach(el => el.classList.remove('active'));

    document.getElementById(`view-${tabName}`).classList.remove('d-none');
    document.querySelector(`.nav-pills-custom .btn[data-tab="${tabName}"]`).classList.add('active');

    // Cargar datos de la pestaña seleccionada
    if (tabName === 'orders') loadOrders();
    if (tabName === 'menu') loadMenu();
    if (tabName === 'inventory') loadInventory();
    if (tabName === 'users') loadUsers();
    if (tabName === 'metrics') loadMetrics();
}

// --- CARGA DE DATOS (LOADERS) ---

async function loadOrders() {
    const res = await fetch(`${API_URL}/pedidos`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) return;
    const orders = await res.json();
    const container = document.getElementById('orders-grid');
    container.innerHTML = orders.length ? orders.map(renderOrderCard).join('') : '<p class="text-center text-muted">No hay pedidos activos.</p>';
}

async function loadMenu() {
    const invRes = await fetch(`${API_URL}/inventory`, { headers: { 'Authorization': `Bearer ${token}` } });
    inventoryList = await invRes.json();

    const res = await fetch(`${API_URL}/products`);
    const products = await res.json();
    const allProds = [...(products.hamburguesas || []), ...(products.hotdogs || []), ...(products.extras || [])];

    document.getElementById('menu-table-body').innerHTML = allProds.map(p => `
        <tr>
            <td><img src="${p.imagen || 'https://via.placeholder.com/40'}" width="40" height="40" class="me-2 rounded" style="object-fit: cover;"> ${p.nombre}</td>
            <td><span class="badge bg-info text-dark">${p.categoria}</span></td>
            <td>${p.precios?.['1'] ? `1:$${p.precios['1']} | 2:$${p.precios['2']}` : `$${p.precioUnitario}`}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary btn-icon" onclick='editProduct(${JSON.stringify(p)})'><i class="fas fa-pencil-alt"></i></button>
                <button class="btn btn-sm btn-outline-danger btn-icon" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function loadInventory() {
    const res = await fetch(`${API_URL}/inventory`, { headers: { 'Authorization': `Bearer ${token}` } });
    const items = await res.json();
    document.querySelector('#inventory-table tbody').innerHTML = items.map(i => `
        <tr>
            <td>${i.nombre}</td>
            <td>${i.cantidad} ${i.unidad}</td>
            <td><span class="badge ${i.cantidad < i.minimo ? 'bg-danger' : 'bg-success'}">${i.cantidad < i.minimo ? 'BAJO' : 'OK'}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary btn-icon" onclick='openInventoryModal(${JSON.stringify(i)})'><i class="fas fa-pencil-alt"></i></button>
                <button class="btn btn-sm btn-outline-danger btn-icon" onclick="deleteInv('${i._id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function loadUsers() {
    const res = await fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } });
    const users = await res.json();
    document.querySelector('#users-table tbody').innerHTML = users.map(u => `
        <tr>
            <td>${u.username}</td>
            <td><span class="badge bg-secondary">${u.role}</span></td>
            <td>${u.role !== 'admin' ? `<button class="btn btn-sm btn-outline-danger btn-icon" onclick="deleteUser('${u._id}')"><i class="fas fa-trash"></i></button>` : ''}</td>
        </tr>
    `).join('');
}

async function loadMetrics() {
    const res = await fetch(`${API_URL}/metrics/top-products`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    const chartCanvas = document.getElementById('chart-top');
    if (window.topProductsChart) window.topProductsChart.destroy();
    window.topProductsChart = new Chart(chartCanvas, {
        type: 'doughnut',
        data: { labels: data.map(d => d._id), datasets: [{ data: data.map(d => d.unidades) }] }
    });
}

// --- RENDERIZADO DE COMPONENTES ---

function renderOrderCard(o) {
    const itemsHtml = o.items.map(i => {
        const mods = i.mods && i.mods.length ? `<div class="text-danger ps-2 small">⚠️ ${i.mods.join(', ')}</div>` : '';
        return `<li><strong>${i.qty}x</strong> ${i.nombre} ${mods}</li>`;
    }).join('');

    return `
        <div class="col-md-4 col-lg-3">
            <div class="order-card p-3 border-left-${getStatusColor(o.status)}">
                <div class="d-flex justify-content-between mb-2">
                    <span class="fw-bold">#${o.numeroOrden} ${o.cliente}</span>
                    <span class="badge bg-light text-dark border">${o.status}</span>
                </div>
                <div class="small text-muted mb-2">${o.tipo}</div>
                <ul class="list-unstyled small mb-3">${itemsHtml}</ul>
                ${getActionButtons(o)}
            </div>
        </div>`;
}

function getStatusColor(s) {
    const colors = { PENDING_PAYMENT: 'red', IN_KITCHEN: 'orange', PREPARING: 'blue', READY: 'green' };
    return colors[s] || 'gray';
}

function getActionButtons(o) {
    if (o.status === 'PENDING_PAYMENT' && (role === 'admin' || role === 'cashier')) {
        return `<button class="btn btn-sm btn-warning w-100 fw-bold" onclick="setStatus('${o._id}','IN_KITCHEN')">💰 COBRAR Y ENVIAR</button>`;
    }
    if (o.status === 'IN_KITCHEN' && (role === 'admin' || role === 'cook')) {
        return `<button class="btn btn-sm btn-primary w-100 fw-bold" onclick="setStatus('${o._id}','PREPARING')">🔥 PREPARAR</button>`;
    }
    if (o.status === 'PREPARING' && (role === 'admin' || role === 'cook')) {
        return `<button class="btn btn-sm btn-info w-100 fw-bold text-dark" onclick="setStatus('${o._id}','READY')">✅ LISTO</button>`;
    }
    if (o.status === 'READY' && (role === 'admin' || role === 'cashier')) {
        return `<button class="btn btn-sm btn-success w-100 fw-bold" onclick="setStatus('${o._id}','COMPLETED')">📦 ENTREGAR</button>`;
    }
    return `<div class="text-muted text-center small">Esperando acción...</div>`;
}

// --- ACCIONES (POST, PUT, DELETE) ---

function setStatus(id, status) {
    fetch(`${API_URL}/pedido/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
    }).then(loadOrders);
}

function saveProduct() {
    const formData = new FormData();
    const id = document.getElementById('p-id').value || 'prod_' + Date.now();
    formData.append('id', id);
    formData.append('nombre', document.getElementById('p-name').value);
    formData.append('categoria', document.getElementById('p-cat').value);
    formData.append('precioUnitario', document.getElementById('p-unit').value);
    formData.append('precios', JSON.stringify({
        "1": parseFloat(document.getElementById('p-price1').value) || 0,
        "2": parseFloat(document.getElementById('p-price2').value) || 0,
        "3": parseFloat(document.getElementById('p-price3').value) || 0
    }));
    formData.append('ingredientes', document.getElementById('p-ing').value);
    const extrasRaw = document.getElementById('p-ext').value.split(',').filter(e => e.includes(':'));
    const extras = extrasRaw.map(e => ({ nombre: e.split(':')[0].trim(), precio: parseFloat(e.split(':')[1]) }));
    formData.append('adicionales', JSON.stringify(extras));
    const receta = currentRecipe.map(r => ({ insumo: r.insumo._id || r.insumo, cantidad: r.cantidad }));
    formData.append('receta', JSON.stringify(receta));

    const fileInput = document.getElementById('p-img-file');
    if (fileInput.files[0]) formData.append('imagen', fileInput.files[0]);
    formData.append('imagenActual', document.getElementById('p-img-current').value);

    fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    }).then(res => res.json()).then(data => {
        if (data.success) {
            bootstrap.Modal.getInstance(document.getElementById('modal-product')).hide();
            loadMenu();
        } else {
            alert('Error al guardar producto');
        }
    });
}

function saveInventory() {
    const id = document.getElementById('inv-id').value;
    const data = {
        nombre: document.getElementById('inv-name').value,
        cantidad: document.getElementById('inv-qty').value,
        unidad: document.getElementById('inv-unit').value,
        costoUnitario: document.getElementById('inv-cost').value,
        minimo: document.getElementById('inv-min').value
    };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/inventory/${id}` : `${API_URL}/inventory`;
    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
    }).then(() => {
        bootstrap.Modal.getInstance(document.getElementById('modal-inventory')).hide();
        loadInventory();
    });
}

function saveUser() {
    const data = {
        username: document.getElementById('u-name').value,
        password: document.getElementById('u-pass').value,
        role: document.getElementById('u-role').value
    };
    fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
    }).then(() => {
        bootstrap.Modal.getInstance(document.getElementById('modal-user')).hide();
        loadUsers();
    });
}

function deleteProduct(id) { if (confirm('¿Borrar producto?')) fetch(`${API_URL}/products/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }).then(loadMenu); }
function deleteInv(id) { if (confirm('¿Borrar insumo?')) fetch(`${API_URL}/inventory/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }).then(loadInventory); }
function deleteUser(id) { if (confirm('¿Borrar usuario?')) fetch(`${API_URL}/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }).then(loadUsers); }

// --- MODALES Y LÓGICA DE RECETAS ---

function openProductModal(p = null) {
    document.getElementById('p-id').value = p?.id || '';
    document.getElementById('p-name').value = p?.nombre || '';
    document.getElementById('p-cat').value = p?.categoria || 'hamburguesas';
    document.getElementById('p-price1').value = p?.precios?.['1'] || 0;
    document.getElementById('p-price2').value = p?.precios?.['2'] || 0;
    document.getElementById('p-price3').value = p?.precios?.['3'] || 0;
    document.getElementById('p-unit').value = p?.precioUnitario || 0;
    document.getElementById('p-ing').value = p?.ingredientes?.join(',') || '';
    document.getElementById('p-ext').value = p?.adicionales?.map(a => `${a.nombre}:${a.precio}`).join(',') || '';
    document.getElementById('p-img-current').value = p?.imagen || '';
    document.getElementById('p-img-file').value = '';
    currentRecipe = p?.receta || [];
    renderRecipeList();
    const select = document.getElementById('recipe-select');
    select.innerHTML = '<option value="">Seleccionar Insumo...</option>' + inventoryList.map(i => `<option value="${i._id}">${i.nombre} (${i.unidad})</option>`).join('');
    new bootstrap.Modal(document.getElementById('modal-product')).show();
}

function openInventoryModal(i = null) {
    document.getElementById('inv-id').value = i?._id || '';
    document.getElementById('inv-name').value = i?.nombre || '';
    document.getElementById('inv-qty').value = i?.cantidad || 0;
    document.getElementById('inv-unit').value = i?.unidad || 'pza';
    document.getElementById('inv-cost').value = i?.costoUnitario || 0;
    document.getElementById('inv-min').value = i?.minimo || 5;
    new bootstrap.Modal(document.getElementById('modal-inventory')).show();
}

function openUserModal() {
    document.getElementById('u-name').value = '';
    document.getElementById('u-pass').value = '';
    document.getElementById('u-role').value = 'cashier';
    new bootstrap.Modal(document.getElementById('modal-user')).show();
}

function addRecipeItem() {
    const select = document.getElementById('recipe-select');
    const qty = document.getElementById('recipe-qty').value;
    if (select.value && qty) {
        currentRecipe.push({ insumo: select.value, cantidad: qty });
        renderRecipeList();
    }
}

function renderRecipeList() {
    const list = document.getElementById('recipe-list');
    list.innerHTML = currentRecipe.map((r, i) => {
        const name = inventoryList.find(x => x._id === (r.insumo._id || r.insumo))?.nombre || 'Insumo no encontrado';
        return `<li class="list-group-item d-flex justify-content-between align-items-center p-1"><span>${name} x ${r.cantidad}</span><button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="currentRecipe.splice(${i},1); renderRecipeList()"><i class="fas fa-times"></i></button></li>`;
    }).join('');
}

function editProduct(p) { openProductModal(p); }

function logout() {
    localStorage.clear();
    window.location.href = '/';
}