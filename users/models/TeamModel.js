const mongoose = require("mongoose");

const teamSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

// create full-text search index for name field
teamSchema.index({ name: "text" });

const Team = mongoose.model("Team", teamSchema);
module.exports = Team;
