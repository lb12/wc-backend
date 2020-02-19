"use strict";

const jwt = require("jsonwebtoken");
const { JWT } = require("../utils/dictionary-codes");

/**
 * Comprueba el token JWT del usuario y lo verifica
 */
module.exports = () => {
  return (req, res, next) => {
    let token = req.get("Authorization") || req.body.token || req.query.token;
    // Si el token no existe, devolver un error
    if (!token) {
      const error = new Error(JWT.NO_TOKEN_PROVIDED);

      error.status = 401;
      next(error);
      return;
    }

    // Eliminar 'Bearer ' si viniera incluido con el token
    token = token.includes(" ") ? token.split(" ")[1] : token;

    jwt.verify(token, process.env.JWT_SECRET, (error, payload) => {
      if (error) {
        // Posibles errores como que el token haya expirado o la verificacion haya fallado
        error.status = 401;
        next(error);
        return;
      }

      req.apiUserId = payload._id;
      next();
    });
  };
};
