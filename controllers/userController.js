"use strict";

// Node imports
const { validationResult } = require("express-validator");

// Imports propios
const User = require("../models/User");
const Advert = require("../models/Advert");
const dbUtils = require("../utils/dbUtils");
const securityUtils = require("../utils/securityUtils");
const {
  users: userCodes,
  actions: actionsCodes,
  validation: validationCodes
} = require("../utils/dictionary-codes");

// *START: Métodos lógica negocio*
/**
 * Crea un usuario a partir de sus datos
 */
const createUser = async userObj => {
  try {
    const user = new User(userObj);
    return await user.save();
  } catch (error) {
    return next(error);
  }
};

/**
 * Obtiene un usuario a partir de su id
 */
const readUser = async userId => {
  if (!dbUtils.isValidId(userId)) {
    return { success: false, message: userCodes.NOT_VALID_USER_ID };
  }

  const user = await User.getUser(userId);

  if (!user) {
    return { success: false, message: userCodes.USER_NOT_FOUND };
  }

  user.password = null;

  return { success: true, result: user };
};

/**
 * Elimina los anuncios de un usuario y a este mismo a partir de su id
 */
const deleteUserAndAdverts = async userId => {
  if (!dbUtils.isValidId(userId)) {
    return { success: false, message: userCodes.NOT_VALID_USER_ID };
  }

  const user = await readUser(userId);

  if (!user.success) {
    return { success: false, message: userCodes.USER_NOT_FOUND };
  }

  await User.deleteUser(userId);
  await Advert.deleteAdvertsByUserId(userId);

  return { success: true, message: actionsCodes.REMOVED_USER_AND_ADVERTS };
};

/**
 * Elimina el anuncio de todas las listas de favoritos de los usuarios
 */
const popAdvertFromFavLists = async advertId => {
  await User.popAdvertFromFavLists(advertId);
}

/**
 * Comprueba si existe un usuario a partir de su username y su email
 */
const existsUser = async ({ username, email }) => {
  return User.existsUser({ username, email });
};

/**
 * Obtiene un usuario a partir del token de recuperación de contraseña enviado por email
 */
const readUserByEmailToken = async data => {
  return await User.findByEmailToken(data);
};

/**
 * Actualiza una contraseña a partir del objeto de su usuario
 */
const updatePassword = async (user, password) => {
  const hash = await securityUtils.hashString(password);

  return User.updatePassword(user._id, hash);
};
// *END: Métodos lógica negocio*

// *START: Métodos fachada (middleware)*
/**
 * Obtener un usuario
 */
const getUser = async (req, res, next) => {
  try {
    const userId = req.params.id || req.apiUserId;

    const result = await readUser(userId);

    const status =
      result.message === userCodes.NOT_VALID_USER_ID
        ? 422
        : result.message === userCodes.USER_NOT_FOUND
        ? 404
        : 200;

    return res.status(status).send(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * Actualizar un usuario
 */
const updateUser = async (req, res, next) => {
  try {
    validationResult(req).throw();

    const { userId } = req;
    const data = req.body;

    if (!dbUtils.isValidId(userId)) {
      return res
        .status(422)
        .json({ success: false, message: userCodes.NOT_VALID_USER_ID });
    }

    const user = await existsUser(data);

    // Otro usuario con esos campos ya existe, por lo que hay que retornar un error
    if (user && !user._id.equals(userId)) {
      return res
        .status(422)
        .json({ success: false, message: validationCodes.USERNAME_EMAIL_USED });
    }

    // Hash password if needed
    if (data.password) {
      data.password = await securityUtils.hashString(data.password);
    }

    const updatedUser = await User.updateUser(userId, data);

    const token = securityUtils.createUserTokenJWT(userId);

    updatedUser.password = null;

    return res
      .status(200)
      .send({ success: true, result: { user: updatedUser, token } });
  } catch (error) {
    return next(error);
  }
};

/**
 * Actualizar contraseña (desde zona privada)
 */
const changePassword = async (req, res, next) => {
  try {
    validationResult(req).throw();

    const { userId } = req;
    const { password } = req.body;

    if (!dbUtils.isValidId(userId)) {
      return res
        .status(422)
        .json({ success: false, message: userCodes.NOT_VALID_USER_ID });
    }

    // Comprobamos si existe un usuario con ese Id
    const user = await User.getUser(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: userCodes.USER_NOT_FOUND });
    }

    await updatePassword(user, password);

    return res
      .status(200)
      .send({ success: true, message: actionsCodes.PASSWORD_WAS_UPDATED });
  } catch (error) {
    next(error);
  }
};

/**
 * Dar de baja un usuario
 */
const unsubscribeUser = async (req, res, next) => {
  try {
    const { userId } = req;

    const result = await deleteUserAndAdverts(userId);

    let status;

    switch (result.message) {
      case userCodes.NOT_VALID_USER_ID:
        status = 422;
        break;
      case userCodes.USER_NOT_FOUND:
        status = 404;
        break;
      default:
        status = 200;
        break;
    }

    return res.status(status).send(result);
  } catch (error) {
    return next(error);
  }
};
// *END: Métodos fachada (middleware)*

module.exports = {
  getUser,
  updateUser,
  unsubscribeUser,
  changePassword,
  updatePassword,
  readUserByEmailToken,
  createUser,
  existsUser,
  readUser,
  popAdvertFromFavLists
};
