"use strict";

// Own imports
const User = require("../models/User");

const setAdvertFav = async (req, res, next) => {
  const { userId } = req;
  const { favs, token } = req.body;

  try {
    const user = await User.updateUser(userId, { favs });
    user.password = null;
    return res.status(200).send({ success: true, result: { user, token } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  setAdvertFav
};
