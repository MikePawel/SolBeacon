require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const { swaggerUi, swaggerDocs } = require("./swagger");
const cors = require("cors");

// Enable CORS for all routes
app.use(cors());

// MongoDB connection configuration
const getMongoUri = () => {
  // Check if we're running in Coolify with linked MongoDB service
  if (process.env.MONGODB_SERVICE_HOST) {
    // Coolify automatically sets these environment variables when services are linked
    const host = process.env.MONGODB_SERVICE_HOST;
    const port = process.env.MONGODB_SERVICE_PORT || "27017";
    const user = process.env.MONGODB_SERVICE_USER;
    const password = process.env.MONGODB_SERVICE_PASSWORD;
    const database = process.env.MONGODB_SERVICE_DATABASE || "masterthesis";

    return `mongodb://${user}:${password}@${host}:${port}/${database}`;
  }

  // Fallback to direct URI if provided
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

const userRouter = require("./routes/user");
app.use("/users", userRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(
    `API Documentation available at http://localhost:${PORT}/api-docs`
  );
});
