"use strict";

const Advert = require("../models/Advert");

/**
 * GET all the distinct tags in the database
 */
const getDistinctTags = async () => {
  const tags = await Advert.getDistinctTags();

  return { success: true, results: tags };
};

const getTags = async (req, res, next) => {
  try {
    const result = await getDistinctTags();

    const status = result ? 200 : 500;

    return res.status(status).send(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTags
};
