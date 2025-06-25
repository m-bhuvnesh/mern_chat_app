import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  const checkAuth = async () => {
    try {
      const storedToken = localStorage.getItem("token");
      const { data } = await axios.get("/api/auth/check", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Authentication failed"
      );
    }
  };

 const login = async (state, credentials) => {
  try {
    const { data } = await axios.post(`/api/auth/${state}`, credentials);

    if (data.success && data.token) {
      // ✅ Only save token if it's valid
      setAuthUser(data.userData);
      connectSocket(data.userData);

      axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      setToken(data.token);
      localStorage.setItem("token", data.token);

      toast.success(data.message || "Login successful");
    } else {
      toast.error(data.message || "Login failed");
    }
  } catch (error) {
    console.error(error);
    toast.error(error.message || "Something went wrong");
  }
};
  const logout = async () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);

    // ✅ Remove Authorization header
    delete axios.defaults.headers.common["Authorization"];

    toast.success("Logout successful");
    socket?.disconnect();
  };

  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to update profile");
    }
  };

  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;

    const newSocket = io(backendUrl, {
      query: {
        userId: userData._id,
      },
    });

    newSocket.connect();
    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });
  };

  useEffect(() => {
    if (token) {
      // ✅ Set header properly if token exists
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    checkAuth();
  }, []);

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
