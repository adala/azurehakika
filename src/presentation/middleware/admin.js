const User = require('../../infrastructure/database/models/User');

async function requireAdmin(req, res, next) {
    try {
        const user = await User.findByPk(req.session.user.id);
        
        if (!user || user.role !== 'admin') {
            return res.render('errors/403',{
                success: false,
                message: 'Admin access required'
            });
        }

        next();
    } catch (error) {
        res.render('admin/admin-access',{
            success: false,
            message: 'Error verifying admin access'
        });
    }
}

module.exports = {
    requireAdmin
};