import jwt from "jsonwebtoken";
import User from "../Models/User.js";

export const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ✅ Check if header exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided in header" });
    }

    const token = authHeader.split(" ")[1]; // Get the token after 'Bearer'

    // ✅ Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Fetch user
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    // ✅ Attach user to request and continue
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};
