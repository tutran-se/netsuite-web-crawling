const express = require("express");
const {
  getSuggestions,
  getProductDetails,
  getStatusData,
} = require("../controllers/product/productController");

const Router = express.Router();

Router.route("/details").post(getProductDetails);
// Router.route("/details").get(getProductDetails);

Router.route("/suggestions").post(getSuggestions);
Router.route("/updateStatus").post(getStatusData);
module.exports = Router;
