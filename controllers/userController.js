const User = require('../models/userSchema');
const bcrypt = require('bcryptjs'); // ✅ Import bcrypt
const jwt = require('jsonwebtoken')

exports.getSignupPage = (req, res) => {
    console.log('signup page');
    res.render('signup');
};

exports.getPostSignup = async (req, res) => {
    console.log('post signup');

    const { name, email, password, confirmPassword, role } = req.body;

    // Basic validation
    if (!name || !email || !password || !confirmPassword || !role) {
        const message = 'Please fill in all fields';
        if (req.query.type === 'json') {
            return res.status(400).json({ success: false, message });
        }
        req.flash('error_msg', message);
        return res.redirect('/signup');
    }

    if (password !== confirmPassword) {
        const message = 'Passwords do not match';
        if (req.query.type === 'json') {
            return res.status(400).json({ success: false, message });
        }
        req.flash('error_msg', message);
        return res.redirect('/signup');
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const message = 'Email already registered';
            if (req.query.type === 'json') {
                return res.status(400).json({ success: false, message });
            }
            req.flash('error_msg', message);
            return res.redirect('/signup');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save the new user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role,
        });

        await user.save();

        if (req.query.type === 'json') {
            return res.status(201).json({
                success: true,
                message: 'Signup successful! Please login.',
                userId: user._id
            });
        }

        req.flash('success_msg', 'Signup successful! Please login.');
        return res.redirect('/login');
    } catch (err) {
        console.error('Signup error:', err);
        const message = 'Something went wrong. Please try again.';
        if (req.query.type === 'json') {
            return res.status(500).json({ success: false, message });
        }
        req.flash('error_msg', message);
        return res.redirect('/signup');
    }
};

exports.getLoginPage = (req, res) => {
    console.log('login page');
    res.render('login');
};

exports.postLoginPage = async (req, res) => {
    console.log('post login');
    const { email, password } = req.body;

    if (!email || !password) {
        if (req.query.type === 'json') {
            return res.status(400).json({
                success: false,
                message: 'Please enter both email and password',
            });
        }
        req.flash('error_msg', 'Please enter both email and password');
        return res.redirect('/login');
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            const message = 'Invalid email or password';
            if (req.query.type === 'json') {
                return res.status(401).json({ success: false, message });
            }
            req.flash('error_msg', message);
            return res.redirect('/login');
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            const message = 'Invalid email or password';
            if (req.query.type === 'json') {
                return res.status(401).json({ success: false, message });
            }
            req.flash('error_msg', message);
            return res.redirect('/login');
        }

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET_KEY,
            { expiresIn: '1h' }
        );

        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 1000, // 1 hour
        });

        if (req.query.type === 'json') {
            return res.json({
                success: true,
                message: 'Login successful',
                userId: user._id,
                token, // Include JWT in the response
            });
        } else {
            req.flash('success_msg', 'Login successful!');
            return res.redirect('/');
        }
    } catch (err) {
        console.error('Login error:', err);
        if (req.query.type === 'json') {
            return res.status(500).json({
                success: false,
                message: 'Server error during login',
            });
        }
        req.flash('error_msg', 'Server error during login');
        return res.redirect('/login');
    }
};


exports.logout = (req, res) => {
    // Remove the JWT token from the cookie
    res.clearCookie('authToken');
    if (req.query.type === 'json') {
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully.'
        });
    }else{
        return res.redirect('/login');
    }
}