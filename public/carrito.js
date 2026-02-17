function obtenerCarrito() {
  return JSON.parse(localStorage.getItem('carrito')) || [];
}

function guardarCarrito(carrito) {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

function actualizarContador() {
  const carrito = obtenerCarrito();
  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  document.getElementById('contadorCarrito').innerText = totalItems;
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

document.addEventListener('DOMContentLoaded', actualizarContador);

</textarea>
<button onclick='agregarAlCarrito({
  _id: "123",
  nombre: "Hamburguesa Clásica",
  precio: 120
})'>
  Pedir
</button>