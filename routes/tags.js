"use strict";

// Node imports
const express = require("express");
const { body } = require("express-validator");

// Own imports
const tagController = require("../controllers/tagController");
const { validation: validationCodes } = require("../utils/dictionary-codes");

const router = express.Router();

// READ
router.get("/", tagController.getTags);
// POST
router.post(
  "/",
  [
    body("name")
      .exists({ checkFalsy: true, checkNull: true })
      .withMessage(validationCodes.MUST_NOT_BE_EMPTY)
  ],
  tagController.addTag
);

module.exports = router;
