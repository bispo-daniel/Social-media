import {useContext,useEffect,useState,useRef} from 'react';
import Topbar from '../../components/topbar/Topbar';
import Conversation from '../../components/Conversation';
import Message from '../../components/Message';
import ChatOnline from '../../components/ChatOnline';
import {AuthContext} from '../../context/AuthContext';
import axios from 'axios';
import './Messenger.css'; 
import { useLocation } from 'react-router';
import io from 'socket.io-client';
import { getStorage, setStorage } from '../../utilities/helpers';

export default function Messenger() {
    const location = useLocation();
    const [conversations,setConversations] = useState([]);
    const {user} = useContext(AuthContext);
    const [currentChat,setCurrentChat] = useState(
        getStorage('chat', {
            direct: true,
            members: [
                {  
                    username: location.state?.to.username,
                    profilePicture: location.state?.to.profilePicture,
                    _id: location.state?.to._id
                },
                {  
                    username: user.username,
                    profilePicture: user.profilePicture,
                    _id: user._id
                }
            ]
        })
    );
    const [messages,setMessages] = useState([]);
    const [searchResults,setSearchResults] = useState([]);
    const  [query,setQuery] = useState('');
    const [message,setMessage] = useState("");
    const scrollRef = useRef();
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    let socket = useRef();
    let convArrival = useRef();
    let recentList = useRef([]);

    
    useEffect(()=>{
    socket.current = io("ws://localhost:8800");
    socket.current.emit("addUser",user._id);
    const cb = (err,res)=>{
        if (err) return;
        if (res.conv) convArrival.current = res.conv;
        if (res.msg) {
            setMessages(prev => {
                return prev.map(chat => {
                    return chat.uniq === res.msg.uniq ? res.msg : chat;
                });
            });
        }
    }
    socket.current.on('receiveMessage',(msg,conv)=>{
        convArrival.current = conv;
        setMessages(prev => [...prev, msg]);
        socket.current.emit("deliveredMessage", {msg, conv}, cb);
    });
    const fetchConvs = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/conversations/${user?._id}`);
            setConversations(res.data);
        } catch (err) {
            console.log('error fetching conversations', err.message);
        }
    }
    fetchConvs();
    scrollRef.current?.scrollIntoView({
        behavior: 'smooth'
    });    
    return ()=>{
        socket.current.disconnect();
    }
    },[user, BACKEND_URL]);

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/messages/${currentChat?._id}`);
                setMessages(res.data.map(chat => {
                    return {...chat, delivered: true}
                }));
            } catch (err) {
                console.log('error fetching chats', err.message);
            }
        };
        console.log(
            currentChat.members[0].username,
            currentChat.members[1].username,
            'currentChat');
        setStorage(currentChat, 'chat');
        !currentChat.direct && fetchChats();
    }, [currentChat, BACKEND_URL, user]);
    
    useEffect(() => {
        if (messages.length === 1) {
            recentList.current.push(convArrival.current);
        } else if (messages.length > 1) {
            messages.forEach(msg => {
                console.log(msg.conversationId, convArrival.current?._id, 'conv chat');
                if (!(msg?.conversationId === (convArrival.current?._id || currentChat?._id))) {
                    recentList.current.push((convArrival.current || currentChat));
                }
            });
        }
        console.log(
            recentList,
            convArrival.current,
            currentChat,
            'list');
        if (recentList.current.length !== 0) setConversations([...recentList.current]);
    }, [messages, currentChat]);


    const handleSubmit = async e=>{
        console.log(currentChat,'msg');
        const msg = {
            to: currentChat.members[0]._id,
            from: user?._id,
            text: message,
            type: 'text',
            createdAt: Date.now(),
            uniq: (Math.floor(Math.random() * Date.now() * Math.random() + Date.now())).toString(),
            conversationId: convArrival.current?._id || currentChat?._id
        }
        const submitCb = (err,msg,conv) => {
            if (err) {
                if (msg && conv) {}
                return;
            }
            convArrival.current = conv;
            setStorage(conv, 'chat');
            setMessages(prev => {
                return prev.map(chat => {
                    console.log(
                        chat.uniq,
                        msg.uniq,
                        chat.uniq === msg.uniq,
                        'chaty'
                        );
                    return chat.uniq === msg.uniq ? msg : chat;
                });
            });
            // setConversations(prev => [...prev, conv]);
        }
        setMessages(prev => [...prev, msg]);
        setMessage("");
        socket.current.emit('sendMessage',msg,submitCb);
    }
    const onKeyPress = async e=>{
        if (e.key === 'Enter') await handleSubmit();
    }

    const search = async e=>{
        let value = e.target.value;
        setQuery(value);
        if (value.length === 0) {
            setSearchResults([]);
        } else {
            try {
                const res = await axios.get(`${BACKEND_URL}/users/friends/${user._id}`);
                console.log(res.data,'friends');
                setSearchResults(res.data);
            } catch (err) {
                console.log(err.message,'friends');
            }
        }
    }
    return (
        <>
        {user.username}
        <Topbar />

        <div className="messenger">

             <div className="chatMenu">
                <div className="chatMenuWrapper">
                    <input 
                    onChange={search} 
                    placeholder="Search for friends" 
                    type="text" 
                    className="chatMenuInput" 
                    value={query}
                    />
                    {
                        searchResults.map((c)=>(
                            <div key={c._id} onClick={()=>{
                                setCurrentChat({
                                    members: [
                                        {
                                            _id: c._id,
                                            username: c.username,
                                            profilePicture: c.profilePicture,
                                        }, 
                                        {
                                            _id: user._id,
                                            username: user.username,
                                            profilePicture: user.profilePicture
                                        }
                                    ]
                                });
                                setSearchResults([])
                                setQuery("");
                            }}>
                            <Conversation active={currentChat?._id === convArrival.current?._id} conversation={c} />
                            </div>
                        ))
                    }
                    {
                        searchResults.length > 0 ? null :
                        (
                            conversations.map((c)=>{
                                console.log(c, 'render conv');
                                return (
                                    <div key={c?._id} onClick={()=>setCurrentChat(c)}>
                                <Conversation conversation={{
                                    username: c?.members[0]?.username,
                                    profilePicture: c?.members[0]?.profilePicture 
                                    }} 
                                    active={currentChat?._id === c?._id}   
                                />
                                </div>
                                )
                            })
                        )
                    }
                </div> 
            </div>
            <div className="chatBox">
             {
                !currentChat ? <span className="noConversationText">Get engage in a conversation with a friend {`${!currentChat.username}`} </span>:        
                <div className="chatBoxWrapper">
                        <div className="chatBoxTop">
                        {
                             messages.length !== 0 ? messages.map(m=>(
                                <div key={m._id} ref={scrollRef}>
                                <Message message={m} own={m.from === user._id} />
                                </div>
                            ))  : <span className="noConversationText"> Start a conversation </span>
                        }
                    </div>
                    <div className="chatBoxBottom">
                        <textarea 
                        onKeyPress={onKeyPress} 
                        value={message} 
                        onChange={e=>setMessage(e.target.value)} 
                        name="chatMessageInput" 
                        id=""  
                        placeholder="write something" 
                        className="chatMessageInput"></textarea>
                        <button onClick={handleSubmit} className="chatSubmitButton">Send</button>
                    </div>
                </div>
            
             } 
            </div> 
            <div className="chatOnline">
                <div className="chatOnlineWrappper">
                    <ChatOnline />
                </div>
            </div>
        </div>
        </>
    )
}