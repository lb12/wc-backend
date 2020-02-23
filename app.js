// Node imports
const express = require("express");
const logger = require("morgan");
const path = require("path");
const createError = require("http-errors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerConfig = YAML.load("./swagger.yaml");
const db = require("./lib/dbConnection");

const app = express();

// Conecto primero con la base de datos, la conexión no me es imprescindible
// Aun asi, la saco en el 'then'
db.connect(process.env.MONGODB_URL)
  .then(conn => {
    // Middlewares
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Headers",
        "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method"
      );
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, DELETE"
      );
      res.header("Allow", "GET, POST, OPTIONS, PUT, DELETE");
      next();
    });
    app.use(logger("dev"));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(express.static(path.join(__dirname, "public")));

    // Rutas del API
    const indexRouter = require("./routes/index");
    const userRouter = require("./routes/User");
    const advertRouter = require("./routes/advert");
    const tagsRouter = require("./routes/tags");
    const authRouter = require("./routes/authentication");
    const apiPath = "/api-v1";

    app.use(apiPath + "/auth", authRouter);
    app.use(apiPath + "/user", userRouter);
    app.use(apiPath + "/adverts", advertRouter);
    app.use(apiPath + "/tags", tagsRouter);
    app.use(apiPath + "/", indexRouter);

    // Swagger init
    app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerConfig));

    // Captura con un 404 aquellos endpoints no resueltos
    app.use(function(req, res, next) {
      next(createError(404));
    });

    // Error handler
    app.use((err, req, res, next) => {
      // Check validation error
      if (err.array) {
        // Validation error
        err.status = 422;
        const errInfo = err.array({ onlyFirstError: true })[0];
        err.message = isAPI(req)
          ? { message: "Not valid", errors: err.mapped() }
          : `Not valid - ${errInfo.param} ${errInfo.msg}`;
      }

      res.status(err.status || 500);

      if (isAPI(req)) {
        res.json({ success: false, error: err.message });
        return;
      }

      // Set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get("env") === "development" ? err : {};

      // Render the error page
      res.render("error");
    });

    function isAPI(req) {
      return req.originalUrl.indexOf("/api-v") === 0;
    }
  })
  .catch(error => {
    console.log("Error connecting mongodb");
    console.log(error);
  });

module.exports = app;
