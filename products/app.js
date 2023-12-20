require("dotenv").config();

// MongoDB + Redis
const { dbConnect } = require("./configs/dbConnect");
const helmet = require("helmet");

// Import modules
const express = require("express");
const cors = require("cors");

// Import routes

// Initialize App
const app = express();

// Midlewares
app.use(cors({ origin: "*" }));

app.use(helmet());
app.use(express.json({ limit: "10MB" }));

// Routes
const productRoute = require("./routes/productRoute");
const redisClient = require("./configs/redisInstance");

app.use("/api/v1/products", productRoute);

app.get("/api/v1/products/health", async (_, res) => {
  try {
    res.send("Hello from product service !!!!");
  } catch (error) {
    console.log(error);
  }
});

// Listen Server
const PORT = process.env.PORT || 5000;

const runServer = async () => {
  try {
    // connect to db
    dbConnect();

    // connect to redis
    await redisClient.connect();

    app.listen(PORT, () => {
      console.log("[Product_Service] Server is running on port " + PORT);
    });
  } catch (error) {
    console.log(error);
  }
};

runServer();
