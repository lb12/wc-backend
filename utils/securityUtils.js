"use strict";

// Node imports
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/**
 * Hash a plain string 10 rounds
 */
const hashString = plainString => bcrypt.hash(plainString, 10);

/**
 * Create a new user token JWT
 */
const createUserTokenJWT = userId => {
  return jwt.sign({ _id: userId }, process.env.JWT_SECRET, {
    expiresIn: "1d"
  });
};

module.exports = {
  hashString,
  createUserTokenJWT
};
