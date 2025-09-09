import express from "express";
import { AuthController } from "../src/controllers/authController.js";
import { authenticateToken } from "../src/middleware/auth.js";
import {
  validateRegistration,
  validateLogin,
  validatePasswordChange,
} from "../src/middleware/validation.js";

const router = express.Router();

// Public routes
router.post("/register", validateRegistration, AuthController.register);
router.post("/login", validateLogin, AuthController.login);

// Protected routes
router.post("/logout", authenticateToken, AuthController.logout);
router.get("/profile", authenticateToken, AuthController.getProfile);
router.put("/profile", authenticateToken, AuthController.updateProfile);
router.put(
  "/change-password",
  authenticateToken,
  validatePasswordChange,
  AuthController.changePassword
);
router.delete("/account", authenticateToken, AuthController.deleteAccount);
router.get("/verify-token", authenticateToken, AuthController.verifyToken);

export { router, authenticateToken };
