const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const {authenticate} = require('../middleware/authenticate')

// Home page route
router.get('/', authenticate,homeController.getHomePage);

module.exports = router;
