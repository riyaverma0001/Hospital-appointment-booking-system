const express = require('express');
const router = express.Router();
const dateController = require('../controllers/dateController');
const {authenticate} = require('../middleware/authenticate')
const {optionalAuth} = require('../middleware/authenticate')

// Get all available dates route
router.get('/get-available-dates', optionalAuth, dateController.getAvailableDates);

module.exports = router;
