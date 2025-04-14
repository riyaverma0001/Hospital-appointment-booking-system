const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/signup', userController.getSignupPage)
router.post('/signup', userController.getPostSignup)

router.get('/login', userController.getLoginPage)
router.post('/login', userController.postLoginPage)

router.post('/logout', userController.logout)


module.exports = router;