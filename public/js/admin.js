// URL Base API
const API_URL = '/api/inventory';

// --- 1. SEGURIDAD: Fetch con Token ---
async function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Agregar headers
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    const response = await fetch(url, options);

    if (response.status === 401 || response.status === 403) {
        alert("Sesión expirada. Ingresa nuevamente.");
        logout();
        return;
    }

    return response;
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// --- 2. CRUD: Cargar Inventario ---
async function cargarInventario() {
    try {
        const res = await authFetch(API_URL);
        if(!res) return; // Si falló auth

        const data = await res.json();
        const items = data.data || []; 
        
        const tbody = document.getElementById('tabla-inventario');
        tbody.innerHTML = '';

        items.forEach(item => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${item.nombre}</strong></td>
                    <td class="${item.cantidad <= item.stockMinimo ? 'text-danger fw-bold' : 'text-success'}">
                        ${item.cantidad}
                    </td>
                    <td>${item.unidad}</td>
                    <td><span class="badge bg-secondary">${item.seccion}</span></td>
                    <td>$${item.precio || 0}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-info me-2" onclick="editarProducto('${item._id}')">✏️</button>
                        <button class="btn btn-sm btn-danger" onclick="eliminarProducto('${item._id}')">🗑️</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error cargando inventario:", error);
    }
}

// --- 3. CRUD: Crear / Editar ---
const modal = new bootstrap.Modal(document.getElementById('modalProducto'));

function abrirModalCrear() {
    document.getElementById('formProducto').reset();
    document.getElementById('prodId').value = ''; 
    document.getElementById('modalTitulo').innerText = "Nuevo Producto";
    modal.show();
}

// Cargar datos en el modal para editar
window.editarProducto = async (id) => {
    try {
        const res = await authFetch(`${API_URL}`); // Traemos todos y filtramos en local (más rápido para pocos items)
        const data = await res.json();
        const item = data.data.find(i => i._id === id);

        if(item) {
            document.getElementById('prodId').value = item._id;
            document.getElementById('prodNombre').value = item.nombre;
            document.getElementById('prodCantidad').value = item.cantidad;
            document.getElementById('prodUnidad').value = item.unidad;
            document.getElementById('prodPrecio').value = item.precio || 0;
            document.getElementById('prodSeccion').value = item.seccion;
            
            document.getElementById('modalTitulo').innerText = "Editar Producto";
            modal.show();
        }
    } catch (e) { console.error(e); }
};

// Guardar (Submit del form)
document.getElementById('formProducto').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('prodId').value;
    const body = {
        nombre: document.getElementById('prodNombre').value,
        cantidad: document.getElementById('prodCantidad').value,
        unidad: document.getElementById('prodUnidad').value,
        precio: document.getElementById('prodPrecio').value,
        seccion: document.getElementById('prodSeccion').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/${id}` : API_URL;

    try {
        const res = await authFetch(url, {
            method: method,
            body: JSON.stringify(body)
        });

        if (res.ok) {
            modal.hide();
            cargarInventario();
        } else {
            alert("Error guardando producto");
        }
    } catch (error) { console.error(error); }
});

// --- 4. CRUD: Eliminar ---
window.eliminarProducto = async (id) => {
    if(!confirm("¿Seguro que quieres borrar este producto?")) return;

    try {
        const res = await authFetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if(res.ok) cargarInventario();
    } catch (e) { console.error(e); }
};

// Iniciar
document.addEventListener('DOMContentLoaded', cargarInventario);