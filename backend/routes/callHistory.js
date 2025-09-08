import express from "express";
import CallHistory from "../src/models/CallHistory.js";
import { authenticateToken } from "./auth.js";

const router = express.Router();

// Get user's call history
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.user.id;

    const callHistory = await CallHistory.getUserCallHistory(
      userId,
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      success: true,
      data: callHistory,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: callHistory.length === parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get call history error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch call history",
    });
  }
});

// Get call statistics
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const userId = req.user.id;

    const stats = await CallHistory.getUserCallStats(userId, parseInt(days));

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get call stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch call statistics",
    });
  }
});

// Get recent rooms
router.get("/recent-rooms", authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user.id;

    const recentRooms = await CallHistory.getRecentRooms(userId, parseInt(limit));

    res.json({
      success: true,
      data: recentRooms,
    });
  } catch (error) {
    console.error("Get recent rooms error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch recent rooms",
    });
  }
});

// Get call analytics for dashboard
router.get("/analytics", authenticateToken, async (req, res) => {
  try {
    const { period = "week" } = req.query;
    const userId = req.user.id;

    const analytics = await CallHistory.getCallAnalytics(userId, period);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Get call analytics error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch call analytics",
    });
  }
});

// Start a call session
router.post("/start", authenticateToken, async (req, res) => {
  try {
    const { roomId, username, participantsCount = 1 } = req.body;
    const userId = req.user.id;

    if (!roomId || !username) {
      return res.status(400).json({
        success: false,
        error: "Room ID and username are required",
      });
    }

    const callSession = await CallHistory.startCall(
      userId,
      roomId,
      username,
      participantsCount
    );

    res.json({
      success: true,
      data: callSession,
    });
  } catch (error) {
    console.error("Start call error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start call session",
    });
  }
});

// End a call session
router.post("/end", authenticateToken, async (req, res) => {
  try {
    const { roomId, duration = 0, callQuality = 0 } = req.body;
    const userId = req.user.id;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        error: "Room ID is required",
      });
    }

    const callSession = await CallHistory.endCall(userId, roomId, duration, callQuality);

    res.json({
      success: true,
      data: callSession,
    });
  } catch (error) {
    console.error("End call error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to end call session",
    });
  }
});

// Add room to favorites
router.post("/favorites", authenticateToken, async (req, res) => {
  try {
    const { roomId, roomName } = req.body;
    const userId = req.user.id;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        error: "Room ID is required",
      });
    }

    const favorite = await CallHistory.addToFavorites(userId, roomId, roomName);

    res.json({
      success: true,
      data: favorite,
    });
  } catch (error) {
    console.error("Add to favorites error:", error);
    if (error.message === "Room already in favorites") {
      return res.status(409).json({
        success: false,
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to add room to favorites",
    });
  }
});

// Remove room from favorites
router.delete("/favorites/:roomId", authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    await CallHistory.removeFromFavorites(userId, roomId);

    res.json({
      success: true,
      message: "Room removed from favorites",
    });
  } catch (error) {
    console.error("Remove from favorites error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove room from favorites",
    });
  }
});

// Get favorite rooms
router.get("/favorites", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const favorites = await CallHistory.getFavoriteRooms(userId);

    res.json({
      success: true,
      data: favorites,
    });
  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch favorite rooms",
    });
  }
});

export default router;
