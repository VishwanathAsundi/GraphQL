const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    const error = new Error("Not Authorized");
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.split(" ")[1];
  console.log(token, "token");
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "secretkey");
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
  if (!decodedToken) {
    const error = new Error("Not Authenticated");
    error.statusCode = 401;
    throw error;
  }
  console.log(decodedToken, "decodetoken");
  req.userId = decodedToken.userId;
  req.email = decodedToken.email;
  next();
};
