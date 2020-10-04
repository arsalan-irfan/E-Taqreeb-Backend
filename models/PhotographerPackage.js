var mongoose = require("mongoose");

// User Schema
var PhotographerPackageSchema = mongoose.Schema({
  noOfImages: {
    type: String,
    required: true,
  },
  videoLength: {
    type: String,
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
    required:true
  },
  title: {
    type: String,
  },
  photographerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref:"photographer",
    required: true,
  },
  advance: {
    type: Number,
    required: true,
  },
},{timestamps: true});

const PhotographerPackage = mongoose.model("photographerPackage", PhotographerPackageSchema);

module.exports = PhotographerPackage;
