// // models/paymentModel.js
// const mongoose = require("mongoose");

// const paymentSchema = new mongoose.Schema({
//   paymentId: { type: String, required: true },
//   orderId: { type: String, required: true },
//   signature: { type: String, required: true },
//   status: { type: String, default: "pending" },  // You can track the payment status
// });

// const Payment = mongoose.model("Payment", paymentSchema);
// module.exports = Payment;