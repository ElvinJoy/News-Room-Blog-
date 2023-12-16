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

// Define the Add model
var Add = mongoose.model("Add", addSchema);

// Export the Add model
module.exports = Add;