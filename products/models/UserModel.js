const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      default: "Pambu@123",
    },
    role: {
      type: String,
      required: true,
      default: "sale_employee",
      enum: ["admin", "sale_employee"],
    },
    location: {
      type: String,
      required: true,
      enum: ["HN", "HCM"],
    },
    status: {
      type: String,
      required: true,
      default: "active",
      enum: ["active", "blocked", "deleted"],
    },
  },
  { timestamps: true }
);

// create full-text search index for name field
userSchema.index({ name: "text" });

const User = mongoose.model("User", userSchema);
module.exports = User;
