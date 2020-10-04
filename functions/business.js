const Lawn = require("../models/Lawn");
const Photographer = require("../models/Photographer");
const LawnOrder = require("../models/LawnOrder");
const registerBusiness = async ({
  company,
  businessEmail,
  owner,
  address,
  city,
  category,
  phone,
  description,
  user,
}) => {
  let business = null;
  let error = null;
  try {
    let data = {
      company,
      businessEmail,
      owner,
      address,
      city,
      category,
      phone,
      description,
      user,
    };

    switch (category.toString()) {
      case "1":
        business = await Lawn.findOne({ businessEmail: businessEmail });
        if (business) {
          error = "Business email already in use!";
        } else {
          business = new Lawn(data);
          business = await business.save();
        }
        break;
      case "2":
        business = new Photographer(data);
        business = await business.save();
        break;
      case "3":
        error = "Caterer Feature will be added soon!";
        break;
      default:
        error = "Business category not found!";
        break;
    }
    return { business, error };
  } catch (err) {
    return { error: err.message };
  }
};

const getUserBusiness = async ({ category, business_id }) => {
  let business = null;
  try {
    switch (category.toString()) {
      case "1":
        business = await Lawn.findOne({ _id: business_id }).populate(
          "packages"
        ).populate('orders');
        break;
      case "2":
        business = await Photographer.findOne({ _id: business_id }).populate(
          "packages"
        ).populate('orders');
        break;
      case "3":
        business = null;
        break;
      default:
        business = null;
        break;
    }
    return business;
  } catch (error) {
    console.log(error.message);
    return null;
  }
};


module.exports = { registerBusiness, getUserBusiness };
