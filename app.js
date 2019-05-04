//jshint esversion:8
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect("mongodb://localhost:27017/usersDB", {useNewUrlParser: true}, (error) => {
  if (!error) {
    console.log("connected successfully");
  }
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});


const User = new mongoose.model("User", userSchema);

/////////////////////////////// HOME ROUTE//////////////////////////////////////////////////

app.route('/')

  .get((req, res) => {
    res.render("home");
  });

/////////////////////////////// LOGIN ROUTE//////////////////////////////////////////////////

app.route('/login')

  .get((req, res) => {
    res.render("login");
  })

  .post((req, res) => {
    const username = req.body.username;
    const password = md5(req.body.password);

    User.findOne({email: username}, (err, foundUser) => {
      if (err) {
        console.log(err);
      }else {
        if(foundUser){
          if (foundUser.password === password) {
            res.render("secrets");
          }
        }
      }
    });
  });

/////////////////////////////// REGISTER ROUTE////////////////////////////////////////////////

app.route('/register')

  .get((req, res) => {
    res.render("register");
  })

  .post((req, res) =>{
    const newUser = new User({
      email: req.body.username,
      password: md5(req.body.password)
    });

    newUser.save((err) => {
      if (err) {
        console.log(err);
      }else {
        res.render("secrets");
      }
    });
  });



let port = process.env.PORT;
if (port == null || port == ""){
  port = 3000;
}

app.listen(port, () => {
  console.log("Server started on port: " + port);
});
