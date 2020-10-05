const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Photographer = require("../models/Photographer");

const PhotographerOrder = require("../models/PhotographerOrder");
const auth = require("../middleware/auth");

const upload = require("../config/multer");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const PhotographerPackage = require("../models/PhotographerPackage");
const { uploadImage } = require("../helper/image-uploading");
const ioServer = require('../server')
const ChatRoom = require('../models/ChatRoom')


const {
  validateLawnUpdate,
  validatePhotographerPackage,
} = require("../validators/valdiators");
const { validationResult } = require("express-validator");

//Fetch all photographers
router.get("/", async (req, res) => {
  try {
    const result = await Photographer.find(
      { publish: true, isBlock: false },
      { company: 1, description: 1, currentRating: 1, images: 1 }
    );
    res.status(200).json({ msg: "All photographers", photographers: result });
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

//Update Photographer
router.post("/update", auth, validateLawnUpdate, async (req, res) => {
  let Errors = [];
  try {
    let error = validationResult(req);
    if (error && error.errors.length > 0) {
      Errors = error.errors;
      return res
        .status(400)
        .json({ message: "Validation Failed!", Errors: Errors });
    } else {
      let {
        company,
        businessEmail,
        description,
        owner,
        address,
        phone,
        city,
      } = req.body;
      let user = await User.findOne({ _id: req.user.id }, { business: 1 });
      if (!user.business) {
        Errors.push({ msg: "Photographer Not Found" });
        return res.status(400).json({ Errors: Errors });
      }
      let photographer = await Photographer.findOne({
        _id: user.business.business_id,
      });
      photographer.company = company;
      photographer.business = businessEmail;
      photographer.description = description;
      photographer.owner = owner;
      photographer.address = address;
      photographer.phone = phone;
      photographer.city = city;
      let output = await photographer.save();
      return res.status(200).json({
        message: "Business info updated successfully!",
        photographer: output,
      });
    }
  } catch (error) {
    console.log(error.message);
    Errors.push({ msg: "Business info updation failed!" });
    return res.status(400).json({ Errors: Errors });
  }
});

//Logo uploading
router.post(
  "/logo",
  auth,
  upload.single("image"),
  uploadImage,
  async (req, res, next) => {
    let Errors = [];
    try {
      if (req.image) {
        let photographer = await Photographer.findOne({
          user: req.user.id,
        }).populate("packages").populate('orders');
        photographer.logo = req.image;
        if (photographer) {
          let result = await photographer.save();
          res.status(200).json({ photographer: result, Errors: null });
        } else {
          Errors.push({ error: "Error in changing logo !" });
          res.status(400).json({ Errors, msg: "No photographer Found." });
        }
      } else {
        Errors.push({ error: "Please insert image !" });
        res.status(400).json({ Errors });
      }
    } catch (error) {
      Errors.push({ error: "Error in changing logo!" });
      res.status(400).json({ Errors, msg: error.message });
    }
  }
);

//Add package to packages array in db
router.post("/package", auth, validatePhotographerPackage, async (req, res) => {
  try {
    let Errors = [];
    let error = validationResult(req);
    if (error && error.errors.length > 0) {
      error.errors.map((err) => {
        Errors.push({ error: err.msg });
      });
      return res
        .status(400)
        .json({ message: "Validation Failed!", Errors: Errors });
    }
    let user = await User.findOne({ _id: req.user.id });
    if (!user || !user.business) {
      console.log("User not found");
      Error.push({ error: "Creating Package Failed" });
      return res.status(400).json({ Errors: Errors });
    }
    const {
      title,
      price,
      videoLength,
      noOfImages,
      date,
      advance,
      description,
    } = req.body;
    let photographer = await Photographer.findOne(
      {
        user: req.user.id,
      },
      { packages: 1 }
    );
    let newPackage = new PhotographerPackage({
      title,
      price,
      noOfImages: noOfImages,
      videoLength: videoLength,
      date,
      advance,
      description,
      photographerId: user.business.business_id,
    });
    let photographerPackage = await newPackage.save();

    photographer.packages.push(photographerPackage._id);
    let result = await photographer.save();
    let response = await Photographer.findOne(
      {
        user: req.user.id,
      },
      { packages: 1 }
    ).populate("packages").populate('orders');
    res
      .status(200)
      .json({ msg: "Package Added Successfully!", photographer: response });
  } catch (error) {
    console.log(error.message);
    Error.push({ error: "Creating Package Failed" });
    return res.status(400).json({ Errors });
  }
});
//delete package from packages array in db
router.delete("/package/:id", auth, async (req, res) => {
  try {
    let deleteResult = PhotographerPackage.remove({ _id: req.params.id });

    let photographer = await Photographer.findOne(
      {
        user: req.user.id,
      },
      { packages: 1, publish: 1 }
    );
    if (photographer.packages.length === 0) {
      res.status(400).json({ msg: "Package deletion fail!" });
    }
    PhotographerPackage.deleteOne({ _id: req.params.id })
      .then((obj) => { })
      .catch((err) => { });
    let temp = photographer.packages.filter((p) => p._id != req.params.id);
    photographer.packages = temp;
    if (photographer.packages.length < 1) {
      photographer.publish = false;
    }
    let result = await photographer.save();
    let response = await Photographer.findOne(
      {
        user: req.user.id,
      },
      { packages: 1 }
    ).populate("packages").populate('orders');
    res
      .status(200)
      .json({ msg: "Package Deleted Successfully!", photographer: response });
  } catch (error) {
    console.log("Delete Package:::", error.message);
    res.status(400).json({ msg: error.message });
  }
});

//Update package to packages array in db
router.put(
  "/package/:pid",
  auth,
  validatePhotographerPackage,
  async (req, res) => {
    try {
      let { pid } = req.params;
      let Errors = [];
      let error = validationResult(req);
      if (error && error.errors.length > 0) {
        error.errors.map((err) => {
          Errors.push({ error: err.msg });
        });
        return res
          .status(400)
          .json({ message: "Validation Failed!", Errors: Errors });
      }
      let user = await User.findOne({ _id: req.user.id });
      if (!user || !user.business) {
        console.log("User not found");
        Error.push({ error: "Creating Package Failed" });
        return res.status(400).json({ Errors: Errors });
      }
      const {
        title,
        price,
        videoLength,
        noOfImages,
        date,
        advance,
        description,
      } = req.body;
      let photographerPackage = await PhotographerPackage.findOne({
        _id: pid,
      });

      if (!photographerPackage) {
        return res.status(400).json({
          message: "Package Not Found",
        });
      }
      photographerPackage.title = title;
      photographerPackage.price = price;
      photographerPackage.noOfImages = noOfImages;
      photographerPackage.videoLength = videoLength;
      photographerPackage.date = date;
      photographerPackage.advance = advance;
      photographerPackage.description = description;
      let result = await photographerPackage.save();

      let photographer = await Photographer.findOne({
        user: req.user.id,
      }).populate("packages").populate('orders');

      res.status(200).json({
        msg: "Package Updated Successfully!",
        photographer: photographer,
      });
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ msg: error.message });
    }
  }
);

router.post("/upload-images", auth, upload.array("image"), async (req, res) => {
  try {
    let photographer = await Photographer.findOne({
      user: req.user.id,
    }).populate("packages").populate('orders');
    if (photographer) {
      const uploader = async (path) => await cloudinary.uploads(path, "Images");
      const urls = [];
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({
          Errors: [{ error: "Please insert images for uploading" }],
          msg: "No images found!",
        });
      }
      for (const file of files) {
        const { path } = file;
        const uniqueFilename = new Date().toISOString();
        const newPath = await uploader(path, {
          public_id: `pics/${uniqueFilename}`,
          tags: `pics`,
        });
        photographer.images.push(newPath);
        fs.unlinkSync(path);
      }
      photographer = await photographer.save();
      res.status(200).json({
        message: "images uploaded successfully",
        photographer: photographer,
      });
    }
  } catch (error) {
    let Errors = [];
    Errors.push({ error: "Error while uploading images" });
    res.status(400).json({
      Errors,
      msg: error.message,
    });
  }
});

