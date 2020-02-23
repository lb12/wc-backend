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

const db = {
  connect: async dbURL => {
    // Conectar con la base de datos
    const url = dbURL || "mongodb://localhost/depatitos";

    // Evitar los warnings de mongoose
    const mongooseOptions = {
      useFindAndModify: false,
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true
    };
    await mongoose.connect(url, mongooseOptions);
    return conn;
  },
  disconnect: () => {
    console.log("Disconected from MongoDB on", conn.name);
    conn.close();
  }
};

module.exports = db;
