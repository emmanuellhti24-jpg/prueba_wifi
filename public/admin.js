const API_URL = '/api';
let token = localStorage.getItem('token');
let role = localStorage.getItem('role');
let socket;

let charts = {}; // Almacenar instancias de gráficas
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
    if (tabName === 'staff') loadStaff();
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
            <td><span class="badge bg-primary">${p.categoria}</span></td>
            <td>${p.precios?.['1'] ? `1:$${p.precios['1']} | 2:$${p.precios['2']}` : `$${p.precioUnitario}`}</td>
            <td class="action-column">
                <button class="action-btn" onclick="deleteProduct('${p.id}')">🗑️</button>
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
            <td class="action-column">
                <button class="action-btn" onclick="deleteInv('${i._id}')">🗑️</button>
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
            <td class="action-column">${u.role !== 'admin' ? `<button class="action-btn" onclick="deleteUser('${u._id}')">🗑️</button>` : ''}</td>
        </tr>
    `).join('');
}

async function loadStaff() {
    const res = await fetch(`${API_URL}/staff`, { headers: { 'Authorization': `Bearer ${token}` } });
    const staffList = await res.json();
    document.querySelector('#staff-table tbody').innerHTML = staffList.data.map(s => `
        <tr>
            <td>${s.nombre} ${s.apellido}</td>
            <td><span class="badge bg-info text-dark">${s.rol}</span></td>
            <td><small>${s.telefono || '-'}<br>${s.email || ''}</small></td>
            <td><span class="badge ${s.estado ? 'bg-success' : 'bg-secondary'}">${s.estado ? 'Activo' : 'Inactivo'}</span></td>
            <td class="action-column">
                <button class="action-btn" style="background-color:#3498db; margin-right:5px;" onclick='openStaffModal(${JSON.stringify(s)})'>✏️</button>
                <button class="action-btn" onclick="deleteStaff('${s._id}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

async function loadMetrics() {
    const startInput = document.getElementById('date-start');
    const endInput = document.getElementById('date-end');
    
    // Fechas por defecto (Mes actual)
    if (!startInput.value) {
        const now = new Date();
        startInput.value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endInput.value = now.toISOString().split('T')[0];
    }

    const query = `?start=${startInput.value}&end=${endInput.value}`;
    const headers = { 'Authorization': `Bearer ${token}` };

    // 1. Cargar KPIs (Dashboard General)
    const resDash = await fetch(`${API_URL}/metrics/dashboard${query}`, { headers });
    const dashData = await resDash.json();
    
    const container = document.getElementById('metrics-container');
    container.innerHTML = dashData.map(m => `
        <div class="col-md-3">
            <div class="metric-card">
                <div class="item-title text-white-50">${m.producto}</div>
                <div class="stat-value">${m.unidades} <small class="fs-6 text-muted">unid.</small></div>
                <div class="stat-label">Hora Pico: ${m.horaPico}</div>
                <div class="mt-2 badge bg-light text-dark">${m.analisis}</div>
            </div>
        </div>
    `).join('');

    // 2. Cargar Gráficas
    // Finanzas
    const resFin = await fetch(`${API_URL}/metrics/financials${query}`, { headers });
    const finData = await resFin.json();
    renderChart('financialChart', 'bar', {
        labels: ['Ingresos', 'Costos', 'Ganancia'],
        datasets: [{
            label: 'Total ($)',
            data: [finData.ingresoTotal, finData.costoTotal, finData.gananciaNeta],
            backgroundColor: ['#2ecc71', '#e74c3c', '#f1c40f']
        }]
    }, { plugins: { title: { display: true, text: 'Finanzas' } } });

    // Categorías
    const resCat = await fetch(`${API_URL}/metrics/categories${query}`, { headers });
    const catData = await resCat.json();
    renderChart('categoryChart', 'doughnut', {
        labels: catData.map(d => d._id.toUpperCase()),
        datasets: [{
            data: catData.map(d => d.cantidadVendida),
            backgroundColor: ['#e67e22', '#3498db', '#9b59b6', '#1abc9c']
        }]
    }, { plugins: { title: { display: true, text: 'Por Categoría' } } });

    // Top Productos
    const resTop = await fetch(`${API_URL}/metrics/top-products${query}`, { headers });
    const topData = await resTop.json();
    renderChart('topProductsChart', 'bar', {
        labels: topData.map(d => d._id),
        datasets: [{
            label: 'Unidades',
            data: topData.map(d => d.unidades),
            backgroundColor: '#e91e63'
        }]
    }, { indexAxis: 'y', plugins: { title: { display: true, text: 'Top 5 Productos' } } });
}

function renderChart(id, type, data, options = {}) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(ctx, {
        type: type,
        data: data,
        options: { responsive: true, maintainAspectRatio: false, ...options }
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
            showToast('Producto guardado correctamente', 'success');
        } else {
            showToast('Error al guardar producto', 'error');
        }
    }).catch(() => showToast('Error de conexión', 'error'));
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
        showToast('Inventario actualizado', 'success');
    }).catch(() => showToast('Error al guardar', 'error'));
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
        showToast('Usuario creado correctamente', 'success');
    }).catch(() => showToast('Error al crear usuario', 'error'));
}

function saveStaff() {
    const id = document.getElementById('st-id').value;
    const data = {
        nombre: document.getElementById('st-nombre').value,
        apellido: document.getElementById('st-apellido').value,
        rol: document.getElementById('st-rol').value,
        telefono: document.getElementById('st-telefono').value,
        email: document.getElementById('st-email').value,
        estado: document.getElementById('st-estado').checked
    };
    
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/staff/${id}` : `${API_URL}/staff`;

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
    }).then(() => {
        bootstrap.Modal.getInstance(document.getElementById('modal-staff')).hide();
        loadStaff();
        showToast('Personal guardado correctamente', 'success');
    }).catch(() => showToast('Error al guardar', 'error'));
}

function deleteProduct(id) { if (confirm('¿Borrar producto?')) fetch(`${API_URL}/products/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }).then(() => { loadMenu(); showToast('Producto eliminado', 'success'); }); }
function deleteInv(id) { if (confirm('¿Borrar insumo?')) fetch(`${API_URL}/inventory/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }).then(() => { loadInventory(); showToast('Insumo eliminado', 'success'); }); }
function deleteUser(id) { if (confirm('¿Borrar usuario?')) fetch(`${API_URL}/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }).then(() => { loadUsers(); showToast('Usuario eliminado', 'success'); }); }
function deleteStaff(id) { if (confirm('¿Eliminar miembro del personal?')) fetch(`${API_URL}/staff/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }).then(() => { loadStaff(); showToast('Personal eliminado', 'success'); }); }

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

function openStaffModal(s = null) {
    document.getElementById('st-id').value = s?._id || '';
    document.getElementById('st-nombre').value = s?.nombre || '';
    document.getElementById('st-apellido').value = s?.apellido || '';
    document.getElementById('st-rol').value = s?.rol || 'Mesero';
    document.getElementById('st-telefono').value = s?.telefono || '';
    document.getElementById('st-email').value = s?.email || '';
    document.getElementById('st-estado').checked = s ? s.estado : true;
    new bootstrap.Modal(document.getElementById('modal-staff')).show();
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