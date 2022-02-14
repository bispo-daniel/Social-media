const express = require("express");
const app = express();
require("dotenv/config");
// const server = require("http").createServer(app);
const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");
const multer = require("multer");
const cors = require('cors');
const Message = require("./models/Message");
const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");
const conversationRoute = require("./routes/coversations");
const messageRoute = require("./routes/messages"); 
const path = require("path");
const Conversation = require("./models/Conversation");
const User = require("./models/User");
const Post = require("./models/Post");
const FRONTEND_URL = process.env.FRONTEND_URL;
const BACKEND_URL = process.env.BACKEND_URL;

const server = app.listen(8800);
const io = require("socket.io")(server, {
  cors: {
    origin: FRONTEND_URL
  }
});

mongoose.connect(
  process.env.MONGO_URL,{ useNewUrlParser: true, useUnifiedTopology: true,useCreateIndex: true }
  );
app.use("/images", express.static(path.join(__dirname, "public/images")));

//middleware
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));
app.use(cors());
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, req.body.name);
  },
});

const upload = multer({ storage: storage });
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    return res.status(200).json("File uploded successfully");
  } catch (error) {
    console.error(error);
  }
});

// defined router because search endpoint 
// is only a single get request

const router = express.Router();

router.get("/", async (req, res) => {
    // since this is an example project limit set is static
    // as a work later try adding paggination so limit will
    // be dynamic since the client will want to scroll down 
    // to view more suggestions or post
    const uid = req.query.uid || '';
    const query = req.query.query;
    let limit = req.query.limit || '50';
    const type = req.query.type || 'all';
    const page = req.query.page || 'index'; // control transformation to appply
    if (type === 'all') {
      limit = limit/2;
      try {
        let posts = await Post.find({
          $or: [
            {desc: { $regex: `^${query}`, $options: 'i' }},
          ]
        }).limit(limit).select('desc img createdAt');
        let users = await User.find({
           $and: [
            {
            $or: [
              {name: { $regex: `\b${query}\b`, $options: 'i' }},
              {username: { $regex: `^${query}`, $options: 'i' }},
            ],
          },
          {_id: {$ne: uid}}
          ]
        }).limit(limit).select('username createdAt');
        if (posts.length !== 0) {
          if (page === 'index') {
            posts = posts.map(post=>{
              return {
                ...post._doc,
                 url: `/post/${post._id}?uid=${uid}`,
                 img: {
                  url: post.img?`${BACKEND_URL}/images/${post.img}`:
                  `${BACKEND_URL}/images/person/noCover.png`,
                  alt: "A post img url"
                }
                }
            })
          }
        }
        if (users.length !== 0) {
          if (page === 'index') {
            users = users.map(user=> {
              return {
                ...user._doc, 
                url: `/profile/${user.username}`,
                img: {
                  url: user.profilePicture?`${BACKEND_URL}/images/${user.profilePicture}`:
                  `${BACKEND_URL}/images/person/noAvatar.png`,
                  alt: `${user.username} image url`
                }
              }
            })
          }
        }
        return res.status(200).json({users,  posts});
      } catch (err) {
        console.log(err.message,'error while searching')
        return res.status(500).json({error: 'Internal server error'});
      }
    }
});

app.use("/api/auth", authRoute);
app.use("/api/search", router);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/messages", messageRoute);


let users = [];
let convIds = [];
const addUser = (userId,socketId)=>{
    if (!users.some(user=>user.userId === userId)){
      const user = {userId, socketId};
      users.push(user);
      return user;
    }
}
const removeUser = async socketId=>{
    users = users.filter(user=>user.socketId.toString() !== socketId.toString());
};
const getUser = async userId=>{
    return users.find(user=> {
      return user.userId.toString() === userId.toString();
    });
}

io.on('connection', socket=>{
  socket.on('addUser',(userId)=>{
    addUser(userId,socket.id);
  });
  socket.on("sendMessage", async (msg,cb)=>{
    const user = await getUser(msg.to);
    if (msg.type ==='files') {console.log('msg image')}
    else {
        try {
          let conversation,message,conv;
          if (!msg.conversationId) {
            try {
                  conversation = await Conversation.findOneAndUpdate(
                      {
                          members: 
                          {$all: [
                                                    {$elemMatch: {$eq: [msg.from, msg.to]}},
                                                    {$elemMatch: {$eq: [msg.to, msg.from]}}
                          ]}                          
                    }, 
                    {
                          members: [msg.to, msg.from]
                    }, {upsert: true, new: true, setDefaultOnInsert: true});
                  conversation = await conversation.save();
            } catch (err) {
              console.log(err.message, 'while updating');
              return cb({message: "Error updating conversation"});
            }
          }
          message = new Message({
            ...msg, 
            conversationId: conversation?conversation._id:msg.conversationId,
            status: 'saved'
          });
          message = await message.save();
          const included = convIds.includes(message.conversationId)?true:false;
          if (!included) {
            convIds.push(message.conversationId);
          }
          const from = await User.findById(msg.from).select('username profilePicture');
          try {
              // try catch avoid error if {to} don't exist - silently send msg 
              const to = await User.findById(msg.to).select('username profilePicture');
              conv = {_id: conversation?conversation._id:msg.conversationId, members: [to, from]};
              cb(false, {...message._doc}, conv, !included?conv:null);
              user && socket.to(user.socketId).emit('receiveMessage', {...message._doc}, conv, !included?conv:null);
          } catch (err) {
            console.log(err.message,'rent');
            cb({message: `Couldn't find ${to.username}: ${err.message}`}, {...message._doc}, conv, !included?conv:null);
          }
          } catch (err) {
                // error while saving
                return cb({message: "Error while saving message"});
          }
    }
  })
  socket.on("deliveredMessage", async ({msg:chat, conv}, cb=()=>{})=>{
    if (chat) {
      try {
        let res =  await Message.findByIdAndUpdate(chat._id, {status: 'delivered'}, 
        {upsert: true, new: true, setDefaultOnInsert: true});
        res = await res.save();
        try {
          let f = await User.findById(chat.from);
          let fr = await getUser(f._id);
          fr && socket.to(fr.socketId).emit('delivered',{msg: res._doc});
        } catch (err) {
          return cb({message: 'Error matching user'})
        }
        //return cb(false,{msg: res._doc, conv});
      } catch (err) {
        return cb({message: 'Error updating status'});
        // return cb({message: 'Error updating status'}, {chat, conv});
      }
    }
  });
  socket.on('disconnect', async ()=>{
          await removeUser(socket.id);
    })
});
