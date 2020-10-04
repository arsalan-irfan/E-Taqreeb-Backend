const { GraphQLDateTime } = require("graphql-iso-date");
const { createRoom,getUserChatRooms } = require("../functions/chat");

let posts = [
  {
    author: "Abc",
    comment: "Abc",
  },
  {
    author: "Efg",
    comment: "Efg",
  },
  {
    author: "Hij",
    comment: "Hij",
  },
  {
    author: "klm",
    comment: "klm",
  },
];

const POST_ADDED = "POST_ADDED";
const Lawn_Published = "Lawn_Published";
const Photographer_Published = "Photographer_Published";

module.exports = (pubsub) => {
  const resolvers = {
    // customDateScalarResolver: {
    //   Date: GraphQLDateTime,
    // },
    Subscription: {
      postAdded: {
        subscribe: () => pubsub.asyncIterator([POST_ADDED]),
      },
      lawnPublished: {
        subscribe: () => pubsub.asyncIterator([Lawn_Published]),
      },
      photographerPublished: {
        subscribe: () => pubsub.asyncIterator([Photographer_Published]),
      }
    },
    Query: {
      posts(root, args, context) {
        return posts;
      },
      getChatRooms:async (root, args, context)=>{
        try {
          let {id}=context.user
          let output= await getUserChatRooms({id});
          return output;
        } catch (error) {
          return {chatRooms:null,error:error.message}
        }
      }
    },
    Mutation: {
      addPost(root, args, context) {
        let { author, comment } = args;

        pubsub.publish(POST_ADDED, { postAdded: { author, comment } });
        posts.push({ author, comment });
        return { author, comment };
      },
      createRoom: async (post, args, context) => {
        try {
          let { user, business, businessType } = args;
          let output = await createRoom({ user, business, businessType });
          return output;
        } catch (error) {
          return { chatRoom: null, error: error.message };
        }
      },
    },
  };
  return resolvers;
};
