const express = require("express");
const router = express.Router();

const POST_ADDED = "POST_ADDED";

module.exports = (pubsub) => {
  router.post('/',(req, res) => {
    let { author, comment } = req.body;
    pubsub.publish(POST_ADDED, { postAdded: { author, comment } });

    res.status(200).json({ author, comment, mesage: "Successfull test" });
  });

  return router;
};
