const API_URL = '/api';
let token = localStorage.getItem('token');
let role = localStorage.getItem('role');
let socket;

let charts = {}; // Almacenar instancias de gráficas
// --- ESTADO Y CACHÉ ---
let currentRecipe = [];
let inventoryList = [];
let productsList = [];
let usersList = [];

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    if (!token) {
        window.location.href = '/';
        return;
    }
    
    // Inicializar tema para admin
    initAdminTheme();
    
    socket = io();
    document.getElementById('user-role-badge').innerText = role.toUpperCase();
    
    aplicarPermisos(role);
    setupSocketListeners();
    
    // Cargar la pestaña inicial
    switchTab('orders');
});

// --- THEME MANAGEMENT PARA ADMIN ---
function initAdminTheme() {
    // Aplicar tema guardado
    const savedTheme = localStorage.getItem('momoys-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Crear toggle button para admin
    createAdminThemeToggle();
    
    // Escuchar cambios de tema
    window.addEventListener('themeChanged', (e) => {
        updateAdminTheme(e.detail.theme);
    });
}

function createAdminThemeToggle() {
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle admin-theme-toggle';
    themeToggle.id = 'adminThemeToggle';
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    themeToggle.setAttribute('aria-label', 'Cambiar tema');
    
    // Posicionar en el header del admin
    const header = document.querySelector('.staff-header') || document.body;
    header.appendChild(themeToggle);
    
    // Event listener
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('momoys-theme', newTheme);
        updateAdminTheme(newTheme);
    });
    
    // Actualizar icono inicial
    updateAdminTheme(localStorage.getItem('momoys-theme') || 'light');
}

function updateAdminTheme(theme) {
    const toggle = document.getElementById('adminThemeToggle');
    if (toggle) {
        const icon = theme === 'dark' ? 'fa-moon' : 'fa-sun';
        toggle.innerHTML = `<i class="fas ${icon}"></i>`;
    }
    
    // Actualizar gráficas si existen
    if (charts && Object.keys(charts).length > 0) {
        updateChartsTheme(theme);
    }
}

function updateChartsTheme(theme) {
    const chartColors = theme === 'dark' ? {
        text: '#e8e8e8',
        grid: 'rgba(255,255,255,0.1)',
        background: 'rgba(45,45,45,0.8)'
    } : {
        text: '#2c2c2c',
        grid: 'rgba(0,0,0,0.1)',
        background: 'rgba(255,255,255,0.8)'
    };
    
    // Actualizar cada gráfica
    Object.values(charts).forEach(chart => {
        if (chart && chart.options) {
            chart.options.plugins.legend.labels.color = chartColors.text;
            chart.options.scales.x.ticks.color = chartColors.text;
            chart.options.scales.y.ticks.color = chartColors.text;
            chart.options.scales.x.grid.color = chartColors.grid;
            chart.options.scales.y.grid.color = chartColors.grid;
            chart.update();
        }
    });
}

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
    try {
        const res = await fetch(`${API_URL}/pedidos`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.status === 401) return logout();
        if (!res.ok) return;
        const orders = await res.json();
        const container = document.getElementById('orders-grid');
        if (container) container.innerHTML = orders.length ? orders.map(renderOrderCard).join('') : '<p class="text-center text-muted">No hay pedidos activos.</p>';
    } catch (error) {
        console.error("Error cargando pedidos:", error);
    }
}

