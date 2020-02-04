'use strict';

// Node imports
const mongoose = require('mongoose');


const UserSchema = mongoose.Schema({
    username: { type: String, unique: true }, // Unique index (usernames should be unique)
    email: { type: String, unique: true }, // Unique index (emails should be unique)
    password: String
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
}


const User = mongoose.model('User', UserSchema);

module.exports = User;
