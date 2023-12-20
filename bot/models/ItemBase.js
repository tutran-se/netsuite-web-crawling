const mongoose = require("mongoose");

const ItemBaseSchema = mongoose.Schema(
 {
  // Basic infos
  name: {
   type: String,
   required: true,
   unique: true
  },
  upc_code: String,
  desc: String,
  lead_time: Number,
  unit: String,
  class: String,
  lv1: String,
  lv2: String,
  cost_of_good_sold: Number,
  minimum_price: Number,
  list_price: Number,
  kgg_price: Number,

  // Inventory infos
  inventory_info: {
   dh: {
    khh_hn: Number, //
    khh_hcm: Number,
    kgg_hn: Number,
    kgg_hcm: Number,
    kkg: Number,
    giu_hang_hn: [Number],
    giu_hang_hcm: [Number],
    hang_sap_ve_kho: Number,
    hang_chua_mua: Number,
    eta_items: []
   },
   dhid: {
    khh_hn: Number,
    khh_hcm: Number,
    kgg_hn: Number,
    kgg_hcm: Number,
    kkg: Number,
    giu_hang_hn: [Number],
    giu_hang_hcm: [Number],
    hang_sap_ve_kho: Number,
    hang_chua_mua: Number,
    eta_items: []
   },
   kho_hang: Number,
   hang_sap_ve_kho_hang: Number
  },
  status: {
   type: String,
   enum: ["active", "deleted"],
   default: "active"
  }
 },
 { timestamps: true }
);

const ItemBase = mongoose.model("ItemBase", ItemBaseSchema);
module.exports = ItemBase;