async function loadMenu() {
    const invRes = await fetch(`${API_URL}/inventory`, { headers: { 'Authorization': `Bearer ${token}` } });
    inventoryList = await invRes.json();

    const res = await fetch(`${API_URL}/products`);
    const products = await res.json();
    productsList = [...(products.hamburguesas || []), ...(products.hotdogs || []), ...(products.extras || [])];

    document.getElementById('menu-table-body').innerHTML = productsList.map(p => `
        <tr>
            <td><img src="${p.imagen || 'https://via.placeholder.com/40'}" width="40" height="40" class="me-2 rounded" style="object-fit: cover;"> ${p.nombre}</td>
            <td><span class="badge bg-primary">${p.categoria}</span></td>
            <td>${p.precios?.['1'] ? `1:$${p.precios['1']} | 2:$${p.precios['2']}` : `$${p.precioUnitario}`}</td>
            <td class="action-column">
                <button class="action-btn" onclick="editProduct('${p.id}')">✏️</button>
                <button class="action-btn" onclick="deleteProduct('${p.id}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

async function loadInventory() {
    const res = await fetch(`${API_URL}/inventory`, { headers: { 'Authorization': `Bearer ${token}` } });
    inventoryList = await res.json();
    document.querySelector('#inventory-table tbody').innerHTML = inventoryList.map(i => `
        <tr>
            <td>${i.nombre}</td>
            <td>${i.cantidad} ${i.unidad}</td>
            <td><span class="badge ${i.cantidad < i.minimo ? 'bg-danger' : 'bg-success'}">${i.cantidad < i.minimo ? 'BAJO' : 'OK'}</span></td>
            <td class="action-column">
                <button class="action-btn" style="background-color:#3498db; margin-right:5px;" onclick="editInventory('${i._id}')">✏️</button>
                <button class="action-btn" onclick="deleteInv('${i._id}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

async function loadUsers() {
    const res = await fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } });
    usersList = await res.json();
    document.querySelector('#users-table tbody').innerHTML = usersList.map(u => `
        <tr>
            <td>${u.username}</td>
            <td><span class="badge bg-secondary">${u.role}</span></td>
            <td class="action-column">
                <button class="action-btn" style="background-color:#3498db; margin-right:5px;" onclick="editUser('${u._id}')">✏️</button>
                ${u.role !== 'admin' ? `<button class="action-btn" onclick="deleteUser('${u._id}')">🗑️</button>` : ''}
            </td>
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

async function setStatus(id, status) {
    try {
        await fetch(`${API_URL}/pedido/${id}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status })
        });
        loadOrders();
    } catch (error) {
        console.error("Error actualizando estado:", error);
    }
}

function saveProduct() {
    const formData = new FormData();
    const id = document.getElementById('p-id').value;
    const isUpdating = !!id;
    formData.append('id', id || 'prod_' + Date.now());
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

    const method = isUpdating ? 'PUT' : 'POST';
    const url = isUpdating ? `${API_URL}/products/${id}` : `${API_URL}/products`;

    fetch(url, {
        method: method,
        headers: { 'Authorization': `Bearer ${token}` }, // Multer se encarga del Content-Type
        body: formData
    }).then(res => res.json()).then(data => {
        if (data.success) {
            bootstrap.Modal.getInstance(document.getElementById('modal-product')).hide();
            loadMenu();
            showToast('Producto guardado correctamente', 'success');
        } else {
            showToast(data.error || 'Error al guardar producto', 'error');
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
    const id = document.getElementById('u-id').value;
    const data = {
        username: document.getElementById('u-name').value,
        password: document.getElementById('u-pass').value,
        role: document.getElementById('u-role').value
    };
    
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/users/${id}` : `${API_URL}/users`;

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
    }).then(() => {
        bootstrap.Modal.getInstance(document.getElementById('modal-user')).hide();
        loadUsers();
        showToast(id ? 'Usuario actualizado' : 'Usuario creado', 'success');
    }).catch(() => showToast('Error al guardar usuario', 'error'));
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

function openUserModal(u = null) {
    document.getElementById('u-id').value = u?._id || '';
    document.getElementById('u-name').value = u?.username || '';
    document.getElementById('u-pass').value = '';
    document.getElementById('u-role').value = u?.role || 'cashier';
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
        // Validación segura para evitar error si insumo es null (producto borrado o error de datos)
        const insumoId = r.insumo ? (r.insumo._id || r.insumo) : null;
        const name = insumoId ? (inventoryList.find(x => x._id === insumoId)?.nombre || 'Insumo no encontrado') : 'Insumo eliminado';

        return `
          <li class="list-group-item" onclick="setActiveItem(this)">
            <span><i class="fas fa-caret-right me-2"></i>${name} <strong class="ms-1">x ${r.cantidad}</strong></span>
            <button class="btn btn-sm btn-outline-danger py-0 px-2 rounded-circle" onclick="event.stopPropagation(); currentRecipe.splice(${i},1); renderRecipeList()">
              <i class="fas fa-times"></i>
            </button>
          </li>`;
    }).join('');
}

function setActiveItem(el) {
    document.querySelectorAll('#recipe-list .list-group-item').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
}

function editProduct(id) { 
    const p = productsList.find(x => x.id === id);
    if (p) openProductModal(p);
}

function editInventory(id) {
    const i = inventoryList.find(x => x._id === id);
    if (i) openInventoryModal(i);
}

function editUser(id) {
    const u = usersList.find(x => x._id === id);
    if (u) openUserModal(u);
}

function logout() {
    localStorage.clear();
    window.location.href = '/';
}

// --- UTILIDADES ---
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '1100';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : 'success'} border-0 show`;
    toast.innerHTML = `
        <div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}