import './index.css';

export default function Index({conversation,active=false}) {
    const PF = process.env.REACT_APP_PUBLIC_FOLDER;
    return (
        <div>
            <div  className={active?"conversation active":"conversation"}>
                <img src={conversation?.profilePicture?PF+ conversation.profilePicture:PF+"/person/noAvatar.png"} alt="" className="conversationImg" /> 
                <h3>{conversation?.username}</h3>
            </div>
        </div>
    )
}