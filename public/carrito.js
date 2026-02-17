function obtenerCarrito() {
  return JSON.parse(localStorage.getItem('carrito')) || [];
}

function guardarCarrito(carrito) {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

function actualizarContador() {
  const carrito = obtenerCarrito();
  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  const contador = document.getElementById('contadorCarrito');
  const carritoFloat = document.querySelector('.carrito-float');
  
  if (contador) {
    contador.innerText = totalItems;
  }
  
  // Lógica de visibilidad inteligente del carrito
  if (carritoFloat) {
    if (totalItems > 0) {
      carritoFloat.classList.add('has-items');
    } else {
      carritoFloat.classList.remove('has-items');
    }
    
    // Actualizar visibilidad según pantalla actual
    actualizarVisibilidadCarrito();
  }
}

/**
 * DEBOUNCE UTILITY - Performance optimization
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * CARRITO FAB - SOLO MENÚ HAMBURGUESAS
 */
function actualizarVisibilidadCarrito() {
  const carritoFloat = document.querySelector('.carrito-float');
  if (!carritoFloat) return;
  
  const body = document.body;
  
  // PERFORMANCE: Cache DOM queries
  const menuGrid = document.querySelector('#menu-grid');
  const currentStep = document.querySelector('.step-container:not(.hidden)');
  
  // Detectar si estamos en el menú de hamburguesas específicamente
  const isHamburgerMenu = menuGrid && 
                         !menuGrid.classList.contains('hidden') &&
                         currentStep && 
                         currentStep.id === 'step-menu';
  
  // PERFORMANCE: Solo cambiar clases si es necesario
  const hadHamburgerClass = body.classList.contains('hamburger-menu');
  
  // Limpiar todas las clases de estado
  body.classList.remove('hamburger-menu', 'welcome-screen', 'order-complete', 'admin-mode');
  
  // Aplicar clase solo si estamos en menú de hamburguesas
  if (isHamburgerMenu) {
    body.classList.add('hamburger-menu');
  } else if (body.classList.contains('staff-mode')) {
    body.classList.add('admin-mode');
  } else if (body.classList.contains('order-complete')) {
    body.classList.add('order-complete');
  } else {
    body.classList.add('welcome-screen');
  }
  
  // PERFORMANCE: Solo trigger reflow si cambió el estado
  if (hadHamburgerClass !== body.classList.contains('hamburger-menu')) {
    carritoFloat.offsetHeight; // Force reflow solo si cambió
  }
}

// DEBOUNCED VERSION para eventos frecuentes
const actualizarVisibilidadCarritoDebounced = debounce(actualizarVisibilidadCarrito, 250);

/**
 * Ocultar carrito después de completar orden
 */
function ocultarCarritoPostOrden() {
  const carritoFloat = document.querySelector('.carrito-float');
  if (carritoFloat) {
    document.body.classList.add('order-complete');
    
    // Animación de confetti (opcional)
    setTimeout(() => {
      carritoFloat.style.animation = 'none';
    }, 1000);
  }
}

function agregarAlCarrito(producto) {
  let carrito = obtenerCarrito();

  const existente = carrito.find(p => p.productId === producto._id);

  if (existente) {
    existente.cantidad++;
  } else {
    carrito.push({
      productId: producto._id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1
    });
  }

  guardarCarrito(carrito);
  actualizarContador();
  abrirCarrito();
}

function abrirCarrito() {
  document.getElementById('carritoPanel').classList.add('abierto');
  renderCarrito();
}

function cerrarCarrito() {
  document.getElementById('carritoPanel').classList.remove('abierto');
}

function renderCarrito() {
  const carrito = obtenerCarrito();
  const contenedor = document.getElementById('carritoContenido');
  contenedor.innerHTML = '';
  let total = 0;

  carrito.forEach(p => {
    total += p.precio * p.cantidad;

    contenedor.innerHTML += `
      <div style="margin-bottom:10px;">
        <strong>${p.nombre}</strong>
        <p>$${p.precio} x ${p.cantidad}</p>
      </div>
    `;
  });

  document.getElementById('totalCarrito').innerText = total;
}

function confirmarPedido() {
  alert("Pedido confirmado 🎉");
  localStorage.removeItem('carrito');
  actualizarContador();
  renderCarrito();
}

// INICIALIZACIÓN OPTIMIZADA
document.addEventListener('DOMContentLoaded', () => {
  actualizarContador();
  
  // Observer OPTIMIZADO para detectar cambios de pantalla
  const observer = new MutationObserver(debounce(() => {
    actualizarVisibilidadCarrito();
  }, 100)); // Debounce a 100ms para mejor responsividad
  
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['class'], // Solo observar cambios de clase
    // Removido childList y subtree para mejor performance
  });
  
  // PERFORMANCE: Eventos optimizados
  window.addEventListener('resize', actualizarVisibilidadCarritoDebounced);
  
  // PERFORMANCE: Intersection Observer para visibilidad
  if ('IntersectionObserver' in window) {
    const menuObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.target.id === 'menu-grid') {
          // Solo actualizar cuando el menú entra/sale del viewport
          actualizarVisibilidadCarritoDebounced();
        }
      });
    }, { threshold: 0.1 });
    
    // Observar el menú cuando esté disponible
    const menuGrid = document.getElementById('menu-grid');
    if (menuGrid) {
      menuObserver.observe(menuGrid);
    }
  }
});