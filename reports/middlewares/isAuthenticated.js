const jwt = require("jsonwebtoken");

let JWT_SECRET = "mysecretkey";

exports.isAuthenticated = (req, res, next) => {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    const decoded = jwt.verify(bearerToken, JWT_SECRET);
    req.user = decoded.user;
    next();
  } else {
    res.sendStatus(403);
  }
};
