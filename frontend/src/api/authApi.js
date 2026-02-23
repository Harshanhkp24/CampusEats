import API from "./axios";

export const loginUser = (payload) => API.post("/auth/login", payload);
export const registerUser = (payload) => API.post("/auth/register", payload);
export const getMe = () => API.get("/auth/me");
