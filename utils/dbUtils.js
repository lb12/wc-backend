const mongoose = require("mongoose");

/**
 * Comprueba si un id es válido o no en mongoose
 */
const isValidId = id => mongoose.Types.ObjectId.isValid(id);

module.exports = { isValidId };
