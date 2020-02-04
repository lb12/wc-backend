const mongoose = require('mongoose');

/**
 * Check if an Id is valid
 */
const isValidId = id => mongoose.Types.ObjectId.isValid(id);

module.exports = {
    isValidId
};