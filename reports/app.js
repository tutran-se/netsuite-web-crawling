require("dotenv").config();
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
const reportRoute = require("./routes/reportRoute");

app.use("/api/v1/reports", reportRoute);

app.get("/api/v1/reports/health", async (_, res) => {
  try {
    res.send("Hello from report service !!!!");
  } catch (error) {
    console.log(error);
  }
});

// Listen Server
const PORT = process.env.PORT || 5002;

const runServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log("[Report_Service] Server is running on port " + PORT);
    });
  } catch (error) {
    console.log(error);
  }
};

runServer();
