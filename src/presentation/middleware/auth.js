const JWTService = require('../../infrastructure/auth/JWTService');

const jwtService = new JWTService();

async function authenticateToken(req, res, next) {
    let token;

    // CRITICAL FIX: Check cookies FIRST (most reliable in cluster mode)
    // Cookie is shared across all workers via the session store
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
        console.log(`Worker ${process.pid}: Token from cookies`);
    }
    // Check session second (requires session store to work in cluster)
    else if (req.session && req.session.token) {
        token = req.session.token;
        console.log(`Worker ${process.pid}: Token from session`);
    }
    // Check Authorization header (for API requests)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
        console.log(`Worker ${process.pid}: Token from Authorization header`);
    }
    // Check request body (for form submissions)
    else if (req.body && req.body.token) {
        token = req.body.token;
        console.log(`Worker ${process.pid}: Token from body`);
    }
    // Check query parameters (fallback)
    else if (req.query && req.query.token) {
        token = req.query.token;
        console.log(`Worker ${process.pid}: Token from query`);
    }

    console.log(`Worker ${process.pid}: Token search result:`, token ? 'Token found' : 'No token found');
    console.log(`Worker ${process.pid}: Session ID:`, req.sessionID);

    if (!token) {
        console.log(`Worker ${process.pid}: No token found, redirecting to login`);
        if (req.accepts('html')) {
            return res.redirect('/auth/login');
        }
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }

    try {
        const decoded = jwtService.verifyToken(token);

        if (!decoded || !decoded.isVerified) {
            console.log(`Worker ${process.pid}: Token invalid or user not verified`);
            if (req.accepts('html')) {
                return res.redirect('/auth/login');
            }
            return res.status(401).json({
                success: false,
                message: 'User not found or not verified'
            });
        }

        // Attach user to request
        req.user = decoded;
        
        // CRITICAL FIX: Store both in session AND verify session is saved
        req.session.user = decoded;
        req.session.token = token;

        console.log(`Worker ${process.pid}: User authenticated:`, decoded.email);

        // CRITICAL: Force session save to ensure it's written to store
        req.session.save((err) => {
            if (err) {
                console.error(`Worker ${process.pid}: Session save error:`, err);
                return res.status(500).json({
                    success: false,
                    message: 'Session save error'
                });
            }
            console.log(`Worker ${process.pid}: Session saved successfully`);
            next();
        });

    } catch (error) {
        console.error(`Worker ${process.pid}: Token verification error:`, error.message);
        // Clear invalid session and cookies
        res.clearCookie('token');
        req.session.destroy(() => {
            if (req.accepts('html')) {
                return res.redirect('/auth/login');
            }
            return res.status(401).json({
                success: false,
                message: 'Session expired. Please login again.'
            });
        });
    }
}

// Middleware to ensure session is synced across workers
function syncSession(req, res, next) {
    if (req.session && req.session.user) {
        req.user = req.session.user;
    }
    next();
}

async function refreshTokenMiddleware(req, res, next) {
    try {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }

        const decoded = jwtService.verifyToken(refreshToken, process.env.JWT_SECRET);

        if (decoded.type !== 'refresh') {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        // Generate new tokens
        const tokens = jwtService.generateToken(user,);

        // Set new tokens in cookies
        res.cookie('accessToken', tokens.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Update session
        req.session.userId = decoded.userId;
        req.session.email = decoded.email;
        req.session.role = decoded.role || 'user';

        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role || 'user'
        };

        next();
    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(401).json({ error: 'Invalid refresh token' });
    }
};

function requireAuth(req, res, next) {
    console.log(`Worker ${process.pid}: requireAuth check`);
    console.log(`Worker ${process.pid}: req.user:`, req.user ? 'exists' : 'null');
    console.log(`Worker ${process.pid}: req.session.user:`, req.session?.user ? 'exists' : 'null');
    console.log(`Worker ${process.pid}: req.cookies.token:`, req.cookies?.token ? 'exists' : 'null');
    
    // Check if user exists in request or session
    if (req.user || (req.session && req.session.user)) {
        // Sync user from session if not in request
        if (!req.user && req.session.user) {
            req.user = req.session.user;
            console.log(`Worker ${process.pid}: User synced from session`);
        }
        return next();
    }

    console.log(`Worker ${process.pid}: Authentication required - redirecting to login`);
    
    if (req.accepts('html')) {
        return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
    }
    
    return res.status(401).json({
        success: false,
        message: 'Authentication required'
    });
}