router.delete("/image/:id", auth, async (req, res) => {
  let Errors = [];
  try {
    let { id } = req.params;
    let photographer = await Photographer.findOne({
      user: req.user.id,
    }).populate("packages").populate('orders');
    if (photographer) {
      let images = photographer.images.filter((image) => {
        console.log("Image id", image._id);
        return image._id != id;
      });
      photographer.images = images;
      if (photographer.images.length < 3) {
        photographer.publish = false;
      }
      let result = await photographer.save();
      res.json({ photographer: result, msg: "Image Deleted Successfully" });
    } else {
      Errors.push({ error: "Error While deleting image" });
      res.status(400).json({
        Errors,
        msg: "No photographer found!",
      });
    }
  } catch (error) {
    Errors.push({ error: "Error While Deleting Image" });
    res.status(400).json({
      Errors,
      msg: error.message,
    });
  }
});

router.post("/publish", auth, async (req, res) => {
  let Errors = [];
  try {
    let photographer = await Photographer.findOne({
      user: req.user.id,
    }).populate("packages").populate('orders');
    console.log("Here:::", photographer);
    if (!photographer.publish && photographer.packages.length === 0) {
      Errors.push({
        error: "Before publishing please add atleast 1 package !",
      });
    }
    if (!photographer.publish && photographer.images.length === 0) {
      Errors.push({
        error: "Before publishing please add atleast 3 images of photographer!",
      });
    }
    if (!photographer.publish && !photographer.logo) {
      Errors.push({ error: "Before publishing please add logo image!" });
    }
    if (Errors.length === 0) {
      console.log("here", photographer.publish)
      photographer.publish = !photographer.publish;
      let result = await photographer.save();
      // console.log("result::",result)
      let { _id, company, description, currentRating, images, publish } = result;

      let payload = { company, description, currentRating, images, _id, publish };

      ioServer.io.emit("photographerPublish", payload)

      return res.status(200).json({
        msg: `Photographer ${result.publish ? "published" : "unpublished"
          } successfully `,
        photographer: result,
      });
    } else {
      return res
        .status(400)
        .json({ msg: "Publishing photographer Failed", Errors });
    }
  } catch (error) {
    Errors.push({ error: "Error in changing publish status!" });
    return res.status(400).json({ msg: error.message, Errors });
  }
});


