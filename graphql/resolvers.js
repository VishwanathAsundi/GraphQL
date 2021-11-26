const User = require("../models/user");
const bcrypt = require("bcryptjs");
module.exports = {
  createUser: async function({ userInput }, req) {
    const { email, password, name } = userInput;
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
