const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs')
const app = express();
const port = 9000;
require('dotenv').config();
const cookieParser = require('cookie-parser')
const session = require('express-session');
const flash = require('connect-flash')

const razorpay = require('razorpay')
const bodyParser = require('body-parser');

app.use(session({
    secret: 'yoursecretkey',
    resave: false,
    saveUninitialized: true,
}))

app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg'),
    res.locals.error_msg = req.flash('error_msg'),
    res.locals.info_msg = req.flash('info_msg'),
    res.locals.error = req.flash('error'); // often used by Passport
    next();
})

app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true })); //  form data
app.use(bodyParser.json());     // json

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB');
});

//import
const homeRoutes = require('./routes/homeRoutes')
const slotRoutes = require('./routes/slotRoutes')
const dateRoutes = require('./routes/dateRoutes')
const bookAppointmentRoutes = require('./routes/bookAppoinementRoutes')
const paymentRoutes = require('./routes/paymentRoute')
const userRoutes = require('./routes/userRoutes')

app.use('/', homeRoutes);
app.use('/', dateRoutes);
app.use('/', slotRoutes);
app.use('/', bookAppointmentRoutes);
app.use('/', paymentRoutes);
app.use('/', userRoutes);

app.listen(port ,()=> {
    console.log(`http://localhost:${port}`);
});