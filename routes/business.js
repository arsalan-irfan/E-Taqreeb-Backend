const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const { validationResult } = require("express-validator");
const { validateBusinessRegistration } = require("../validators/valdiators");
const { uploadImage } = require("../helper/image-uploading");
const { registerBusiness } = require("../functions/business");
const Lawn = require('../models/Lawn');
const Photographer = require('../models/Photographer');

router.post("/", auth, validateBusinessRegistration, async (req, res) => {
  let Errors = [];
  try {
    let error = validationResult(req);
    if (error && error.errors.length > 0) {
      Errors = error.errors;
      return res
        .status(400)
        .json({ message: "Validation Failed!", Errors: Errors });
    }
    let user = await User.findOne({ _id: req.user.id });
    
    if(user.businessPending){
      Errors.push({ msg: "Your Business request is already pending" });
      return res
        .status(400)
        .json({ message: "Business Registration Failed!", Errors: Errors });
    }
    else if(user.businessUser){
      Errors.push({ msg: "You have already registered on business !" });
      return res
      .status(400)
      .json({ message: "Business Registration Failed!", Errors: Errors });
    }
    else{
      let {
        company,
        businessEmail,
        category,
        description,
        owner,
        address,
        phone,
        city,
      } = req.body;
      console.log('caregory is:', category)
      let output = await registerBusiness({
        company,
        businessEmail,
        category,
        description,
        owner,
        address,
        phone,
        city,
        user: req.user.id,
      });
      if (!output.error) {
        let result = await user.save();
        return res.status(200).json({
          message: "Business registered successfully!",
          bid: output.business._id,
        });
      } else {
        Errors.push({ msg: output.error });
        return res.status(400).json({
          message: "Error in business registration!",
          Errors: Errors,
        });
      }
    }

    
  } catch (error) {
    Errors.push({ msg: error.message });
    return res.status(400).json({ Errors: Errors });
  }
});

router.post(
  "/cnic/:category/:bid",
  auth,
  upload.single("image"),
  uploadImage,
  async (req, res) => {
    let Errors = [];
    let { category, bid } = req.params;
    try {
      if (!category || !bid) {
        Errors.push({
          msg: "Error in uploading image ",
          error: "Params are undefined",
        });
        return res.status(400).json({ Errors: Errors });
      } else if (!req.image) {
        Errors.push({
          msg: "cnic image is not provided",
          error: "Cnic is required",
        });
        return res.status(400).json({ Errors: Errors });
      } else {
        let business;
        switch (category.toString()) {
          case "1":
            business = await Lawn.findOne({ _id: bid });
            break;
          case "2":
            business = await Photographer.findOne({ _id: bid });
            break;
          case "3":
            business = null;
            break;
          default:
            business = null;
            break;
        }
        if (business) {
          business.ownerCnic = req.image;
          business = await business.save();
          let user = await User.findOne({ _id: req.user.id });
          user.businessPending = true;

          user = await user.save();
          console.log("user in console log is:", user);

          return res.json({
            msg: "Business registered successfully",
            result: user,
          });
        } else {
          Errors.push({
            msg: "Business registration Faliled",
            error: "Business not found",
          });
          return res.status(400).json({ Errors: Errors });
        }
      }
    } catch (error) {}
  }
);

module.exports = router;
