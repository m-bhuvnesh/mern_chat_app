import User from "../Models/User.js";
import jwt from "jsonwebtoken";
//Middleware to protect routes
export const protectRoute = async (req, res, next) => {
  try {
    const token = req.headers.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.json({
      success: false,
      message: error.message,
    });
  }

  // console.log("Authorization Header:", req.headers.token);
  // try {

  //   const authHeader = req.headers.token;

  //   if (!authHeader || !authHeader.startsWith("Bearer ")) {
  //     return res.status(401).json({
  //       success: false,
  //       message: "No token provided",
  //     });
  //   }
  //   const token = authHeader.split(" ")[1];
  //   const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //   const user = await User.findById(decoded.userId).select("-password");
  //   if (!user) {
  //     return res.json({
  //       success: false,
  //       message: "User not found",
  //     });
  //   }
  //   req.user = user;
  //   next();
  // } catch (error) {
  //   console.error("Auth Middleware Error:", error.message);
  //   return res.json({
  //     success: false,
  //     message: "Unauthorized access: " + error.message,
  //   });
  // }
};

export const checkAuth = (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
};
