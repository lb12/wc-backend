'use strict';

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

router.post('/signin', authController.authenticate);

module.exports = router;