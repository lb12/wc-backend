"use strict";

// Node imports
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { validationResult } = require("express-validator");

// Imports propios
const User = require("../models/User");
const userController = require("./userController");
const securityUtils = require("../utils/securityUtils");
const {
  users: userCodes,
  auth: authCodes,
  emails: emailCodes,
  JWT: jwtCodes,
  actions: actionsCodes,
  validation: validationCodes
} = require("../utils/dictionary-codes");

// *START: Métodos fachada (middleware)*
/**
 * Devuelve un token JWT si las credenciales son correctas
 */
const signIn = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    // Comprueba si el usuario existe o si concuerda la contraseña en plano
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(422)
        .json({ success: false, message: authCodes.INVALID_CREDENTIALS });
    }

    const token = securityUtils.createUserTokenJWT(user._id);

    user.password = null;

    return res.status(200).json({ success: true, result: { user, token } });
  } catch (error) {
    next(error);
  }
};

/**
 * Registra un usuario a partir de sus datos
 */
const signUp = async (req, res, next) => {
  try {
    validationResult(req).throw();

    const { username, email, password } = req.body;

    const user = await userController.existsUser({ username, email });

    // El usuario ya existe, por lo que hay que retornar un error
    if (user) {
      return res
        .status(422)
        .json({ success: false, message: authCodes.USERNAME_EMAIL_USED }); //"Username or email currently used"
    }

    // Cifra la contraseña
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

/**
 * Envía un email a una dirección para recuperar la contraseña
 */
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).send({
      success: false,
      message: validationCodes.EMAIL_MUST_NOT_BE_EMPTY
    });
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
      return res
        .status(403)
        .send({ success: false, message: userCodes.USER_NOT_FOUND });
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
      subject: "Restart password",
      text:
        "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
        "Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n" +
        `http://localhost:3001/reset/${token}\n\n` +
        "If you did not request this, please ignore this email and your password will remain unchanged.\n"
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: emailCodes.EMAIL_SENT });
  } catch (error) {
    next(error);
  }
};

/**
 * Comprueba si el token es correcto y devuelve el email de la persona que solicita el cambio de contraseña
 */
const resetPassword = async (req, res, next) => {
  const { token } = req.query;

  const user = await userController.readUserByEmailToken({ token });

  if (!user) {
    return res
      .status(403)
      .send({ success: false, message: jwtCodes.INVALID_OR_EXPIRED_TOKEN });
  }

  return res.status(200).send({ success: true, result: { email: user.email } });
};

/**
 * Actualiza una contraseña a partir del token de recuperación
 */
const updatePassword = async (req, res, next) => {
  try {
    validationResult(req).throw();

    const { email, password, token } = req.body;

    const user = await userController.readUserByEmailToken({ token, email });

    if (!user) {
      return res
        .status(403)
        .send({ success: false, message: jwtCodes.INVALID_OR_EXPIRED_TOKEN });
    }

    // si lo encuentra, actualizar la contraseña con la que te pasan.
    const updatedUserPass = await userController.updatePassword(user, password);

    if (!updatedUserPass) {
      return res.status(500).send({
        success: false,
        message: actionsCodes.PASSWORD_NOT_UPDATED
      });
    }

    res
      .status(200)
      .send({ success: true, message: actionsCodes.PASSWORD_WAS_UPDATED });

    // limpiamos los tokens del usuario en la base de datos en paralelo
    await User.findOneAndUpdate(
      { email },
      { resetPasswordToken: null, resetPasswordExpires: null }
    );
  } catch (error) {
    next(error);
  }
};
// *END: Métodos fachada (middleware)*

module.exports = {
  signIn,
  signUp,
  forgotPassword,
  resetPassword,
  updatePassword
};
