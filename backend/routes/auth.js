import express from "express";
import * as authController from "../src/controllers/authController.js";
import { authenticateToken } from "../src/middleware/auth.js";
import {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
} from "../src/middleware/validation.js";

const router = express.Router();

// Public routes
router.post("/register", validateRegistration, authController.register);
router.post("/login", validateLogin, authController.login);

// Protected routes
router.use(authenticateToken);
router.post("/logout", authController.logout);
router.get("/profile", authController.getProfile);
router.put("/profile", validateProfileUpdate, authController.updateProfile);
router.put(
  "/change-password",
  validatePasswordChange,
  authController.changePassword
);
router.delete("/account", authController.deleteAccount);
router.get("/verify", authController.verifyToken);

export default router;
