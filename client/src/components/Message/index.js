import './index.css';
import {format} from 'timeago.js';
export default function Index({own,message}) {
    const renderStatus = ()=>{
        if (message.status === 'delivered') {
            return <span>Delivered</span>
        } else if (message.status === 'saved') {
            return <span>Saved</span>
        } else {
            return <span>Pending</span>
        }
    }
    return (
    <div className={own?"message own":"message"}>
            <div className="messageTop">
                <img className="messageImg" src="" alt=""  />
                <p className="messageText">{message.text}</p>
            </div>
            <div className="messageBottom">
                {format(message.createdAt)}
                {
                    own && renderStatus() 
                }
            </div>
        </div>
    )
}
