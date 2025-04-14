const mongoose = require('mongoose');

// Booking schema
const bookedSchema = new mongoose.Schema({
    bookingId: {
        type: Number,
        required: true,
        unique: true
    },
    date: {
        type: String,
        required: true
    },
    timeSlot: {
        type: String,
        required: true
    },
    name: {
        type: String,
    },
    mobile: {
        type: String,
    },
    title: {
        type: String,
    },
    email: {
        type: String,
    },
    status: {
        type: String,
        enum: ["booked", "rescheduled", "cancelled"],
        default: 'booked',
        required: true,
    },
     user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // reference to User model
        required: true
      },
      doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming your model name is 'Doctor'
        required: true
      },          
    paymentId: {
        type:String,
    },
    orderId:{
        type:String,
    },
    paymentStatus: {
        type:String,
    }
});

// Pre-save hook to generate and assign bookingId
bookedSchema.pre('save', async function(next) {
    if (this.isNew) {
        try {
            // Get the current number of bookings, which effectively gives us the last bookingId
            const bookingCount = await Booking.countDocuments();  // Count total bookings
            this.bookingId = bookingCount + 1;  // Increment bookingId by 1
        } catch (error) {
            console.error('Error generating bookingId:', error);
            next(error);  // Pass the error to the next middleware
        }
    }
    next();  // Proceed to save the booking
});

const Booking = mongoose.model('Booking', bookedSchema);
module.exports = Booking;