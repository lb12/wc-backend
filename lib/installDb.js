"use strict";

// Node imports
require("dotenv").config();

// Imports propios
const conn = require("./dbConnection");
const User = require("../models/User");
const Tag = require("../models/Tag");
const Advert = require("../models/Advert");
const securityUtils = require("../utils/securityUtils");

// Variables que almacenan los modelos tras añadirlos a la DB
let users = [];
let tags = [];
let adverts = [];

conn.once("open", async () => {
  try {
    await installDB();
    closeDBConnection();
  } catch (error) {
    console.error("Something went wrong installing database.", error);
  }
});

async function installDB() {
  console.log("*****************************");
  console.log("* Users data");
  await handleUsersData();
  console.log("* Tags data");
  await handleTagsData();
  console.log("* Advert data");
  await handleAdvertsData();
  console.log("* Set users favs");
  await handleUsersFavs();
  console.log("*****************************");
}

// [START]: Métodos de usuario
/**
 * Método fachada que gestiona los usuarios
 */
async function handleUsersData() {
  await deleteAllDataFromDB(User, "users");
  const usersSample = require(`../data/sample_users.json`);
  const usersHashedPass = await hashUsersPass(usersSample);
  await loadUsersIntoDB(usersHashedPass);
}

/**
 * Hashea la contraseña de todos los usuarios de muestra
 * @param {*} usersSample usuarios de muestra con la contraseña en plano
 */
async function hashUsersPass(usersSample) {
  let users = [];
  try {
    users = Promise.all(
      usersSample.map(async user => {
        user.password = await securityUtils.hashString(user.password);
        return user;
      })
    );
  } catch (error) {
    console.log("Error hashing users passwords", error);
  }

  return users;
}

/**
 * Carga los usuarios con la contraseña hasheada en la base de datos
 * @param {*} usersHashedPass usuarios con la contraseña hasheada
 */
async function loadUsersIntoDB(usersHashedPass) {
  try {
    users = await User.insertMany(usersHashedPass);

    console.info(`${users.length} new users were successfully stored.`);
  } catch (error) {
    conn.emit("error", error);
  }
}

// [END]: Métodos de usuario

// [START]: Métodos de tags
/**
 * Método fachada que gestiona los tags
 */
async function handleTagsData() {
  await deleteAllDataFromDB(Tag, "tags");
  const sampleTags = require(`../data/sample_tags.json`);
  await loadTagsIntoDB(sampleTags);
}

/**
 * Carga los tags en la base de datos
 * @param {*} sampleTags tags de muestra
 */
async function loadTagsIntoDB(sampleTags) {
  try {
    tags = await Tag.insertMany(sampleTags);

    console.info(`${tags.length} new tags were successfully stored.`);
  } catch (error) {
    conn.emit("error", error);
  }
}

// [END]: Métodos de tags

// [START]: Métodos de anuncios
/**
 * Método fachada que gestiona los anuncios
 */
async function handleAdvertsData() {
  await deleteAllDataFromDB(Advert, "adverts");
  const sampleAdverts = require(`../data/sample_adverts.json`);
  assignFields(sampleAdverts); // Añadir un tag y un user aleatorios
  await loadAdvertsIntoDB(sampleAdverts);
}

/**
 * Añade un usuario y una lista de tags aleatorios de las muestras anteriores a los anuncios
 * @param {*} sampleAdverts anuncios precargados
 */
function assignFields(sampleAdverts) {
  adverts = sampleAdverts.map(advert => {
    assignRandomUser(advert);
    assignRandomTags(advert);
  });
}

/**
 * Añade una lista de tags aleatorios a un anuncio
 * @param {*} sampleAdvert anuncio
 */
function assignRandomTags(sampleAdvert) {
  const randomTagsAmount = Math.floor(Math.random() * 3) + 1; // Como mucho 3 tags y mínimo 1
  const _tags = [];

  for (let index = 0; index < randomTagsAmount; index++) {
    let tag = "";
    // Nos aseguramos que un mismo anuncio no tenga tags repetidos
    do {
      tag = getFieldFromRandomObjectCollection("value", tags);
    } while (_tags.includes(tag));
    _tags.push(tag);
  }
  sampleAdvert.tags = _tags;
}

/**
 * Añade un usuario creador aleatorio a un anuncio
 * @param {*} sampleAdvert anuncio
 */
function assignRandomUser(sampleAdvert) {
  const userId = getFieldFromRandomObjectCollection("_id", users);
  sampleAdvert.member = userId;
}

/**
 * Carga los anuncios en la base de datos
 * @param {*} sampleTags tags de muestra
 */
async function loadAdvertsIntoDB(sampleAdverts) {
  try {
    adverts = await Advert.insertMany(sampleAdverts);

    console.info(`${adverts.length} new adverts were successfully stored.`);
  } catch (error) {
    conn.emit("error", error);
  }
}

// [END]: Métodos de anuncios

// [START]: Métodos de favs
/**
 * Método que gestiona los favs
 */
async function handleUsersFavs() {
  try {
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const randomFavsAmount = Math.floor(Math.random() * 4); // Como mucho 3 ads favoritos
      const favs = [];
      for (let j = 0; j < randomFavsAmount; j++) {
        let adId = "";
        // Nos aseguramos que un mismo user no tenga favs repetidos
        do {
          adId = getFieldFromRandomObjectCollection("_id", adverts);
        } while (favs.includes(adId));
        favs.push(adId);
      }
      // Actualizo el usuario con los favs
      await User.findByIdAndUpdate(user._id, { favs });
    }
  } catch (error) {
    console.log(error);
  }
}
// [END]: Métodos de favs

// [START]: Métodos auxiliares

/**
 * Obtiene el campo de un objeto aleatorio de una coleccion dada
 * @param {*} field campo a obtener
 * @param {*} collection collección de la que obtendremos el objeto
 */
function getFieldFromRandomObjectCollection(field, collection) {
  const randomIndex = Math.floor(Math.random() * collection.length);
  return collection[randomIndex][field];
}

/**
 * Borra toda una colección de datos
 * @param {*} DataModel Colección que tiene que eliminar
 * @param {*} dataName Nombre de la colección
 */
async function deleteAllDataFromDB(DataModel, dataName) {
  try {
    let dataDeleted = await DataModel.deleteMany({}).exec();

    console.log(`${dataDeleted.n} ${dataName} were successfully deleted.`);
  } catch (error) {
    conn.emit("error", error);
  }
}

/**
 * Cierra la conexión con la base de datos
 */
async function closeDBConnection() {
  try {
    await conn.close();
    console.info(
      `Connection with database ${conn.name} was successfully closed. `
    );
  } catch (error) {
    conn.emit("error", error);
  }
}

// [END]: Métodos auxiliares
