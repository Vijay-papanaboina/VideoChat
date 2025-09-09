import { AuthService } from "../services/authService.js";

export class AuthController {
  // Register a new user
  static async register(req, res) {
    try {
      const { username, email, password, firstName, lastName, avatar, bio } =
        req.body;

      const result = await AuthService.register({
        username,
        email,
        password,
        firstName,
        lastName,
        avatar,
        bio,
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: result,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      const result = await AuthService.login(email, password);

      res.json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Logout user
  static async logout(req, res) {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Token is required",
        });
      }

      await AuthService.logout(token);

      res.json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get user profile
  static async getProfile(req, res) {
    try {
      const user = req.user; // Set by auth middleware

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;

      const updatedUser = await AuthService.updateProfile(userId, updateData);

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password and new password are required",
        });
      }

      await AuthService.changePassword(userId, currentPassword, newPassword);

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Delete account
  static async deleteAccount(req, res) {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Password is required to delete account",
        });
      }

      await AuthService.deleteAccount(userId, password);

      res.json({
        success: true,
        message: "Account deleted successfully",
      });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Verify token
  static async verifyToken(req, res) {
    try {
      const user = req.user; // Set by auth middleware

      res.json({
        success: true,
        message: "Token is valid",
        data: user,
      });
    } catch (error) {
      console.error("Verify token error:", error);
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }
}
