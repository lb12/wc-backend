"use strict";

// Node imports
const express = require("express");
const { check, body } = require("express-validator");

// Our imports
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const jwtAuth = require("../lib/jwtAuth");

const router = express.Router();

router.post(
  "/signin",
  [
    body("username")
      .exists({ checkFalsy: true, checkNull: true })
      .withMessage("Must be a string"),
    body("password")
      .exists({ checkFalsy: true, checkNull: true })
      .withMessage("Must be a string"),
    check("username")
      .isLength({ min: 4 })
      .withMessage("Username should be at least 4 chars long"),
    check("password")
      .isLength({ min: 6 })
      .withMessage("Password should be at least 6 chars long")
  ],
  authController.signIn
);
router.post(
  "/signup",
  [
    body("username")
      .exists({ checkFalsy: true, checkNull: true })
      .withMessage("Must be a string"),
    body("email")
      .exists({ checkFalsy: true, checkNull: true })
      .withMessage("Must be a string"),
    body("password")
      .exists({ checkFalsy: true, checkNull: true })
      .withMessage("Must be a string"),
    check("email")
      .isEmail()
      .withMessage("Email format is not correct"),
    check("username")
      .isLength({ min: 4 })
      .withMessage("Username should be at least 4 chars long"),
    check("password")
      .isLength({ min: 6 })
      .withMessage("Password should be at least 6 chars long")
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
      .withMessage("Must be a string"),
    check("password")
      .isLength({ min: 6 })
      .withMessage("Password should be at least 6 chars long")
  ],
  authController.updatePassword
);

module.exports = router;
