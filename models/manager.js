var mongoose = require("mongoose");

var addSchema = mongoose.Schema({
    name: String,
    email: String,
    topic: String,
    password: String,
    status: Number,
});

var manager = mongoose.model("manager", addSchema);

module.exports = manager;