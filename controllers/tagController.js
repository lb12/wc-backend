"use strict";

// Node imports
const { validationResult } = require("express-validator");

// Imports propios
const Tag = require("../models/Tag");

// *START: Métodos lógica negocio*
/**
 * Obtiene los tags de la base de datos
 */
const getDistinctTags = async () => {
  const tags = await Tag.getTags();

  return { success: true, results: tags };
};

/**
 * Crea un nuevo tag en la base de datos
 */
const createTag = async value => {
  const tag = new Tag({ value });
  
  const newTag = await tag.save();

  return { success: true, result: newTag };
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

/**
 * Añadir un tag
 */
const addTag = async (req, res, next) => {
  try {
    validationResult(req).throw();
    const { name } = req.body;

    const result = await createTag(name);

    const status = result ? 200 : 500;

    return res.status(status).send(result);
  } catch (error) {
    next(error);
  }
};
// *END: Métodos fachada (middleware)*

module.exports = {
  getTags,
  addTag
};
