import jwt from "jsonwebtoken";
import { authService } from "../services/authService.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    // Try to get token from cookie first, then from Authorization header
    const token =
      req.cookies.authToken ||
      (req.headers["authorization"] &&
        req.headers["authorization"].split(" ")[1]);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access token required",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from database
    const user = await authService.findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid token - user not found",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: "Account is deactivated",
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(403).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};

// Middleware to verify token but don't require it (optional auth)
export const optionalAuth = async (req, res, next) => {
  try {
    const token =
      req.cookies.authToken ||
      (req.headers["authorization"] &&
        req.headers["authorization"].split(" ")[1]);

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await authService.findUserById(decoded.userId);

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};

// Middleware to check if user is verified
export const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      error: "Email verification required",
    });
  }

  next();
};

// Middleware to check admin role (if you implement roles)
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  // Add role checking logic here when you implement roles
  // if (req.user.role !== 'admin') {
  //   return res.status(403).json({
  //     success: false,
  //     error: "Admin access required"
  //   });
  // }

  next();
};
