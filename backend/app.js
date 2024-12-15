const express = require("express");
//const bodyParser = require("body-parser"); If this two are disabled payment issue may come
// const cors = require("cors");
const app = express();
const errorMiddleware = require("./middlewares/error");
const cookieParser = require("cookie-parser");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "config/config.env") });

app.use(express.json());
app.use(cookieParser());
// app.use(cors());
// app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const products = require("./routes/product.js");
const auth = require("./routes/auth.js");
const order = require("./routes/order.js");
const paymentRoutes = require("./routes/paymentRoutes.js");

app.use("/api/v1/", products);
app.use("/api/v1/", auth);
app.use("/api/v1/", order);
app.use("/api/v1/", paymentRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"));
  });
}

app.use(errorMiddleware);

module.exports = app;
