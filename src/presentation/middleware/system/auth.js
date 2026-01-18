const authenticate = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    
    // Redirect to login if not authenticated
    res.redirect('/system/login');
};

const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.redirect('/system/login');
        }

        const userRole = req.session.user.role;
        
        if (allowedRoles.includes(userRole)) {
            return next();
        }

        // Forbidden - user doesn't have required role
        res.status(403).render('error', {
            message: 'Access Denied',
            error: 'You do not have permission to access this resource'
        });
    };
};

const requirePasswordChange = (req, res, next) => {
    if (req.session.user && req.session.user.mustChangePassword) {
        // Allow access to change password page and logout only
        const allowedPaths = ['/system/change-password', '/system/logout'];
        if (allowedPaths.includes(req.path)) {
            return next();
        }
        return res.redirect('/system/change-password');
    }
    next();
};

module.exports = {
    authenticate,
    authorizeRole,
    requirePasswordChange
};