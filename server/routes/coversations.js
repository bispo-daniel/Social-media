const router = require("express").Router();
const Conversation = require("../models/Conversation");


router.post("/", async (req,res)=>{
    const newConversation = new Conversation({
        members: [req.body.senderId,req.body.receiverId]
    });
    try {
        const savedConversation = await newConversation.save();
        return res.status(200).json({res:savedConversation});
    } catch (err) {
        return res.status(500).json({
            err: err.message
        });
    }
});

router.get("/:userId", async (req,res)=>{
    try {
        const conversation = await Conversation.find({
            members: {$in: req.params.userId}
        }).populate('members', '_id username profilePicture')
            .sort('-createdAt');
        return res.status(200).json(conversation);
    } catch (err) {
        return res.status(400).json({err:err.message});
    }
})

module.exports = router;