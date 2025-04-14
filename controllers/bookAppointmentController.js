const Booking = require('../models/bookedSlots');
const Slot = require('../models/slotSchema');  // Assuming Slot model is imported
const moment = require('moment');
const User = require('../models/userSchema')

exports.getBookAppointmentPage = async (req, res) => {
    console.log('Book Appointment Page');
    const availableDates = {};
    let message = 'Dates fetched successfully.';
    const timeSlots = [];

    const doctors = await User.find({ role: 'doctor' });

    const baseUrl = req.session.baseUrl || `${req.protocol}://${req.get('host')}`;
    try {
        
        const bookedSlots = await Booking.find({ status: { $in: ['booked', 'rescheduled'] } }).select('date timeSlot -_id');

       
    

        // Create a map of booked slots by date
        const bookedSlotsMap = {};
        bookedSlots.forEach((booking) => {
            const { date, timeSlot } = booking;
            if (!bookedSlotsMap[date]) {
                bookedSlotsMap[date] = new Set();
            }
            bookedSlotsMap[date].add(timeSlot);
        });

        // Fetch available time slots from slotSchema and sort them by startTime
        const slots = await Slot.find({ user: req.user.id, status: 'available' }).sort({ startTime: 1 });

        // Filter out booked slots for each date dynamically
        const availableTimeSlotsByDate = {};
        for (let i = 1; i <= 10; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i); // Increment date by i days

            // Format the date as DD-MM-YYYY
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const formattedDate = `${day}-${month}-${year}`;

            // Create a map of available time slots for the specific date
            let availableSlotsForDate = slots.filter((slot) => {
                const slotKey = `${slot.startTime} - ${slot.endTime}`;
                return !bookedSlotsMap[formattedDate]?.has(slotKey);
            });

            // Sort the available slots for the date by startTime
            availableSlotsForDate = availableSlotsForDate.sort((a, b) => {
                return new Date(`1970-01-01T${a.startTime}`) - new Date(`1970-01-01T${b.startTime}`);
            });

            availableTimeSlotsByDate[formattedDate] = availableSlotsForDate;

            // Add to available dates if there are available slots
            if (availableSlotsForDate.length > 0) {
                availableDates[i] = formattedDate;
            }
        }

        const isReschedule = req.originalUrl.includes('reschedule-appointment');

        // Render the response
        res.render('book-appointment', {
            success: true,
            message: message,
            available_dates: availableDates,
            available_time_slots_by_date: availableTimeSlotsByDate,
            isReschedule,
            userId: req.user.id,
            baseUrl,
            doctors
        });
    } catch (error) {
        // Error handling
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching dates and time slots.',
        });
    }
};

exports.postBookAppointment = async (req, res) => {
    console.log('Post appointment route');
    console.log('req.body is:', req.body);

    try {
        const { name, mobile, title, email, date, timeSlot, userId, doctor } = req.body;

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        req.session.baseUrl = baseUrl;

        if (!date || !timeSlot) {
            const message = 'Date and time slot are required.';
            if (req.query.type === 'json') {
                return res.status(400).json({ success: false, message });
            }
            req.flash('error_msg', message);
            return res.redirect(`/book-appointment/${userId}`);
        }

        if (!userId) {
            const message = 'User ID is required.';
            if (req.query.type === 'json') {
                return res.status(400).json({ success: false, message });
            }
            req.flash('error_msg', message);
            return res.redirect(`/book-appointment/${userId}`);
        }

        const existingBooking = await Booking.findOne({ date, timeSlot });

        if (
            existingBooking &&
            (existingBooking.status === 'booked' || existingBooking.status === 'rescheduled')
        ) {
            const message = 'The selected time slot is already booked.';
            if (req.query.type === 'json') {
                return res.status(409).json({ success: false, message });
            }
            req.flash('error_msg', message);
            return res.redirect(`/book-appointment/${userId}`);
        }

        const bookingCount = await Booking.countDocuments();
        const bookingId = bookingCount + 1;

        const booking = new Booking({
            bookingId,
            date,
            timeSlot,
            name,
            mobile,
            title,
            email,
            status: 'booked',
            user: userId,
            doctor
        });

        await booking.save();

        if (req.query.type === 'json') {
            return res.status(201).json({
                success: true,
                message: 'Appointment booked successfully.',
                booking: {
                    bookingId: booking.bookingId,
                    date: booking.date,
                    timeSlot: booking.timeSlot,
                    status: booking.status,
                },
            });
        }

        req.flash('success_msg', 'Appointment booked successfully.');
        return res.redirect(`/book-appointment/${userId}`);
    } catch (error) {
        console.error('Error booking appointment:', error);
        const message = 'An error occurred while booking the appointment.';
        if (req.query.type === 'json') {
            return res.status(500).json({ success: false, message });
        }
        req.flash('error_msg', message);
        return res.redirect(`/book-appointment/${userId}`);
    }
};

