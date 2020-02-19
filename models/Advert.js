"use strict";

// Load mongoose module
const mongoose = require("mongoose");
const slug = require('mongoose-slug-updater');
const { ObjectId } = mongoose.Schema.Types;

mongoose.plugin(slug);

// Define the Advert schema
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
  slug: { type: String, slug: "name", unique: true }
});



// Model methods

/**
 * Lists an array of adverts if found.
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
 * Count all the documents
 */
advertSchema.statics.countWithFilters = function({ filter }) {
  const query = Advert.countDocuments(filter);
  return query.exec();
};

/**
 * Searchs an advert by his Id
 */
advertSchema.statics.getById = function(advertId) {
  const query = Advert.findById(advertId);
  query.populate({ path: "member", select: ["username", "slug"] });
  return query.exec();
};

/**
 * Lists an array of adverts published by a member Id
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
 * Lists distinct advert tags
 */
advertSchema.statics.getDistinctTags = function() {
  const query = Advert.distinct("tags");
  query.sort();
  return query.exec();
};

/**
 * Delete adverts by user id
 */
advertSchema.statics.deleteAdvertsByUserId = function(userId) {
  const query = Advert.deleteMany({ member: userId });
  return query.exec();
};

advertSchema.statics.deleteAdvert = function(advertId) {
  const query = Advert.findByIdAndDelete(advertId);
  return query;
}

advertSchema.statics.updateAdvert = function(advertId, advertData) {
  const query = Advert.findByIdAndUpdate(advertId, advertData, { new: true });

  return query.exec();
};

// Create the Advert Model
const Advert = mongoose.model("Advert", advertSchema);

// Export Advert Schema
module.exports = Advert;
