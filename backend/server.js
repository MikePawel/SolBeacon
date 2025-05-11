require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const { swaggerUi, swaggerDocs } = require("./swagger");
const cors = require("cors");

// Enable CORS for specific origin
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "https://master-fe.mikepawel.com/ ",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// MongoDB connection configuration
const getMongoUri = () => {
  if (process.env.MONGODB_SERVICE_HOST) {
    const host = process.env.MONGODB_SERVICE_HOST;
    const port = process.env.MONGODB_SERVICE_PORT || "27017";
    const user = process.env.MONGODB_SERVICE_USER;
    const password = process.env.MONGODB_SERVICE_PASSWORD;
    const database = process.env.MONGODB_SERVICE_DATABASE || "masterthesis";

    return `mongodb://${user}:${password}@${host}:${port}/${database}`;
  }

  return process.env.MONGODB_URI;
};

mongoose.connect(getMongoUri());
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Connected to MongoDB");
});

app.use(express.json());

// Swagger documentation route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// User routes
const userRouter = require("./routes/user");
app.use("/users", userRouter);

// Transaction routes
const transactionRouter = require("./routes/transaction");
app.use("/transactions", transactionRouter);

// Add payment routes - but load the module only when needed
console.log("Registering payment routes (lazy loading)");
const paymentRouter = require("./routes/payment");
app.use("/payment", paymentRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(
    `API Documentation available at http://localhost:${PORT}/api-docs`
  );
});