exports.getAllBookings = async (req, res) => {
    console.log('all bookings display page');
    try {
        let filter = {};

        // Check the role and set filter accordingly
        if (req.user.role === 'user') {
            filter.user = req.user.id;
        } else if (req.user.role === 'doctor') {
            filter.doctor = req.user.id;
        }

        // Fetch bookings based on role and sort by date/time
        const bookings = await Booking.find(filter)
            .populate('doctor')
            .sort({ date: 1, timeSlot: 1 });

        if (req.query.type === 'json') {
            res.status(200).json({
                success: true,
                message: 'All bookings fetched successfully.',
                bookings,
            });
        } else {
            res.render('all-bookings', {
                bookings,
                userId: req.user.id,
                userRole: req.user.role,
                baseUrl: `${req.protocol}://${req.get('host')}`,
            });
        }
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.getBooking = async (req, res) => {
    console.log('Get booking route');

    const { mobileNo } = req.params; // Extract mobileNo from the route parameter

    console.log('Mobile number is:', mobileNo);

    if (!mobileNo) {
        return res.status(400).json({ message: 'Mobile number is required.' });
    }

    try {
        // Fetch the booking data using the mobile field
        const booking = await Booking.findOne({ mobile: mobileNo });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found for this mobile number.' });
        }

        res.status(200).json(booking); // Send the booking data
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

exports.cancelBooking = async (req, res) => {
    console.log('Post route works');
    const mobileNo = req.params.mobileNo;

    try {
        const result = await Booking.findOneAndUpdate(
            { mobile: mobileNo },
            { status: 'cancelled' },
            { new: true }
        );

        if (!result) {
            if (req.query.type === 'json') {
                return res.status(404).json({
                    success: false,
                    message: `No booking found for the mobile number: ${mobileNo}`,
                });
            }

            req.flash('error_msg', `No booking found for the mobile number: ${mobileNo}`);
            return res.redirect('/all-bookings');
        }

        if (req.query.type === 'json') {
            return res.json({
                success: true,
                message: 'Booking canceled successfully.',
                booking: {
                    bookingId: result.bookingId,
                    mobile: result.mobile,
                    status: result.status,
                },
            });
        }

        req.flash('success_msg', 'Booking canceled successfully.');
        res.redirect(`/all-bookings/${result.user}`); // You may adjust this redirect as needed

    } catch (error) {
        console.error(error);

        if (req.query.type === 'json') {
            return res.status(500).json({
                success: false,
                message: 'An error occurred while canceling the booking.',
            });
        }

        req.flash('error_msg', 'An error occurred while canceling the booking.');
        res.redirect('/all-bookings');
    }
};


exports.GetRescheduleBooking = async (req, res) => {
    console.log('Book Appointment Page');
    const baseUrl = req.session.baseUrl || `${req.protocol}://${req.get('host')}`;

    const doctors = await User.find({ role: 'doctor' });

    const mobileNo = req.params.mobileNo;
    console.log('mobile no. is: ', mobileNo);

    const availableDates = {};
    let message = 'Dates fetched successfully.';
    const timeSlots = [];

    try {
        // Fetch the booking by mobile number
        
        const booking = await Booking.findOne({ mobile: mobileNo });
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking found for the mobile number: ${mobileNo}`,
            });
        }

        // Fetch all booked slots
        
        const bookedSlots = await Booking.find({
            status: { $in: ['booked', 'rescheduled'] }
        }).select('date timeSlot -_id');

        // Create a map of booked slots by date
        const bookedSlotsMap = {};
        bookedSlots.forEach((booking) => {
            const { date, timeSlot } = booking;
            if (!bookedSlotsMap[date]) {
                bookedSlotsMap[date] = new Set();
            }
            bookedSlotsMap[date].add(timeSlot);
        });

        // Fetch available time slots from slotSchema and sort them by startTime
        const slots = await Slot.find({ user: req.user.id, status: 'available' }).sort({ startTime: 1 });

        // Filter out booked slots for each date dynamically
        const availableTimeSlotsByDate = {};
        for (let i = 1; i <= 10; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i); // Increment date by i days

            // Format the date as DD-MM-YYYY
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const formattedDate = `${day}-${month}-${year}`;

            // Filter available slots for the specific date
            let availableSlotsForDate = slots.filter((slot) => {
                const slotKey = `${slot.startTime} - ${slot.endTime}`;
                return !bookedSlotsMap[formattedDate]?.has(slotKey);
            });

            // Sort the available slots for the date by startTime
            availableSlotsForDate = availableSlotsForDate.sort((a, b) => {
                return new Date(`1970-01-01T${a.startTime}`) - new Date(`1970-01-01T${b.startTime}`);
            });

            availableTimeSlotsByDate[formattedDate] = availableSlotsForDate;

            // Add to available dates if there are available slots
            if (availableSlotsForDate.length > 0) {
                availableDates[i] = formattedDate;
            }
        }

        const isReschedule = req.originalUrl.includes('reschedule-appointment');

        // Render the response
        res.render('book-appointment', {
            success: true,
            message: message,
            available_dates: availableDates,
            available_time_slots_by_date: availableTimeSlotsByDate,
            isReschedule,
            booking,
            baseUrl,
            userId: req.user.id,
            doctors
        });
    } catch (error) {
        console.error('Error:', error.message);

        // Error handling
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching dates and time slots.',
            error: error.message,
        });
    }
};

exports.PostRescheduleBooking = async (req, res) => {
    console.log('Reschedule booking post request');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    req.session.baseUrl = baseUrl;

    const mobileNo = req.params.mobileNo;
    const { date, timeSlot, name, mobile, email, doctor } = req.body;

    try {
        if (!date || !timeSlot) {
            const msg = 'Date and time slot are required.';
            if (req.query.type === 'json') {
                return res.status(400).json({ success: false, message: msg });
            }
            req.flash('error_msg', msg);
            return res.redirect('back');
        }

        const booking = await Booking.findOne({ mobile: mobileNo });
        if (!booking) {
            const msg = `No booking found for the mobile number: ${mobileNo}`;
            if (req.query.type === 'json') {
                return res.status(404).json({ success: false, message: msg });
            }
            req.flash('error_msg', msg);
            return res.redirect('back');
        }

        // Update booking
        booking.date = date;
        booking.timeSlot = timeSlot;
        booking.name = name || booking.name;
        booking.mobile = mobile || booking.mobile;
        booking.email = email || booking.email;
        booking.doctor = doctor || booking.doctor; 
        booking.status = 'rescheduled';

        await booking.save();

        const successMsg = 'Appointment rescheduled successfully!';
        if (req.query.type === 'json') {
            return res.json({
                success: true,
                message: successMsg,
                booking: {
                    bookingId: booking.bookingId,
                    name: booking.name,
                    date: booking.date,
                    timeSlot: booking.timeSlot,
                    status: booking.status,
                    mobile: booking.mobile,
                    email: booking.email
                }
            });
        }

        req.flash('info_msg', successMsg);
        res.redirect(`/all-bookings/${booking.mobile}`);

    } catch (error) {
        console.error('Error rescheduling booking:', error);
        const msg = 'An error occurred while rescheduling the appointment.';
        if (req.query.type === 'json') {
            return res.status(500).json({ success: false, message: msg });
        }
        req.flash('error_msg', msg);
        res.redirect('back');
    }
};
