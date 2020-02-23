"use strict";

// Node imports
const request = require("supertest");
const app = require("../app");
require("dotenv").config();

// Imports propios
const db = require("../lib/dbConnection");

// Antes de cualquier cosa conectamos con la DB de testing
before(async () => {
  await db.connect(process.env.MONGODB_URL_TEST);
});

/**
 * 1. Autenticación
 */
describe("1. Auth tests", () => {
  it("Test 1.1: POST /api-v1/auth/signin with right credentials returns 200", done => {
    const login = {
      username: "lb12",
      password: "123456789"
    };

    request(app)
      .post("/api-v1/auth/signin")
      .send(login)
      .expect(200, done);
  });

  it("Test 1.2: POST /api-v1/auth/signin with wrong credentials returns 422", done => {
    const login = {
      username: "user@example.com",
      password: "asdfasd"
    };

    request(app)
      .post("/api-v1/auth/signin")
      .send(login)
      .expect(422, done);
  });
});

/**
 * 2. Usuarios
 */
describe("2. Users tests", () => {
  it("Test 2.1: GET /api-v1/user/:id with wrong id returns 422", done => {
    const userId = 1;
    request(app)
      .get(`/api-v1/user/${userId}`)
      .expect(422, done);
  });
  it("Test 2.2: GET /api-v1/user/:id with invented id returns 404", done => {
    const userId = "id_inventado";
    request(app)
      .get(`/api-v1/user/${userId}`)
      .expect(404)
      .expect({ success: false, message: "USER_NOT_FOUND" }, done);
  });
  it("Test 2.3: PUT /api-v1/user/:userId with invented id and no token provided returns 401", done => {
    const userId = "id_inventado";
    request(app)
      .put(`/api-v1/user/${userId}`)
      .expect(401)
      .expect({ success: false, error: "NO_TOKEN_PROVIDED" }, done);
  });
});

/**
 * 3. Anuncios
 */
describe("3. Adverts tests", () => {
  it("Test 3.1: GET /api-v1/adverts should return 200", done => {
    request(app)
      .get(`/api-v1/adverts`)
      .expect(200, done);
  });
});

/**
 * 4. Tags
 */
describe("4. Tags tests", () => {
  it("Test 4.1: GET /api-v1/tags should return 200", done => {
    request(app)
      .get(`/api-v1/tags`)
      .expect(200, done);
  });

  it("Test 4.2: POST /api-v1/tags should return 200", done => {
    const tag = { name: "garden" };
    request(app)
      .post(`/api-v1/tags`)
      .send(tag)
      .expect(200, done);
  });
});

/**
 * Al acabar, desconectamos
 */
after(done => {
  db.disconnect();
  done();
});
