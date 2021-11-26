const fs = require("fs");
const path = require("path");
const { validationResult } = require("express-validator");
const Post = require("../models/post");
const User = require("../models/user");
const socket = require("../socket");

exports.getPosts = async (req, res, next) => {
  const page = req.query.page || 1;
  const perPage = 1;
  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate("creator")
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);
    res.status(200).json({ posts: posts, totalItems: totalItems });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res
      .status(422)
      .json({ message: "Unprocessible entity", errors: errors.array() });
  }
  const title = req.body.title;
  const content = req.body.content;

  //   if (!req.file) {
  //     const error = new Error("File is not attached");
  //     error.statusCode = 422;
  //     throw error;
  //   }
  //   const imageUrl = req.file.path;
  //   console.log(imageUrl, "imageUrl");

  let post = new Post({
    title: title,
    content: content,
    imageUrl: "images/vishwa.jpeg",
    creator: req.userId
  });
  try {
    await post.save();
    const user = User.findById(req.userId);
    user.posts.push(post);
    await user.save();
    socket.getIO().emit("posts", { post: post, action: "create" });
    res.status(201).json({
      message: "Post created successfully",
      post: post,
      creator: { name: user.name, id: user._id }
    });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};
exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ message: "Post fetch is success", post: post });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
exports.updatePost = async (req, res, next) => {
  const postId = req.body.postId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res
      .status(422)
      .json({ message: "Unprocessible entity", errors: errors.array() });
  }
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  try {
    const post = await Post.findById(postId).populate("creator");
    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      throw error;
    }
    if (post.creator._id.toString() !== req.userId) {
      const error = new Error("Not Authorized");
      error.statusCode = 403;
      throw error;
    }
    if (req.file) {
      imageUrl = req.file.path;
      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }
    }
    if (!imageUrl) {
      const error = new Error("File is not attached");
      error.statusCode = 422;
      throw error;
    }

    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;
    await post.save();
    socket.getIO().emit("posts", { post: post, action: "update" });
    res
      .status(200)
      .json({ message: "Post Updated successfully", post: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error("Not Authorized");
      error.statusCode = 403;
      throw error;
    }
    clearImage(post.imageUrl);
    // look for loggen in user and author of the post
    await Post.findByIdAndDelete(postId);

    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();
    socket.getIO().emit("posts", { post: postId, action: "delete" });
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
const clearImage = filePath => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, err => {
    console.log(err);
  });
};
