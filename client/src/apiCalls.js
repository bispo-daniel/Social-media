import axios from "axios";
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const loginCall = async (userCredential, dispatch) => {
  dispatch({ type: "LOGIN_START" });
  try {
    const res = await axios.post(`${BACKEND_URL}/auth/login`, userCredential);
    dispatch({ type: "LOGIN_SUCCESS", payload: res.data });
  } catch (err) {
    console.log(err.response.data);
    dispatch({ type: "LOGIN_FAILURE", payload: err.response.data });
  }
};

