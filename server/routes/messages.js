const router = require("express").Router();
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

router.post("/", async (req,res)=>{
    const newMessage = new Message(req.body);
    await Conversation();
    try {
        const savedMessage = await newMessage.save();
        return res.status(200).json({res:savedMessage});
    } catch (err) {
        return res.status(500).json({err:err.message});
    }
});

router.get("/:conversationId",async (req,res)=>{
    try {
        const messages = await Message.find({
            conversationId: req.params.conversationId
        });
        return res.status(200).json(messages);
        
    } catch (err) {
        return res.status(500).json({err: err.message});
    }
})

// const user = await User.findById(req.user._id).select("-password");
// if (!user) return res.status(400).send("User doesn't exist");
// const messages = await Message.find({ $or: [{ to: user.username }, { from: user.username }] }).sort({ time: -1 });
// res.status(200).send(messages);

module.exports = router;