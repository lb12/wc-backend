"use strict";

// Node imports
const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");

// Imports propios
const { ObjectId } = mongoose.Schema.Types;

// Añadimos 'slug' como plugin de mongoose
mongoose.plugin(slug);

const UserSchema = mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  favs: { type: [{ type: ObjectId, ref: "Advert" }] },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Number },
  slug: { type: String, slug: "username", unique: true } // Aplicado al 'username' del usuario
});

// START: *Métodos del modelo*
/**
 * Buscar un usuario a partir de su id
 */
UserSchema.statics.getUser = function(userId) {
  const query = User.findById(userId);

  return query.exec();
};

/**
 * Actualizar los datos de un usuario a partir de su id
 */
UserSchema.statics.updateUser = function(userId, userData) {
  const query = User.findByIdAndUpdate(userId, userData, { new: true });

  return query.exec();
};

/**
 * Actualiza la contraseña de un usuario a partir de su id
 */
UserSchema.statics.updatePassword = function(userId, hashedPassword) {
  const query = User.findByIdAndUpdate(
    userId,
    { password: hashedPassword },
    { new: true }
  );

  return query.exec();
};

/**
 * Elimina un usuario a partir de su id
 */
UserSchema.statics.deleteUser = function(userId) {
  const query = User.findByIdAndDelete(userId);

  return query.exec();
};

/**
 * Comprueba si un usuario existe o no a partir de su username o su email
 */
UserSchema.statics.existsUser = function({ username, email }) {
  const query = User.findOne({
    $or: [{ username }, { email }]
  });

  return query.exec();
};

/**
 * Busca un usuario a partir del token de recuperación de contraseña
 */
UserSchema.statics.findByEmailToken = function({ token, email }) {
  const query = User.findOne({
    $and: [
      { resetPasswordToken: token },
      { resetPasswordExpires: { $gte: Date.now() } },
      email ? { email } : {}
    ]
  });

  return query.exec();
};

/**
 * Elimina el anuncio de todas las listas de favoritos
 */
UserSchema.statics.popAdvertFromFavLists = function(advertId) {
  const query = User.updateMany({}, { $pullAll: { favs: [advertId] } });

  return query.exec();
};
// END: *Métodos del modelo*

const User = mongoose.model("User", UserSchema);

module.exports = User;
