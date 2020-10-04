const mongoose = require("mongoose");

const LawnSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
    ownerCnic: {
      type: String,
      default: null,
    },
    businessEmail: {
      type: String,
      required: true,
    },
    businessPending: {
      type: Boolean,
      default: true,
    },
    city: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },

    logo: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      required: true,
    },
    ratings: {
      type: Number,
    },
    publish: {
      type: Boolean,
      default: false,
    },

    images: [
      {
        id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        comment: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        rating: {
          type: Number,
          required: true,
        },
      },
    ],
    social: {
      twitter: {
        type: String,
      },
      facebook: {
        type: String,
      },
      instagram: {
        type: String,
      },
    },
    youtubeUrl: {
      type: String,
      default: null,
    },
    isBlock: {
      type: Boolean,
      default: false,
    },

    packages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "lawnPackage",
      },
    ],
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "lawnOrder",
      },
    ],
    stars: {
      type: Number,
      default: 0,
    },
    currentRating: {
      type: Number,
      default: 0,
    },
    chatRooms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "chatroom",
      },
    ],
  },
  { timestamps: true }
);

module.exports = Lawn = mongoose.model("lawn", LawnSchema);
