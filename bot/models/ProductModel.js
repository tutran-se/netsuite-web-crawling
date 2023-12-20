// create product model
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  product_code: String,
  provider: String,
  ton_kho_HN: Number,
  ton_kho_HCM: Number,
  ton_kho_KGG_HN: Number,
  ton_kho_KGG_HCM: Number,
  giu_hang_HN: Number,
  giu_hang_HCM: Number,
  hang_sap_ve: Number,
  hang_chua_mua: Number,
  ton_kho_hang: Number,
  hang_sap_ve_kho_hang: Number,
  lead_time: Number,
  eta_items: [
    {
      eta_delivered_date: String,
      eta_quantity: Number,
      confirm_vendor_date: String,
      company_location_area: String,
    },
  ],
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
