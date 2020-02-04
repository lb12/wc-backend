'use strict';

// Node imports
const express = require('express');
const { check, body } = require('express-validator');

// Own imports
const userController = require('../controllers/userController');

const router = express.Router();


// CREATE
router.post('/', 
    [
        body('username').exists({checkFalsy: true, checkNull: true}).withMessage('Must be a string'),
        body('email').exists({checkFalsy: true, checkNull: true}).withMessage('Must be a string'),
        body('password').exists({checkFalsy: true, checkNull: true}).withMessage('Must be a string'),
        check('email').isEmail().withMessage('Email format is not correct'),
        check('username').isLength({ min: 4 }).withMessage('Username should be at least 4 chars long'),
        check('password').isLength({ min: 6 }).withMessage('Password should be at least 6 chars long')
    ],
    userController.createUser);

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

// DELETE
router.delete('/:id', userController.deleteUser);


module.exports = router;