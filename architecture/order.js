
const productService = require('./product');
const paymentService = require('./payment');

function createOrder(session) {
    if (!session.order) {
        session.order = {
            id: "order_" + Date.now(),
            items: [],
            total: 0,
            createdAt: new Date()
        };
        console.log("[OrderService] Pedido creado:", session.order.id);
    }
    return session.order;
}

async function addProductToOrder(session, productId, quantity) {
    if (!session.order) {
        throw new Error("No hay un pedido activo. Por favor, cree uno primero.");
    }

    const product = await productService.findProductById(productId);

    if (!product || product.stock < quantity) {
        throw new Error("Producto no disponible o sin stock suficiente.");
    }

    session.order.items.push({
        productId: product.id,
        name: product.nombre,
        price: product.precio,
        quantity: quantity
    });

    session.order.total = session.order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    console.log("[OrderService] Producto", productId, "agregado al pedido", session.order.id, ". Total actual:", session.order.total);
    return session.order;
}

async function confirmAndPay(session, paymentDetails) {
    if (!session.order || session.order.items.length === 0) {
        throw new Error("El pedido está vacío. No se puede procesar el pago.");
    }

    const orderTotal = session.order.total;
    console.log("[OrderService] Confirmando pedido", session.order.id, "por un total de", orderTotal);

    const paymentResult = await paymentService.processPayment({
        ...paymentDetails,
        amount: orderTotal
    });

    console.log("[OrderService] Pago exitoso para el pedido", session.order.id, ". Transacción:", paymentResult.transactionId);
    
    const completedOrder = session.order;
    session.order = null;

    return {
        success: true,
        message: "Pedido completado y pagado exitosamente.",
        order: completedOrder,
        transaction: paymentResult
    };
}

module.exports = {
    createOrder,
    addProductToOrder,
    confirmAndPay
};
