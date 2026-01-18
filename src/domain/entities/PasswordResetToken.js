// entities/PasswordResetTokenEntity.js
class PasswordResetToken {
  constructor({
    id = null,
    userId,
    token,
    expiresAt,
    used = false,
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this.id = id;
    this.userId = userId;
    this.token = token;
    this.expiresAt = expiresAt;
    this.used = used;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromModel(model) {
    if (!model) return null;
    
    return new PasswordResetToken({
      id: model.id,
      userId: model.userId,
      token: model.token,
      expiresAt: model.expiresAt,
      used: model.used,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    });
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      token: this.token,
      expiresAt: this.expiresAt,
      used: this.used,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  isExpired() {
    return new Date() > new Date(this.expiresAt);
  }

  isValid() {
    return !this.used && !this.isExpired();
  }

  markAsUsed() {
    this.used = true;
    this.updatedAt = new Date();
  }
}

module.exports = PasswordResetToken;