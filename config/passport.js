const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const passportJWT = require("passport-jwt");
const ExtractJWT = passportJWT.ExtractJwt;
const FacebookStrategy = require("passport-facebook").Strategy;
GoogleStrategy = require("passport-google-oauth20").Strategy;
const JWTStrategy = passportJWT.Strategy;
//User model
const User = require("../models/User");
const Admin = require("../models/Admin");
const FACEBOOK_CLIENT_ID = require("./AppCredentials").facebookClientId;
const FACEBOOK_CLIENT_SECRET = require("./AppCredentials").facebookClientSecret;
const GOOGLE_CLIENT_ID = require("./AppCredentials").googleClientId;
const GOOGLE_CLIENT_SECRET = require("./AppCredentials").googleClientSecret;
module.exports = function (passport) {
  passport.use(
    new JWTStrategy(
      {
        jwtFromRequest: ExtractJWT.fromHeader("x-auth-token"),
        secretOrKey: "jwt-secret",
      },
      function (jwtPayload, cb) {
        //find the user in db if needed
        if (jwtPayload.user.type == "admin") {
          return Admin.findOne({ _id: jwtPayload.user.id })
            .then((user) => {
              if (!user) {
                return cb(null, false, {
                  message:
                    "token is not valid please get another token by logging in!",
                });
              }
              return cb(null, {data:user,type:"admin"});
            })
            .catch((err) => {
              return cb(err);
            });
        }
        return User.findOne({ _id: jwtPayload.user.id })
          .then((user) => {
            if (!user) {
              return cb(null, false, {
                message:
                  "Authentication Failed please login again!",
              });
            }
            return cb(null, {data:user,type:"user"});
          })
          .catch((err) => {
            return cb(err);
          });
      }
    )
  );

  passport.use(
    new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
      if (email.includes("admin@admin.com")) {
        Admin.findOne({ email: email })
          .then((admin) => {
            if (!admin) {
              return done(null, false, {
                message: "invalid username or password",
              });
            }
            //Match password
            bcrypt.compare(password, admin.password, (err, isMatch) => {
              if (err) throw err;
              if (isMatch) {
                admin.type = "admin";
                return done(null, admin);
              } else {
                return done(null, false, {
                  message: "invalid username or password",
                });
              }
            });
          })
          .catch((err) => {
            //  return cb(err);
          });
      }

      //Match User
      else {
        User.findOne({ email: email })
          .then((user) => {
            if (!user) {
              return done(null, false, {
                message: "invalid username or password",
              });
            }
            //Match password
            bcrypt.compare(password, user.password, (err, isMatch) => {
              if (err) throw err;

              if (isMatch) {
                user.type = "user";
                return done(null, user);
              } else {
                return done(null, false, {
                  message: "invalid username or password",
                });
              }
            });
          })
      }
    })
  );

  passport.use(
    new FacebookStrategy(
      {
        clientID: FACEBOOK_CLIENT_ID,
        clientSecret: FACEBOOK_CLIENT_SECRET,
        callbackURL: "http://localhost:5000/return",
        profileFields: ["emails", "name", "picture.type(large)"],
      },
      function (accessToken, refreshToken, profile, done) {
        const FacebookEmail = profile.emails[0].value;
        const FacebookPhoto = profile.photos[0].value;

        User.findOne({ email: FacebookEmail }, (err, user) => {
          if (err) {
            return done(err);
          }
          if (user) {
            return done(null, user);
          }
          var newUser = new User({
            id: profile.id,
            name: profile.name.givenName,
            email: FacebookEmail,
            imageURL: FacebookPhoto,
            emailVerified: true,
          });
          // newUser.facebook.id = profile.id;
          // newUser.facebook.token = accessToken;
          // newUser.facebook.name =
          //   profile.name.givenName + ' ' + profile.name.familyName;
          // newUser.facebook.email = profile.emails[0].value;

          newUser.save(function (err) {
            if (err) throw err;
            // newUser.token = accessToken;
            return done(null, newUser);
          });
        });
      }
    )
  );
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:5000/returnG",
        profileFields: ["emails", "name", "photos"],
      },
      function (accessToken, refreshToken, profile, done) {
        const GoogleEmail = profile.emails[0].value;
        const GooglePhoto = profile.photos[0].value;
        User.findOne({ email: GoogleEmail }, (err, user) => {
          if (err) {
            return done(err);
          }
          if (user) {
            return done(null, user);
          }
          var newUser = new User({
            id: profile.id,
            name: profile.name.givenName,
            email: GoogleEmail,
            imageURL: GooglePhoto,
            emailVerified: true,
          });
          newUser.save(function (err) {
            if (err) throw err;
            return done(null, newUser);
          });
        });
      }
    )
  );
  // passport.serializeUser(function(user, done) {
  //   done(null, user);
  // });

  // passport.deserializeUser(function(user, done) {
  //   done(null, user);
  // });
};
