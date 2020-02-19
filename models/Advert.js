"use strict";

// Node imports
const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater"); // Garantizar URL SEO-Friendly

// Imports propios
const { ObjectId } = mongoose.Schema.Types;

// Añadimos 'slug' como plugin de mongoose
mongoose.plugin(slug);

const advertSchema = mongoose.Schema({
  name: { type: String, index: true },
  for_sale: { type: Boolean, index: true },
  price: { type: Number, index: true },
  photo: String,
  tags: { type: [String], index: true },
  description: String,
  reserved: { type: Boolean, default: false },
  sold: { type: Boolean, default: false, index: true },
  member: { type: ObjectId, ref: "User", index: true },
  slug: { type: String, slug: "name", unique: true } // Aplicado al 'name' del anuncio
});

// START: *Métodos del modelo*
/**
 * Devolver un listado de anuncios en un array
 */
advertSchema.statics.listAll = function({ filter, skip, limit, fields, sort }) {
  const query = Advert.find(filter);
  query.skip(skip);
  query.limit(limit);
  query.select(fields);
  query.populate({ path: "member", select: ["username", "slug"] });
  query.sort(sort);
  return query.exec();
};

/**
 * Contar todos los documentos incluidos en una paginación
 */
advertSchema.statics.countWithFilters = function({ filter }) {
  const query = Advert.countDocuments(filter);
  return query.exec();
};

/**
 * Busca un anuncio a partir de su id
 */
advertSchema.statics.getById = function(advertId) {
  const query = Advert.findById(advertId);
  query.populate({ path: "member", select: ["username", "slug"] });
  return query.exec();
};

/**
 * Busca todos los anuncios de un usuario a partir del id de este
 */
advertSchema.statics.getByMemberId = function(memberId, { skip, limit }) {
  const query = Advert.find({ member: memberId });
  query.skip(skip);
  query.limit(limit);
  query.populate({ path: "member", select: ["username", "slug"] });
  query.sort({ _id: -1 });
  return query.exec();
};

/**
 * Devuelve un listado de todos los tags encontrados en los anuncios
 */
advertSchema.statics.getDistinctTags = function() {
  const query = Advert.distinct("tags");
  query.sort();
  return query.exec();
};

/**
 * Elimina todos los anuncios a partir del id del usuario creador
 */
advertSchema.statics.deleteAdvertsByUserId = function(userId) {
  const query = Advert.deleteMany({ member: userId });
  return query.exec();
};

/**
 * Elimina un anuncio a partir de su id
 */
advertSchema.statics.deleteAdvert = function(advertId) {
  const query = Advert.findByIdAndDelete(advertId);
  return query;
};

/**
 * Actualiza los datos de un anuncio a partir de su id
 */
advertSchema.statics.updateAdvert = function(advertId, advertData) {
  const query = Advert.findByIdAndUpdate(advertId, advertData, { new: true });

  return query.exec();
};
// END: *Métodos del modelo*

const Advert = mongoose.model("Advert", advertSchema);

module.exports = Advert;
