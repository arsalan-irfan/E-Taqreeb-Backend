const Lawn = require("../models/Lawn");
const Business = require("../models/Business");

module.exports = {
  onApproveBusiness: async bid => {
    let result = {};
    try {
      let business = await Business.findOne({ _id: bid });
      console.log("BUSINESS FETCHED:::"+business)
      const {
        company,
        businessEmail,
        owner,
        address,
        city,
        category,
        phone,
        postalCode,
        description,
        user_id
      } = business;

      switch (category) {
        case "lawn":
          result = await Lawn.findOne({ businessEmail: businessEmail });
          if (!result)
            result = await Lawn.create({
              company,
              businessEmail,
              owner,
              address,
              city,
              phone,
              postalCode,
              description,
              user_id
            });
          break;
      }
      return result;
    } catch (error) {
      console.log("Hello"+error.message);
      return null;
    }
  }
};
