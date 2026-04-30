const WorkflowService = require('../../services/workflow.service');

describe('Workflow Service - Validar Transiciones de Estado', () => {

    test('Un cocinero (cook) NO debe poder cambiar un pedido a COMPLETED', () => {
        const resultado = WorkflowService.validarTransicion('READY', 'COMPLETED', 'cook');
        
        expect(resultado.valido).toBe(false);
        expect(resultado.mensaje).toBe('Un cocinero no puede entregar pedidos');
    });

    test('Un cajero (cashier) SÍ debe poder cambiar un pedido a COMPLETED', () => {
        const resultado = WorkflowService.validarTransicion('READY', 'COMPLETED', 'cashier');
        
        expect(resultado.valido).toBe(true);
    });

    test('NO se debe permitir retroceder un pedido de READY a PREPARING', () => {
        const resultado = WorkflowService.validarTransicion('READY', 'PREPARING', 'admin');
        
        expect(resultado.valido).toBe(false);
    });

    test('SÍ se debe permitir avanzar un pedido de PREPARING a READY', () => {
        const resultado = WorkflowService.validarTransicion('PREPARING', 'READY', 'cook');
        
        expect(resultado.valido).toBe(true);
    });
});