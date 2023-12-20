const jwt = require("jsonwebtoken");

let JWT_SECRET = process.env.JWT_SECRET;

exports.isAuthenticated = (req, res, next) => {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    try {
      const decoded = jwt.verify(bearerToken, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        ok: false,
        errorType: "AUTHORIZATION_ERROR",
        vn_msg: "Không có quyền truy cập.",
        en_msg: "Unauthorized.",
      });
    }
  } else {
    return res.status(401).json({
      ok: false,
      errorType: "AUTHORIZATION_ERROR",
      vn_msg: "Không có quyền truy cập.",
      en_msg: "Unauthorized.",
    });
  }
};
