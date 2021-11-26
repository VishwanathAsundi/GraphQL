const User = require("../models/user");
const bcrypt = require("bcryptjs");
const validator = require("validator");

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
  hello() {
    return "Hello World";
  }
};
