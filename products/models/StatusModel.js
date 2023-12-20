// create product model
const mongoose = require("mongoose");

const statusDataSchema = new mongoose.Schema(
  {
    total: Number,
    lastUpdated: String,
    day: Number,
    month: Number,
    year: Number,
    hour: Number,
    minute: Number,
    provider: String,
  },
  { timestamps: true }
);

const StatusData = mongoose.model("StatusData", statusDataSchema);

module.exports = StatusData;
