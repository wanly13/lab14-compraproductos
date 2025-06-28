const request = require("supertest");
const app =require("./../server");

describe("Fitness Function de Resiliencia (Payment API Circuit Breaker)", () => {
    let server;
    let agent;

    const testUser = {
        username: "user_payment_" + Date.now(),
        password: "password123"
    };
    const validPaymentData = {
        paymentMethod: "tarjeta_credito",
        details: { cardNumber: "1234-5678-9012-3456", expiry: "12/25", cvv: "123" },
        amount: 100.00
    };

    beforeAll(async () => {
        server = app.listen(0);
        agent = request.agent(server);

        await agent
            .post("/users/register")
            .send(testUser);
        
        await agent
            .post("/users/login")
            .send(testUser);
    });

    afterAll((done) => {
        server.close(done);
    });

    beforeEach(async () => {
        await agent.post("/payment/reactivate-service");
    });

    it("Pago: N=1 (Caso Exitoso)", async () => {
        await agent.post("/payment/simulate-failures").send({ count: 0 });

        const res = await agent
            .post("/payment/process")
            .send(validPaymentData);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("success", true);
        expect(res.body).toHaveProperty("message", "Pago procesado exitosamente.");
        expect(res.body).toHaveProperty("transactionId");
    });

    it("Pago: N=2 (1 Fallo, 1 Éxito - OK)", async () => {
        await agent.post("/payment/simulate-failures").send({ count: 1 });

        const resFail = await agent
            .post("/payment/process")
            .send(validPaymentData);

        expect(resFail.statusCode).toEqual(502);
        expect(resFail.body.error).toContain("Error de comunicación");

        const resSuccess = await agent
            .post("/payment/process")
            .send(validPaymentData);

        expect(resSuccess.statusCode).toEqual(200);
        expect(resSuccess.body).toHaveProperty("success", true);
    });

    it("Pago: N>=3 (Bad). Bloqueo del servicio después de 3 fallos", async () => {
        await agent.post("/payment/simulate-failures").send({ count: 3 });

        let res = await agent.post("/payment/process").send(validPaymentData);
        expect(res.statusCode).toEqual(502);

        res = await agent.post("/payment/process").send(validPaymentData);
        expect(res.statusCode).toEqual(502);

        res = await agent.post("/payment/process").send(validPaymentData);
        expect(res.statusCode).toEqual(503);
        expect(res.body.error).toContain("Servicio no disponible");
        expect(res.body.message).toContain("El servicio de pagos ha sido desactivado temporalmente.");

        res = await agent.post("/payment/process").send(validPaymentData);
        expect(res.statusCode).toEqual(503);
        expect(res.body.message).toContain("El servicio de pagos está temporalmente desactivado");
    });

    it("Pago: N>=3 (Bad) - Después del bloqueo, no es posible realizar un pago exitoso", async () => {
        await agent.post("/payment/simulate-failures").send({ count: 3 });
        await agent.post("/payment/process").send(validPaymentData);
        await agent.post("/payment/process").send(validPaymentData);
        await agent.post("/payment/process").send(validPaymentData);

        const res = await agent
            .post("/payment/process")
            .send(validPaymentData);

        expect(res.statusCode).toEqual(503);
        expect(res.body.error).toContain("Servicio no disponible");
    });

    it("Pago: Desbloqueo del servicio después del tiempo de bloqueo (simulado con reactivación manual)", async () => {
        await agent.post("/payment/simulate-failures").send({ count: 3 });
        await agent.post("/payment/process").send(validPaymentData);
        await agent.post("/payment/process").send(validPaymentData);
        await agent.post("/payment/process").send(validPaymentData);

        let res = await agent.post("/payment/process").send(validPaymentData);
        expect(res.statusCode).toEqual(503);

        await agent.post("/payment/reactivate-service");

        res = await agent
            .post("/payment/process")
            .send(validPaymentData);
            
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual("Pago procesado exitosamente.");
    });
});
