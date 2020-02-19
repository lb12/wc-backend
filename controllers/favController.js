"use strict";

// Imports propios
const User = require("../models/User");
const dbUtils = require("../utils/dbUtils");
const { users: userCodes } = require("../utils/dictionary-codes");

// *START: Métodos lógica negocio*
/**
 * Actualiza todos los favs de un usuario
 */
const updateUserFavs = async (userId, favs) => {
  if (!dbUtils.isValidId(userId)) {
    return { message: userCodes.NOT_VALID_USER_ID };
  }

  const user = await User.updateUser(userId, { favs });
  user.password = null;

  return user;
};
// *END: Métodos lógica negocio*

// *START: Métodos fachada (middleware)*
/**
 * Actualiza los favs de un usuario
 */
const setAdvertFav = async (req, res, next) => {
  const { userId } = req;
  const { favs, token } = req.body;

  try {
    const result = await updateUserFavs(userId, favs);

    if (result.message === userCodes.NOT_VALID_USER_ID) {
      return res
        .status(200)
        .send({ success: false, message: userCodes.NOT_VALID_USER_ID });
    }

    return res
      .status(200)
      .send({ success: true, result: { user: result, token } });
  } catch (error) {
    next(error);
  }
};
// *END: Métodos fachada (middleware)*

module.exports = {
  setAdvertFav
};
