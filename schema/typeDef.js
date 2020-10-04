const { gql } = require("apollo-server-express");

const typeDefs = gql`
  scalar Date

  type Post {
    author: String
    comment: String
  }

  type ChatUser {
    _id: ID
    name: String
    image: String
  }
  type ChatBusiness {
    _id: ID
    name: String
    image: String
  }
  type ChatMessage {
    _id: ID!
    senderId: ID!
    message: String
    createdAt: Date!
  }

  type ChatRoomDetail {
    _id: ID!
    user: ChatUser!
    lawn: ChatBusiness
    photographer: ChatBusiness
    businessType:String!
    createdAt: Date!
    updatedAt: Date!
  }

  type ChatRoom {
    _id: ID!
    businessType:String!
    user: ID!
    lawn: ID
    photographer: ID
    createdAt: Date!
    updatedAt: Date!
  }

  type CreateChatRoomOutput{
    chatRoom: ChatRoom
    error: String
  }

  type ChatRoomsOutput{
    chatRooms:[ChatRoomDetail]
    error:String
  }

  type Image{
    _id: ID!
    url: String!
  }


  type LawnPublishResponse{
    _id:ID!
    company: String!
    images: [Image]
    description:String
  }
  type PhotographerPublishResponse{
    _id:ID!
    company: String!
    images: [Image]
    description:String
  }

  type Subscription {
    postAdded: Post
    lawnPublished:LawnPublishResponse!
    photographerPublished:PhotographerPublishResponse!
  }

  type Query {
    posts: [Post]
    getChatRooms:ChatRoomsOutput!
  }

  type Mutation {
    addPost(author: String, comment: String): Post
    createRoom(user: String!, business: String!, businessType: String!): CreateChatRoomOutput
  }
`;
module.exports = typeDefs;
