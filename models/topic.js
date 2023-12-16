const mongoose = require("mongoose");
const topicSchema = mongoose.Schema({
    topic: String
});
const Topic = mongoose.model("Topic", topicSchema);
module.exports = Topic;