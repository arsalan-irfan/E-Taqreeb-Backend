var mongoose = require("mongoose");

// User Schema
var UserSchema = mongoose.Schema(
  {
    id: {
      type: String,
    },
    isBlock: {
      type: Boolean,
      default: false,
    },
    completeProfile: {
      type: Boolean,
      default: false,
    },
    resetPasswordCode: {
      type: String,
      default: null,
    },
    resetPasswordTime: {
      type: Number,
      default: null,
    },
    resetCodeVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationCode: {
      type: String,
      default: null,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },

    imageURL: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    password: {
      type: String,
    },
    city: {
      type: String,
    },
    gender: {
      type: Number,
      default: 1,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    businessUser: {
      type: Boolean,
      default: false,
    },
    businessPending: {
      type: Boolean,
      default: false,
    },
    business: {
      category: {
        type: String,
      },
      business_id: {
        type: String,
      },
    },
    notifications: [
      {
        message: {  
          type: String,
          required: true,
        },
        icon: {
          type: String,
          required: true,
        },
        url: {
          type: String,
        },
        chatRooms: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "chatroom",
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
