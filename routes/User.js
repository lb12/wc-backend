'use strict';

// Node imports
const express = require('express');
const { check, body } = require('express-validator');

// Own imports
const userController = require('../controllers/userController');
const jwtAuth = require("../lib/jwtAuth");
const privateZoneAuth = require("../lib/privateZoneAuth");

const router = express.Router();

// READ
router.get('/:id', userController.getUser);

// UPDATE
router.put('/:id', 
    [
        check('email').isEmail().withMessage('Email format is not correct'),
        check('username').isLength({ min: 4 }).withMessage('Username should be at least 4 chars long'),
        check('password').isLength({ min: 6 }).withMessage('Password should be at least 6 chars long')
    ],
    userController.updateUser);

// UNSUBSCRIBE user and his/her adverts
router.delete('/unsubscribe/:userId', jwtAuth(), privateZoneAuth(), userController.unsubscribeUser);


module.exports = router;