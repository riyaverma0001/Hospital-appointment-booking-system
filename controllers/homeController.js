exports.getHomePage = (req, res) => {
    console.log('Home page');
    if(!req.user) {
        req.flash('error_msg', 'Please login first')
        return res.redirect('/login');
    }
    res.render('home', {userId: req.user.id, userRole: req.user.role});
};