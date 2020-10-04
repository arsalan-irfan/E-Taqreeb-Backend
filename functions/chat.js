const ChatRoom = require("../models/ChatRoom");
const User = require("../models/User");
const Lawn = require("../models/Lawn");
const Photographer = require("../models/Photographer");

const getRoom = async ({ user, business, businessType }) => {
  try {
    let query = { user: user };
    if (businessType == "lawn") {
      query.lawn = business;
    } else if (businessType == "photographer") {
      query.photographer = business;
    } else {
      return { chatRoom: null, error: error.message,notFound:false };
    }
    let chatRoom = await ChatRoom.findOne(query);
    if(chatRoom){
      return {chatRoom: chatRoom, error: null,notFound:false}
    }else{
      return {chatRoom: chatRoom, notFound:true}
    }
  } catch (error) {
    return { chatRoom: null, error: error.message,notFound:false };
  }
};

const createRoom = async ({ user, business, businessType }) => {
  try {
    let room = new ChatRoom();
    let businessModel;
    room.user = user;
    room.businessType = businessType;
    if (businessType === "lawn") {
      room.lawn = business;
      businessModel = Lawn;
    } else if (businessType === "photographer") {
      room.photographer = business;
      businessModel = Photographer;
    } else {
      return { chatRoom: null, error: error.message };
    }

    let result = await room.save();
    

    return { chatRoom: result, error: null };
  } catch (error) {
    return { chatRoom: null, error: error.message };
  }
};
const getUserChatRooms = async ({ id }) => {
  try {
    let chatRooms = await ChatRoom.find({ user: id })
      .populate({
        path: "chatRooms",
        select: { messages: 0 },
      })
      .populate({
        path: "lawn",
        select: { _id: 1, company: 1, logo: 1 },
      })
      .populate({
        path: "photographer",
        select: { _id: 1, company: 1, logo: 1 },
      });

    return { chatRooms, error: null };
  } catch (error) {
    return { chatRooms: null, error: error.message };
  }
};

module.exports = { createRoom, getUserChatRooms,getRoom };
