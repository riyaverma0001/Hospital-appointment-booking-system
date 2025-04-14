const Slot = require('../models/slotSchema');
const Booking = require('../models/bookedSlots');

// exports.getSlotsPage = async (req, res) => {
//     try {
//         const userId = req.params.id; // Get the user ID from URL
//         const selectedDate = req.query.date;
//         console.log('req.date:' , selectedDate)
//         console.log('user id:', userId)
//         // Fetch all available slots
//         const slots = await Slot.find({ user: userId }).sort({ startTime: 1 });
//         const availSlots = await Slot.find({ user: userId, status: 'available' }).sort({ startTime: 1 });

//         const totalSlots = await Slot.countDocuments({ user: userId });
//         const timezone = 'India';
//         const date = req.query.date; // Get the date from query parameter

//         let availableSlots;

//         const availableDates = {};
//         for (let i = 1; i <= 10; i++) {
//             const date = new Date();
//             date.setDate(date.getDate() + i);
//             const day = String(date.getDate()).padStart(2, '0');
//             const month = String(date.getMonth() + 1).padStart(2, '0');
//             const year = date.getFullYear();
//             const formattedDate = `${day}-${month}-${year}`;
//             availableDates[i] = formattedDate;
//         }

//         if (date) {
//             // Fetch booked or rescheduled slots for the given date
//             const bookedSlots = await Booking.find({
//                 date: date,
//                 status: { $in: ["booked", "rescheduled"] },
//             });

//             // Extract booked time slots (e.g., "9:00 AM - 9:30 AM")
//             const bookedTimeSlots = bookedSlots.map(slot => slot.timeSlot);

//             // Filter out slots that are in the booked or rescheduled list
//             availableSlots = availSlots.filter(slot => {
//                 const slotTime = `${slot.startTime} - ${slot.endTime}`;
//                 return !bookedTimeSlots.includes(slotTime);
//             });
//         } else {
//             availableSlots = availSlots;
//         }

//         const formattedSlots = availableSlots.map(slot => ({
//             slot: `${slot.startTime} - ${slot.endTime}`,
//         }));

//         if (req.query.type === 'json') {
//             res.json({
//                 success: true,
//                 userId,
//                 date: date || null,
//                 timezone: timezone,
//                 available_slots: formattedSlots,
//                 selectedDate
//             });
//         } else {
//             res.render('slots', { available_dates: availableDates,slots, selectedDate, totalSlots, userId,  baseUrl: `${req.protocol}://${req.get('host')}`  });
//         }

//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Error fetching slots');
//     }
// };


exports.getSlotsPage = async (req, res) => {
    try {
        const userId = req.params.id;
        const selectedDate = req.query.date;
        const timezone = 'India';

        console.log('Selected Date:', selectedDate);
        console.log('User ID:', userId);

        // Base filter for all available slots
        const filter = { user: userId, status: 'available' };
        if (selectedDate) {
            filter.date = selectedDate; // Add date conditionally
        }

        // Fetch only the relevant available slots (filtered by date if present)
        const availSlots = await Slot.find(filter).sort({ startTime: 1 });

        // Count all slots for rendering
        const totalSlots = await Slot.countDocuments({ user: userId });

        // Generate upcoming available dates
        const availableDates = {};
        for (let i = 1; i <= 10; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const formattedDate = `${day}-${month}-${year}`;
            availableDates[i] = formattedDate;
        }

        let availableSlots = [];

        if (selectedDate) {
            // Get booked or rescheduled slots for that date
            const bookedSlots = await Booking.find({
                date: selectedDate,
                status: { $in: ["booked", "rescheduled"] },
            });

            const bookedTimeSlots = bookedSlots.map(slot => slot.timeSlot);

            // Filter out booked/rescheduled time slots
            availableSlots = availSlots.filter(slot => {
                const slotTime = `${slot.startTime} - ${slot.endTime}`;
                return !bookedTimeSlots.includes(slotTime);
            });
        } else {
            // No date provided, return all available slots
            availableSlots = availSlots;
        }

        // Format for JSON output
        const formattedSlots = availableSlots.map(slot => ({
            slot: `${slot.startTime} - ${slot.endTime}`,
        }));

        // Return JSON if requested
        if (req.query.type === 'json') {
            return res.json({
                success: true,
                userId,
                date: selectedDate || null,
                timezone,
                available_slots: formattedSlots,
                
            });
        }

        // If rendering page, also fetch all slots (not just available)
        const slots = await Slot.find({ user: userId }).sort({ startTime: 1 });

        return res.render('slots', {
            available_dates: availableDates,
            slots,
            selectedDate,
            totalSlots,
            userId,
            baseUrl: `${req.protocol}://${req.get('host')}`,
            selectedDate
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching slots');
    }
};

// Helper function to format time in HH:MM AM/PM format
function formatTime(time) {
    const [hour, minute] = time.split(':');
    const hour12 = (hour % 12) || 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    return `${hour12}:${minute} ${ampm}`;
}

exports.PostAddSlots = async (req, res) => {
    console.log('Add Slot route');
    console.log(req.body); 

    const { start_time, end_time, status, date } = req.body;

    try {
        const newSlot = new Slot({
            date,
            startTime: start_time,
            endTime: end_time,
            status,
            user: req.user.id
        });

        await newSlot.save();

        if (req.query.type === 'json') {
            return res.status(201).json({
                success: true,
                message: 'Slot added successfully!',
                slot: newSlot,
                baseUrl: `${req.protocol}://${req.get('host')}` 
            });
        }

        req.flash('success_msg', 'Slot added successfully!');
        res.redirect(`/available-slots/${req.user.id}`);
    } catch (error) {
        console.error('Error adding slot:', error);
        
        if (req.query.type === 'json') {
            return res.status(500).json({
                success: false,
                message: 'Failed to add slot. Please try again.'
            });
        }

        req.flash('error_msg', 'Failed to add slot. Please try again.');
        res.redirect(`/available-slots/${req.user.id}`);
    }
};

exports.PostDeleteSlot = async (req, res) => {
    console.log('Delete slot route');
    const { slotId } = req.body;
    console.log('Slot ID:', slotId);  

    try {
        const slot = await Slot.findById(slotId);
        if (!slot) {
            if (req.query.type === 'json') {
                return res.status(404).json({
                    success: false,
                    message: 'Slot not found.'
                });
            }

            req.flash('error_msg', 'Slot not found.');
            return res.redirect(`/available-slots/${req.user.id}`);
        }

        await Slot.findByIdAndDelete(slotId);

        if (req.query.type === 'json') {
            return res.status(200).json({
                success: true,
                message: 'Slot deleted successfully.'
            });
        }

        req.flash('error_msg', 'Slot deleted successfully.');
        res.redirect(`/available-slots/${req.user.id}`);
    } catch (error) {
        console.error('Error deleting slot:', error);

        if (req.query.type === 'json') {
            return res.status(500).json({
                success: false,
                message: 'Error deleting slot. Please try again.'
            });
        }

        req.flash('error_msg', 'Error deleting slot. Please try again.');
        res.redirect(`/available-slots/${req.user.id}`);
    }
};
