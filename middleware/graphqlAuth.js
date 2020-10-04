const jwt = require("jsonwebtoken");
const { AuthenticationError } = require("apollo-server-express");

const verifyUser = async (token) => {
  if (!token || token === "") {
    throw new AuthenticationError("Invalid Token");
  }
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "jwt-secret");
  } catch (err) {
    throw new AuthenticationError("Invalid Token");
  }
  if (!decodedToken) {
    throw new AuthenticationError("Invalid Token");
  }
  return {
    user: decodedToken.user,
  };
};

module.exports = { verifyUser };
