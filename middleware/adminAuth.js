const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) {
    return res.status(401).json({
      msg: "No token, authorization denied",
    });
  }

  try {
    const decoded = jwt.verify(token, "jwt-secret");
    let user = decoded.user;
    if (user.type == "admin") {
      req.user = user;
      next();
    } else {
      res.status(401).json({
        error: "Authorization Error",
      });
    }
  } catch (err) {
    res.status(401).json({
      error: "Authorization Error",
    });
  }
};
