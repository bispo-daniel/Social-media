import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import Profile from "./pages/profile/Profile";
import Register from "./pages/register/Register";
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Redirect,
} from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import Messenger from "./pages/Messenger";
import Post from './pages/Post';

function App() {
    const { user } = useContext(AuthContext);
    return (
        <Router>
            <Switch>
                <Route exact path="/">
                    {!user ? <Redirect to="/login" from="/" /> : <Home />}
                </Route>
                <Route path="/login">{user ? <Redirect to="/" /> : <Login />}</Route>
                <Route path="/register">
                    {user ? <Redirect to="/" /> : <Register />}
                </Route>
                <Route path="/messenger">
                    {!user ? <Redirect to="/login" /> : <Messenger />}
                </Route>
                <Route path="/profile/:username">
                    {!user ? <Redirect to="/login" /> : <Profile />}
                </Route>
                <Route path="/post/:postId">
                    {!user ? <Redirect to="/login" /> : <Post />}
                </Route>
            </Switch>
        </Router>
    );
}

export default App;
