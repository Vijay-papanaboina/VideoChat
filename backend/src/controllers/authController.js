import { authService } from "../services/authService.js";

// Register a new user
export const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, avatar, bio } =
      req.body;

    const result = await authService.register({
      username,
      email,
      password,
      firstName,
      lastName,
      avatar,
      bio,
    });

    // Registration no longer returns token - user must login
    // Cookie is not set here anymore

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: result.user,
        // Don't send token in response body for security
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await authService.login(email, password);

    // Set HTTP-only cookie with token
    // Use sameSite: 'none' for cross-origin requests (frontend/backend on different domains)
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("authToken", result.token, {
      httpOnly: true,
      secure: isProduction, // Required for sameSite: 'none'
      sameSite: isProduction ? "none" : "lax", // 'none' for cross-origin in prod
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: result.user,
        // Don't send token in response body for security
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

// Logout user
export const logout = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
      });
    }

    // Clear the HTTP-only cookie
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

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
};

// Get user profile
export const getProfile = async (req, res) => {
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
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    const updatedUser = await authService.updateProfile(userId, updateData);

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
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    await authService.changePassword(userId, currentPassword, newPassword);

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
};

// Delete account
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required to delete account",
      });
    }

    await authService.deleteAccount(userId, password);

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
};

// Verify token
export const verifyToken = async (req, res) => {
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
};

// Search users
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters long",
      });
    }

    const { roomId } = req.query;
    const users = await authService.searchUsers(q, 10, req.user.id, roomId);

    res.json(users);
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search users",
    });
  }
};

// Verify email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    const result = await authService.verifyEmail(token);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Resend verification email
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const result = await authService.resendVerificationEmail(email);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const result = await authService.forgotPassword(email);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process request",
    });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    const result = await authService.resetPassword(token, password);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
