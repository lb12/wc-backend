"use strict";

// Node imports
const { validationResult } = require("express-validator");

// Our imports
const Advert = require("../models/Advert");
const userController = require("./userController");
const dbUtils = require("../utils/dbUtils");
const filesUtils = require("../utils/filesUtils");

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

  const countAllAdverts = await Advert.countWithFilters({
    filter: { member: memberId }
  });

  return { success: true, results: adverts, totalAdverts: countAllAdverts };
};

const getFavs = async (memberId, { skip, limit }) => {
  if (!dbUtils.isValidId(memberId)) {
    return { success: false, message: "Provide correct Member id" };
  }

  const user = await userController.readUser(memberId);

  // Ha habido un error en la obtencion del usuario, ya trae el mensaje de error, lo devuelvo tal cual.
  if (user.message) {
    return user;
  }

  // Tenemos un array de ids, por lo que tenemos que hacer el paginado manualmente
  const { favs } = user.result;
  const totalAdverts = favs.length;
  const adverts = favs.slice(skip, skip + limit);

  // Obtenemos los datos de los adverts de la pagina correspondiente
  const results = await Promise.all(
    adverts.map(async advertId => await Advert.getById(advertId))
  );

  return { success: true, results, totalAdverts };
};

const getAll = async filters => {
  const adverts = await Advert.listAll(filters);
  const countAllAdverts = await Advert.countWithFilters(filters);

  return { success: true, results: adverts, totalAdverts: countAllAdverts };
};

const deleteAdvert = async advertId => {
  const advert = await Advert.deleteAdvert(advertId);
  return { success: true, result: advert };
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
  const obtainFavs = req.query.favs === "true";

  try {
    let result;

    if (obtainFavs) {
      result = await getFavs(memberId, { skip, limit });
    } else {
      result = await getByMemberId(memberId, { skip, limit });
    }

    let status = 200;

    switch (result.message) {
      case "Provide correct Member id":
        status = 422;
        break;
      case "User id was not found in database":
        status = 404;
        break;
      default:
        break;
    }

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

const deleteAdvertById = async (req, res, next) => {
  const advertId = req.params.id;

  const result = await deleteAdvert(advertId);

  return res.status(200).send(result);
};

const saveAdvert = async (req, res, next) => {
  try {
    validationResult(req).throw();
    let data = req.body;
    const file = req.files;

    data.photo = filesUtils.getPhotoFilename(file);

    const advert = new Advert(data);
    const savedAdvert = await advert.save();

    return res.status(200).send({ success: true, result: savedAdvert });
  } catch (error) {
    next(error);
  }
};

const updateAdvert = async (req, res, next) => {
  try {
    validationResult(req).throw();
    const { id } = req.params;
    let data = req.body;

    const file = req.files;

    if (Object.keys(file).length > 0) {
      data.photo = filesUtils.getPhotoFilename(file);
    }

    const updatedAdvert = await Advert.updateAdvert(id, data);

    return res.status(200).send({ success: true, result: updatedAdvert });
  } catch (error) {
    next(error);
  }
};

// END: Métodos fachada

module.exports = {
  getAdverts,
  getAdvertById,
  getAdvertsByMemberId,
  deleteAdvertById,
  saveAdvert,
  updateAdvert
};
