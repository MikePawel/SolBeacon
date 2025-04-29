require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const { swaggerUi, swaggerDocs } = require("./swagger");

mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Connected to MongoDB");
});

app.use(express.json());

// Swagger documentation route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const userRouter = require("./routes/user");
app.use("/users", userRouter);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
  console.log("API Documentation available at http://localhost:3000/api-docs");
});
