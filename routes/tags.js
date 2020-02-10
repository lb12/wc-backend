'use strict';

// Node imports
const express = require('express');

// Own imports
const tagController = require('../controllers/tagController');

const router = express.Router();

// READ
router.get('/', tagController.getTags);


module.exports = router;