const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
require("dotenv").config();


const passport = require("passport");

const jwt = require("jsonwebtoken");
var cors = require("cors");

const bodyParser = require("body-parser");
const methodOverride = require("method-override");




const app = express();
const auth = require("./middleware/auth");
const PORT = process.env.PORT || 5000;
const Message = require("./models/Message");
const { getUserBusiness } = require("./functions/business");
const { verifyUser } = require("./middleware/graphqlAuth");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));




const socketio = require('socket.io');
const server = http.createServer(app);
const io = socketio(server);

app.use(methodOverride("_method"));

//const io = socketIO.listen(server);

//Access control over domain
app.use(cors());

require("./config/passport")(passport);

//DB config
const db = require("./config/keys").MongoURI;

mongoose
  .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((db) => {
    console.log("mongo db connected");
  })
  .catch((err) => console.log(err));


//passport config

app.use(require("cookie-parser")());

//Bodyparser

//Routes


app.use("/lawn", require("./routes/lawn"));
app.use("/admin", require("./routes/admin"));
app.use("/caterer", require("./routes/caterer"));
app.use("/business", require("./routes/business"));
app.use("/photographer", require("./routes/photographer"));

app.use("/users", require("./routes/users"));



app.get(
  "/login/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
  // UsersController.facebookAuth
);

app.get(
  "/login/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/return",
  passport.authenticate("facebook", { session: false }),
  function (req, res) {
    //  console.log(req.user.token);

    const payload = {
      user: {
        id: req.user._id,
      },
    };
    const token = jwt.sign(payload, "jwt-secret", { expiresIn: 360000 });

    console.log(token);
    res.cookie("auth", token);
    res.redirect(`http://localhost:3000/login/social`);
  }
);

app.get(
  "/returnG",
  passport.authenticate("google", { session: false }),
  function (req, res) {
    const payload = {
      user: {
        id: req.user._id,
      },
    };
    const token = jwt.sign(payload, "jwt-secret", { expiresIn: 360000 });
    // console.log(token);
    res.cookie("auth", token);
    res.redirect("http://localhost:3000/login/social");
  }
);

app.get("/profile", function (req, res) {
  res.render("profile", { user: req.user });
});

//Get auth User
app.get("/authUser", auth, function (req, res, next) {
  let business = null;
  let orders = null;
  passport.authenticate("jwt", { session: false }, async function (
    err,
    user,
    info
  ) {
    if (err) {
      res.json(err);
    }
    //get user
    //  if (req.isAuthenticated()) {
    //console.log('req.file', ' ', req.file);
    if (info) {
      res.status(400).json({ errors: [{ msg: info.message }] });
    }
    if (user.data) {
      if (user.data.businessUser) {
        let { category, business_id } = user.data.business;
        business = await getUserBusiness({ category, business_id });

        // console.log('business:', business)
      }
      res
        .status(200)
        .json({ user: user.data, type: user.type, business: business });
    } else {
      res.status(401).json({ errors: [{ msg: "Error in fetching Profile" }] });
    }
  })(req, res, next);
});

app.get("/addCollection", (req, res) => {
  const message = new Message({
    id: "123",
  });
  message.save();
  res.status(200).send("added!");
});


app.get("/", (req, res) => {
  res.status(200).send("Working ");
});


server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports.io = io;