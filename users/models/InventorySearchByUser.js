const mongoose = require("mongoose");

const inventorySearchByUserSchema = mongoose.Schema(
  {
    date: Date,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    providers: [
      {
        name: String,
        quantity: Number,
      },
    ],
  },
  { timestamps: true }
);

const InventorySearchByUser = mongoose.model(
  "InventorySearchByUser",
  inventorySearchByUserSchema
);
module.exports = InventorySearchByUser;
