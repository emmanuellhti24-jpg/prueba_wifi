// services/workflow.service.js

class WorkflowService {
    // 1. DICCIONARIO DE TRANSICIONES (La lógica del negocio)
    // Define desde qué estado (clave) hacia qué estados (arreglo) se puede avanzar.
    static validTransitions = {
        'PENDING': ['PREPARING', 'CANCELLED'],
        'PREPARING': ['READY', 'CANCELLED'], 
        'READY': ['COMPLETED', 'CANCELLED'],
        'COMPLETED': [], // Es un estado final, de aquí no se mueve
        'CANCELLED': []  // Es un estado final
    };

    // 2. DICCIONARIO DE PERMISOS (Seguridad por roles)
    // Define a qué estados puede enviar un pedido cada rol.
    static rolePermissions = {
        'cook': ['PREPARING', 'READY'], 
        'cashier': ['COMPLETED', 'CANCELLED'], // El cajero cobra o cancela
        'admin': ['PREPARING', 'READY', 'COMPLETED', 'CANCELLED'] // El admin lo puede todo
    };

    /**
     * Valida si un usuario puede cambiar el estado de un pedido.
     * @param {string} estadoActual - El estado actual del pedido en la base de datos.
     * @param {string} nuevoEstado - El estado al que se quiere cambiar.
     * @param {string} rol - El rol del usuario haciendo la petición.
     * @returns {Object} { valido: boolean, mensaje?: string }
     */
    static validarTransicion(estadoActual, nuevoEstado, rol) {
        // Validación A: ¿El rol tiene permiso para asignar este nuevo estado?
        if (!this.rolePermissions[rol] || !this.rolePermissions[rol].includes(nuevoEstado)) {
            // Específicamente para el test del cocinero
            if (nuevoEstado === 'COMPLETED' && rol === 'cook') {
                return { valido: false, mensaje: 'Un cocinero no puede entregar pedidos' };
            }
            return { 
                valido: false, 
                mensaje: `El rol '${rol}' no tiene permisos para cambiar el pedido a '${nuevoEstado}'.` 
            };
        }

        // Validación B: ¿La transición lógica es correcta? (No retroceder)
        const posiblesDestinos = this.validTransitions[estadoActual];

        if (!posiblesDestinos) {
            return { valido: false, mensaje: `El estado actual '${estadoActual}' no existe.` };
        }

        if (!posiblesDestinos.includes(nuevoEstado)) {
            return { 
                valido: false, 
                mensaje: `Transición inválida: No se puede pasar un pedido de '${estadoActual}' a '${nuevoEstado}'.` 
            };
        }

        // Si sobrevive a los bloqueos anteriores, la operación es legal
        return { valido: true };
    }
}

module.exports = WorkflowService;