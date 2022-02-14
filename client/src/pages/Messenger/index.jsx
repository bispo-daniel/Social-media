import {useContext,useEffect,useState,useRef} from 'react';
import Topbar from '../../components/topbar/Topbar';
import Conversation from '../../components/Conversation';
import GroupView from '../../components/GroupView';
import Message from '../../components/Message';
import ChatOnline from '../../components/ChatOnline';
import {AuthContext} from '../../context/AuthContext';
import axios from 'axios';
import './Messenger.css'; 
import io from 'socket.io-client';
import { getStorage, setStorage,uniq } from '../../utilities/helpers';

export default function Messenger() {
    const [conversations, setConversations] = useState([]);
    const {user} = useContext(AuthContext);
    const [currentChat, setcurrentChat] = useState(undefined);
    const [messages, setMessages] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const  [query, setQuery] = useState('');
    const [message, setMessage] = useState("");
    const scrollRef = useRef();
    let socket = useRef();
    let convArrival = useRef();
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    
    useEffect(()=>{
    socket.current = io("ws://localhost:8800");
    socket.current.emit("addUser",user._id);
    const fetchConvs = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/conversations/${user?._id}`);
            setConversations(res.data);
        } catch (err) {
            console.log('error fetching conversations', err.message);
        }
    }
    fetchConvs();
    socket.current.on('receiveMessage', (msg, conv, d) => { 
        if (msg.from._id !== user._id) {
            convArrival.current = conv; 
            if (d) setConversations(prev=>[d, ...prev]);
             if (getStorage('chat')._id === conv._id) {
            setMessages(prev => [...prev, msg]);
        }
        socket.current.emit("deliveredMessage", {msg, conv});
    }
    });
    socket.current.on('delivered', ({msg})=>{
        setMessages(prev => {
            return prev.map(chat => {
                return chat.uniq === msg.uniq ? msg : chat;
            });
        });
    })
    setcurrentChat(getStorage('chat'));
    scrollRef.current?.scrollIntoView({
        behavior: 'smooth'
});    
    return ()=>{
        socket.current.disconnect();
    }
    },[user, BACKEND_URL]);

    useEffect(()=>{
        const fetchChats = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/messages/${currentChat?._id}`);
                setMessages(res.data);
            } catch (err) {
                console.log('Error fetching chat ', err.message);
            }
        }
        setMessage("");
        fetchChats(); 
    }, [currentChat, BACKEND_URL]);


    const handleSubmit = async e=>{
        // trying to allowing \r\n with textarea failed attempt tho
        // let validText = /(^.+(\n|\r|\s)*.+)|(^(\n|\n\r|\s)*.+)|(^.+(\n|\n\r|\s)$)/;
        // if (!validText.test(message)) {
        //     console.log('it is false', message);
        //     return false;
        // }
        if (message.length === 0) return;
        const data = {
            to: setConversation(currentChat)._id,
            from: user?._id,
            text: message,
            type: 'text',
            createdAt: Date.now(),
            uniq: uniq(), // In a prod app install uniq instead for more assurance
            conversationId: currentChat?._id
        }
        const submitCb = (err,msg,conv) => {
            if (err) {
                if (msg && conv) {}
                return;
            }
            if (conv._id !== currentChat?._id) 
            setConversations(prev => [conv, ...prev]);
            if (currentChat?._id !== conv._id) {
                setcurrentChat(conv);
            };
            setStorage(conv, 'chat');
            setMessages(prev => {
                return prev.map(chat => {
                    return chat.uniq === msg.uniq ? msg : chat;
                });
            });
            // setConversations(prev=>{
            //     prev.sort(function (a, b) { return a - new Date(b.time) })
            // })
        }
        setMessages(prev => [...prev, data]);
        setMessage("");
        socket.current.emit('sendMessage', data, submitCb);
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
            const result = [];
            if (conversations.length !== 0) {
                const reg = new RegExp(value, "i");
                conversations.forEach(c=>{
                    const chat = setConversation(c);
                    if (reg.test(chat.username)) {
                        result.push({...c, group: 'conv'});
                    }
                });
                setSearchResults(result);
            }
            try {
                const res = await axios.get(`${BACKEND_URL}/users/search?query=${value}&uid=${user._id}`);
                const transformed = res.data.map(c=>({
                    direct: true,
                    group: 'user',
                    members: [
                        {
                            _id: c._id,
                            username: c.username,
                            profilePicture: c.profilePicture
                        }, 
                        {
                            _id: user._id,
                            username: user.username,
                            profilePicture: user.profilePicture
                        }
                    ]
                }));
                setSearchResults([...result, ...transformed]);
            } catch (err) {
                console.log("Can't search ", err.message);
            }
        }
    }

    const setConversation = (c) => {
        if (!c.members) return {};
        const chat = c?.members.find(m=> m._id !== user._id);
        return {
            username: chat?.username,
            profilePicture: chat?.profilePicture,
            _id: chat?._id
        }; 
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
                        searchResults.length !== 0 &&
                        <GroupView  
                        titles={['Chat List', 'User List']}
                        group={['conv', 'user']}
                        lead="chat-search"
                        effect={{
                            addon: {
                                convMap: [],
                                view: (c)=>{
                                    return <div key={c._id} onClick={()=>{
                                        setcurrentChat(c);
                                        setStorage(c,'chat');
                                        setSearchResults([])
                                        setQuery("");
                                    }}>
                                    <Conversation 
                                    key={c._id}
                                    active={currentChat?._id === convArrival.current?._id} 
                                    conversation={setConversation(c)} 
                                    />
                                    </div>
                                }
                            },
                            transforms: [
                                (addon)=>{
                                    let chatList = [];
                                    searchResults.forEach(c=>{
                                        if  (c.group === 'conv') {
                                            chatList.push(c);
                                            addon.convMap.push(setConversation(c)._id);
                                        }
                                    })
                                    return chatList;
                                },
                                (addon)=>{
                                    let userList = [];
                                    searchResults.forEach(c=>{
                                        if (c.group === 'user' && 
                                        !addon.convMap.includes(setConversation(c)._id)
                                        )  userList.push(c);
                                    })
                                    return userList;
                                }
                            ]
                        }}
                        />
                    }
                    {
                        searchResults.length > 0 ? null :
                        (
                            conversations.length !== 0 && 
                            conversations.map((c)=>{
                                return (
                                    <div key={c?._id} onClick={()=> {
                                        setcurrentChat(c);
                                        setStorage(c, 'chat');
                                    }}>
                                <Conversation 
                                conversation={setConversation(c)} 
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
                !currentChat ? <span className="noConversationText">
                    Get engage in a conversation with a friend {`${!currentChat?.username}`} 
                    </span>:        
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
                        <input
                        onKeyPress={onKeyPress} 
                        value={message} 
                        onChange={e=>setMessage(e.target.value)} 
                        name="chatMessageInput" 
                        id="" 
                        placeholder="write something" 
                        className="chatMessageInput" />
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