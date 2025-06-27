const request = require("supertest");
const app = require("./../server");

describe("Fitness Function de Rendimiento", () => {
    let server;

    beforeAll(() => {
        server = app.listen(0);
    });

    afterAll((done) => {
        server.close(done);
    });

    it("Debe medir el tiempo de consulta en la base de datos para un producto en particular", async () => {
        const producto = "Proyector Portátil Mini"; 
        const res = await request(server).post("/performance/search/productos").send({ producto });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("productosFilter");
        expect(res.body).toHaveProperty("productosTime");

        const productosTime = parseFloat(res.body.productosTime);
        expect(productosTime).toBeLessThanOrEqual(200);
    });

    it("Debe medir el tiempo de consulta en la base de datos para todos los productos", async () => {
        const res = await request(server).get("/performance/productos/in-stock");
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("productosInStock");
        expect(res.body).toHaveProperty("productsInStockTime");

        const productsInStockTime = parseFloat(res.body.productsInStockTime);
        expect(productsInStockTime).toBeLessThanOrEqual(200);
    });
});