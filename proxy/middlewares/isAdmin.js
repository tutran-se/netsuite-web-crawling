// create middleware to check if user is admin

exports.isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(401).json({
      ok: false,
      errorType: "AUTHORIZATION_ERROR",
      vn_msg: "Không có quyền truy cập.",
      en_msg: "Unauthorized.",
    });
  }
  next();
};
