const express = require('express');
const router = express.Router();
const bookAppointmentController = require('../controllers/bookAppointmentController');
const {authenticate} = require('../middleware/authenticate')

// Get all available dates route
router.get('/book-appointment/:id', authenticate, bookAppointmentController.getBookAppointmentPage);
router.post('/book-appointment', authenticate, bookAppointmentController.postBookAppointment);

router.get('/all-bookings/:id', authenticate, bookAppointmentController.getAllBookings);
router.get('/get-booking/:mobileNo', authenticate, bookAppointmentController.getBooking);

router.post('/cancel-booking/:mobileNo', authenticate, bookAppointmentController.cancelBooking);

router.get('/reschedule-appointment/:mobileNo', authenticate,bookAppointmentController.GetRescheduleBooking);
router.post('/reschedule-appointment/:mobileNo', authenticate, bookAppointmentController.PostRescheduleBooking);

module.exports = router;