"use strict";

// Node imports
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const UserSchema = mongoose.Schema({
  username: { type: String, unique: true }, // Unique index (usernames should be unique)
  email: { type: String, unique: true }, // Unique index (emails should be unique)
  password: String,
  favs: { type: [{ type: ObjectId, ref: "Advert", index: true }] },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Number }
});

/**
 * Get a user by its id
 */
UserSchema.statics.getUser = function(userId) {
  const query = User.findById(userId);

  return query.exec();
};

/**
 * Update a user by its id
 */
UserSchema.statics.updateUser = function(userId, userData) {
  const query = User.findByIdAndUpdate(userId, userData, { new: true });

  return query.exec();
};

/**
 * Update the password of a user by its id
 */
UserSchema.statics.updatePassword = function(userId, hashedPassword) {
  const query = User.findByIdAndUpdate(
    userId,
    { password: hashedPassword },
    { new: true }
  );

  return query.exec();
};

/**
 * Delete a user by its id
 */
UserSchema.statics.deleteUser = function(userId) {
  const query = User.findByIdAndDelete(userId);

  return query.exec();
};

/**
 * Check if a User field exists or not
 */
UserSchema.statics.existsField = function(fieldObj) {
  const query = User.findOne(fieldObj);

  return query.exec();
};

/**
 * Checks if a User exists or not
 */
UserSchema.statics.existsUser = function({ username, email }) {
  const query = User.findOne({
    $or: [{ username }, { email }]
  });

  return query.exec();
};

/**
 * Returns an email satifies that token is found and is not expired yet
 */
UserSchema.statics.findByEmailToken = function({token, email}) {
  const query = User.findOne({
    $and: [
      { resetPasswordToken: token },
      { resetPasswordExpires: { $gte: Date.now() } },
      email ? { email } : {}
    ]
  });

  return query.exec();
};

const User = mongoose.model("User", UserSchema);

module.exports = User;
