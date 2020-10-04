const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const router = express.Router();
const passport = require("passport");
const Lawn = require("../models/Lawn");

const Photographer = require("../models/Photographer");
const User = require("../models/User");
const Business = require("../models/Business");
const adminAuth = require("../middleware/adminAuth");
const onApproveBusiness = require("../helper/admin").onApproveBusiness;
const ioServer = require('../server')

//Register Handle
router.post("/register", (req, res) => {
  const { name, email, phone, password } = req.body;

  //Check required fields
  //Validation passed
  Admin.findOne({ email: email })
    .then((admin) => {
      if (admin) {
        //admin exists
        res.status(400).json({ errors: [{ msg: "admin already exist" }] });
        //  res.json({ admin });
      } else {
        const newadmin = new Admin({
          name,
          email,
          password,
          phone,
        });
        console.log(newadmin);
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newadmin.password, salt, (err, hash) => {
            if (err) throw err;
            newadmin.password = hash;
            newadmin
              .save()
              .then((admin) => {
                console.log("bcrypt!!\n", admin);
                req.login(admin, { session: false }, function (error) {
                  if (error) return next(error);
                  // console.log('Request Login supossedly successful.');
                  //   console.log("Request Login supossedly successful.");
                  const payload = {
                    admin: {
                      id: admin._id,
                    },
                  };
                  const token = jwt.sign(payload, "jwt-secret", {
                    expiresIn: 360000,
                  });
                  return res.status(200).json({ token, type: "admin" });
                });
                // res.status(200).send(true);
              })
              .catch((err) => res.status(500).send("Server Error"));
          });
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

//Login Handle
router.post("/login", function (req, res, next) {
  passport.authenticate("local", { session: false }, function (
    err,
    admin,
    info
  ) {
    console.log(info);
    if (info) {
      return res.status(400).json({ errors: [{ msg: info.message }] });
    }
    if (admin) {
      req.login(admin, { session: false }, function (error) {
        if (error) {
          return res.send(error);
        }
        // console.log('Request Login supossedly successful.');
        //   console.log("Request Login supossedly successful.");
        console.log(admin.type);
        const payload = {
          user: {
            id: admin._id,
            type: admin.type,
          },
        };
        const token = jwt.sign(payload, "jwt-secret", { expiresIn: 360000 });
        return res.status(200).json({ token, type: "admin" });
      });
    }
  })(req, res, next);
});

//get All Users
router.get('/getUsers', adminAuth, async (req, res) => {
  User.find(
    {},
    { name: 1, businessUser: 1, imageURL: 1, isBlock: 1 },
    (err, result) => {
      if (err) throw err;
      console.log('users:', result);
      return res.status(200).json({ users: result })
    }
  )
})



//get number of Users for months

router.get("/getUserCount",adminAuth,  async (req, res) => {
  
  try {
    const userCount = await  Admin.find(
      {
        email: "admin@admin.com",
      },
      "janCount febCount marCount aprCount mayCount juneCount julyCount augCount sepCount octCount novCount decCount -_id"
    );
    return res.status(200).json(...userCount)  
  } catch (error) {
    return res.status(400).json({error: 'server error'})  
   
  }
  
});

//List all unapproved Lawns

router.get("/lawn/pendingLawn/all", adminAuth, async (req, res) => {
  try {
    const result = await Lawn.find(
      { businessPending: true },
      { createdAt: 1, company: 1 }
    );
    //console.log(result)
    return res.status(200).json({ lawns: result });
  } catch (err) {
    return res.status(400).json({ Errors: [{ error: err.message }] });
  }
});


//List all unapproved Photographers

router.get("/photographer/pendingPhotographer/all", adminAuth, async (req, res) => {
  try {
    const result = await Photographer.find(
      { businessPending: true },
      { createdAt: 1, company: 1 }
    );
    //console.log(result)
    return res.status(200).json({ photographers: result });
  } catch (err) {
    return res.status(400).json({ Errors: [{ error: err.message }] });
  }
});



//List all approved Lawns
router.get("/getLawn/all", adminAuth, async (req, res) => {
  try {
    const result = await Lawn.find(
      { businessPending: false },
      { company: 1, businessEmail: 1, phone: 1, isBlock: 1 }
    );
    console.log(result)
    return res.status(200).json({ lawns: result });
  } catch (error) {
    return res.status(400).json({ Errors: [{ error: error.message }] });
  }
});

//List all approved Photographers
router.get("/getPhotographer/all", adminAuth, async (req, res) => {
  try {
    const result = await Photographer.find(
      { businessPending: false },
      { company: 1, businessEmail: 1, phone: 1, isBlock: 1 }
    );
    console.log(result)
    return res.status(200).json({ photographers: result });
  } catch (error) {
    return res.status(400).json({ Errors: [{ error: error.message }] });
  }
});

//get Lawn by id
//UnApproved
router.get("/pendingLawn/:id", adminAuth, async (req, res) => {
  try {
    const result = await Lawn.find({ _id: req.params.id });
    console.log('result:', result)
    const lawn = result[0];

    const { user } = lawn;
    const result2 = await User.find(
      { _id: user },
      { imageURL: 1, name: 1, phone: 1, email: 1 }
    );
    //console.log(business);

    return res.status(200).json({ lawn: result[0], user: result2[0] });
  } catch (error) {
    return res.status(400).json({ errors: [{ msg: error.message }] });
  }
});



//get Photographer by id
//UnApproved
router.get("/pendingPhotographer/:id", adminAuth, async (req, res) => {
  try {
    const result = await Photographer.find({ _id: req.params.id });
    console.log('result:', result)
    const photographer = result[0];

    const { user } = photographer;
    const result2 = await User.find(
      { _id: user },
      { imageURL: 1, name: 1, phone: 1, email: 1 }
    );
    //console.log(business);

    return res.status(200).json({ photographer: result[0], user: result2[0] });
  } catch (error) {
    return res.status(400).json({ errors: [{ msg: error.message }] });
  }
});


//get lawn by id
//Approved

router.get("/single/lawn/:id", adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const lawn = await Lawn.findOne({ _id: id });
    if (!lawn) {
      return res.status(400).json({ msg: "No lawn found" });
    }
    const user = await User.findOne({ _id: lawn.user });
    console.log(user);
    if (!user) {
      return res.status(400).json({ msg: "No User Found" });
    }
    return res
      .status(200)
      .json({ msg: "lawn Found !", lawn: lawn, user: user });
  } catch (err) {
    res.status(400).json({ Errors: [{ error: err.message }] });
  }
});


//get photographer by id
//Approved

router.get("/single/photographer/:id", adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const lawn = await Photographer.findOne({ _id: id });
    if (!lawn) {
      return res.status(400).json({ msg: "No lawn found" });
    }
    const user = await User.findOne({ _id: photographer.user });
    console.log(user);
    if (!user) {
      return res.status(400).json({ msg: "No User Found" });
    }
    return res
      .status(200)
      .json({ msg: "photographer Found !", photographer: photographer, user: user });
  } catch (err) {
    res.status(400).json({ Errors: [{ error: err.message }] });
  }
});




