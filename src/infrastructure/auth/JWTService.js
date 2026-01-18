const jwt = require('jsonwebtoken');

class JWTService {
    generateToken(payload, expiresIn = '24h') {
        return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
    }

    verifyToken(token) { 
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return null;
        }
    }

    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
}

module.exports = JWTService;