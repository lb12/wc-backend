"use strict";

// Node imports
const express = require("express");
const { query, body } = require("express-validator");

// Our imports
const router = express.Router();
const advertController = require("../controllers/advertController");

router.get(
  "/",
  [
    query("for_sale")
      .optional()
      .isBoolean()
      .withMessage("Must be a boolean"),
    query("price")
      .optional()
      .matches(/[0-9]*-?[0-9]*/g)
      .withMessage("Not a valid expression"),
    query("page")
      .optional()
      .isNumeric()
      .withMessage("Must be a number"),
    query("limit")
      .optional()
      .isNumeric()
      .withMessage("Must be a number")
  ],
  advertController.getAdverts
);
router.get("/:id", advertController.getAdvertById);
router.get("/member/:memberId", advertController.getAdvertsByMemberId);

module.exports = router;
