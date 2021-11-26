const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const { graphqlHTTP } = require("express-graphql");
const graphqlSchema = require("./graphql/schema");
const resolvers = require("./graphql/resolvers");
const auth = require("./middleware/auth");
const fs = require("fs");

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString + "-" + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimeType == "image/png" ||
    file.mimeType == "image/jpg" ||
    file.mimeType == "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(bodyParser.json()); // to parse the request body of incoming request

app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
  res.setHeader("Access-control-Allow-Headers", "Content-Type, Authorization");
  if (req.method == "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(auth);

app.put("/post-image", (req, res, next) => {
  if (!req.isAuth) {
    const error = new Error("User is not authenticated");
    error.code = 401;
    throw error;
  }
  if (!req.file) {
    const error = new Error("No file is provided");
    error.code = 422;
    throw error;
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }
  return res
    .status(200)
    .json({ message: "added successfully", filePath: req.file.path });
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: resolvers,
    graphiql: true,
    customFormatErrorFn: err => {
      if (!err.originalError) {
        return err;
      }
      const data = err.originalError.data || "";
      const message = err.message || "An error occured";
      const status = err.originalError.code || 500;
      return {
        message: message,
        status: status,
        data: data
      };
    }
  })
);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(
    "mongodb+srv://xyz:ko28NUr5WaJWB4AP@cluster0.6lk21.mongodb.net/messages?retryWrites=true&w=majority"
  )
  .then(res => {
    app.listen(8080, () => {
      console.log("connected to 8080");
    });
  })
  .catch(e => {
    console.log(e);
  });
const clearImage = filePath => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, err => {
    console.log(err);
  });
};
