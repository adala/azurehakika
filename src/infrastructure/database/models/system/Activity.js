'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../../../../../config/database');
const SystemUser = require('../system/SystemUser');


const Activity = sequelize.define('Activity', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'SystemUser',
            key: 'id'
        }
    },
    actorId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'SystemUser',
            key: 'id'
        }
    },
    type: {
        type: DataTypes.ENUM(
            'POST_CREATED',
            'POST_LIKED',
            'POST_SHARED',
            'COMMENT_CREATED',
            'COMMENT_LIKED',
            'USER_FOLLOWED',
            'USER_MENTIONED',
            'SYSTEM_ANNOUNCEMENT',
            'ACHIEVEMENT_UNLOCKED'
        ),
        allowNull: false
    },
    entityType: {
        type: DataTypes.ENUM('POST', 'COMMENT', 'LIKE', 'USER', 'SYSTEM'),
        allowNull: false
    },
    entityId: {
        type: DataTypes.UUID,
        allowNull: true // Null for system activities
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    importance: {
        type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
        defaultValue: 'MEDIUM'
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {

    tableName: 'activities',
    timestamps: true,
    indexes: [
        {
            name: 'activities_user_id_index',
            fields: ['userId']
        },
        {
            name: 'activities_actor_id_index',
            fields: ['actorId']
        },
        {
            name: 'activities_type_index',
            fields: ['type']
        },
        {
            name: 'activities_entity_index',
            fields: ['entityType', 'entityId']
        },
        {
            name: 'activities_created_at_index',
            fields: ['createdAt']
        },
        {
            name: 'activities_is_read_index',
            fields: ['isRead']
        }
    ],
    hooks: {
        beforeCreate: (activity) => {
            if (activity.metadata && typeof activity.metadata === 'object') {
                activity.metadata = {
                    ...activity.metadata,
                    createdAt: new Date()
                };
            }
        }
    }
});


// Associations
Activity.belongsTo(SystemUser, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'CASCADE'
});

Activity.belongsTo(SystemUser, {
    foreignKey: 'actorId',
    as: 'actor',
    onDelete: 'CASCADE'
});

// Polymorphic associations for different activity types
// Activity.belongsTo(models.Post, {
//     foreignKey: 'entityId',
//     constraints: false,
//     as: 'post'
// });

// Activity.belongsTo(models.Comment, {
//     foreignKey: 'entityId',
//     constraints: false,
//     as: 'comment'
// });

// Activity.belongsTo(models.Like, {
//     foreignKey: 'entityId',
//     constraints: false,
//     as: 'like'
// });

