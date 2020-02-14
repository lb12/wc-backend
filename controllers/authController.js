"use strict";

// Node imports
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

// Our imports
const User = require("../models/User");
const userController = require("./userController");
const securityUtils = require("../utils/securityUtils");

/**
 * POST recieve credentials and return a JWT token if credentials are OK
 */
const signIn = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    // Check user exists or if plain password is ok
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(422)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    user.password = null;

    return res.status(200).json({ success: true, result: { user, token} });
  } catch (error) {
    next(error);
  }
};

const signUp = async (req, res, next) => {
  try {
    validationResult(req).throw();

    const { username, email, password } = req.body;

    const user = await userController.existsUser({ username, email });

    // El usuario ya existe, por lo que hay que retornar un error
    if (user) {
      return res
        .status(422)
        .json({ success: false, message: "Username or email currently used" });
    }

    // Hash password
    const hash = await securityUtils.hashString(password);

    const createdUser = await userController.createUser({
      username,
      email,
      password: hash
    });

    const token = jwt.sign({ _id: createdUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    createdUser.password = null;

    return res.status(200).json({ success: true, result: { user: createdUser, token} });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signIn,
  signUp
};
