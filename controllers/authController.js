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
    console.error(email);
    return res.status(400).send("email required");
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

    console.log(user);

    if (!user) {
      console.error("email not in database");
      return res.status(403).send("email not in db");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: `${process.env.EMAIL_ADDRESS}`,
        pass: `${process.env.EMAIL_PASSWORD}`
      }
    });

    const mailOptions = {
      from: "noSqlDemoEmail@gmail.com",
      to: `${user.email}`,
      subject: "Link To Reset Password",
      text:
        "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
        "Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n" +
        `http://localhost:3001/reset/${token}\n\n` +
        "If you did not request this, please ignore this email and your password will remain unchanged.\n"
    };

    console.log("sending mail");

    transporter.sendMail(mailOptions, (err, response) => {
      if (err) {
        console.error("there was an error: ", err);
      } else {
        console.log("here is the res: ", response);
        res.status(200).json("recovery email sent");
      }
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  const token = req.query.token;

  // Buscar un usuario que tenga el token en cuestion
  const user = await userController.readUserByEmailToken({ token });
  console.log(user);
  // Si no lo encontramos, devolver un success false con message incluido
  if (!user) {
    return res
      .status(403)
      .send({ success: false, message: "Token is invalid or has expired" });
  }

  // Si lo encontramos, devolver el email y success = true.
  return res.status(200).send({ success: true, result: { email: user.email } });
};

const updatePassword = async (req, res, next) => {
  try {
    validationResult(req).throw();

    const { email, password, token } = req.body;

    // buscar al usuario por email y token
    const user = await userController.readUserByEmailToken({ token, email });

    // si no lo encuentra, sacar un error con success false y message.
    if (!user) {
      return res
        .status(403)
        .send({ success: false, message: "Token is invalid or has expired" });
    }

    // si lo encuentra, actualizar la contraseña con la que te pasan.
    const updatedUserPass = await userController.updatePassword(user, password);

    // si no ha ido bien, sacar un error con success false y message.
    if (!updatedUserPass) {
      return res.status(500).send({
        success: false,
        message: "Password update could not finish successfully"
      });
    }

    // si esta actualizacion ha ido bien, eliminar los tokens y retornar success = true y un mensaje
    await User.findOneAndUpdate(
      { email },
      { resetPasswordToken: null, resetPasswordExpires: null }
    );

    return res
      .status(200)
      .send({ success: true, message: "Password was updated succesfully" });
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
