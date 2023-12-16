var mongoose = require("mongoose");

// Define the Add schema
var addSchema = mongoose.Schema({
    name: String,
    user_id: String,
    title: String,
    topic: String,
    content: String,
    Date: String,
    status: Number,
});


var Add = mongoose.model("Add", addSchema);

module.exports = Add;
