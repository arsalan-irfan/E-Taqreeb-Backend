var mongoose = require("mongoose");

// User Schema
var LawnPackageSchema = mongoose.Schema({
  section: {
    type: String,
  },
  capacity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  date: [
    {
      type: Date,
      default: Date.now,
    },
  ],
  description: {
    type: String,
  },
  timeFrom: {
    type: String,
    require: true,
  },
  timeTo: {
    type: String,
    require: true,
  },
  title: {
    type: String,
  },
  lawn_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref:"lawn"
  },
  advance: {
    type: Number,
    required: true,
  },
});

const User = mongoose.model("lawnPackage", LawnPackageSchema);

module.exports = User;