router.post("/review/:lid", auth, async (req, res) => {
  try {
    console.log(req.body);
    let { comment, rating } = req.body;
    let { lid } = req.params;
    if (!comment || !rating || rating < 0 || rating > 5) {
      return res.status(400).json({
        Errors: [{ error: "Error in submiting review" }],
        msg: "Invalid inputs",
      });
    } else {
      let photographer = await Photographer.findOne(
        { _id: lid },
        { reviews: 1, stars: 1, currentRating: 1 }
      );
      let index = photographer.reviews.findIndex(
        (obj) => req.user.id == obj.user.toString()
      );
      if (index != -1) {
        return res.status(400).json({
          Errors: [{ error: "Review Already added !" }],
          msg: "",
        });
      }
      if (photographer) {
        let review = {
          user: req.user.id,
          comment,
          rating,
        };
        photographer.reviews.push(review);
        photographer.stars += parseInt(rating);
        photographer.currentRating =
          photographer.stars / photographer.reviews.length;
        photographer = await photographer.save();
        let result = await Photographer.findOne({ _id: lid })
          .populate("packages")
          .populate("orders")
          .populate({
            path: "reviews.user",
            select: { _id: 1, name: 1, imageURL: 1 },
          });
        return res
          .status(200)
          .json({ msg: "Review Added Successfully", photographer: result });
      }
    }
  } catch (error) {
    return res.status(500).json({
      Errors: [{ error: "Error in submiting review", msg: error.message }],
    });
  }
});

router.put("/review/:lid", auth, async (req, res) => {
  try {
    console.log(req.body);
    let { comment, rating } = req.body;
    let { lid } = req.params;
    if (!comment || !rating || rating < 0 || rating > 5) {
      return res.status(400).json({
        Errors: [{ error: "Error in submiting review" }],
        msg: "Invalid inputs",
      });
    } else {
      let photographer = await Photographer.findOne(
        { _id: lid },
        { reviews: 1, stars: 1, currentRating: 1 }
      );
      let index = photographer.reviews.findIndex(
        (obj) => req.user.id == obj.user.toString()
      );
      if (index === -1) {
        return res.status(400).json({
          Errors: [{ error: "Error in updating review !" }],
          msg: "",
        });
      }
      console.log("index", index);
      if (photographer) {
        photographer.stars -= photographer.reviews[index].rating;
        photographer.stars += parseInt(rating);
        photographer.currentRating =
          photographer.stars / photographer.reviews.length;
        photographer.reviews[index].rating = rating;
        photographer.reviews[index].comment = comment;

        photographer = await photographer.save();
        console.log("photographer::", photographer);
        let result = await Photographer.findOne({ _id: lid })
          .populate("packages")
          .populate("orders")
          .populate({
            path: "reviews.user",
            select: { _id: 1, name: 1, imageURL: 1 },
          });
        return res
          .status(200)
          .json({ msg: "Review Updated Successfully", photographer: result });
      }
    }
  } catch (error) {
    return res.status(500).json({
      Errors: [{ error: "Error in updating review", msg: error.message }],
    });
  }
});

