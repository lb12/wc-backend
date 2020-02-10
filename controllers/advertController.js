"use strict";

// Node imports
const { validationResult } = require("express-validator");

// Our imports
const Advert = require("../models/Advert");
const dbUtils = require("../utils/dbUtils");

// START: Métodos con lógica de negocio

const getById = async id => {
  if (!dbUtils.isValidId(id)) {
    return { success: false, message: "Provide correct Advert id" };
  }

  const advert = await Advert.getById(id);

  if (!advert) {
    return { success: false, message: "Advert id was not found in database" };
  }

  return { success: true, result: advert };
};

const getByMemberId = async (memberId, filters) => {
  if (!dbUtils.isValidId(memberId)) {
    return { success: false, message: "Provide correct Member id" };
  }

  const adverts = await Advert.getByMemberId(memberId, filters);

  return { success: true, results: adverts };
};

const getAll = async filters => {
  const adverts = await Advert.listAll(filters);

  return { success: true, results: adverts };
};

// END: Métodos con lógica de negocio

// START: Métodos fachada

/**
 * GET advert info
 * @param id id of the advert
 * @returns Advert info
 */
const getAdvertById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await getById(id);

    const status =
      result.message === "Provide correct Advert id"
        ? 422
        : result.message === "Advert id was not found in database"
        ? 404
        : 200;

    return res.status(status).send(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET adverts created by a member
 * @param memberId id of the member
 * @returns Adverts list
 */
const getAdvertsByMemberId = async (req, res, next) => {
  const { memberId } = req.params;
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const skip = !isNaN(page) || page !== 1 ? limit * page - limit : 0;

  try {
    const result = await getByMemberId(memberId, { skip, limit });

    const status = result.message === "Provide correct Member id" ? 422 : 200;

    return res.status(status).send(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET adverts from the DB
 * @param req can receive a list of filters and process them to obtain a list of adverts
 * @returns Adverts list
 */
const getAdverts = async (req, res, next) => {
  try {
    validationResult(req).throw();

    // Filters by
    const name = req.query.name;
    const forSale = req.query.for_sale;
    const tag = req.query.tag;
    const price = req.query.price;

    // Other filters
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const skip = !isNaN(page) || page !== 1 ? limit * page - limit : 0;
    const fields = req.query.fields;
    const sort = { _id: req.query.sort ? req.query.sort : -1 }; // if no sort filter, newest adverts go first

    const filter = {};

    if (name) {
      filter.name = new RegExp("^" + name, "i"); // ^ = starts with ; i = case insensitive
    }

    if (forSale) {
      filter.for_sale = forSale;
    }

    if (tag) {
      filter.tags = tag;
    }

    if (price) {
      const priceFilterSplitted = price.split("-");

      if (priceFilterSplitted.length === 1) {
        // [ '50' ] value
        filter.price = parseInt(priceFilterSplitted[0]);
      } else {
        if (priceFilterSplitted[0] !== "" && priceFilterSplitted[1] !== "") {
          // [ '50', '60' ] min-max
          filter.price = {
            $gte: parseInt(priceFilterSplitted[0]),
            $lte: parseInt(priceFilterSplitted[1])
          };
        } else if (
          priceFilterSplitted[0] !== "" &&
          priceFilterSplitted[1] === ""
        ) {
          // [ '50', '' ] min-
          filter.price = { $gte: parseInt(priceFilterSplitted[0]) };
        } else {
          // [ '', '60' ] -max
          filter.price = { $lte: parseInt(priceFilterSplitted[1]) };
        }
      }
    }

    const result = await getAll({ filter, skip, limit, fields, sort });

    return res.status(200).send(result);
  } catch (error) {
    next(error);
  }
};

// END: Métodos fachada

/**
 * POST an advert to the DB
 * @param req receives in req.body all the fields of the advert.
 */
/* async function saveAdvert(req, next) {
  try {
    validationResult(req).throw();

    let data = req.body;
    const file = req.files;

    const photoObj = getPhotoFileObj(file);
    data.photo = photoObj.fullname;

    const advert = new Advert(data);
    const advertSaved = await advert.save();

    // Send message to the RabbitMQ to create a new thumbnail
    const thumbnailMessage = {
      info: `${photoObj.fullname} at ${Date.now()}`,
      image: photoObj,
      quality: 75
    };
    createThumbnail(thumbnailMessage).catch(err => console.log(err));

    return advertSaved;
  } catch (error) {
    next(error);
    return;
  }
} */

// Aux methods

/**
 * Get the filename of the advert photo
 * @param file Object with the advert info fields
 */
/* function getPhotoFileObj(file) {
  const filePath = file.photo.path;
  const splittedPath = filePath.split("/");

  const fileName = splittedPath.pop(3);
  const imagePath = splittedPath.join("/");

  const splittedFileName = fileName.split(".");
  const fileExtension = splittedFileName[splittedFileName.length - 1];

  const fileObj = {
    fullname: fileName,
    name: splittedFileName[0],
    extension: fileExtension,
    path: imagePath
  };

  return fileObj;
} */

module.exports = {
  getAdverts,
  getAdvertById,
  getAdvertsByMemberId
};
