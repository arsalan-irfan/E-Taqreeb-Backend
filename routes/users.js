const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const nodemailer = require("nodemailer");

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

require("dotenv").config();
const auth = require("../middleware/auth");
//User model
const User = require("../models/User");
const Admin = require("../models/Admin");

const LawnOrder = require("../models/LawnOrder");

const PhotographerOrder = require("../models/PhotographerOrder");
require("../config/passport")(passport);
const crypto = require("crypto");

const dotenv = require("dotenv");
dotenv.config();
const { uploadImage } = require("../helper/image-uploading");
const { getUserChatRooms, getRoom, createRoom } = require("../functions/chat");

//Upload Image

router.post(
  "/upload",
  upload.single("image"),
  uploadImage,
  async (req, res, next) => {
    try {
      res.json({ image: req.image }).status(200);
    } catch (error) {
      res.status(400).json(error);
    }
  }
);

//All User
router.get("/", async (req, res) => {
  try {
    const result = await User.find();
    res.status(200).json({ msg: "All users", users: result });
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

//Update User
router.post("/update", auth, async (req, res) => {
  try {
    const { name, phone, city, gender } = req.body;
    if (!name || !city || !phone || !gender) {
      res
        .status(400)
        .json({ error: "Please fill the required fields", user: null });
    } else {
      let user = await User.findOne({ _id: req.user.id });
      user.name = name;
      user.city = city;
      user.phone = phone;
      user.gender = gender;
      let result = await user.save();
      res.status(200).json({ error: null, user: result });
    }
  } catch (error) {
    res.status(400).json({ error: error.message, user: null });
  }
});

router.post(
  "/updateProfilePic",
  auth,
  upload.single("image"),
  uploadImage,
  async (req, res, next) => {
    let Errors = [];
    try {
      if (req.image) {
        let user = await User.findOne({ _id: req.user.id });
        user.imageURL = req.image;
        let result = await user.save();
        res.status(200).json({ user: result, Errors: null });
      } else {
        Errors.push({ error: "Error in changing profile pic" });
        res.status(400).json({ Errors });
      }
    } catch (error) {
      Errors.push({ error: "Error in changing profile pic" });
      res.status(400).json({ Errors });
    }
  }
);

//Register Handle
router.post("/register", async (req, res) => {
  let Errors = [];
  try {
    const { name, email, phone, password, imageURL, city, gender } = req.body;
    console.log("Image", imageURL, typeof imageURL);
    if (!name || !email || !phone || !password || !imageURL) {
      Errors.push({
        message: "Error While Creating User",
        error: "please fill all required fields",
      });
    }
    if (password.length < 6) {
      Errors.push({
        message: "Error While Creating User",
        error: "password length should not be less than 6",
      });
    }
    let existingUser = await User.findOne({ email: email });
    if (existingUser) {
      Errors.push({
        message: "Error While Creating User",
        error: "Email already in use!",
      });
    }
    if (Errors.length === 0) {
      const hashedPassword = await bcrypt.hash(password, 12);
      const Code = crypto.randomBytes(3).toString("hex");

      const newUser = new User({
        name,
        email,
        city,
        password: hashedPassword,
        phone,
        gender,
        imageURL: imageURL.image,
        emailVerificationCode: Code,
        completeProfile: true,
      });
      let result = await newUser.save();
      console.log("User created");
      const payload = {
        user: {
          id: result._id,
          type: "user",
        },
      };
      const token = jwt.sign(payload, "jwt-secret", {
        expiresIn: 360000,
      });
      return res.status(200).json({ token, type: "user", Errors: [] });
    } else {
      res.status(400).json({ token: null, Errors });
    }
  } catch (error) {
    Errors.push({
      message: "Error While Creating User",
      error: error.message,
    });
    res.status(400).json({ token: null, Errors });
  }
});

//Login Handle
router.post("/login", function (req, res, next) {
  passport.authenticate("local", { session: false }, function (
    err,
    user,
    info
  ) {
    console.log(info);
    if (info) {
      return res.status(400).json({
        token: null,
        Errors: [{ message: "Error while signing in !", error: info.message }],
      });
    }
    if (user) {
      req.login(user, { session: false }, function (error) {
        if (error) {
          return res.send(error);
        }
        // console.log('Request Login supossedly successful.');
        //   console.log("Request Login supossedly successful.");
        //console.log(user);
        const payload = {
          user: {
            id: user._id,
            type: user.type,
          },
        };
        const token = jwt.sign(payload, "jwt-secret", { expiresIn: 360000 });
        return res.status(200).json({ token, type: `${user.type}` });
      });
    }
  })(req, res, next);
});

//Complete Profile
router.post("/completeProfile", (req, res) => {
  var Errors = [];
  const { phone, city, gender } = req.body;
  User.findOne({
    email: req.body.email,
  }).then(async (user) => {
    if (!user) {
      Errors.push({
        message: "Error While Sending Code",
        error: "User does not exist",
      });
      return res.status(400).json({ Errors });
    }
    await User.updateMany(
      {
        _id: user._id,
      },
      {
        $set: {
          phone,
          city,
          gender,
          completeProfile: true,
        },
      },
      (err, data) => {
        if (err) console.log(err);
        //  console.log(data);
      }
    );
    const usr = await User.findOne({email: req.body.email});
    console.log(usr);
    return res.status(200).json({user: usr})

  });
});

//Forgot password
router.post("/forgotPassword", (req, res, next) => {
  //const token = crypto.randomBytes(20).toString('hex');
  //const resetPasswordToken = token
  var Errors = [];
  console.log(req.body.email);
  User.findOne({
    email: req.body.email,
  })
    .then((user) => {
      console.log("user:", user);
      if (!user) {
        Errors.push({
          message: "Error While Sending Code",
          error: "User does not exist",
        });
        return res.status(400).json({ Errors });
      }
      const Code = crypto.randomBytes(3).toString("hex");

      var ExpireTime = new Date().getTime() + 15 * 60 * 1000;

      // var seconds = new Date().getTime();
      User.updateMany(
        {
          _id: user._id,
        },
        {
          $set: {
            resetPasswordCode: Code,
            resetPasswordTime: ExpireTime,
            resetCodeVerified: false,
          },
        },
        (err, data) => {
          if (err) console.log(err);
          //  console.log(data);
        }
      );

      console.log(`${process.env.EMAIL}`);
      console.log(`${process.env.PASSWORD}`);
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: `${process.env.EMAIL}`,
          pass: `${process.env.PASSWORD}`,
        },
      });

      const mailOptions = {
        from: `${process.env.EMAIL}`,
        to: `${user.email}`,
        subject: "Reset Password Code",
        text:
          `Dear User, Password reset request has been recieved` +
          `\n\nPlease Enter this code in required field ` +
          `\n\n${Code}`,
      };
      // console.log('sending mail');

      transporter.sendMail(mailOptions, (err, res) => {
        console.log(err);
        if (err) {
          return res
            .status(400)
            .json({ errors: [{ msg: "Email has not been send" }] });
        }
      });
      return res.send("email sent successfully");
    })
    .catch((err) => {
      //return res.status(400).send("Server Error")
      console.log(err);
    });
});

