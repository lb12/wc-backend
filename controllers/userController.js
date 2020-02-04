'use strict';

// Node imports
const { validationResult } = require('express-validator');

// Own imports
const User = require('../models/User');
const dbUtils = require('../utils/dbUtils');
const securityUtils = require('../utils/securityUtils');


const createUser = async (req, res, next) => {
    try {
        validationResult(req).throw();
        
        let data = req.body;

        // Check if email or username exists
        let exists = await User.existsField({ username: data.username }) != null || 
                     await User.existsField({ email: data.email }) != null;

        if (exists) {
            return res.status(422).send({ success: false, message: 'Username or email currently used' });
        }

        // Hash password
        data.password = await securityUtils.hashString(data.password);

        const user = new User(data);
        const savedUser = await user.save();
        
        return res.status(200).send({ success: true, result: savedUser });
    } catch (error) {
        return next(error);
    }
};

const getUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
        
        if (!dbUtils.isValidId(userId)) {
            return res.status(422).json({ success: false, message: 'Provide correct User id' });
        }

        const user = await User.getUser(userId);

        if(!user) {
            return res.status(404).json({ success: false, message: 'User id was not found in database' });
        }

        return res.status(200).send({ success: true, result: user });

    } catch (error) {
        return next (error);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
        let data = req.body;

        if (!dbUtils.isValidId(userId)) {
            return res.status(422).json({ success: false, message: 'Provide correct User id' });
        }
        
        // Hash password if needed
        if (data.password) {
            data.password = await securityUtils.hashString(data.password);
        }

        const updatedUser = await User.updateUser(userId, data);

        return res.status(200).send({ success: true, result: updatedUser });
    } catch (error) {
        return next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
    
        if (!dbUtils.isValidId(userId)) {
            return res.status(422).json({ success: false, message: 'Provide correct User id' });
        }

        const deletedUser = await User.deleteUser(userId);

        return res.status(200).send({ success: true, result: deletedUser });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    createUser,
    getUser,
    updateUser,
    deleteUser
};