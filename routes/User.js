"use strict";

// Node imports
const express = require("express");
const { check, body } = require("express-validator");

// Own imports
const userController = require("../controllers/userController");
const jwtAuth = require("../lib/jwtAuth");
const privateZoneAuth = require("../lib/privateZoneAuth");
const { validation: validationCodes } = require("../utils/dictionary-codes");

const router = express.Router();

// READ
router.get("/:id", userController.getUser);

// UPDATE
router.put(
  "/:userId",
  jwtAuth(),
  privateZoneAuth(),
  [
    body("username")
      .exists({ checkFalsy: true, checkNull: true })
      .withMessage(validationCodes.MUST_NOT_BE_EMPTY),
    body("email")
      .exists({ checkFalsy: true, checkNull: true })
      .withMessage(validationCodes.MUST_NOT_BE_EMPTY),
    check("email")
      .isEmail()
      .withMessage(validationCodes.EMAIL_FORMAT_IS_NOT_CORRECT),
    check("username")
      .isLength({ min: 4 })
      .withMessage(validationCodes.USERNAME_4_CHARS_LONG)
  ],
  userController.updateUser
);

router.put(
  "/change-password/:userId",
  jwtAuth(),
  privateZoneAuth(),
  [
    body("password")
      .exists({ checkFalsy: true, checkNull: true })
      .withMessage(validationCodes.MUST_NOT_BE_EMPTY),
    check("password")
      .isLength({ min: 6 })
      .withMessage(validationCodes.PASSWORD_6_CHARS_LONG)
  ],
  userController.changePassword
);

// UNSUBSCRIBE user and his/her adverts
router.delete(
  "/unsubscribe/:userId",
  jwtAuth(),
  privateZoneAuth(),
  userController.unsubscribeUser
);

module.exports = router;
