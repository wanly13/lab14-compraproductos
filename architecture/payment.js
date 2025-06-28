async function processPayment(paymentData) {
    console.log("[PaymentService] Iniciando procesamiento de pago por", paymentData.amount);
    
    return new Promise(resolve => {
        setTimeout(() => {
            const result = {
                success: true,
                transactionId: "txn_" + Date.now(),
                message: "Pago procesado exitosamente."
            };
            console.log("[PaymentService] Pago procesado. Transacción:", result.transactionId);
            resolve(result);
        }, 50);
    });
}

module.exports = { processPayment };