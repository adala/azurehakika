function flashMiddleware(req, res, next) {
    // Initialize flash messages
    if (!req.session.flash) {
        req.session.flash = {
            messages: [],
            type: 'info'
        };
    }

    // Make flash available to templates
    res.locals.flash = {
        get: () => {
            const messages = req.session.flash.messages || [];
            const type = req.session.flash.type || 'info';
            
            // Clear flash after reading
            req.session.flash = { messages: [], type: 'info' };
            
            return { messages, type };
        },
        
        set: (message, type = 'info') => {
            req.session.flash = {
                messages: Array.isArray(message) ? message : [message],
                type: type
            };
        },
        
        add: (message, type = 'info') => {
            if (!req.session.flash.messages) {
                req.session.flash.messages = [];
            }
            req.session.flash.messages.push(message);
            req.session.flash.type = type;
        }
    };

    next();
}

module.exports = flashMiddleware;