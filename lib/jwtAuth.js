"use strict";

const jwt = require("jsonwebtoken");

module.exports = () => {
  return (req, res, next) => {
    let token = req.get("Authorization") || req.body.token || req.query.token;

    // If token does not exist, send an error
    if (!token) {
      const error = new Error("no token provided");

      error.status = 401;
      next(error);
      return;
    }

    // Remove 'Bearer ' if it is with token
    token = token.includes(" ") ? token.split(" ")[1] : token;

    jwt.verify(token, process.env.JWT_SECRET, (error, payload) => {
      if (error) {
        // Some error like JWT expired or some verification like that failed
        error.status = 401;
        next(error);
        return;
      }
      
      req.apiUserId = payload._id;
      next();
    });
  };
};