//Check forgot Password Verification code

router.post("/resetCheck", (req, res) => {
  const { resetPasswordCode } = req.body;
  var Errors = [];
  User.findOne({
    resetPasswordCode: resetPasswordCode,
  })
    .then((user) => {
      // console.log(user.resetPasswordTime);
      if (!user) {
        Errors.push({
          message: "Error While Verifying Code",
          error: "Verification Code is expired or invalid",
        });
        console.log(Errors);
        return res.status(400).json({ Errors });
      }
      if (new Date().getTime() > user.resetPasswordTime) {
        return res.status(400).json({
          errors: [{ msg: "Verification code is expired or invalid" }],
        });
      }
      User.updateMany(
        {
          resetPasswordCode: resetPasswordCode,
        },
        {
          $set: {
            resetCodeVerified: true,
            resetPasswordCode: null,
            resetPasswordTime: null,
          },
        },
        (err, data) => {
          if (err) console.log(err);
          //  console.log(data);
        }
      );
      res
        .status(200)
        .json({ user: user.email, msg: "Verification code Matched" });
    })
    .catch((err) => {
      console.log(err);
      //return res.status(400).json({Errors:[{error:'Verification is expired or invalide'}]})
    });
});

//Reset Password Route
router.post("/resetPassword", (req, res) => {
  var { email, password, confirm_password } = req.body;
  // console.log(email, password, password2);
  if (password !== confirm_password) {
    return res
      .status(400)
      .json({ Errors: [{ error: "Passwords do not match" }] });
  }
  User.findOne({
    email: email,
  }).then((user) => {
    if (!user) {
      return res
        .status(400)
        .json({ Errors: [{ error: "please enter valid email" }] });
    }
    if (!user.resetCodeVerified) {
      return res.status(400).json({
        Errors: [{ error: "your reset password code is not verified" }],
      });
    }

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) throw err;
        //console.log(hash);
        password = hash;
        User.updateMany(
          {
            email: email,
          },
          {
            $set: {
              password: password,
              resetCodeVerified: false,
            },
          },
          (err, data) => {
            if (err) console.log(err);
            if (data) {
              return res.status(200).send("password has been reset");
            }
            //  console.log(data);
          }
        );
      });
    });
  });
  // console.log(password);
});

