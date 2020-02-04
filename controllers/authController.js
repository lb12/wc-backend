"use strict";

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

/**
 * POST recieve credentials and return a JWT token if credentials are OK
 */
async function authenticate(req, next) {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    // Check user exists or if plain password is ok
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return { success: false, error: "Invalid credentials" };
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "3d"
    });

    return { success: true, result: token };
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticate
};
