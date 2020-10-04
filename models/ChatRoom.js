var mongoose = require("mongoose");

// User Schema
var ChatRoomSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lawn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "lawn",
      default: null,
    },
    photographer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "photographer",
      default: null,
    },
    businessType: {
      type: String,
      enum: ["lawn", "photographer"],
      default: "lawn",
    },
    
  },
  { timestamps: true }
);

const ChatRoom = mongoose.model("chatroom", ChatRoomSchema);

module.exports = ChatRoom;
