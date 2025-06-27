function iniciarPedido() {
    console.log("Pedido iniciado");
    return { productos: [], confirmado: false, pagado: false };
}

function agregarProducto(pedido, producto) {
    pedido.productos.push(producto);
    console.log("Producto agregado:", producto);
}

function confirmarPedido(pedido) {
    if (!pedido.productos.length) throw new Error("No hay productos");
    pedido.confirmado = true;
    console.log("Pedido confirmado");
}

function pagarPedido(pedido) {
    if (!pedido.confirmado) throw new Error("Pedido no confirmado");
    pedido.pagado = true;
    console.log("Pedido pagado");
}

function finalizarPedido(pedido) {
    if (!pedido.pagado) throw new Error("Pedido no pagado");
    console.log("Pedido finalizado con éxito");
    return true;
}

module.exports = {
    iniciarPedido,
    agregarProducto,
    confirmarPedido,
    pagarPedido,
    finalizarPedido,
};
