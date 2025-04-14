const Razorpay = require("razorpay");
const Booking = require('../models/bookedSlots');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: "rzp_live_0MtOlXlnQqezZd", // Replace with your Razorpay Key ID
  key_secret: "uLLlp8joAoOmt5NWOWVL77TE", // Replace with your Razorpay Key Secret
});

exports.getPaymentPage = (req, res) => {
    console.log('Payment page');
    res.render('payment-success');
};

//razorpay routes
exports.createOrder = async (req, res) => {
    console.log('Create order');

    try {
        const { amount, currency } = req.body;

        const order = await razorpay.orders.create({
            amount: parseInt(amount), // Amount in paise
            currency: currency,
            receipt: `receipt_${Date.now()}`,
        });

        res.json(order);
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({ success: false, message: "Failed to create order" });
    }
}

// exports.savePayment = async (req, res) => {
//     console.log('Save payment');
//     try {
//         const {
//             paymentId,
//             orderId,
//             signature,
//             name,
//             mobile,
//             title,
//             email,
//             date,
//             timeSlot,
//         } = req.body;

//         // Save payment and booking details
//         const booking = new BookedSlot({
//             name,
//             mobile,
//             title,
//             email,
//             date,
//             timeSlot,
//             paymentId,
//             orderId,
//             paymentStatus: "Success",
//         });

//         await booking.save();

//         res.json({ success: true, message: "Booking and Payment saved successfully." });
//     } catch (error) {
//         console.error("Error saving booking:", error);
//         res.status(500).json({ success: false, message: "Failed to save booking and payment details." });
//     }
// }

exports.savePayment = async (req, res) => {
    console.log('Save payment');
    console.log('req.body is:', req.body);

    try {
        const {
            paymentId,
            orderId,
            signature,
            name,
            mobile,
            title,
            email,
            date,
            timeSlot,
        } = req.body;

        // Validate required fields
        if (!paymentId || !orderId || !signature || !name || !mobile || !title || !email || !date || !timeSlot) {
            return res.status(400).send('All fields are required.');
        }

        // Check if the time slot is already booked for the selected date
        const existingBooking = await Booking.findOne({ date: date, timeSlot });

        if (existingBooking && (existingBooking.status === 'booked' || existingBooking.status === 'rescheduled')) {
            return res.status(400).send('The selected time slot is already booked.');
        }

        // Get the current number of bookings, which gives the last bookingId
        const bookingCount = await Booking.countDocuments();
        const bookingId = bookingCount + 1;  // Increment the bookingId by 1

        // Save payment and booking details
        const booking = new Booking({
            bookingId,         // Generated bookingId
            name,
            mobile,
            title,
            email,
            date,
            timeSlot,
            paymentId,         // Save Razorpay payment ID
            orderId,           // Save Razorpay order ID
            paymentStatus: "Success", // Save payment status (Success or Failed)
        });

        // Save the booking and payment details
        await booking.save();

        res.status(200).json({
            success: true,
            message: "Booking and Payment saved successfully.",
            appointment: {
                bookingId,  // Include the bookingId in the response
                date,
                timeSlot,
                name,
                mobile,
                title,
                email,
                paymentStatus: "Success" // Return payment status
            }
        });

    } catch (error) {
        console.error("Error saving booking:", error);
        res.status(500).json({ success: false, message: "Failed to save booking and payment details." });
    }
};

exports.getBookDetails = async (req, res) => {
    console.log('get booking details');
    try {
        const { name, mobile, date, timeSlot, email, title } = req.query;
    
        if (!name || !mobile || !date || !timeSlot || !email || !title ) {
          return res.status(400).json({ message: "Missing required parameters" });
        }
    
        // Save booking with pending status
        const newBooking = new Booking({ name, mobile, date, timeSlot, email, title });
        await newBooking.save();
    
        // Create a Razorpay order
        const options = {
          amount: amount * 100, // Convert to paise
          currency: "INR",
          receipt: newBooking._id.toString(),
          payment_capture: 1, // Auto-capture payment
        };
    
        const order = await razorpay.orders.create(options);
    
        res.json({
          success: true,
          message: "Redirect to Razorpay Payment Gateway",
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          razorpayKey: process.env.RAZORPAY_KEY_ID,
          redirectUrl: `https://checkout.razorpay.com/v1/checkout.js?order_id=${order.id}&key=${process.env.RAZORPAY_KEY_ID}`,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
}