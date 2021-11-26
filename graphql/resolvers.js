const User = require("../models/user");
const Post = require("../models/post");
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
  }
};
