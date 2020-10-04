const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Lawn = require("../models/Lawn");
const auth = require("../middleware/auth");
const upload = require("../config/multer");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const LawnPackage = require("../models/LawnPackage");

const LawnOrder = require("../models/LawnOrder");
const { uploadImage } = require("../helper/image-uploading");
const ChatRoom = require('../models/ChatRoom')

const ioServer = require('../server')


const {
  validateLawnUpdate,
  validateLawnPackage,
} = require("../validators/valdiators");
const { validationResult } = require("express-validator");


router.get("/", async (req, res) => {
  try {
    const result = await Lawn.find(
      { publish: true, isBlock: false },
      { company: 1, description: 1, currentRating: 1, images: 1 }
    );
    res.status(200).json({ msg: "All Lawns", lawns: result });
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

//Update Lawn
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
        category,
        description,
        owner,
        address,
        phone,
        city,
      } = req.body;
      let user = await User.findOne({ _id: req.user.id }, { business: 1 });
      if (!user.business) {
        Errors.push({ msg: "Lawn Not Found" });
        return res.status(400).json({ Errors: Errors });
      }
      console.log("Business ID", user.business.business_id);
      let lawn = await Lawn.findOne({ _id: user.business.business_id });
      console.log("LAWN:::", lawn);
      lawn.company = company;
      lawn.business = businessEmail;
      lawn.category = category;
      lawn.description = description;
      lawn.owner = owner;
      lawn.address = address;
      lawn.phone = phone;
      lawn.city = city;
      let output = await lawn.save();
      return res.status(200).json({
        message: "Business info updated successfully!",
        lawn: output,
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
        let lawn = await Lawn.findOne({ user: req.user.id })
          .populate("packages")
          .populate("orders");

        lawn.logo = req.image;
        if (lawn) {
          let result = await lawn.save();
          res.status(200).json({ lawn: result, Errors: null });
        } else {
          Errors.push({ error: "Error in changing logo !" });
          res.status(400).json({ Errors, msg: "No Lawn Found." });
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
router.post("/package", auth, validateLawnPackage, async (req, res) => {
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
      capacity,
      price,
      timeTo,
      timeFrom,
      date,
      advance,
      description,
    } = req.body;
    let lawn = await Lawn.findOne(
      {
        user: req.user.id,
      },
      { packages: 1 }
    );
    console.log("Lawn", lawn);
    let newPackage = new LawnPackage({
      title,
      capacity,
      price,
      timeFrom: timeFrom,
      timeTo: timeTo,
      date,
      advance,
      description,
      lawn_id: user.business.business_id,
    });
    let lawnPackage = await newPackage.save();

    lawn.packages.push(lawnPackage._id);
    let result = await lawn.save();
    let response = await Lawn.findOne(
      {
        user: req.user.id,
      },
      { packages: 1 }
    )
      .populate("packages")
      .populate("orders");

    res
      .status(200)
      .json({ msg: "Package Added Successfully!", lawn: response });
  } catch (error) {
    console.log(error.message);
    Error.push({ error: "Creating Package Failed" });
    return res.status(400).json({ Errors });
  }
});
//delete package from packages array in db
router.delete("/package/:id", auth, async (req, res) => {
  try {
    let deleteResult = LawnPackage.remove({ _id: req.params.id });
    console.log("Delete Result", deleteResult);
    let lawn = await Lawn.findOne(
      {
        user: req.user.id,
      },
      { packages: 1 }
    );
    if (lawn.packages.length === 0) {
      res.status(400).json({ msg: "Package deletion fail!" });
    }
    let temp = lawn.packages.filter((p) => p._id != req.params.id);
    lawn.packages = temp;
    if (lawn.packages.length < 1) {
      lawn.publish = false;
    }
    let result = await lawn.save();
    let response = await Lawn.findOne(
      {
        user: req.user.id,
      },
      { packages: 1 }
    )
      .populate("packages")
      .populate("orders");

    res
      .status(200)
      .json({ msg: "Package Deleted Successfully!", lawn: response });
  } catch (error) {
    console.log("Delete Package:::", error.message);
    res.status(400).json({ msg: error.message });
  }
});

//Update package to packages array in db
router.put("/package/:pid", auth, validateLawnPackage, async (req, res) => {
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
      capacity,
      price,
      timeTo,
      timeFrom,
      date,
      advance,
      description,
    } = req.body;
    let lawnPackage = await LawnPackage.findOne({
      _id: pid,
    });

    if (!lawnPackage) {
      return res.status(400).json({
        message: "Package Not Found",
      });
    }
    lawnPackage.title = title;
    lawnPackage.capacity = capacity;
    lawnPackage.price = price;
    lawnPackage.timeFrom = timeFrom;
    lawnPackage.timeTo = timeTo;
    lawnPackage.date = date;
    lawnPackage.advance = advance;
    lawnPackage.description = description;
    let result = await lawnPackage.save();

    let lawn = await Lawn.findOne({
      user: req.user.id,
    })
      .populate("packages")
      .populate("orders");

    res.status(200).json({
      msg: "Package Updated Successfully!",
      lawn: lawn,
    });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ msg: error.message });
  }
});

