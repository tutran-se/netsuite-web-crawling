const express = require("express");
const {
  getBaoCaoDSBan,
  getBaoCaoDSKy,
  getBaoCaoHH,
  getBaoCaoTinhTrangGiuHang,
  getBaoCaoTonKho,
} = require("../controllers/report/reportController");

const Router = express.Router();

Router.route("/baoCaoDSBan").get(getBaoCaoDSBan);
Router.route("/baoCaoDSKy").get(getBaoCaoDSKy);
Router.route("/baoCaoHH").get(getBaoCaoHH);
Router.route("/baoCaoTinhTrangGiuHang").get(getBaoCaoTinhTrangGiuHang);
Router.route("/baoCaoTonKho").get(getBaoCaoTonKho);

module.exports = Router;
