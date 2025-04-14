const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
    const token = req.cookies.authToken;

    if (!token) {
        // No token, continue without setting req.user
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded; // Attach user info if token is valid
    } catch (err) {
        // Invalid token — skip setting req.user but don't block access
        console.warn('Invalid token, continuing without user info');
    }

    next();
};

exports.optionalAuth = (req, res, next) => {
    const token = req.cookies.authToken;

    if (!token) {
        // No token, continue without setting req.user
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded; // Attach user info if token is valid
    } catch (err) {
        // Invalid token — skip setting req.user but don't block access
        console.warn('Invalid token, continuing without user info');
    }

    next(); // Always call next
};