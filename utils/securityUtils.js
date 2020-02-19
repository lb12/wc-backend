"use strict";

// Node imports
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/**
 * Hashea una contraseña en plano hasta 10 veces
 */
const hashString = plainString => bcrypt.hash(plainString, 10);

/**
 * Crea un nuevo token JWT con el _id del usuario pasado como parámetro
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
