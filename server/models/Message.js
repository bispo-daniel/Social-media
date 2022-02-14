const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
    {
        to: {
            type: Object,
        },
        from: {
            type: Object
        }, 
        type: {
            type: String
        }, 
        text: {
            type: String
        },
        createdAt: {
            type: String
        },
        conversationId: {
            type: String
        }, 
        uniq: {
            type: String
        },
        status: {
            type: String,
            default: 'pending'
        }
    }
);

module.exports = new mongoose.model("messages", MessageSchema);