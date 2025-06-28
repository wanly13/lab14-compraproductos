// services/productService.js
const path = require("path");
const fs = require("fs");

const PRODUCTOS_PATH = path.resolve(__dirname, "../database/products.json");

const loadDB = () => {
    try {
        if (fs.existsSync(PRODUCTOS_PATH)) {
            const data = fs.readFileSync(PRODUCTOS_PATH, "utf8");
            return data ? JSON.parse(data) : [];
        }
        return [];
    } catch (error) {
        console.error("Error al cargar base de datos de productos:", error);
        return [];
    }
};

async function findProductById(productId) {
    console.log("[ProductService] Buscando producto con ID:", productId);
    const productos = loadDB();
    return new Promise(resolve => {
        const product = productos.find(p => p.id === productId);
        resolve(product || null);
    });
}

module.exports = { findProductById };
