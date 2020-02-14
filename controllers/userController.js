"use strict";

// Node imports
const { validationResult } = require("express-validator");

// Own imports
const User = require("../models/User");
const Advert = require("../models/Advert");
const dbUtils = require("../utils/dbUtils");
const securityUtils = require("../utils/securityUtils");

const createUser = async userObj => {
  try {
    const user = new User(userObj);
    return await user.save();
  } catch (error) {
    return next(error);
  }
};

const readUser = async userId => {
  if (!dbUtils.isValidId(userId)) {
    return { success: false, message: "Provide correct User id" };
  }

  const user = await User.getUser(userId);

  if (!user) {
    return { success: false, message: "User id was not found in database" };
  }

  user.password = null;

  return { success: true, result: user };
};

const deleteUserAndAdverts = async userId => {
  if (!dbUtils.isValidId(userId)) {
    return { success: false, message: "Provide correct User id" };
  }

  const user = await readUser(userId);

  if (!user.success) {
    return { success: false, message: "User id was not found in database" };
  }

  await User.deleteUser(userId);
  await Advert.deleteAdvertsByUserId(userId);

  return {
    success: true,
    message: "User and adverts were succesfully removed"
  };
};

const getUser = async (req, res, next) => {
  try {
    const userId = req.params.id || req.apiUserId;

    const result = await readUser(userId);

    const status =
      result.message === "Provide correct User id"
        ? 422
        : result.message === "User id was not found in database"
        ? 404
        : 200;

    return res.status(status).send(result);
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    validationResult(req).throw();

    const userId = req.params.id;
    let data = req.body;

    if (!dbUtils.isValidId(userId)) {
      return res
        .status(422)
        .json({ success: false, message: "Provide correct User id" });
    }

    // Hash password if needed
    if (data.password) {
      data.password = await securityUtils.hashString(data.password);
    }

    const updatedUser = await User.updateUser(userId, data);

    return res.status(200).send({ success: true, result: updatedUser });
  } catch (error) {
    return next(error);
  }
};

const unsubscribeUser = async (req, res, next) => {
  try {
    const { userId } = req;

    const result = await deleteUserAndAdverts(userId);

    let status;

    switch (result.message) {
      case "Provide correct User id":
        status = 422;
        break;
      case "User id was not found in database":
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

module.exports = {
  createUser,
  readUser,
  getUser,
  updateUser,
  unsubscribeUser
};
