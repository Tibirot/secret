//jshint esversion:8
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our big secret.",
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/usersDB", {useNewUrlParser: true}, (error) => {
  if (!error) {
    console.log("connected successfully");
  }
});

mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://googleapis.com/oauth2/v3/userinfo",
    scope: ["profile"]
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

/////////////////////////////// HOME ROUTE//////////////////////////////////////

app.route('/')

  .get((req, res) => {
    res.render("home");
  });

/////////////////////////////// GOOGLE AUTH ROUTE///////////////////////////////

app.route('/auth/google')
  .get(passport.authenticate("google", { scope: ["profile"] }));

/////////////////////////////// GOOGLE SECRETS ROUTE///////////////////////////////

app.route("/auth/google/secrets")
  .get(passport.authenticate("google", { failureRedirect: "/login"}),
  (req, res) => {
    res.redirect("/secrets");
  });

/////////////////////////////// LOGIN ROUTE/////////////////////////////////////

app.route('/login')

  .get((req, res) => {
    res.render("login");
  })

  .post((req, res) => {

    const user = new User({
      username: req.body.username,
      password: req.body.password
    });

    req.login(user, (err) => {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        });
      }
    });
  });

/////////////////////////////// REGISTER ROUTE//////////////////////////////////

app.route('/register')

  .get((req, res) => {
    res.render("register");
  })

  .post((req, res) =>{

    User.register({username: req.body.username}, req.body.password, (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        });
      }
    });

  });

/////////////////////////////// SECRETS ROUTE//////////////////////////////////

app.route('/secrets')

  .get((req, res) => {
    if (req.isAuthenticated) {
      res.render("secrets");
    } else {
      res.redirect("/login");
    }
  });

/////////////////////////////// LOGOUT ROUTE//////////////////////////////////

app.route("/logout")

  .get((req, res) => {
    req.logout();
    res.redirect("/");
  });

let port = process.env.PORT;
if (port == null || port == ""){
  port = 3000;
}

app.listen(port, () => {
  console.log("Server started on port: " + port);
});