//Change Block Status of lawn by id

//Change Block Status of photographer by id
router.post("/lawn/changeBlockStatus", adminAuth, async (req, res) => {
  const { lawn_id, currentBlockStatus } = req.body;
  //console.log(lawn_id, currentBlockStatus);
  const newBlockStatus = !currentBlockStatus;
  // console.log(typeof newBlockStatus, " ", newBlockStatus);
  // console.log(typeof currentBlockStatus, " ", currentBlockStatus);
  try {
    await Lawn.updateOne(
      { _id: lawn_id },
      { $set: { isBlock: newBlockStatus } },
      function (err, result) {
        console.log(result, " newBlockStatus", newBlockStatus);
        if (result && newBlockStatus) {
          console.log("lawn has been blocked successfully");
          res.status(200).json({
            msg: "lawn has been blocked successfully",
          });
        }
        if (result && !newBlockStatus) {
          console.log("lawn has been unblocked successfully");
          res.status(200).json({
            msg: "lawn has been unblocked successfully",
          });
        }
        if (err) {
          throw err;
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
});



//Change Block Status of photographer by id

//Change Block Status of photographer by id
router.post("/photographer/changeBlockStatus", adminAuth, async (req, res) => {
  const { photographer_id, currentBlockStatus } = req.body;
  //console.log(photographer_id, currentBlockStatus);
  const newBlockStatus = !currentBlockStatus;
  // console.log(typeof newBlockStatus, " ", newBlockStatus);
  // console.log(typeof currentBlockStatus, " ", currentBlockStatus);
  try {
    await Photographer.updateOne(
      { _id: photographer_id },
      { $set: { isBlock: newBlockStatus } },
      function (err, result) {
        console.log(result, " newBlockStatus", newBlockStatus);
        if (result && newBlockStatus) {
          console.log("photographer has been blocked successfully");
          res.status(200).json({
            msg: "photographer has been blocked successfully",
          });
        }
        if (result && !newBlockStatus) {
          console.log("photographer has been unblocked successfully");
          res.status(200).json({
            msg: "photographer has been unblocked successfully",
          });
        }
        if (err) {
          throw err;
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
});




//Change block status of User
router.post("/user/changeBlockStatus", adminAuth, async (req, res) => {
  const { user_id, currentBlockStatus } = req.body;
  //console.log(lawn_id, currentBlockStatus);
  const newBlockStatus = !currentBlockStatus;
  // console.log(typeof newBlockStatus, " ", newBlockStatus);
  // console.log(typeof currentBlockStatus, " ", currentBlockStatus);
  try {
    await User.updateOne(
      { _id: user_id },
      { $set: { isBlock: newBlockStatus } },
      function (err, result) {
        console.log(result, " newBlockStatus", newBlockStatus);
        if (result && newBlockStatus) {
          console.log("user has been blocked successfully");
          res.status(200).json({
            msg: "user has been blocked successfully",
          });
        }
        if (result && !newBlockStatus) {
          console.log("user has been unblocked successfully");
          res.status(200).json({
            msg: "user has been unblocked successfully",
          });
        }
        if (err) {
          throw err;
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
});






//approve lawn by id

router.get("/lawn/approve/:id", adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await Lawn.findOneAndUpdate({ _id: id },
      { $set: { businessPending: false } },
      async function (err, result) {
        if (err) {
          throw err;
        }
        if (result) {
          const { user, _id } = result;
          console.log(result)
          await User.updateOne({ _id: user }, {
            $set: {
              businessPending: false, businessUser: true, business: {
                category: "1",
                business_id: _id
              }
            }
          }, (err, result) => {
            if (err) throw err;
            if (result) {
              let { _id } = result
              ioServer.io.emit("businessStatus", { uid: _id, msg: "Your Business Request has been accepted by admin" })
              return res.status(200).json({ msg: 'lawn has been approved successfully', id: _id })
            }
          })
        }

      }
    );
    // const user = await User.findOne({ _id: lawn.user });
    // console.log(user);
    // if (!user) {
    //   return res.status(400).json({ msg: "No User Found" });
    // }
    // return res
    //   .status(200)
    //   .json({ msg: "lawn Found !", lawn: lawn, user: user });
  } catch (err) {
    res.status(400).json({ Errors: [{ error: err.message }] });
  }
});





//approve photographer by id

router.get("/photographer/approve/:id", adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await Photographer.findOneAndUpdate({ _id: id },
      { $set: { businessPending: false } },
      async function (err, result) {
        if (err) {
          throw err;
        }
        if (result) {
          const { user, _id } = result;
          console.log(result)
          await User.updateOne({ _id: user }, {
            $set: {
              businessPending: false, businessUser: true, business: {
                category: "2",
                business_id: _id
              }
            }
          }, (err, result) => {
            if (err) throw err;
            if (result) {
              let { _id } = result
              ioServer.io.emit("businessStatus", { uid: _id, msg: "Your Business Request has been accepted by admin" })
              return res.status(200).json({ msg: 'photographer has been approved successfully', id: _id })
            }
          })
        }

      }
    );
  } catch (err) {
    res.status(400).json({ Errors: [{ error: err.message }] });
  }
});








//reject lawn by id

router.delete("/lawn/reject/:id", adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await Lawn.findOneAndDelete({ _id: id },
      async function (err, result) {
        if (err) {
          throw err;
        }
        if (result) {
          let { _id } = result
          ioServer.io.emit("businessStatus", { uid: _id, msg: "Your Business Request has been rejected by admin" })
          console.log(result)
        }
        return res.status(200).json({ msg: 'lawn has been rejected successfully' })
      }
    );
    // const user = await User.findOne({ _id: lawn.user });
    // console.log(user);
    // if (!user) {
    //   return res.status(400).json({ msg: "No User Found" });
    // }
    // return res
    //   .status(200)
    //   .json({ msg: "lawn Found !", lawn: lawn, user: user });
  } catch (err) {
    res.status(400).json({ Errors: [{ error: err.message }] });
  }
});




//reject photographer by id

router.delete("/photographer/reject/:id", adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await Photographer.findOneAndDelete({ _id: id },
      async function (err, result) {
        if (err) {
          throw err;
        }
        if (result) {
          let { _id } = result
          ioServer.io.emit("businessStatus", { uid: _id, msg: "Your Business Request has been rejected by admin" })
          console.log(result)
        }
        return res.status(200).json({ msg: 'photographer has been rejected successfully' })
      }
    );
  } catch (err) {
    res.status(400).json({ Errors: [{ error: err.message }] });
  }
});



module.exports = router;
