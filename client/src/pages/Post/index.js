import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useRouteMatch } from 'react-router-dom';
import Post from '../../components/post/Post';
import Topbar from '../../components/topbar/Topbar';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Index() {
    const match= useRouteMatch();
    const postId = match.params.postId;
    const [post, setPost] = useState();
    useEffect(()=>{
        const fetch = async ()=>{
             try {
                const res = await axios.get(`${BACKEND_URL}/posts/${postId}`);
                setPost(res.data);
             } catch (err) {
                 console.log(err.message, 'from msg');
             }
        }
       fetch();
    }, [postId]);
    return (
        <div>
            <Topbar />
            <main style={{width: '100%', maxWidth: '600px',margin:'0 auto'}}>
                {post && <Post post={post} />}
            </main>
        </div>
    )
}
