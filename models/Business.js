const mongoose = require("mongoose");

const BusinessSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users"
    },
    company: {
      type: String,
      required: true
    },
    owner: {
      type: String,
      required: true
    },
    businessEmail: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    phone: {
      type: Number,
      required: true
    },
    postalCode: {
      type: Number,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    approvalStatus: {
      type: String,
      default: "Pending"
    },
  },
  { timestamps: true }
);

module.exports = Business = mongoose.model("business", BusinessSchema);
