require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Connected to MongoDB");
});

app.use(express.json());

const userRouter = require("./routes/user");
app.use("/users", userRouter);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
