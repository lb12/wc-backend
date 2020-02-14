"use strict";

module.exports = () => {
  return (req, res, next) => {
    const { userId } = req.params;
    const apiUserId = req.apiUserId;

    console.log('userId', userId)
    console.log('apiUserId', apiUserId)

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
