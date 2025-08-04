const express = require('express');
const router = express.Router();
const { createBooking, getBookings, overrideAvailability } = require('../controllers/bookingController');

router.post('/', createBooking);         // Create a booking
router.get('/', getBookings);            // Get all bookings
router.post('/override', overrideAvailability);  // Override slots (admin)

module.exports = router;