router.delete("/review/:lid", auth, async (req, res) => {
  try {
    let { lid } = req.params;
    let photographer = await Photographer.findOne({ _id: lid })
      .populate("packages")
      .populate("orders")
      .populate({
        path: "reviews.user",
        select: { _id: 1, name: 1, imageURL: 1 },
      });

    index = photographer.reviews.findIndex(
      (obj) => obj.user._id.toString() == req.user.id
    );
    if (index !== -1) {
      photographer.reviews[index];
      photographer.stars -= photographer.reviews[index].rating;

      photographer.reviews.splice(index, 1);

      photographer.currentRating =
        photographer.reviews.length < 1
          ? 0
          : photographer.stars / photographer.reviews.length;

    }
    photographer = await photographer.save();
    let result = await Photographer.findOne({ _id: lid })
      .populate("packages")
      .populate("orders")
      .populate({
        path: "reviews.user",
        select: { _id: 1, name: 1, imageURL: 1 },
      });
    return res
      .status(200)
      .json({ msg: "Review Updated Successfully", photographer: result });
  } catch (error) {
    return res.status(500).json({
      Errors: [{ error: "Error in updating review", msg: error.message }],
    });
  }
});
router.post("/search", auth, async (req, res) => {
  let photographers = [];
  const { searchString } = req.body;
  try {
    if (searchString && searchString.length > 0) {
      photographers = await Photographer.aggregate([
        {
          $match: {
            $or: [
              {
                company: {
                  $regex: searchString,
                  $options: "i",
                },
                publish:true
              },
            ],
          },
        },
      ]);
    } else {
      photographers = await Photographer.find(
        { isBlock: false, publish: true },
        {
          _id: 1,
          company: 1,
          images: 1,
          description: 1,
          logo: 1,
          isBlock: 1,
          publish: 1,
          currentRating: 1
        }
      );
    }
    //   console.log("pet", users[0].petId[0]);
    return res
      .status(200)
      .json({ msg: "Searching Successfull", photographers });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      Errors: [{ error: "Searching Fail", msg: error.message }],
    });
  }
});
router.post("/range", auth, async (req, res) => {
  let photographers = [];
  const { priceFrom, priceTo } = req.body;
  let query = {};
  try {
    if (priceFrom && priceTo) {
      query.price = { $gte: priceFrom, $lte: priceTo };
    }
    if (!priceFrom) {
      query.price = { $gte: 0, $lte: priceTo };
    }
    if (!priceTo) {
      query.price = { $gte: priceFrom };
    }
    let photographerPackages = await PhotographerPackage.find(query).populate({
      path: "photographerId",
      select: {
        _id: 1,
        company: 1,
        images: 1,
        description: 1,
        logo: 1,
        isBlock: 1,
        publish: 1,
        currentRating: 1
      },
    });
    photographerPackages.forEach((photographerPackage) => {
      if (
        photographerPackage.photographerId &&
        photographerPackage.photographerId.publish &&
        !photographerPackage.photographerId.isBlock
      ) {
        let index = photographers.findIndex(
          (lawn) => lawn._id === photographerPackage.photographerId._id
        );
        if (index === -1)
          photographers.push(photographerPackage.photographerId);
      }
    });
    return res
      .status(200)
      .json({
        msg: "Search Accroding to range Successfull",
        photographers: photographers,
      });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      Errors: [
        { error: "Search Accroding to range Failed", msg: error.message },
      ],
    });
  }
});


//user request photographer booking
//new order is been creating
router.post("/requestPhotographer", auth, async (req, res) => {
  const { userId, packageId, photographerId, bookingDate } = req.body;
  console.log("request photographer is postinggg");
  console.log(userId, packageId, photographerId, bookingDate);
  var name, email;
  var Errors = [];
  try {
    const user = await User.findOne({ _id: userId });
    name = user.name;
    email = user.email;
  } catch (error) {
    return res.status(400).json({ msg: "server error" });
  }
  try {
    const order = new PhotographerOrder({
      name,
      email,
      userId,
      packageId,
      bookingDate,
      photographerId,
    });
    let result = await order.save();
    console.log("order created:", result);
    if (result) {
      try {
        const photographer = await Photographer.findOne({ _id: photographerId }, { orders: 1 });
        console.log("photographer found:", photographer);
        photographer.orders.push(result._id);
        await photographer.save();
        if (photographer) {
          return res
            .status(200)
            .json({ msg: "booking has been requested successfully" });
        }
      } catch (error) {
        console.log("Errors !!", error);
        Errors.push({ error: "Error in requesting booking" });
        return res.status(400).json({ msg: error.message, Errors });
      }
    }
  } catch (error) {
    console.log("Errors !!", error);
    Errors.push({ error: "Error in requesting booking" });
    return res.status(400).json({ msg: error.message, Errors });
  }
});




