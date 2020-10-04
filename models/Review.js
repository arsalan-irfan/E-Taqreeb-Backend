var mongoose = require("mongoose");

// User Schema
var ReviewSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users"
    },
    text: {
      type: String,
      required: true
    },
    name: {
      type: String
    },
    avatar: {
      type: String
    },
    date: {
      type: Date,
      default: Date.now
    },
    rating: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

const User = mongoose.model("review", ReviewSchema);

module.exports = User;
