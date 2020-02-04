// Node imports
const express = require('express');
const logger = require('morgan');
const createError = require('http-errors');

const app = express();


// View engine setup
/* app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').__express); */


// Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// DB connection
require('./lib/dbConnection');


// API Routes
const indexRouter = require('./routes/index');
const userRouter = require('./routes/User');
const authRouter = require('./routes/authentication');
const apiPath = '/api-v1';
app.use(apiPath + '/auth', authRouter);
app.use(apiPath + '/user', userRouter);
app.use(apiPath + '/', indexRouter);



// Catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});


// Error handler
app.use( (err, req, res, next) => {
    // Check validation error
  if (err.array) { // Validation error
    err.status = 422;
    const errInfo = err.array({ onlyFirstError: true })[0];
    err.message = isAPI(req) ?
      { message: 'Not valid', errors: err.mapped()} :
      `Not valid - ${errInfo.param} ${errInfo.msg}`;
  }

  res.status(err.status || 500);

  if (isAPI(req)) {
    res.json({ success: false, error: err.message });
    return;
  }

  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.render('error');
});

function isAPI(req) {
    return req.originalUrl.indexOf('/api-v') === 0;
}

module.exports = app;