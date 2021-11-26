const express = require("express");

const feedController = require("../controllers/feed");
const { body } = require("express-validator");

const isAuth = require("../middleware/is-auth");

const feedRoutes = express.Router();

feedRoutes.get("/posts", isAuth, feedController.getPosts);

feedRoutes.post(
  "/post",
  isAuth,
  [
    body("title")
      .trim()
      .isLength({ min: 5 }),
    body("content")
      .trim()
      .isLength({ min: 5 })
  ],
  feedController.createPost
);

feedRoutes.get("/post/:postId", isAuth, feedController.getPost);

feedRoutes.put(
  "/post/:postId",
  isAuth,
  [
    body("title")
      .trim()
      .isLength({ min: 5 }),
    body("content")
      .trim()
      .isLength({ min: 5 })
  ],
  feedController.updatePost
);

feedRoutes.delete("/post/:postId", isAuth, feedController.deletePost);

module.exports = feedRoutes;
