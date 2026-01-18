const { DataTypes } = require('sequelize');
const sequelize = require('../../../../config/database');

const TeamMember = sequelize.define('TeamMember', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: true, // Can be null for invited members who haven't joined yet
        references: {
            model: 'users', // Assuming you have a Users table
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            isEmail: {
                msg: 'Valid email is required'
            },
            notEmpty: {
                msg: 'Email cannot be empty'
            }
        }
    },
    role: {
        type: DataTypes.ENUM('admin', 'member', 'viewer'),
        defaultValue: 'member',
        allowNull: false,
        validate: {
            isIn: {
                args: [['admin', 'member', 'viewer']],
                msg: 'Valid role is required'
            }
        }
    },
    permissions: {
        type: DataTypes.JSON,
        defaultValue: ['view_verifications'],
        allowNull: false,
        validate: {
            isValidPermissions(value) {
                if (!Array.isArray(value)) {
                    throw new Error('Permissions must be an array');
                }
                
                const validPermissions = [
                    'view_verifications',
                    'create_verifications',
                    'edit_verifications',
                    'delete_verifications',
                    'manage_team',
                    'view_financials',
                    'manage_settings'
                ];
                
                for (const permission of value) {
                    if (!validPermissions.includes(permission)) {
                        throw new Error(`Invalid permission: ${permission}`);
                    }
                }
            }
        }
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    invitedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    joinedAt: {
        type: DataTypes.DATE,
        allowNull: true // Null until the member joins
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    invitedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },
    invitationToken: {
        type: DataTypes.STRING(64),
        allowNull: true, // For pending invitations
        unique: true
    },
    invitationExpires: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'team_members',
    indexes: [
        // Index for faster lookups by userId (for joined members)
        {
            fields: ['userId']
        },
        // Index for pending invitations
        {
            fields: ['invitationToken'],
            where: {
                isActive: false
            }
        }
    ],
    hooks: {
        beforeValidate: (teamMember, options) => {
            // Ensure permissions is always an array
            if (teamMember.permissions && !Array.isArray(teamMember.permissions)) {
                teamMember.permissions = [teamMember.permissions];
            }
            
            // Set joinedAt when member becomes active
            if (teamMember.isActive && !teamMember.joinedAt) {
                teamMember.joinedAt = new Date();
            }
            
            // Clear joinedAt when member becomes inactive
            if (!teamMember.isActive && teamMember.changed('isActive')) {
                teamMember.joinedAt = null;
            }
        },
        beforeCreate: (teamMember, options) => {
            // Generate invitation token for new inactive members
            if (!teamMember.isActive && !teamMember.invitationToken) {
                teamMember.invitationToken = generateInvitationToken();
                teamMember.invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            }
        }
    }
});

// Instance methods (matching your entity class methods)
TeamMember.prototype.validateEntity = function() {
    const errors = [];
    
    if (!this.email || !this.isValidEmail(this.email)) {
        errors.push('Valid email is required');
    }
    
    if (!this.role || !['admin', 'member', 'viewer'].includes(this.role)) {
        errors.push('Valid role is required');
    }
    
    return errors;
};

TeamMember.prototype.isValidEmail = function(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

TeamMember.prototype.hasPermission = function(permission) {
    return this.permissions.includes(permission);
};

TeamMember.prototype.toJSON = function() {
    const values = { ...this.get() };
    
    // Remove sensitive fields
    delete values.invitationToken;
    delete values.invitationExpires;
    
    return values;
};

// Static methods
TeamMember.findByTeam = function(teamId, options = {}) {
    const where = { teamId };
    
    if (options.activeOnly) {
        where.isActive = true;
    }
    
    return this.findAll({
        where,
        include: options.include || [],
        order: options.order || [['createdAt', 'DESC']]
    });
};

TeamMember.findPendingInvitations = function(teamId) {
    return this.findAll({
        where: {
            teamId,
            isActive: false,
            invitationExpires: {
                [sequelize.Op.gt]: new Date()
            }
        }
    });
};

TeamMember.findActiveMembers = function(teamId) {
    return this.findAll({
        where: {
            teamId,
            isActive: true
        },
        include: [{
            association: 'user', // Assuming you set up this association
            attributes: ['id', 'firstName', 'lastName', 'avatar']
        }]
    });
};

TeamMember.acceptInvitation = function(token, userId) {
    return this.findOne({
        where: {
            invitationToken: token,
            invitationExpires: {
                [sequelize.Op.gt]: new Date()
            },
            isActive: false
        }
    }).then(member => {
        if (!member) {
            throw new Error('Invalid or expired invitation token');
        }
        
        member.userId = userId;
        member.isActive = true;
        member.joinedAt = new Date();
        member.invitationToken = null;
        member.invitationExpires = null;
        
        return member.save();
    });
};

// Helper function to generate invitation token
function generateInvitationToken() {
    return require('crypto').randomBytes(32).toString('hex');
}

// Associations (to be set up in your model index file)
TeamMember.associate = function(models) {
    TeamMember.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
    });
    
    TeamMember.belongsTo(models.Team, {
        foreignKey: 'teamId',
        as: 'team'
    });
    
    TeamMember.belongsTo(models.User, {
        foreignKey: 'invitedBy',
        as: 'inviter'
    });
};

module.exports = TeamMember;