"use strict";

const { permissions } = require("../utils/dictionary-codes");

/**
 * Comprueba que el _id del token JWT del usuario actualmente logado sea el mismo que el _id pasado como parámetro.
 */
module.exports = () => {
  return (req, res, next) => {
    const { userId } = req.params;
    const apiUserId = req.apiUserId;

    if (apiUserId !== userId) {
      const error = new Error(permissions.NOT_AUTHORIZED);
      error.status = 401;

      next(error);
      return;
    }

    req.userId = userId;
    next();
  };
};
