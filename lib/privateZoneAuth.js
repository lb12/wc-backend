"use strict";

module.exports = () => {
  return (req, res, next) => {
    const { userId } = req.params;
    const apiUserId = req.apiUserId;

    if (apiUserId !== userId) {
      const error = new Error("You are not authorized to do this");
      error.status = 401;
      
      next(error);
      return;
    }

    req.userId = userId;
    next();
  };
};
