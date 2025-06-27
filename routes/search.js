const express = require("express");
const router = express.Router();
const { performance } = require("perf_hooks");
const path = require("path");
const fs = require("fs");

const PRODUCTOS_PATH = path.resolve(__dirname, "../database/productos.json");

const loadDB = (dbPath) => {
    try {
        if (fs.existsSync(dbPath)) {
            const data = fs.readFileSync(dbPath, "utf8");
            return data ? JSON.parse(data) : [];
        }
        return [];
    } catch (error) {
        console.error("Error al cargar base de datos:", dbPath, error);
        return [];
    }
};

router.get("/productos/in-stock", (req, res) => {
    const start = performance.now();
    const productos = loadDB(PRODUCTOS_PATH);
    const productosInStock = productos.filter((item) => item.stock > 0);
    const productsInStockTime = performance.now() - start;

    res.json({
        productosInStock,
        productsInStockTime: productsInStockTime.toFixed(2).toString() + "ms",
    });
});

router.post("/search/productos", (req, res) => {
    const { producto } = req.body;
    if (!producto) return res.status(400).json({ error: "Producto es requerido" });

    const start = performance.now();
    const productos = loadDB(PRODUCTOS_PATH);
    const productosFilter = productos.filter((item) => item.nombre.includes(producto));
    const productosTime = performance.now() - start;

    res.json({
        productosFilter,
        productosTime: productosTime.toFixed(2).toString() + "ms",
    });
});

module.exports = router;