/**
 * SERVICIO DE WORKFLOW DE PEDIDOS
 * Gestiona transiciones de estado con validación de roles
 * 
 * Estados: PENDING_PAYMENT → IN_KITCHEN → PREPARING → READY → COMPLETED
 */

// Definición de estados y transiciones permitidas
const ESTADOS = {
    PENDING_PAYMENT: 'PENDING_PAYMENT',  // Recibido (esperando pago)
    IN_KITCHEN: 'IN_KITCHEN',            // En cocina (pagado)
    PREPARING: 'PREPARING',              // Preparando
    READY: 'READY',                      // Listo para entregar
    COMPLETED: 'COMPLETED'               // Entregado
};

// Mapeo de estados legibles
const ESTADOS_LEGIBLES = {
    PENDING_PAYMENT: 'Recibido',
    IN_KITCHEN: 'En Cocina',
    PREPARING: 'Preparando',
    READY: 'Listo',
    COMPLETED: 'Entregado'
};

// Transiciones permitidas por rol
const TRANSICIONES_POR_ROL = {
    cashier: {
        PENDING_PAYMENT: ['IN_KITCHEN'],     // Cajero: recibido → en cocina (cobra)
        READY: ['COMPLETED']                  // Cajero: listo → entregado
    },
    cook: {
        IN_KITCHEN: ['PREPARING'],            // Cocina: en cocina → preparando
        PREPARING: ['READY']                  // Cocina: preparando → listo
    },
    admin: {
        // Admin puede hacer cualquier transición
        PENDING_PAYMENT: ['IN_KITCHEN', 'PREPARING', 'READY', 'COMPLETED'],
        IN_KITCHEN: ['PREPARING', 'READY', 'COMPLETED'],
        PREPARING: ['READY', 'COMPLETED'],
        READY: ['COMPLETED']
    }
};

/**
 * Valida si una transición de estado es permitida para un rol
 * @param {string} estadoActual - Estado actual del pedido
 * @param {string} nuevoEstado - Estado al que se quiere transicionar
 * @param {string} rol - Rol del usuario (admin, cashier, cook)
 * @returns {Object} { valido: boolean, mensaje: string }
 */
function validarTransicion(estadoActual, nuevoEstado, rol) {
    // Validar que los estados existan
    if (!ESTADOS[estadoActual]) {
        return {
            valido: false,
            mensaje: `Estado actual inválido: ${estadoActual}`
        };
    }

    if (!ESTADOS[nuevoEstado]) {
        return {
            valido: false,
            mensaje: `Estado nuevo inválido: ${nuevoEstado}`
        };
    }

    // No permitir retroceder estados
    const ordenEstados = Object.keys(ESTADOS);
    const indexActual = ordenEstados.indexOf(estadoActual);
    const indexNuevo = ordenEstados.indexOf(nuevoEstado);

    if (indexNuevo < indexActual) {
        return {
            valido: false,
            mensaje: 'No se puede retroceder estados'
        };
    }

    // Si es el mismo estado, no hacer nada
    if (estadoActual === nuevoEstado) {
        return {
            valido: false,
            mensaje: 'El pedido ya está en ese estado'
        };
    }

    // Validar permisos por rol
    const transicionesPermitidas = TRANSICIONES_POR_ROL[rol];
    
    if (!transicionesPermitidas) {
        return {
            valido: false,
            mensaje: `Rol inválido: ${rol}`
        };
    }

    const estadosPermitidos = transicionesPermitidas[estadoActual];
    
    if (!estadosPermitidos || !estadosPermitidos.includes(nuevoEstado)) {
        return {
            valido: false,
            mensaje: `El rol ${rol} no puede cambiar de ${ESTADOS_LEGIBLES[estadoActual]} a ${ESTADOS_LEGIBLES[nuevoEstado]}`
        };
    }

    return {
        valido: true,
        mensaje: 'Transición válida'
    };
}

/**
 * Obtiene los siguientes estados posibles para un pedido según el rol
 * @param {string} estadoActual - Estado actual del pedido
 * @param {string} rol - Rol del usuario
 * @returns {Array} Lista de estados posibles
 */
function obtenerSiguientesEstados(estadoActual, rol) {
    const transicionesPermitidas = TRANSICIONES_POR_ROL[rol];
    
    if (!transicionesPermitidas || !transicionesPermitidas[estadoActual]) {
        return [];
    }

    return transicionesPermitidas[estadoActual].map(estado => ({
        codigo: estado,
        nombre: ESTADOS_LEGIBLES[estado]
    }));
}

/**
 * Obtiene el flujo completo de estados
 * @returns {Array} Flujo de estados
 */
function obtenerFlujoCompleto() {
    return Object.keys(ESTADOS).map(estado => ({
        codigo: estado,
        nombre: ESTADOS_LEGIBLES[estado]
    }));
}

/**
 * Verifica si un estado es final
 * @param {string} estado - Estado a verificar
 * @returns {boolean}
 */
function esFinal(estado) {
    return estado === ESTADOS.COMPLETED;
}

/**
 * Obtiene el color asociado a un estado (para UI)
 * @param {string} estado - Estado del pedido
 * @returns {string} Color en formato hex
 */
function obtenerColorEstado(estado) {
    const colores = {
        PENDING_PAYMENT: '#FFC107',  // Amarillo
        IN_KITCHEN: '#FF9800',       // Naranja
        PREPARING: '#2196F3',        // Azul
        READY: '#4CAF50',            // Verde
        COMPLETED: '#9E9E9E'         // Gris
    };
    return colores[estado] || '#000000';
}

/**
 * Obtiene el icono asociado a un estado (para UI)
 * @param {string} estado - Estado del pedido
 * @returns {string} Emoji o icono
 */
function obtenerIconoEstado(estado) {
    const iconos = {
        PENDING_PAYMENT: '💰',
        IN_KITCHEN: '🍳',
        PREPARING: '👨‍🍳',
        READY: '✅',
        COMPLETED: '📦'
    };
    return iconos[estado] || '📋';
}

module.exports = {
    ESTADOS,
    ESTADOS_LEGIBLES,
    TRANSICIONES_POR_ROL,
    validarTransicion,
    obtenerSiguientesEstados,
    obtenerFlujoCompleto,
    esFinal,
    obtenerColorEstado,
    obtenerIconoEstado
};