router.post("/create", auth, (req, res) => {
  const {
    user,
    company,
    businessEmail,
    owner,
    address,
    city,
    category,
    phone,
    postalCode,
    description,
  } = req.body;
  Lawn.findOne({ businessEmail: businessEmail }).then((lawn) => {
    if (lawn) {
      console.log(lawn);
      res
        .status(400)
        .json({ errors: [{ msg: "Business email already used" }] });
    } else {
      const newLawn = new Lawn({
        user,
        company,
        businessEmail,
        owner,
        address,
        city,
        category,
        phone,
        postalCode,
        description,
      });
      newLawn.save().then((businessSaved) => {
        console.log("Lawn business Saved Successfully " + businessSaved);
        User.findOneAndUpdate(
          { _id: businessSaved.user },
          { $set: { businessPending: true } },
          { new: true },
          (err, doc) => {
            if (err) {
              console.log("Error2");
              res.status(400).json({ errors: [{ msg: err.message }] });
            }
            res.status(200).json({
              msg: "Lawn Successfully Submited",
              data: businessSaved,
            });
          }
        );
      });
    }
  });
});

router.get("/single/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const business = await Lawn.findOne({ _id: id });
    if (!business) {
      res.status(400).json({ msg: "No business found" });
    }
    const user = await User.findOne({ _id: business.user });
    console.log(user);
    if (!user) {
      res.status(400).json({ msg: "No User Found" });
    }
    res.status(200).json({ msg: "Lawn Found !", lawn: business, user: user });
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

router.post(
  "/upload-images",
  auth,
  upload.array("image"),
  async (req, res) => {
    try {
      let lawn = await Lawn.findOne({ user: req.user.id })
        .populate("packages")
        .populate("orders");

      if (lawn) {
        const uploader = async (path) =>
          await cloudinary.uploads(path, "Images");
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
          lawn.images.push(newPath);
          fs.unlinkSync(path);
        }
        lawn = await lawn.save();
        res.status(200).json({
          message: "images uploaded successfully",
          lawn: lawn,
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
  }
);

router.delete("/image/:id", auth, async (req, res) => {
  let Errors = [];
  try {
    let { id } = req.params;
    let lawn = await Lawn.findOne({ user: req.user.id })
      .populate("packages")
      .populate("orders");

    if (lawn) {
      let images = lawn.images.filter((image) => {
        console.log("Image id", image._id);
        return image._id != id;
      });
      lawn.images = images;
      if (lawn.images.length < 3) {
        lawn.publish = false;
      }
      let result = await lawn.save();
      res.json({ lawn: result, msg: "Image Deleted Successfully" });
    } else {
      Errors.push({ error: "Error While deleting image" });
      res.status(400).json({
        Errors,
        msg: "No Lawn found!",
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
    let lawn = await Lawn.findOne({ user: req.user.id })
      .populate("packages")
      .populate("orders");

    if (!lawn.publish && lawn.packages.length < 1) {
      Errors.push({
        error: "Before publishing please add atleast 1 package !",
      });
    }
    if (!lawn.publish && lawn.images.length < 3) {
      Errors.push({
        error: "Before publishing please add atleast 3 images of lawn!",
      });
    }
    if (!lawn.publish && !lawn.logo) {
      Errors.push({ error: "Before publishing please add logo image!" });
    }
    if (Errors.length === 0) {
      lawn.publish = !lawn.publish;
      let result = await lawn.save();
      let { _id, company, description, currentRating, images, publish } = result;
      let payload = { company, description, currentRating, images, _id, publish };

      ioServer.io.emit("lawnPublish", payload)

      return res.status(200).json({
        msg: `Lawn ${result.publish ? "published" : "unpublished"
          } successfully `,
        lawn: result,
      });
    } else {
      return res.status(400).json({ msg: "Publishing Lawn Failed", Errors });
    }
  } catch (error) {
    Errors.push({ error: "Error in changing publish status!" });
    return res.status(400).json({ msg: error.message, Errors });
  }
});


//user request lawn booking
//new order is been creating
router.post("/requestLawn", auth, async (req, res) => {
  const { userId, packageId, lawnId, bookingDate } = req.body;
  console.log("request lawn is postinggg");
  console.log(userId, packageId, lawnId, bookingDate);
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
    const order = new LawnOrder({
      name,
      email,
      userId,
      packageId,
      bookingDate,
      lawnId,
    });
    let result = await order.save();
    console.log("order created:", result);
    if (result) {
      try {
        const lawn = await Lawn.findOne({ _id: lawnId }, { orders: 1 });
        console.log("lawn found:", lawn);
        lawn.orders.push(result._id);
        await lawn.save();
        if (lawn) {
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
    const order = await LawnOrder.find({ _id: id });

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
      const package = await LawnPackage.findOne({ _id: packageId });
      // console.log('package is:', package)
      return res
        .status(200)
        .json({ user, package, createdAt, status, bookingDate });
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
    const order = await LawnOrder.findOneAndUpdate(
      { _id: id },
      { $set: { status: 1 } }
    );
    let lawn = await Lawn.findOne({ _id: order.lawnId }, { company: 1 })
    let payloadAccepted={ userId: order.userId, msg: `${lawn.company} has accepted your order` }
    console.log("PayloadAccepted",payloadAccepted);
    
    ioServer.io.emit('lawnOrderAccepted', payloadAccepted)

    const { packageId } = order;
    try {
      const result = await LawnPackage.findOneAndUpdate(
        { _id: packageId },
        { $push: { date: order.bookingDate } }
      );
      if (result) {
        try {
          const orders = await LawnOrder.find({ packageId: packageId });
          // console.log('orders are:', orders)
          orders.map(async (ord, index) => {

            //console.log(order.bookingDate.getDate(), ord.bookingDate.getDate());
            //  console.log('hello\n', ord._id, id)
            if (ord._id.toString() != id
              && ord.bookingDate.getDate() == order.bookingDate.getDate()
            ) {
              console.log("these orders are:", ord);
              ord.status = 2;
              await ord.save();
              ioServer.io.emit('lawnOrderRejected', { userId: ord.userId, msg: `${lawn.company} has rejected your order` })
              console.log("Reject",payloadAccepted);

            }
          });
          //  const ord = await orders.save();
        } catch (error) {
          console.log(error);
          return res
            .status(400)
            .json({ Errors: [{ error: "error in accepting order" }] });
        }
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
    let order = await LawnOrder.findOneAndUpdate(
      { _id: id },
      {
        status: 2,
      }
    );
    let lawn = await Lawn.findOne({ _id: order.lawnId }, { company: 1 })

    ioServer.io.emit('lawnOrderRejected', { userId: order.userId, msg: `${lawn.company} has rejected your order` })
    return res.status(200).json({ msg: "order rejected successfully" });
  } catch (error) {
    return res
      .status(400)
      .json({ Errors: [{ error: "error in rejecting order" }] });
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
      let lawn = await Lawn.findOne(
        { _id: lid },
        { reviews: 1, stars: 1, currentRating: 1 }
      );
      let index = lawn.reviews.findIndex(
        (obj) => req.user.id == obj.user.toString()
      );
      if (index != -1) {
        return res.status(400).json({
          Errors: [{ error: "Review Already added !" }],
          msg: "",
        });
      }
      if (lawn) {
        let review = {
          user: req.user.id,
          comment,
          rating,
        };
        lawn.reviews.push(review);
        lawn.stars += parseInt(rating);
        lawn.currentRating = lawn.stars / lawn.reviews.length;
        lawn = await lawn.save();
        let result = await Lawn.findOne({ _id: lid })
          .populate("packages")
          .populate("orders")
          .populate({
            path: "reviews.user",
            select: { _id: 1, name: 1, imageURL: 1 },
          });
        return res
          .status(200)
          .json({ msg: "Review Added Successfully", lawn: result });
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
      let lawn = await Lawn.findOne(
        { _id: lid },
        { reviews: 1, stars: 1, currentRating: 1 }
      );
      let index = lawn.reviews.findIndex(
        (obj) => req.user.id == obj.user.toString()
      );
      if (index === -1) {
        return res.status(400).json({
          Errors: [{ error: "Error in updating review !" }],
          msg: "",
        });
      }
      console.log("index", index);
      if (lawn) {
        lawn.stars -= lawn.reviews[index].rating;
        lawn.stars += parseInt(rating);
        lawn.currentRating = lawn.stars / lawn.reviews.length;
        lawn.reviews[index].rating = rating;
        lawn.reviews[index].comment = comment;

        lawn = await lawn.save();
        console.log("lawn::", lawn);
        let result = await Lawn.findOne({ _id: lid })
          .populate("packages")
          .populate("orders")
          .populate({
            path: "reviews.user",
            select: { _id: 1, name: 1, imageURL: 1 },
          });
        return res
          .status(200)
          .json({ msg: "Review Updated Successfully", lawn: result });
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
    let lawn = await Lawn.findOne({ _id: lid })
      .populate("packages")
      .populate("orders")
      .populate({
        path: "reviews.user",
        select: { _id: 1, name: 1, imageURL: 1 },
      });

    index = lawn.reviews.findIndex(
      (obj) => obj.user._id.toString() == req.user.id
    );
    if (index !== -1) {
      lawn.reviews[index];
      lawn.stars -= lawn.reviews[index].rating;

      lawn.reviews.splice(index, 1);
      console.log("reviews ", lawn.reviews.length)
      lawn.currentRating = lawn.reviews.length < 1 ? 0 : lawn.stars / lawn.reviews.length;

    }
    lawn = await lawn.save();

    return res.status(200).json({ msg: "Review Updated Successfully", lawn });
  } catch (error) {
    return res.status(500).json({
      Errors: [{ error: "Error in updating review", msg: error.message }],
    });
  }
});
router.post("/search", auth, async (req, res) => {
  let lawns = [];
  const { searchString } = req.body;
  try {
    if (searchString && searchString.length > 0) {
      lawns = await Lawn.aggregate([
        {
          $match: {
            $or: [
              {
                company: {
                  $regex: searchString,
                  $options: "i",
                },
              },
            ],
          },
        },
      ]);
    } else {
      lawns = await Lawn.find(
        { isBlock: false, publish: true },
        {
          _id: 1,
          company: 1,
          images: 1,
          description: 1,
          logo: 1,
          isBlock: 1,
          publish: 1,
          currentRating: 1,
        }
      );
    }

    //   console.log("pet", users[0].petId[0]);
    return res.status(200).json({ msg: "Searching Successfull", lawns });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      Errors: [{ error: "Searching Fail", msg: error.message }],
    });
  }
});
router.post("/range", auth, async (req, res) => {
  let lawns = [];
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
    let lawnPackages = await LawnPackage.find(query).populate({
      path: "lawn_id",
      select: {
        _id: 1,
        company: 1,
        images: 1,
        description: 1,
        logo: 1,
        isBlock: 1,
        publish: 1,
        currentRating: 1,
      },
    });

    lawnPackages.forEach((lawnPackage) => {
      if (
        lawnPackage.lawn_id &&
        lawnPackage.lawn_id.publish &&
        !lawnPackage.lawn_id.isBlock
      ) {
        let index = lawns.findIndex(
          (lawn) => lawn._id === lawnPackage.lawn_id._id
        );
        if (index === -1) lawns.push(lawnPackage.lawn_id);
      }
    });
    return res
      .status(200)
      .json({ msg: "Search Accroding to range Successfull", lawns: lawns });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      Errors: [
        { error: "Search Accroding to range Failed", msg: error.message },
      ],
    });
  }
});

router.get('/chatRooms', auth, async (req, res) => {
  try {
    let chatRooms = [];
    let user = await User.findOne({ _id: req.user.id }, { business: 1 });
    console.log("user", user)
    if (user.business) {
      chatRooms = await ChatRoom.find({ lawn: user.business.business_id.toString() })
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
    const lawn = await Lawn.findOne({ _id: id })
      .populate("packages")
      .populate("orders")
      .populate({
        path: "reviews.user",
        select: { _id: 1, name: 1, imageURL: 1 },
      });
    if (!lawn) {
      return res
        .status(400)
        .json([{ error: "No lawn found", msg: "Lawn not exist" }]);
    }

    return res.status(200).json({ msg: "Lawn Found !", lawn: lawn });
  } catch (error) {
    return res
      .status(400)
      .json([{ error: "No lawn found", msg: error.message }]);
  }
});

module.exports = router

