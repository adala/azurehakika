const bcrypt = require('bcryptjs');

class HashService {
    async hash(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }

    async compare(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }
}

module.exports = HashService;