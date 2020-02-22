"use strict";

// Node imports
const { validationResult } = require("express-validator");

// Imports propios
const Advert = require("../models/Advert");
const userController = require("./userController");
const dbUtils = require("../utils/dbUtils");
const filesUtils = require("../utils/filesUtils");
const {
  adverts: advertCodes,
  users: userCodes,
  validation: validationCodes
} = require("../utils/dictionary-codes");

// *START: Métodos lógica negocio*
/**
 * Obtiene un anuncio a partir de su id
 */
const getById = async id => {
  if (!dbUtils.isValidId(id)) {
    return { success: false, message: advertCodes.NOT_VALID_ADVERT_ID };
  }

  const advert = await Advert.getById(id);

  if (!advert) {
    return { success: false, message: advertCodes.ADVERT_NOT_FOUND };
  }

  return { success: true, result: advert };
};

/**
 * Obtiene todos los anuncios de un usuario a partir del id de este
 */
const getByMemberId = async (memberId, filters) => {
  if (!dbUtils.isValidId(memberId)) {
    return { success: false, message: userCodes.NOT_VALID_USER_ID };
  }

  const adverts = await Advert.getByMemberId(memberId, filters);

  const countAllAdverts = await Advert.countWithFilters({
    filter: { member: memberId }
  });

  return { success: true, results: adverts, totalAdverts: countAllAdverts };
};

/**
 * Obtiene todos los anuncios favoritos de un usuario a partir del id de este
 */
const getFavs = async (memberId, { skip, limit }) => {
  if (!dbUtils.isValidId(memberId)) {
    return { success: false, message: userCodes.NOT_VALID_USER_ID };
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

/**
 * Obtiene todos los anuncios a partir de unos filtros, en caso de que los hubiera
 */
const getAll = async filters => {
  const adverts = await Advert.listAll(filters);
  const countAllAdverts = await Advert.countWithFilters(filters);

  return { success: true, results: adverts, totalAdverts: countAllAdverts };
};

/**
 * Elimina un anuncio a partir de su id
 */
const deleteAdvert = async advertId => {
  const advert = await Advert.deleteAdvert(advertId);
  return { success: true, result: advert };
};
// *END: Métodos lógica negocio*

// *START: Métodos fachada*
/**
 * Obtener un anuncio a partir de su id
 */
const getAdvertById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await getById(id);

    const status =
      result.message === advertCodes.NOT_VALID_ADVERT_ID
        ? 422
        : result.message === advertCodes.ADVERT_NOT_FOUND
        ? 404
        : 200;

    return res.status(status).send(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * Obtener los anuncios de un usuario
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
      case userCodes.NOT_VALID_USER_ID:
        status = 422;
        break;
      case userCodes.USER_NOT_FOUND:
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
 * Obtener los anuncios según una lista de filtros si la hubiese
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

    filter.sold = false; // Solo mostramos en la búsqueda PÚBLICA aquellos anuncios que NO se han vendido

    const result = await getAll({ filter, skip, limit, fields, sort });

    return res.status(200).send(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar un anuncio a partir de su id
 */
const deleteAdvertById = async (req, res, next) => {
  try {
    const advertId = req.params.id;

    if (!dbUtils.isValidId(advertId)) {
      return res.status(422).send({ success: false, message: advertCodes.NOT_VALID_ADVERT_ID });
    }
  
    // Eliminar también el anuncio de los favoritos de otros usuarios
    await userController.popAdvertFromFavLists(advertId);
    
    // Finalmente eliminar el anucio
    const result = await deleteAdvert(advertId);
  
    return res.status(200).send(result);    
  } catch (error) {
    next(error);
  }
};

/**
 * Guardar un anuncio
 */
const saveAdvert = async (req, res, next) => {
  try {
    validationResult(req).throw();
    let data = req.body;
    const file = req.files;
    
    if (Object.keys(file).length === 0) {
      return res.status(422).send({ success: false, message: validationCodes.PHOTO_FILE_IS_MANDATORY });
    }

    data.photo = filesUtils.getPhotoFilename(file);
    data.tags = data.tags.split(","); // tags need split

    const advert = new Advert(data);
    const savedAdvert = await advert.save();

    return res.status(200).send({ success: true, result: savedAdvert });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar un anuncio
 */
const updateAdvert = async (req, res, next) => {
  try {
    validationResult(req).throw();
    const { id } = req.params;
    let data = req.body;
    const file = req.files;

    if (Object.keys(file).length > 0) {
      data.photo = filesUtils.getPhotoFilename(file);
    }

    data.tags = data.tags.split(","); // tags need split

    const updatedAdvert = await Advert.updateAdvert(id, data);

    return res.status(200).send({ success: true, result: updatedAdvert });
  } catch (error) {
    next(error);
  }
};

/**
 * Marcar / Desmarcar un anuncio como reservado o vendido
 */
const setReservedOrSoldAdvert = async (req, res, next) => {
  try {
    const { id } = req.params;
    let data = req.body;

    const updatedAdvert = await Advert.updateAdvert(id, data);

    return res.status(200).send({ success: true, result: updatedAdvert });
  } catch (error) {
    next(error);
  }
};
// *END: Métodos fachada*

module.exports = {
  getAdverts,
  getAdvertById,
  getAdvertsByMemberId,
  deleteAdvertById,
  saveAdvert,
  updateAdvert,
  setReservedOrSoldAdvert
};