module.exports = {
    authenticateToken,
    requireAuth,
    syncSession
};
// const JWTService = require('../../infrastructure/auth/JWTService');

// const jwtService = new JWTService();

// async function authenticateToken(req, res, next) {
//     let token;


//     // Check session first
//     if (req.session && req.session.token) {
//         token = req.session.token;
//         console.log(`Worker ${process.pid}: Token from session`);
//     }
//     // Check multiple sources for token
//     else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
//         token = req.headers.authorization.split(' ')[1];
//         console.log(`Worker ${process.pid}: Token from Authorization header`);
//     }
//     // Check cookies (alternative approach)
//     else if (req.cookies && req.cookies.token) {
//         token = req.cookies.token;
//         console.log(`Worker ${process.pid}: Token from cookies`);
//     }
//     // Check request body (for form submissions - this will now work since multer runs first)
//     else if (req.body && req.body.token) {
//         token = req.body.token;
//         console.log(`Worker ${process.pid}: Token from body`);
//     }
//     // Check query parameters
//     else if (req.query && req.query.token) {
//         token = req.query.token;
//     }

//     console.log('Token search result:', token ? 'Token found' : 'No token found');

//     if (!token) {
//         if (req.accepts('html')) {
//             return res.redirect('/auth/login');
//         }
//         return res.status(401).json({
//             success: false,
//             message: 'Access token required'
//         });
//     }

//     try {
//         const decoded = jwtService.verifyToken(token);

//         if (!decoded || !decoded.isVerified) {
//             if (req.accepts('html')) {
//                 return res.redirect('/auth/login');
//             }
//             return res.status(401).json({
//                 success: false,
//                 message: 'User not found or not verified'
//             });
//         }

//         // Attach user to request and session for cluster compatibility
//         req.user = decoded;
//         req.session.user = decoded;
//         req.session.token = token;

//         // Ensure session is saved
//         req.session.save((err) => {
//             if (err) {
//                 console.error(`Worker ${process.pid}: Session save error:`, err);
//             }
//             next();
//         });

//     } catch (error) {
//         console.error(`Worker ${process.pid}: Token verification error:`, error.message);
//         // Clear invalid session
//         req.session.destroy(() => {
//             if (req.accepts('html')) {
//                 return res.redirect('/auth/login');
//             }
//             return res.status(401).json({
//                 success: false,
//                 message: 'Session expired. Please login again.'
//             });
//         });
//     }
// }

// // Middleware to ensure session is synced across workers
// function syncSession(req, res, next) {
//     if (req.session && req.session.user) {
//         req.user = req.session.user;
//     }
//     next();
// }

// async function refreshTokenMiddleware(req, res, next) {
//     try {
//         const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

//         if (!refreshToken) {
//             return res.status(401).json({ error: 'Refresh token required' });
//         }

//         const decoded = jwtService.verifyToken(refreshToken, process.env.JWT_SECRET);

//         if (decoded.type !== 'refresh') {
//             return res.status(401).json({ error: 'Invalid refresh token' });
//         }

//         // Generate new tokens
//         const tokens = jwtService.generateToken(user,);

//         // Set new tokens in cookies
//         res.cookie('accessToken', tokens.accessToken, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === 'production',
//             sameSite: 'strict',
//             maxAge: 24 * 60 * 60 * 1000
//         });

//         res.cookie('refreshToken', tokens.refreshToken, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === 'production',
//             sameSite: 'strict',
//             maxAge: 7 * 24 * 60 * 60 * 1000
//         });

//         // Update session
//         req.session.userId = decoded.userId;
//         req.session.email = decoded.email;
//         req.session.role = decoded.role || 'user';

//         req.user = {
//             id: decoded.userId,
//             email: decoded.email,
//             role: decoded.role || 'user'
//         };

//         next();
//     } catch (error) {
//         console.error('Refresh token error:', error);
//         return res.status(401).json({ error: 'Invalid refresh token' });
//     }
// };

// function requireAuth(req, res, next) {
//     if (req.user || (req.session && req.session.user)) {
//         if (!req.user && req.session.user) {
//             req.user = req.session.user;
//         }
//         return next();
//     }

//     if (req.accepts('html')) {
//         return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
//     }
    
//     return res.status(401).json({
//         success: false,
//         message: 'Authentication required'
//     });
// }

// module.exports = {
//     authenticateToken,
//     requireAuth
// };


