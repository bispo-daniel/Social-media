import "./RightBar.css";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { setStorage } from "../../utilities/helpers";

export default function RightBar({ user }) {
   const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
   const { user: currentUser, dispatch } = useContext(AuthContext);
   const [followed, setFollowed] = useState(false);
   const history = useHistory();
   useEffect(() => {
      setFollowed(currentUser.followings.includes(user._id));
   }, [BACKEND_URL, user, currentUser]);

   const handleClick = async () => {
      try {
         if (followed) {
            await axios.put(`${BACKEND_URL}/users/${user._id}/unfollow`, {
               userId: currentUser._id,
            });
            dispatch({ type: "UNFOLLOW", payload: user._id });
         } else {
            await axios.put(`${BACKEND_URL}/users/${user._id}/follow`, {
               userId: currentUser._id,
            });
            dispatch({ type: "FOLLOW", payload: user._id });
         }
         setFollowed(!followed);
      } catch (err) {
      }
   };

   const HomeRightbar = () => {
      return (
         <div className="clearRight">

         </div>
      );
   };

   const ProfileRightbar = () => {
      return (
         <>
            {user.username !== currentUser.username && (
               <button className="rightBarFollowButton" onClick={handleClick}>
                  {followed ? "Unfollow" : "Follow"}
               </button>
            )}
            {
               currentUser._id !== user._id &&
               <button className="messageButton" onClick={() =>
                  setStorage({
                     direct: true,
                     members: [
                        {
                           _id: user?._id,
                           username: user?.username,
                           profilePicture: user?.profilePicture,
                        },
                        {
                           _id: currentUser?._id,
                           username: currentUser?.username,
                           profilePicture: currentUser?.profilePicture
                        }
                     ]
                  }, 'chat', () => history.push({
                     pathname: '/messenger'
                  }))}
               >Message</button>
            }

         </>
      );
   };


   return (
      <div className="rightBar">
         <div className="rightBarWrapper">
            {user ? <ProfileRightbar /> : <HomeRightbar />}
         </div>
      </div>
   );
}