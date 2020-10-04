var mongoose = require("mongoose");

// User Schema
var LawnOrderSchema = mongoose.Schema(
  {
    name:{
      type: String,
      required: true
    },
    email:{
      type: String,
      required: true
      
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref:'User'
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    lawnId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref:'lawn'
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("lawnOrder", LawnOrderSchema);

module.exports = User;
