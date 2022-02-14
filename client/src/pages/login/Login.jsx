import { useContext, useRef } from "react";
import { loginCall } from "../../apiCalls";
import { AuthContext } from "../../context/AuthContext";
import { CircularProgress } from "@material-ui/core";
import { useHistory } from 'react-router-dom';
import "./login.css";

export default function Login() {
  const email = useRef();
  const password = useRef();
  const history = useHistory();
  const { isFetching, error, dispatch } = useContext(AuthContext);
  // const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleClick = (e) => {
    e.preventDefault();
    loginCall(
      { email: email.current.value, password: password.current.value },
      dispatch
    );
  };

  return (
    <div className="login">
      <form className="loginBox" onSubmit={e => e.preventDefault()}>
        < input placeholder="Email" type="email" required className="loginInput" ref={email} />
        < input placeholder="Password" type="password" required minLength="6" className="loginInput" ref={password} />
        <button onClick={handleClick} className="loginButton" type="submit" disabled={isFetching}>
          {isFetching ? (
            <CircularProgress color="white" size="20px" />
          ) : (
            "Log In"
          )}
        </button>
        <span className="loginForgot">Forgot Password?</span>
        <button onClick={_ => {
          history.push({
            pathname: "/register"
          })
        }} className="loginRegisterButton">
          {isFetching ? (
            <CircularProgress color="white" size="20px" />
          ) : (
            "Create a New Account"
          )}
        </button>
        {
          error && <p style={{ color: 'red' }}>{error.message}</p>
        }
      </form>
    </div>
  );
}
