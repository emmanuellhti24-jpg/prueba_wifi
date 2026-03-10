/**
 * LÓGICA DEL PANEL DE STAFF
 * Autor: Emmanuel
 */

const StaffApp = {
    socket: null,
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role'),
    
    init: function() {
        if (!this.token) {
            window.location.href = '/';
            return;
        }

        // Mostrar Rol en UI
        document.getElementById('user-role-badge').innerText = this.role.toUpperCase();
        
        // Configurar navegación si es Admin
        if (this.role === 'admin') {
            const nav = document.getElementById('nav-tabs');
            nav.innerHTML += `
                <button class="nav-btn" onclick="StaffApp.switchTab('metrics')"><i class="fas fa-chart-line"></i> Métricas</button>
                <button class="nav-btn" onclick="StaffApp.switchTab('inventory')"><i class="fas fa-box"></i> Inventario</button>
            `;
        }

        this.initSocket();
        this.loadOrders();
    },

    initSocket: function() {
        this.socket = io();
        
        this.socket.on('nuevo-pedido', (pedido) => {
            this.playAudio('new');
            this.renderOrderCard(pedido, true); // true = poner al principio
        });

        this.socket.on('actualizacion-pedido', (pedido) => {
            // Remover tarjeta anterior si existe
            const existing = document.getElementById(`order-${pedido._id}`);
            if (existing) existing.remove();
            
            // Si está completo y no soy admin, no lo muestro más
            if (pedido.status === 'COMPLETED' && this.role !== 'admin') return;

            if (pedido.status === 'READY') this.playAudio('ready');
            this.renderOrderCard(pedido);
        });
    },

    loadOrders: async function() {
        try {
            const res = await fetch('/api/pedidos', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (res.status === 401) this.logout();
            
            const pedidos = await res.json();
            const grid = document.getElementById('orders-grid');
            grid.innerHTML = ''; // Limpiar mensaje de carga
            
            pedidos.forEach(p => this.renderOrderCard(p));
        } catch (error) {
            console.error("Error cargando pedidos", error);
        }
    },

    renderOrderCard: function(pedido, prepend = false) {
        // Filtros de vista por Rol
        if (this.role === 'cook' && pedido.status === 'PENDING_PAYMENT') return;
        if (this.role === 'cashier' && (pedido.status === 'IN_KITCHEN' || pedido.status === 'PREPARING')) return;

        const grid = document.getElementById('orders-grid');
        const card = document.createElement('div');
        card.className = 'order-card';
        card.id = `order-${pedido._id}`;

        // Generar Lista de Items HTML
        const itemsHtml = pedido.items.map(item => {
            const mods = item.mods && item.mods.length ? 
                `<div class="text-danger small fst-italic ms-3">⚠️ ${item.mods.join(', ')}</div>` : '';
            return `<li class="mb-1"><strong>${item.qty}x</strong> ${item.nombre} ${mods}</li>`;
        }).join('');

        // Generar Botones según estado
        let buttonsHtml = '';
        if (this.role === 'admin' || this.role === 'cashier') {
            if (pedido.status === 'PENDING_PAYMENT') {
                buttonsHtml = `<button class="btn-action btn-pay" onclick="StaffApp.updateStatus('${pedido._id}', 'IN_KITCHEN')">💰 Cobrar $${pedido.total}</button>`;
            } else if (pedido.status === 'READY') {
                buttonsHtml = `<button class="btn-action btn-pay" onclick="StaffApp.updateStatus('${pedido._id}', 'COMPLETED')">📦 Entregar</button>`;
            }
        }
        if (this.role === 'admin' || this.role === 'cook') {
            if (pedido.status === 'IN_KITCHEN') {
                buttonsHtml = `<button class="btn-action btn-cook" onclick="StaffApp.updateStatus('${pedido._id}', 'PREPARING')">🔥 Cocinar</button>`;
            } else if (pedido.status === 'PREPARING') {
                buttonsHtml = `<button class="btn-action btn-ready" onclick="StaffApp.updateStatus('${pedido._id}', 'READY')">✅ Listo</button>`;
            }
        }

        card.innerHTML = `
            <div class="order-header">
                <span class="order-id">#${pedido.numeroOrden} - ${pedido.cliente}</span>
                <span class="order-time">${new Date(pedido.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div class="status-badge st-${pedido.status}">${pedido.status.replace('_', ' ')}</div>
            <div class="order-body">
                <div class="badge bg-secondary mb-2">${pedido.tipo}</div>
                <ul class="list-unstyled text-white">${itemsHtml}</ul>
            </div>
            <div class="actions">${buttonsHtml}</div>
        `;

        if (prepend) grid.prepend(card);
        else grid.appendChild(card);
    },

    updateStatus: async function(id, status) {
        await fetch(`/api/pedido/${id}/status`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({ status })
        });
    },

    switchTab: function(tabId) {
        document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
        
        document.getElementById(`view-${tabId}`).classList.add('active');
        // lógica simple para activar clase visual en el botón presionado
        event.currentTarget.classList.add('active');
    },

    logout: function() {
        localStorage.clear();
        window.location.href = '/';
    },

    playAudio: function(type) {
        const url = type === 'new' 
            ? 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' 
            : 'https://actions.google.com/sounds/v1/cartoon/pop.ogg';
        new Audio(url).play().catch(e => console.log("Audio bloqueado"));
    }
};

// Iniciar aplicación al cargar
document.addEventListener('DOMContentLoaded', () => StaffApp.init());