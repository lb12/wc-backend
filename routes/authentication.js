"use strict";

// Node imports
const express = require("express");
const { check, body } = require("express-validator");

// Our imports
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const jwtAuth = require("../lib/jwtAuth");
const { validation: validationCodes } = require("../utils/dictionary-codes");

const router = express.Router();

router.post(
  "/signin",
  [
    body("username")
      .exists({ checkFalsy: true, checkNull: true })
      .withMessage(validationCodes.MUST_NOT_BE_EMPTY),
    body("password")
      .exists({ checkFalsy: true, checkNull: true })
      .withMessage(validationCodes.MUST_NOT_BE_EMPTY),
    check("username")
      .isLength({ min: 4 })
      .withMessage(validationCodes.USERNAME_4_CHARS_LONG),
    check("password")
      .isLength({ min: 6 })
      .withMessage(validationCodes.PASSWORD_6_CHARS_LONG)
  ],
  authController.signIn
);
router.post(
  "/signup",
  [
    body("username")
      .exists({ checkFalsy: true, checkNull: true })
      .withMessage(validationCodes.MUST_NOT_BE_EMPTY),
    body("email")
      .exists({ checkFalsy: true, checkNull: true })
      .withMessage(validationCodes.MUST_NOT_BE_EMPTY),
    body("password")
      .exists({ checkFalsy: true, checkNull: true })
      .withMessage(validationCodes.MUST_NOT_BE_EMPTY),
    check("email")
      .isEmail()
      .withMessage(validationCodes.EMAIL_FORMAT_IS_NOT_CORRECT),
    check("username")
      .isLength({ min: 4 })
      .withMessage(validationCodes.USERNAME_4_CHARS_LONG),
    check("password")
      .isLength({ min: 6 })
      .withMessage(validationCodes.PASSWORD_6_CHARS_LONG)
  ],
  authController.signUp
);
router.post("/checkToken", jwtAuth(), userController.getUser);

router.post("/forgot-password", authController.forgotPassword);
router.get("/reset-password", authController.resetPassword);
router.put(
  "/update-password",
  [
    body("password")
      .exists({ checkFalsy: true, checkNull: true })
      .withMessage(validationCodes.MUST_NOT_BE_EMPTY),
    check("password")
      .isLength({ min: 6 })
      .withMessage(validationCodes.PASSWORD_6_CHARS_LONG)
  ],
  authController.updatePassword
);

module.exports = router;
