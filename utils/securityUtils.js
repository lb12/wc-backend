'use strict';

// Node imports
const bcrypt = require('bcrypt');


/**
 * Hash a plain string 10 rounds
 */
const hashString = plainString => bcrypt.hash(plainString, 10);

module.exports = {
    hashString
}
