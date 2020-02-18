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
router.delete('/:id/:userId', jwtAuth(), privateZoneAuth(), advertController.deleteAdvertById);
router.post('/', multipartMiddleware, jwtAuth(), 
[
    body('name').exists({checkFalsy: true, checkNull: true}).withMessage('Must be a string'),
    body('for_sale').exists({checkNull: true}).isBoolean().withMessage('Must be a boolean'),
    body('tags').exists({checkFalsy: true, checkNull: true}).withMessage('Not a valid tag'),
    body('price').exists({checkFalsy: true, checkNull: true}).isNumeric().withMessage('Must be a number')
], advertController.saveAdvert);
router.put('/:id/:userId', multipartMiddleware, jwtAuth(), privateZoneAuth(), 
[
    body('name').exists({checkFalsy: true, checkNull: true}).withMessage('Must be a string'),
    body('for_sale').exists({checkNull: true}).isBoolean().withMessage('Must be a boolean'),
    body('tags').exists({checkFalsy: true, checkNull: true}).withMessage('Not a valid tag'),
    body('price').exists({checkFalsy: true, checkNull: true}).isNumeric().withMessage('Must be a number')
], advertController.updateAdvert);
router.post('/set-favs/:userId', jwtAuth(), privateZoneAuth(), favController.setAdvertFav);
router.put('/set-reserved-or-sold/:id/:userId', jwtAuth(), privateZoneAuth(), advertController.setReservedOrSoldAdvert);

module.exports = router;
