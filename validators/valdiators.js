const { check } = require("express-validator");

const validateBusinessRegistration = [
  check("businessEmail")
    .not()
    .isEmpty()
    .withMessage("Business email is required !")
    .isEmail()
    .withMessage("Invalid Email!"),
  check("company")
    .not()
    .isEmpty()
    .withMessage("Company name is required !")
    .withMessage("Invalid Email!"),
  check("company").not().isEmpty().withMessage("Company name is required !"),
  check("category").not().isEmpty().withMessage("category is required !"),
  check("description").not().isEmpty().withMessage("description is required !"),
  check("owner").not().isEmpty().withMessage("Owner name is required !"),
  check("address").not().isEmpty().withMessage("Address is required !"),
  check("phone").not().isEmpty().withMessage("phone number is required !"),
  check("city").not().isEmpty().withMessage("City name is required !"),
];
const validateLawnUpdate = [
  check("businessEmail")
    .not()
    .isEmpty()
    .withMessage("Business email is required !")
    .isEmail()
    .withMessage("Invalid Email!"),
  check("company")
    .not()
    .isEmpty()
    .withMessage("Company name is required !")
    .withMessage("Invalid Email!"),
  check("company").not().isEmpty().withMessage("Company name is required !"),
  check("description").not().isEmpty().withMessage("description is required !"),
  check("owner").not().isEmpty().withMessage("Owner name is required !"),
  check("address").not().isEmpty().withMessage("Address is required !"),
  check("phone").not().isEmpty().withMessage("phone number is required !"),
  check("city").not().isEmpty().withMessage("City name is required !"),
];

const validateLawnPackage = [
  check("title").not().isEmpty().withMessage("Invalid Title!"),
  check("capacity").not().isEmpty().withMessage("Please Mention The Capacity!"),
  check("description")
    .not()
    .isEmpty()
    .withMessage("Please Briefly describe the package"),
  check("price").not().isEmpty().withMessage("Please Mention the Price !"),
  check("advance")
    .not()
    .isEmpty()
    .withMessage("Please Mention the Advance Price!"),
  check("timeFrom").not().isEmpty().withMessage("Address is required !"),
  check("timeTo").not().isEmpty().withMessage("phone number is required !"),
];
const validatePhotographerPackage = [
  check("title").not().isEmpty().withMessage("Invalid Title!"),
  check("description")
    .not()
    .isEmpty()
    .withMessage("Please Briefly describe the package"),
  check("price").not().isEmpty().withMessage("Please Mention the Price !"),
  check("advance")
    .not()
    .isEmpty()
    .withMessage("Please Mention the Advance Price!"),
  check("noOfImages").not().isEmpty().withMessage("Address is required !"),
];

module.exports = {
  validateBusinessRegistration,
  validateLawnUpdate,
  validateLawnPackage,
  validatePhotographerPackage
};
