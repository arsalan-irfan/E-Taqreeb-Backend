var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// User Schema
var AdminSchema = mongoose.Schema({
  id: {
    type: String
  },
  imageURL: {
    type: String
  },
  name: {
    type: String
    //required: true
  },
  email: {
    type: String
    //required: true
  },
  phone: {
    type: String
  },
  password: {
    type: String
    //required: true
  },
  unapprovedBusiness:{
    type: Array,
    default: null
  },
  approvedBusiness:{
    type: Array,
    default: null
  },
  janCount:{
    type: Number,
    default: 0
  },
  febCount:{
    type: Number,
    default: 0
  },
  marCount:{
    type: Number,
    default: 0
  },
  aprCount:{
    type: Number,
    default: 0
  },
  mayCount:{
    type: Number,
    default: 0
  },
  juneCount:{
    type: Number,
    default: 0
  },
  julyCount:{
    type: Number,
    default: 0
  },
  augCount:{
    type: Number,
    default: 0
  },
  sepCount:{
    type: Number,
    default: 0
  },
  octCount:{
    type: Number,
    default: 0
  },
  novCount:{
    type: Number,
    default: 0
  },
  decCount:{
    type: Number,
    default: 0
  }
  
});

const Admin = mongoose.model('Admin', AdminSchema);

module.exports = Admin;
