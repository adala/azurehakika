function errorHandler(err, req, res, next) {
    console.error('Error:', err);

    // Set default status code
    let statusCode = err.status || err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error: ' + Object.values(err.errors).map(e => e.message).join(', ');
    } else if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
    } else if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate entry found';
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    // Determine response format based on request type
    if (req.accepts('html')) {
        // Render error page for HTML requests
        res.status(statusCode).render(`errors/${statusCode}`, {
            title: `${statusCode} Error - AcademicVerify`,
            user: req.session.user,
            error: process.env.NODE_ENV === 'development' ? err : {}
        });
    } else if (req.accepts('json')) {
        // Return JSON for API requests
        res.status(statusCode).json({
            success: false,
            error: {
                message: message,
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
            }
        });
    } else {
        // Default to plain text
        res.status(statusCode).type('txt').send(`${statusCode}: ${message}`);
    }
}

function notFoundHandler(req, res, next) {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
}

module.exports = {
    errorHandler,
    notFoundHandler
};