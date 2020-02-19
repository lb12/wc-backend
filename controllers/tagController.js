"use strict";

// Imports propios
const Advert = require("../models/Advert");

// *START: Métodos lógica negocio*
/**
 * Obtiene los tags de la base de datos
 */
const getDistinctTags = async () => {
  const tags = await Advert.getDistinctTags();

  return { success: true, results: tags };
};
// *END: Métodos lógica negocio*

// *START: Métodos fachada (middleware)*
/**
 * Obtener tags
 */
const getTags = async (req, res, next) => {
  try {
    const result = await getDistinctTags();

    const status = result ? 200 : 500;

    return res.status(status).send(result);
  } catch (error) {
    next(error);
  }
};
// *END: Métodos fachada (middleware)*

module.exports = {
  getTags
};
