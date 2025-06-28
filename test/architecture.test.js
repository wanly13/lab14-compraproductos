const orderService = require("../architecture/order");
const productService = require("../architecture/product");
const paymentService = require("../architecture/payment");

jest.mock("../architecture/product");
jest.mock("../architecture/payment");

describe("Architecture Test: Critical Path de Pedidos", () => {

    beforeEach(() => {
        productService.findProductById.mockClear();
        paymentService.processPayment.mockClear();
    });

    it("debe llamar a los servicios de producto y pago en la secuencia correcta", async () => {
        const mockSession = { user: { id: "user123" } };

        const mockProduct = {
            id: "prod_abc",
            nombre: "Laptop Pro",
            precio: 1500,
            stock: 10
        };
        const mockPaymentResult = {
            success: true,
            transactionId: "txn_mock_12345"
        };

        productService.findProductById.mockResolvedValue(mockProduct);
        paymentService.processPayment.mockResolvedValue(mockPaymentResult);


        orderService.createOrder(mockSession);
        await orderService.addProductToOrder(mockSession, "prod_abc", 1);
        const finalResult = await orderService.confirmAndPay(mockSession, {
            paymentMethod: "tarjeta_credito",
            details: "..."
        });

        expect(productService.findProductById).toHaveBeenCalledTimes(1);
        expect(productService.findProductById).toHaveBeenCalledWith("prod_abc");

        expect(paymentService.processPayment).toHaveBeenCalledTimes(1);

        expect(paymentService.processPayment).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 1500,
                paymentMethod: "tarjeta_credito"
            })
        );
        
        expect(finalResult.success).toBe(true);
        expect(finalResult.message).toContain("Pedido completado");
        expect(finalResult.transaction.transactionId).toBe("txn_mock_12345");
    });
});
