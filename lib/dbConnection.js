"use strict";

const mongoose = require("mongoose");
const conn = mongoose.connection;

conn.on("error", error => {
  console.log("Connection error", error);
  process.exit(1);
});

conn.once("open", () => {
  console.log("Connected with MongoDB on", conn.name);
});

// Evitar los warnings de mongoose
const mongooseOptions = {
  useFindAndModify: false,
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
};

// Conectar con la base de datos
const dbURL = process.env.MONGODB_URL || "mongodb://localhost/wallaclone";
mongoose.connect(dbURL, mongooseOptions);

module.exports = conn;
