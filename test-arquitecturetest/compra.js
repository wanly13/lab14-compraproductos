const {
    iniciarPedido,
    agregarProducto,
    confirmarPedido,
    pagarPedido,
    finalizarPedido,
} = require("../routes/compra");

describe("Critical Path Test del proceso de compra", () => {
    it("debe ejecutar todo el flujo exitosamente", () => {
        const pedido = iniciarPedido();

        agregarProducto(pedido, { id: 1, nombre: "Laptop" });
        agregarProducto(pedido, { id: 2, nombre: "Mouse" });

        confirmarPedido(pedido);
        pagarPedido(pedido);
        const resultado = finalizarPedido(pedido);

        expect(pedido.productos.length).toBe(2);
        expect(pedido.confirmado).toBe(true);
        expect(pedido.pagado).toBe(true);
        expect(resultado).toBe(true);
    });
});
