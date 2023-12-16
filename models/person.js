var mongoose = require("mongoose");
var BlogSchema = mongoose.Schema({
  name: String,
  email: String,
  password: String,
  status: {
    type: Number,
    default: 0,
  },
});

var blog = mongoose.model("blog", BlogSchema);
module.exports = blog;
