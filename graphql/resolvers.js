const User = require("../models/user");
const Post = require("../models/post");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");

module.exports = {
  createUser: async function({ userInput }, req) {
    const { email, password, name } = userInput;

    const errors = [];
    if (!validator.isEmail(email)) {
      errors.push("Inavlid Email");
    }
    if (!validator.isLength(password, { min: 5 })) {
      errors.push("Minimum password length should be 2");
    }
    if (!validator.isLength(name, { min: 5 })) {
      errors.push("name should be atleast 2");
    }
    if (errors.length > 0) {
      const error = new Error("Invalid input");
      error.code = 422;
      error.data = errors;
      throw error;
    }

    const emailExist = await User.find({ email: email });

    if (emailExist.length > 0) {
      const error = new Error("User already exists");
      throw error;
    }
    const hashedPw = await bcrypt.hash(password, 12);
    let user = new User({
      email,
      password: hashedPw,
      name,
      status: "A new"
    });
    const userCreated = await user.save();
    return { ...userCreated._doc, _id: userCreated._id };
  },
  login: async function({ email, password }) {
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("User not found");
      error.code = 401;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("Incorrect password");
      error.code = 401;
      throw error;
    }
    let token = jwt.sign(
      {
        email: email,
        userId: user._id.toString()
      },
      "secretkey",
      { expiresIn: "1h" }
    );
    return { token: token, userId: user._id.toString() };
  },
  createPost: async function({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error("User is not authenticated");
      error.code = 401;
      throw error;
    }
    const { title, content, imageUrl } = postInput;
    const errors = [];
    if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
      errors.push("title is invalid");
    }
    if (
      validator.isEmpty(content) ||
      !validator.isLength(content, { min: 5 })
    ) {
      errors.push("Content is invalid");
    }
    if (
      validator.isEmpty(imageUrl) ||
      !validator.isLength(imageUrl, { min: 5 })
    ) {
      errors.push("imageUrl is invalid");
    }
    if (errors.length > 0) {
      const error = new Error("Invalid input");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("Invalid user");
      error.code = 401;
      throw error;
    }
    let post = new Post({
      title,
      content,
      imageUrl,
      creator: user
    });
    let postCreated = await post.save();
    user.posts.push(post);
    await user.save();
    return {
      ...postCreated._doc,
      _id: postCreated._id.toString(),
      updatedAt: postCreated.updatedAt.toISOString(),
      createdAt: postCreated.createdAt.toISOString()
    };
  },
  posts: async function({ page }, req) {
    if (!req.isAuth) {
      const error = new Error("User is not authenticated");
      error.code = 401;
      throw error;
    }
    if (!page) {
      page = 1;
    }
    const perPage = 2;
    let totalPosts = await Post.find().countDocuments();
    let posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("creator")
      .limit(perPage)
      .skip((page - 1) * perPage);
    return {
      posts: [
        ...posts.map(post => {
          return {
            ...post._doc,
            _id: post._id.toString(),
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString()
          };
        })
      ],
      totalPosts: totalPosts
    };
  },
  post: async function({ postId }, req) {
    if (!req.isAuth) {
      const error = new Error("User is not authenticated");
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(postId).populate("creator");
    if (!post) {
      const error = new Error("Post not found");
      error.code = 404;
      throw error;
    }
    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toString(),
      updatedAt: post.updatedAt.toString()
    };
  },
  updatePost: async function({ postId, postInput }, req) {
    if (!req.isAuth) {
      const error = new Error("User is not authenticated");
      error.code = 401;
      throw error;
    }
    const { title, content, imageUrl } = postInput;
    console.log(postInput, "here");
    const errors = [];
    if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
      errors.push("title is invalid");
    }
    if (
      validator.isEmpty(content) ||
      !validator.isLength(content, { min: 5 })
    ) {
      errors.push("Content is invalid");
    }
    if (
      validator.isEmpty(imageUrl) ||
      !validator.isLength(imageUrl, { min: 5 })
    ) {
      errors.push("imageUrl is invalid");
    }
    if (errors.length > 0) {
      const error = new Error("Invalid input");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const post = await Post.findById(postId).populate("creator");
    if (!post) {
      const error = new Error("Post not found");
      error.code = 404;
      throw error;
    }
    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error("Not authorized");
      error.code = 401;
      throw error;
    }
    post.title = title;
    post.content = content;
    if (post.imageUrl !== "undefined") {
      post.imageUrl = imageUrl;
    }
    await post.save();
    return {
      ...post._doc,
      createdAt: post.createdAt.toString(),
      updatedAt: post.updatedAt.toString(),
      _id: post._id.toString()
    };
  },
  deletePost: async function({ postId }, req) {
    if (!req.isAuth) {
      const error = new Error("User is not authenticated");
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(postId).populate("creator");
    if (!post) {
      const error = new Error("Post not found");
      error.code = 404;
      throw error;
    }
    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error("Not authorized to delete the post");
      error.code = 401;
      throw error;
    }
    clearImage(post.imageUrl);
    await Post.findByIdAndDelete(postId);
    const user = User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();
    return {
      isDeleted: true
    };
  },
  user: async function(args, req) {
    if (!req.isAuth) {
      const error = new Error("User is not authenticated");
      error.code = 401;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("User doesn't exist");
      error.code = 404;
      throw error;
    }
    return {
      ...user._doc,
      _id: user._id.toString(),
      status: user.status
    };
  },
  updateStatus: async function({ status }, req) {
    if (!req.isAuth) {
      const error = new Error("User is not authenticated");
      error.code = 401;
      throw error;
    }
    const errors = [];
    if (validator.isEmpty(status) || !validator.isLength(status, { min: 2 })) {
      errors.push("Status is invalid");
    }
    if (errors.length > 0) {
      const error = new Error("Invalid status input");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("User doesn't exist");
      error.code = 404;
      throw error;
    }
    user.status = status;
    await user.save();
    return {
      ...user._doc,
      _id: user._id.toString()
    };
  }
};
const clearImage = filePath => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, err => {
    console.log(err);
  });
};
