"use strict";

// Node imports
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
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

    const token = securityUtils.createUserTokenJWT(user._id);

    user.password = null;

    return res.status(200).json({ success: true, result: { user, token } });
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

    const token = securityUtils.createUserTokenJWT(createdUser._id);

    createdUser.password = null;

    return res
      .status(200)
      .json({ success: true, result: { user: createdUser, token } });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).send({ success: false, message: "Email required"});
  }

  try {
    const token = crypto.randomBytes(20).toString("hex");

    const user = await User.findOneAndUpdate(
      { email },
      {
        resetPasswordToken: token,
        resetPasswordExpires: Date.now() + 3600000
      }
    );

    if (!user) {
      return res.status(403).send({ success: false, message: "Email not found"});
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: `${process.env.EMAIL_ADDRESS}`,
        pass: `${process.env.EMAIL_PASSWORD}`
      }
    });

    const mailOptions = {
      from: "password-recovery@gmail.com",
      to: `${user.email}`,
      subject: "Link To Reset Password",
      text:
        "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
        "Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n" +
        `http://localhost:3001/reset/${token}\n\n` +
        "If you did not request this, please ignore this email and your password will remain unchanged.\n"
    };

    await transporter.sendMail(mailOptions);    
    res.status(200).json({ success: true, message: 'Recovery email has been sent' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  const { token } = req.query;

  const user = await userController.readUserByEmailToken({ token });
  
  if (!user) {
    return res
      .status(403)
      .send({ success: false, message: "Token is invalid or has expired" });
  }

  return res.status(200).send({ success: true, result: { email: user.email } });
};

const updatePassword = async (req, res, next) => {
  try {
    validationResult(req).throw();

    const { email, password, token } = req.body;

    const user = await userController.readUserByEmailToken({ token, email });

    if (!user) {
      return res
        .status(403)
        .send({ success: false, message: "Token is invalid or has expired" });
    }

    // si lo encuentra, actualizar la contraseña con la que te pasan.
    const updatedUserPass = await userController.updatePassword(user, password);

    if (!updatedUserPass) {
      return res.status(500).send({
        success: false,
        message: "Password update could not finish successfully"
      });
    }

    res
      .status(200)
      .send({ success: true, message: "Password was updated succesfully" });

    // limpiamos los tokens del usuario en la base de datos en paralelo
    await User.findOneAndUpdate(
      { email },
      { resetPasswordToken: null, resetPasswordExpires: null }
    );    
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signIn,
  signUp,
  forgotPassword,
  resetPassword,
  updatePassword
};
