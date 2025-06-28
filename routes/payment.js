const express = require("express");
const router = express.Router();

let apiStatus = {
    consecutiveFails: 0,
    isLocked: false,
    lastFailTimestamp: null,
    failuresToSimulate: 0
};

const MAX_API_FAILS = 3;
const LOCKOUT_TIME = 2 * 60 * 1000;

const simulateBankApiCall = (paymentMethod, details, amount) => {
    console.log("[API Bancaria] Intentando procesar pago de " + amount + " con " + paymentMethod);

    return new Promise((resolve, reject) => {
        const networkDelay = Math.random() * 500 + 500;
        setTimeout(() => {
            if (!paymentMethod || !details || typeof amount !== 'number' || amount <= 0) {
                return reject({ type: "USER_INPUT_ERROR", message: "Datos de pago inválidos. Verifique el monto y los detalles." });
            }
            const supportedMethods = ["tarjeta_credito", "paypal", "transferencia"];
            if (!supportedMethods.includes(paymentMethod)) {
                return reject({ type: "USER_INPUT_ERROR", message: "El método de pago '" + paymentMethod + "' no está soportado." });
            }

            if (apiStatus.failuresToSimulate > 0) {
                apiStatus.failuresToSimulate--;
                console.error("[API Bancaria] Fallo de conexión FORZADO por simulación.");
                return reject({ type: "API_CONNECTION_ERROR", message: "No se pudo conectar con el servicio bancario." });
            }
            if (Math.random() < 0.20) {
                console.error("[API Bancaria] Fallo de conexión ALEATORIO.");
                return reject({ type: "API_CONNECTION_ERROR", message: "No se pudo conectar con el servicio bancario." });
            }

            const transactionId = "txn_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11);
            console.log("[API Bancaria] Pago aprobado. ID de transacción: " + transactionId);
            resolve({
                success: true,
                transactionId: transactionId,
                message: "Pago procesado exitosamente."
            });
        }, networkDelay);
    });
};

const checkApiStatus = (req, res, next) => {
    if (apiStatus.isLocked) {
        const timeSinceLockout = Date.now() - apiStatus.lastFailTimestamp;

        if (timeSinceLockout < LOCKOUT_TIME) {
            const timeLeft = Math.ceil((LOCKOUT_TIME - timeSinceLockout) / 1000);
            console.warn("[Sistema] Petición bloqueada. La API está temporalmente fuera de servicio.");
            return res.status(503).json({
                error: "Servicio no disponible",
                message: "El servicio de pagos está temporalmente desactivado debido a problemas de conexión. Por favor, intente de nuevo en aproximadamente " + timeLeft + " segundos."
            });
        } else {
            console.log("[Sistema] El tiempo de bloqueo ha expirado. Reactivando el servicio de pagos.");
            apiStatus.isLocked = false;
            apiStatus.consecutiveFails = 0;
            apiStatus.lastFailTimestamp = null;
        }
    }
    next();
};

router.post("/process", checkApiStatus, async (req, res) => {
    if (!req.session.user || !req.session.user.username) {
        return res.status(401).json({ error: "Acceso no autorizado. Debe iniciar sesión." });
    }

    const { paymentMethod, details, amount } = req.body;

    try {
        const result = await simulateBankApiCall(paymentMethod, details, amount);

        if (apiStatus.consecutiveFails > 0) {
            console.log("[Sistema] La conexión con la API bancaria se ha restablecido.");
            apiStatus.consecutiveFails = 0;
            apiStatus.lastFailTimestamp = null;
        }
        
        res.status(200).json(result);

    } catch (error) {
        if (error.type === 'API_CONNECTION_ERROR') {
            apiStatus.consecutiveFails++;
            apiStatus.lastFailTimestamp = Date.now();
            console.error("[Sistema] Fallo de conexión a la API N°: " + apiStatus.consecutiveFails);

            if (apiStatus.consecutiveFails >= MAX_API_FAILS) {
                apiStatus.isLocked = true;
                console.error("[Sistema] LÍMITE ALCANZADO. Bloqueando el servicio de pagos por " + (LOCKOUT_TIME / 1000) + " segundos.");
                return res.status(503).json({
                    error: "Servicio no disponible",
                    message: "El servicio de pagos ha sido desactivado temporalmente. Intente más tarde."
                });
            }

            return res.status(502).json({
                error: "Error de comunicación",
                message: "No pudimos procesar su pago en este momento debido a un problema con nuestro proveedor bancario. Por favor, inténtelo de nuevo en unos momentos."
            });
        } 
        
        if (error.type === 'USER_INPUT_ERROR') {
            return res.status(400).json({
                error: "Datos incorrectos",
                message: error.message
            });
        }

        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

router.post("/simulate-failures", (req, res) => {
    const { count } = req.body;
    if (typeof count !== 'number' || count < 0 || !Number.isInteger(count)) {
        return res.status(400).json({ error: "El parámetro 'count' debe ser un número entero no negativo." });
    }
    
    apiStatus.failuresToSimulate = count;
    apiStatus.consecutiveFails = 0;
    apiStatus.isLocked = false;
    apiStatus.lastFailTimestamp = null;

    console.log("[Simulación] Se simularán " + count + " fallos de conexión consecutivos.");
    res.status(200).json({ message: "Simulación activada. La API fallará en la conexión las próximas " + count + " veces." });
});

router.post("/reactivate-service", (req, res) => {
    console.log("[Sistema] El servicio de pagos ha sido reactivado manualmente.");
    apiStatus.consecutiveFails = 0;
    apiStatus.isLocked = false;
    apiStatus.lastFailTimestamp = null;
    apiStatus.failuresToSimulate = 0;
    res.status(200).json({ message: "El servicio de pagos ha sido reactivado." });
});

module.exports = router;