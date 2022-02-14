const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
    {
        members: [{type: mongoose.Schema.ObjectId, ref:'users'}]
    }, 
    { timestamps: true}
);

module.exports = new mongoose.model("Conversations",ConversationSchema);