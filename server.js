const express = require('express');
const expressHandlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const session = require('express-session');
//const RedisStore = require('connect-redis')(session);
//const redis = require('redis');
const cors = require('cors');
const cookie = require('cookie-parser');
require('dotenv').config();
const i18n = require('i18n');
const setLanguage = require('./src/presentation/middleware/language');
const walletMiddleware = require('./src/presentation/middleware/walletBalance');


// Configure i18n
i18n.configure({
    locales: ['en', 'fr', 'pt', 'sw', 'ar'], // English, French, Portuguese, Swahili, Arabic
    directory: __dirname + '/locales',
    defaultLocale: 'en',
    cookie: 'lang',
    autoReload: true,
    updateFiles: false,
    objectNotation: true,
    queryParameter: 'lang'
});

const sequelize = require('./config/database');
const routes = require('./src/presentation/routes');
const { errorHandler, notFoundHandler } = require('./src/presentation/middleware/errorHandler');
const flashMiddleware = require('./src/presentation/middleware/flash');
const ConfigurationSeeder = require('./src/infrastructure/database/seeders/ConfigurationSeeder');


const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// View engine setup
app.engine('handlebars', expressHandlebars.engine({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'src/presentation/views/layouts'),
    partialsDir: path.join(__dirname, 'src/presentation/views/partials'),
    helpers: {
        year: () => new Date().getFullYear(),
        eq: function (a, b) {
            return a === b;
        },
        json: function (context) {
            return JSON.stringify(context);
        },
        ifRole: function (user, role, options) {
            if (user && user.role === role) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        currentDate: function () {
            return new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },
        getRoleBadgeColor: function (role) {
            switch (role) {
                case 'owner': return 'warning';
                case 'admin': return 'info';
                case 'member': return 'secondary';
                default: return 'light';
            }
        },
        priorityColor: function (priority) {
            const colors = {
                'low': 'secondary',
                'medium': 'info',
                'high': 'warning',
                'urgent': 'danger'
            };
            return colors[priority] || 'secondary';
        },
        formatDate: (date) => {
            if (!date) return 'N/A';
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        or: (...args) => {
            // Remove the options parameter (last argument)
            const params = args.slice(0, -1);
            return params.some(param => param);
        },
        and: (...args) => {
            const params = args.slice(0, -1);
            return params.every(param => param);
        },
        ne: (a, b) => a !== b,
        gt: function (a, b) {
            return a > b;
        },
        abs: function (value) {
            return Math.abs(value);
        },
        formatClassification: function (classification) {
            const classificationMap = {
                '1st': 'First Class',
                '2:1': 'Upper Second',
                '2:2': 'Lower Second',
                '3rd': 'Third Class',
                'pass': 'Pass',
                'distinction': 'Distinction',
                'merit': 'Merit'
            };
            return classificationMap[classification] || classification;
        },
        formatCurrency: function (amount) {
            return parseFloat(amount).toFixed(2);
        },
        formatStatus: function (status) {
            const statusMap = {
                'pending': 'Pending',
                'pending_assignment': 'Awaiting Assignment',
                'processing': 'Processing',
                'requires_review': 'Requires Review',
                'completed': 'Completed',
                'failed': 'Failed'
            };
            return statusMap[status] || status;
        },
        truncate: function (str, len) {
            if (str && str.length > len) {
                return str.substring(0, len) + '...';
            }
            return str;
        },
        formatDateShort: function (dateString) {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        },
        formatTime: function (dateString) {
            return new Date(dateString).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        '__': function () {
            return i18n.__.apply(this, arguments);
        },
        trans: function (key) {
            return i18n.__({ phrase: key, locale: this.currentLocale })
        },
        toJSON: function (context) {
            return JSON.stringify(context);
        },
        safeLogo: function (logoUrl, institutionName) {
            if (!logoUrl || typeof logoUrl !== 'string') {
                // Return the fallback icon HTML if no valid logo
                return new Handlebars.SafeString(
                    '<div class="institution-icon mb-3"><i class="fas fa-university fa-2x text-primary"></i></div>'
                );
            }
            // Clean the URL string
            const cleanUrl = logoUrl.trim().replace(/^['"`]+|['"`]+$/g, '');
            // Return a safe HTML string
            return new Handlebars.SafeString(
                `<img src="${logoUrl}" alt="${institutionName || 'Institution'}" class="institution-logo" width="100" height="100">`
            );
        },
        lookup: function (obj, key) {
            return obj && obj[key];
        },
        getNested: function (obj, path) {
            var paths = path.split('.')
                , current = obj
                , i;

            for (i = 0; i < paths.length; ++i) {
                if (current[paths[i]] == undefined) {
                    return undefined;
                } else {
                    current = current[paths[i]];
                }
            }
            return current;
        },
        confidenceClass: function (confidence) { 
            if (confidence >= 90) return 'bg-success';
            if (confidence >= 80) return 'bg-warning';
            return 'bg-danger';
        },
        responseStatusBadge: function (status) {
            const badges = {
                'pending': 'warning',
                'processing': 'info',
                'completed': 'success',
                'failed': 'danger',
                'requires_review': 'warning',
                'discrepancy': 'danger'
            };
            return badges[status] || 'secondary';
        }
    }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'src/presentation/views'));

// Middleware
app.use(i18n.init);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookie());

// Redis client setup
// const redisClient = redis.createClient({
//     url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
//     password: process.env.REDIS_PASSWORD || undefined,
// });

// redisClient.connect().catch(console.error);
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'hakika-secret-key-change-in-production',
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true for HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax' // CSRF protection
    },
    name: 'hakika.sid', // Custom session name
    rolling: true // Reset cookie expiration on every response
};
session(sessionConfig);
// Add store based on environment
if (process.env.REDIS_URL) {
    // Redis session store (RECOMMENDED for production cluster)
    let RedisStore;
    try {
        // Try v7+ syntax (default export)
        RedisStore = require('connect-redis').default;
    } catch (e) {
        // Fallback to v6 syntax (function export)
        RedisStore = require('connect-redis')(session);
    }
    const { createClient } = require('redis');
    
    const redisClient = createClient({
        url: process.env.REDIS_URL,
        legacyMode: true
    });
    
    redisClient.connect().catch(console.error);
    
    sessionConfig.store = new RedisStore({
        client: redisClient,
        prefix: 'hakika:sess:',
        ttl: 86400 // 24 hours in seconds 
    });
    
    console.log(`Worker ${process.pid}: Using Redis session store`);
} else if (process.env.MONGO_URL) {
    // MongoDB session store (alternative for production cluster)
    const MongoStore = require('connect-mongo');
    
    sessionConfig.store = MongoStore.create({
        mongoUrl: process.env.MONGO_URL,
        collectionName: 'sessions',
        ttl: 24 * 60 * 60 // 24 hours in seconds
    });
    
    console.log(`Worker ${process.pid}: Using MongoDB session store`);
} else {
    // Memory store (DEVELOPMENT ONLY - will not work properly in cluster mode)
    console.warn(`Worker ${process.pid}: WARNING - Using in-memory session store. This will NOT work properly in cluster mode!`);
    console.warn(`Worker ${process.pid}: Please set REDIS_URL or MONGO_URL environment variable for production.`);
    
    // Use memory store but with sticky session cookie workaround
    const sessionStore = new Map();
    
    // Custom memory store that can be shared (still limited, but better than default)
    class ClusterMemoryStore extends session.Store {
        constructor() {
            super();
            this.sessions = sessionStore;
        }
        
        get(sid, callback) {
            const sess = this.sessions.get(sid);
            callback(null, sess);
        }
        
        set(sid, session, callback) {
            this.sessions.set(sid, session);
            callback(null);
        }
        
        destroy(sid, callback) {
            this.sessions.delete(sid);
            callback(null);
        }
        
        all(callback) {
            const sessions = Array.from(this.sessions.values());
            callback(null, sessions);
        }
        
        length(callback) {
            callback(null, this.sessions.size);
        }
        
        clear(callback) {
            this.sessions.clear();
            callback(null);
        }
    }
    
    sessionConfig.store = new ClusterMemoryStore();
}
app.use(session(sessionConfig));
app.use(setLanguage);

// Flash messages middleware (must be after session)
app.use(flashMiddleware);

// Trust proxy for production
app.set('trust proxy', 1);

// Routes
app.use('/', routes);

app.use((req, res, next) => {
    if (req.user) {
        walletMiddleware.setWalletBalance(req, res, next);
    } else {
        next();
    }
});

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Error handler - must be last middleware
app.use(errorHandler);

// Database connection and server start
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        await sequelize.sync({ force: false });
        console.log('Database synchronized.');

        // Seed configuration data
        const configSeeder = new ConfigurationSeeder();
        await configSeeder.run();
        console.log('Configuration data seeded.');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to start server:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    // application run directly; start app server
    startServer();
} else {
    // application imported as a module via "require": export function
    // to create server
    module.exports = startServer;
}
