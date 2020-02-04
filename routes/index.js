'use strict';

// Load router with express module
const express = require('express');
const router = express.Router();

// Define full list of routes
router.get('/', function(req, res, next) {
  res.status(200).send({success: true, message: 'Hello world niggas!'});
});

// Export router
module.exports = router;