//CheckEmailVerificationCode

router.post("/emailVerification", (req, res, next) => {
  //const token = crypto.randomBytes(20).toString('hex');
  //const resetPasswordToken = token

  // console.log('user:', user);
  const { code, email } = req.body;
  User.findOne({
    email,
  }).then((user) => {
    // var seconds = new Date().getTime();
    if (!user) {
      return res.status(400).json({ errors: [{ msg: "Email is incorrect!" }] });
    }
    //User Found!
    if (code == user.emailVerificationCode) {
      User.updateMany(
        {
          _id: user._id,
        },
        {
          $set: {
            emailVerified: true,
          },
        },
        async (err, data) => {
          if (err) console.log(err);
          //  console.log(data);
          const finUser = await User.findOne({email});

          return res.status(200).json({ msg: "Verification is Successfull!", user:finUser });
        }
      );
    } else {
      console.log("wrong verification Code");
      return res
        .status(400)
        .json({ Errors: [{  error:"Verification Code is wrong!" }] });
    }
  });
});

//send Email Verification Code
router.post("/sendEmailVerificationCode", (req, res) => {
  const { email } = req.body;
  User.findOne({
    email,
  }).then((user) => {
    // console.log('user:', user);
    if (!user) {
      res.status(400).send("email is incorrect");
    }
    const Code = crypto.randomBytes(3).toString("hex");
    // var seconds = new Date().getTime();
    User.updateMany(
      {
        _id: user._id,
      },
      {
        $set: {
          emailVerificationCode: Code,
          emailVerified: false,
        },
      },
      (err, data) => {
        if (err) console.log(err);
        //  console.log(data);
      }
    );
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: `${process.env.EMAIL}`,
        pass: `${process.env.PASSWORD}`,
      },
    });

    const mailOptions = {
      from: `${process.env.EMAIL}`,
      to: `${user.email}`,
      subject: "Email Verification Code",
      text:
        `Dear ${user.name}, Your Email Verification Code is` + `\n\n${Code}`,
    };
    // console.log('sending mail');

    transporter.sendMail(mailOptions, (err, res) => {
      console.log(err);
      if (err) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Email has not been send" }] });
      }
    });
  });
  return res.status(200).json({ msg: "email sent successfully" });
});



router.get("/chat", auth, async (req, res) => {
  try {
    const { id } = req.user;
    
    let output = await getUserChatRooms({ id });
    if (output.error) {
      return res.status(500).json({ chatRooms: [], error: output.error });
    } else {
      return res.status(200).json({ chatRooms: output.chatRooms, error: output.error });

    }
  } catch (error) {
    return res.status(500).json({ chatRooms: [], error: error.message });
  }
});

router.get("/getOrderHistory/:id", auth, async (req, res) => {
  //id of user from frontend
  const { id } = req.params;
  try {
    const order = await LawnOrder.find(
      { userId: id },
      { createdAt: 1, status: 1,bookingDate:1 }
    ).populate({ path: "lawnId", select: { company: 1, businessEmail: 1 } });

    const order2 = await PhotographerOrder.find(
      { userId: id },
      { createdAt: 1, status: 1 }
    ).populate({
      path: "photographerId",
      select: { company: 1, businessEmail: 1 },
    });
    order.push(...order2);
    console.log("order is :", order);
    return res.status(200).json({ order });
  } catch (error) {
    console.log("error is:", error);
    return res
      .status(400)
      .json({ Errors: [{ error: "error in getting order" }] });
    }
  });


router.get("/chat/:businessType/:business", auth, async (req, res) => {
  try {
    const { business, businessType } = req.params;
    const { id } = req.user;
    // console.log(id)
    if (business && businessType) {
      let check = await getRoom({ user: id, business, businessType });
      // console.log("In Check", check);
      if (check.notFound) {
        let addroom = await createRoom({ user: id, business, businessType });
        console.log("While adding room", addroom.error);
      }
    }
    let output = await getUserChatRooms({ id });
    console.log(output)
    if (output.error) {
      return res.status(500).json({ chatRooms: [], error: output.error });
    } else {
      return res.status(200).json({ chatRooms: output.chatRooms, error: output.error });
    }
  } catch (error) {
    return res.status(500).json({ chatRooms: [], error: error.message });
  }
});

module.exports = router;
