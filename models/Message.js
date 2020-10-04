var mongoose = require('mongoose');
//var bcrypt = require('bcryptjs');

// User Schema
var MessageSchema = mongoose.Schema({
  id:{
      type: String,
      
      
  },
  message:[{
    author: String,
    message:String
  }]
});

const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;
