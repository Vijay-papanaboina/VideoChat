import express from "express";
import * as authController from "../src/controllers/authController.js";
import { authenticateToken } from "../src/middleware/auth.js";
import {
  validateLogin,
  validateProfileUpdateMiddleware,
  validatePasswordChangeMiddleware,
} from "../src/middleware/validation.js";

const router = express.Router();

// Public routes
router.post("/register", authController.register);
router.post("/login", validateLogin, authController.login);

// Protected routes
router.use(authenticateToken);
router.post("/logout", authController.logout);
router.get("/profile", authController.getProfile);
router.put(
  "/profile",
  validateProfileUpdateMiddleware,
  authController.updateProfile
);
router.put(
  "/change-password",
  validatePasswordChangeMiddleware,
  authController.changePassword
);
router.delete("/account", authController.deleteAccount);
router.get("/verify", authController.verifyToken);
router.get("/users/search", authController.searchUsers);

export default router;
