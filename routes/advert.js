"use strict";

// Node imports
const express = require("express");
const { query, body } = require("express-validator");

// Load multipart module
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart({ uploadDir: 'public/images/adverts' });

// Our imports
const router = express.Router();
const advertController = require("../controllers/advertController");
const favController = require("../controllers/favController");
const jwtAuth = require("../lib/jwtAuth");
const privateZoneAuth = require("../lib/privateZoneAuth");
const { validation: validationCodes } = require('../utils/dictionary-codes');

router.get(
  "/",
  [
    query("for_sale")
      .optional()
      .isBoolean()
      .withMessage(validationCodes.MUST_BE_BOOLEAN),
    query("price")
      .optional()
      .matches(/[0-9]*-?[0-9]*/g)
      .withMessage(validationCodes.NOT_VALID_EXPRESSION),
    query("page")
      .optional()
      .isNumeric()
      .withMessage(validationCodes.MUST_BE_NUMBER),
    query("limit")
      .optional()
      .isNumeric()
      .withMessage(validationCodes.MUST_BE_NUMBER)
  ],
  advertController.getAdverts
);
router.get("/:id", advertController.getAdvertById);
router.get("/member/:memberId", advertController.getAdvertsByMemberId);
router.delete('/:id/:userId', jwtAuth(), privateZoneAuth(), advertController.deleteAdvertById);
router.post('/', multipartMiddleware, jwtAuth(), 
[
    body('name').exists({checkFalsy: true, checkNull: true}).withMessage(validationCodes.MUST_NOT_BE_EMPTY),
    body('description').exists({checkFalsy: true, checkNull: true}).withMessage(validationCodes.MUST_NOT_BE_EMPTY),
    body('for_sale').exists({checkNull: true}).isBoolean().withMessage(validationCodes.MUST_BE_BOOLEAN),
    body('tags').exists({checkFalsy: true, checkNull: true}).withMessage(validationCodes.TAG_NOT_VALID),
    body('price').exists({checkFalsy: true, checkNull: true}).isNumeric().withMessage(validationCodes.MUST_BE_NUMBER)
], advertController.saveAdvert);
router.put('/:id/:userId', multipartMiddleware, jwtAuth(), privateZoneAuth(), 
[
    body('name').exists({checkFalsy: true, checkNull: true}).withMessage(validationCodes.MUST_NOT_BE_EMPTY),
    body('description').exists({checkFalsy: true, checkNull: true}).withMessage(validationCodes.MUST_NOT_BE_EMPTY),
    body('for_sale').exists({checkNull: true}).isBoolean().withMessage(validationCodes.MUST_BE_BOOLEAN),
    body('tags').exists({checkFalsy: true, checkNull: true}).withMessage(validationCodes.TAG_NOT_VALID),
    body('price').exists({checkFalsy: true, checkNull: true}).isNumeric().withMessage(validationCodes.MUST_BE_NUMBER)
], advertController.updateAdvert);
router.post('/set-favs/:userId', jwtAuth(), privateZoneAuth(), favController.setAdvertFav);
router.put('/set-reserved-or-sold/:id/:userId', jwtAuth(), privateZoneAuth(), advertController.setReservedOrSoldAdvert);

module.exports = router;