//get details of order by id
router.get("/getOrder/:id", auth, async (req, res) => {
  const { id } = req.params;
  try {
    const order = await PhotographerOrder.find({ _id: id });

    const Errors = [];
    Errors.push({ error: "Error in getting order" });
    console.log("order is :", order);
    if (order.length == 0) {
      return res.status(400).json({ msg: error.message, Errors });
    }
    if (order.length > 0) {
      const { userId, packageId, createdAt, status, bookingDate } = order[0];
      //console.log('order has been created at:', createdAt)
      const user = await User.findOne(
        { _id: userId },
        { name: 1, email: 1, imageURL: 1 }
      );
      //  console.log('user is:', user)
      const package = await PhotographerPackage.findOne({ _id: packageId });
      // console.log('package is:', package)
      return res.status(200).json({ user, package, createdAt, status, bookingDate });
    }
  } catch (error) {
    return res
      .status(400)
      .json({ Errors: [{ error: "error in getting order" }] });
  }
});



//accept order
router.post("/acceptOrder", auth, async (req, res) => {
  const { id } = req.body;
  try {
    const order = await PhotographerOrder.findOneAndUpdate(
      { _id: id },
      { $set: { status: 1 } }
    );
    const { packageId } = order;
    try {
      const result = await PhotographerPackage.findOneAndUpdate(
        { _id: packageId },
        { $push: { date: order.bookingDate } }
      );
      if (result) {
        let photographer = await Photographer.findOne({ _id: order.photographerId }, { company: 1 })
        let payloadAccepted = { userId: order.userId, msg: `${photographer.company} has accepted your order` }
        console.log("PayloadAccepted", payloadAccepted);
        ioServer.io.emit('photographerOrderAccepted', payloadAccepted)
        return res
          .status(200)
          .json({ msg: "Order has been accepted successfully" });
      }
    } catch (error) {
      return res
        .status(400)
        .json({ Errors: [{ error: "error in accepting order" }] });
    }
  } catch (error) {
    return res
      .status(400)
      .json({ Errors: [{ error: "error in accepting order" }] });
  }
});

//reject order
router.delete("/rejectOrder/:id", auth, async (req, res) => {
  const { id } = req.params;
  try {
    let order = await PhotographerOrder.findOneAndUpdate({ _id: id }, {
      status: 2
    });
    // let photographer = await Photographer.findOne(
    //   {
    //     user: req.user.id,
    //   },
    //   { orders: 1 }
    // );
    // if (photographer.orders.length === 0) {
    //   res.status(400).json({ msg: "Order Rejection failed" });
    // }
    // let temp = photographer.orders.filter((o) => o._id != id);
    // photographer.orders = temp;
    // await photographer.save();
    let photographer = await Photographer.findOne({ _id: order.photographerId }, { company: 1 })

    ioServer.io.emit('photographerOrderRejected', { userId: order.userId, msg: `${photographer.company} has rejected your order` })
    return res.status(200).json({ msg: "order rejected successfully" });
  } catch (error) {
    return res
      .status(400)
      .json({ Errors: [{ error: "error in rejecting order" }] });
  }
});

router.get('/chatRooms', auth, async (req, res) => {
  try {
    let chatRooms = [];
    let user = await User.findOne({ _id: req.user.id }, { business: 1 });
    console.log("user", user)
    if (user.business) {
      chatRooms = await ChatRoom.find({ photographer: user.business.business_id.toString() })
        .populate({
          path: "user",
          select: { _id: 1, name: 1, imageURL: 1 }
        })
      console.log("bid", user.business.business_id)
      return res.status(200).json({ chatRooms: chatRooms });

    }
    else {
      return res.status(200).json({ chatRooms: [] })
    }
    // chatRooms = await ChatRoom.find({lawn:},{})
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})


router.get("/:id", auth, async (req, res) => {
  const { id } = req.params;
  try {
    const photographer = await Photographer.findOne({
      _id: id,
      publish: true,
      isBlock: false,
    })
      .populate("packages")
      .populate("orders")
      .populate({
        path: "reviews.user",
        select: { _id: 1, name: 1, imageURL: 1 },
      });
    if (!photographer) {
      res
        .status(400)
        .json([
          { error: "No photographer found", msg: "photographer not exist" },
        ]);
    }

    res
      .status(200)
      .json({ msg: "photographer Found !", photographer: photographer });
  } catch (err) {
    res
      .status(400)
      .json([{ error: "No photographer found", msg: error.message }]);
  }
});


module.exports = router;
