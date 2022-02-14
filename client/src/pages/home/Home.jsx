import { useContext } from "react";
import Topbar from "../../components/topbar/Topbar";
import LeftBar from "../../components/LeftBar/LeftBar";
import Feed from "../../components/feed/Feed";
import RightBar from "../../components/RightBar/RightBar";
import { AuthContext } from "../../context/AuthContext";
import "./home.css"
import { Redirect } from "react-router-dom";

export default function Home() {
    
    const { user: currentUser } = useContext(AuthContext);

    return (
        <>
            {
                !currentUser ? <Redirect to="/login" from="/" /> :
                    (
                        <>
                            <Topbar />
                            <div className="homeContainer">
                                <LeftBar />
                                <Feed />
                                <RightBar user={currentUser} />
                            </div>
                        </>
                    )
            }
        </>
    );

}
