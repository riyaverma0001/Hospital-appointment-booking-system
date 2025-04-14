const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay')
const paymentController = require('../controllers/paymentController');

const razorpay = new Razorpay({
    key_id: "rzp_live_0MtOlXlnQqezZd",
    key_secret: "uLLlp8joAoOmt5NWOWVL77TE",
  });


router.post('/create-order', paymentController.createOrder)

router.post('/save-payment', paymentController.savePayment)

router.get('/payment-success', paymentController.getPaymentPage);

//for booking
router.get('/pay/book-app', paymentController.getBookDetails);

module.exports = router;