const express = require("express");
const app = express();
const ejs = require("ejs");
const bodyParser = require("body-parser");
const session = require("express-session");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));


var sec = require("./sec");
app.use("/", sec);

var admin = require("./admin");
app.use("/", admin);

var topicmanager = require("./topicManager");
app.use("/", topicmanager);


// app.use(express.static("assets"));
app.use(express.static("public"));

app.listen(3000, (req, res) => {
    console.log("server has been started");
  });