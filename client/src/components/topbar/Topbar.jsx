import "./topbar.css";
import { Search, Chat, Notifications, Settings, Tv, Home, DirectionsRun } from "@material-ui/icons";
import { Link, useHistory } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import GroupView from '../../components/GroupView';
import axios from 'axios';
import { format } from 'timeago.js';

export default function Topbar() {
    const { user, dispatch } = useContext(AuthContext);
    const [suggestions, setSuggestions] = useState([]);
    const [query, setQuery] = useState("");
    const history = useHistory();
    const PF = process.env.REACT_APP_PUBLIC_FOLDER;
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    const search = async e => {
        let value = e.target.value;
        setQuery(value);
        if (value.length === 0) {
            setSuggestions([]);
        } else {
            try {
                const res = await axios.get(`${BACKEND_URL}/search?query=${value}&uid=${user._id}`);
                const users = res.data.users.map(res => {
                    return { ...res, group: 'user' }
                });
                const posts = res.data.posts.map(res => {
                    return { ...res, group: 'post' }
                });
                setSuggestions([...users, ...posts]);
            } catch (err) {
                console.log('error fetching search', err?.response?.data.error)
            }
        }
    }

    return (
        <header>
            <div className="headerContainer">
                <div className="headerLeft">
                    <Link to="/" style={{ textDecoration: "none" }}>
                        <span className="logo">*</span>
                    </Link>
                    <div className="search-container">
                        <div className="searchbar">
                            <Search className="searchIcon" />
                            <input
                                placeholder="Search for It!"
                                className="searchInput"
                                value={query}
                                onChange={search}
                            />
                        </div>
                        {
                            suggestions.length !== 0 &&
                            <div className="suggestions">
                                <GroupView
                                    titles={["User List", "Post List"]}
                                    group={['user', 'post']}
                                    effect={{
                                        addon: {
                                            view: (c) => {
                                                return (
                                                    <div onClick={() => {
                                                        history.push({ pathname: c.url })
                                                    }} className="suggest">
                                                        <div className={c.group === 'post' ? "suggest-imgWrapper" : "suggest-imgWrapper header-user"} ><img alt={c.img?.alt} src={c.img?.url} /> </div>
                                                        <div className="suggest-content">
                                                            <div>{c.username || c.desc}</div>
                                                            <p>{format(c.createdAt)}</p>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                        },
                                        transforms: [
                                            () => {
                                                const userList = [];
                                                suggestions.forEach(suggestion => {
                                                    if (suggestion.group === 'user') {
                                                        userList.push(suggestion);
                                                    }
                                                })
                                                return userList;
                                            },
                                            () => {
                                                const postList = [];
                                                suggestions.forEach(suggestion => {
                                                    if (suggestion.group === 'post') {
                                                        postList.push(suggestion);
                                                    }
                                                })
                                                return postList;
                                            }
                                        ]
                                    }}
                                />
                            </div>
                        }
                    </div>
                </div>
                
                <div className="headerCenter">
                    <Link to="/"><button className="centerLink"><Home/></button></Link>
                    <button className="centerLink"><Tv/></button>
                    <button className="centerLink" onClick={() => dispatch({ type: 'LOGOUT' })}><DirectionsRun/></button>
                </div>

                <div className="headerRight">
                    <div className="headerIcons">
                            <div className="headerIconItem">
                            <Link to="/messenger" style={{ color: 'white' }}>
                                <Chat />
                                <span className="headerIconBadge">2</span>
                            </Link>
                            </div>
                        <div className="headerIconItem">
                            <Notifications />
                            <span className="headerIconBadge">1</span>
                        </div>
                        <div className="headerIconItem">
                            <Settings />
                        </div>
                    </div>
                    <Link to={`/profile/${user.username}`}>
                        <img
                            src={
                                user.profilePicture
                                    ? PF + user.profilePicture
                                    : PF + "person/noAvatar.png"
                            }
                            alt=""
                            className="headerImg"
                        />
                    </Link>
                </div>

                <div className="hamburgerIcon">
                    <div className="one"></div>
                    <div className="two"></div>
                    <div className="three"></div>
                </div>
            
            </div>
        </header>
    );
}
