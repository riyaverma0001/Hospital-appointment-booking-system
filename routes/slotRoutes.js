const express = require('express');
const router = express.Router();
const slotController = require('../controllers/slotController');
const {authenticate} = require('../middleware/authenticate')
const {optionalAuth} = require('../middleware/authenticate')
//slots page route
// router.get('/available-slots', authenticate, slotController.getSlotsPage);
router.get('/available-slots/:id', optionalAuth, slotController.getSlotsPage);


router.post('/add-slot', authenticate,slotController.PostAddSlots);
router.post('/delete-slot', authenticate , slotController.PostDeleteSlot);

module.exports = router;