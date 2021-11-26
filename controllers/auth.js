const { validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwtoken = require("jsonwebtoken");

exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty) {
    const err = new Error("Validation failed");
    err.statusCode = 422;
    err.data = errors.array();
    throw err;
  }
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      const err = new Error("User with that email doesn't exist");
      err.statusCode = 401;
      err.data = errors.array();
      throw err;
    }
    loadedUser = user;
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const err = new Error("Incorrect password");
      err.statusCode = 401;
      err.data = errors.array();
      throw err;
    }

    const token = jwtoken.sign(
      {
        email: loadedUser.email,
        userId: loadedUser._id.toString()
      },
      "secretkey",
      { expiresIn: "1hr" }
    );
    res.status(200).json({
      message: "Signed in Successfully",
      token: token,
      userId: loadedUser._id.toString()
    });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 401;
    }
    next(e);
  }
};

exports.signUp = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty) {
    const err = new Error("Validation failed");
    err.statusCode = 422;
    err.data = errors.array();
    throw err;
  }
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;
  try {
    const emailExist = await User.findOne({ email: email });
    if (emailExist) {
      const err = new Error("Email already exists");
      err.statusCode = 422;
      err.data = errors.array();
      throw err;
    }
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 422;
    }
    next(e);
  }
  try {
    const hashedPwd = await bcrypt.hash(password, 12);
    let user = new User({
      email: email,
      password: hashedPwd,
      name: name,
      status: "A new"
    });
    await user.save();
    res.status(201).json({ message: "User created!", userId: result._id });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

exports.getStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("User is not authorized");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      status: user.status
    });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

exports.updateStatus = async (req, res, next) => {
  const status = req.body.status;
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    user.status = status;
    await user.save();
    res.status(200).json({ message: "Status updated successfully" });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};
