import { Router } from "express";
import { authenticateToken } from "../src/middleware/auth.js";
import * as roomService from "../src/services/roomService.js";

const router = Router();

/**
 * GET /api/rooms/my-rooms
 * Get all rooms the authenticated user is a member of
 */
router.get("/my-rooms", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const rooms = await roomService.getUserPermanentRoomMemberships(userId);

    res.json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    console.error("Error fetching user rooms:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rooms",
    });
  }
});

/**
 * GET /api/rooms/:roomId/members
 * Get all members of a specific room (must be a member to view)
 */
router.get("/:roomId/members", authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Check if user is a member of the room
    const isMember = await roomService.isPermanentRoomMember(roomId, userId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this room",
      });
    }

    const members = await roomService.getPermanentRoomMembers(roomId);

    res.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error("Error fetching room members:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch room members",
    });
  }
});

/**
 * DELETE /api/rooms/:roomId/leave
 * Leave a room (cannot leave if you're the creator)
 */
router.delete("/:roomId/leave", authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Check if user is a member
    const isMember = await roomService.isPermanentRoomMember(roomId, userId);
    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: "You are not a member of this room",
      });
    }

    // Check if user is the creator (creators cannot leave, must delete)
    const room = await roomService.checkPermanentRoomExists(roomId);
    if (room && room.createdBy === userId) {
      return res.status(400).json({
        success: false,
        message: "Room creators cannot leave. Delete the room instead.",
      });
    }

    await roomService.removePermanentRoomMember(roomId, userId);

    res.json({
      success: true,
      message: "Successfully left the room",
    });
  } catch (error) {
    console.error("Error leaving room:", error);
    res.status(500).json({
      success: false,
      message: "Failed to leave room",
    });
  }
});

/**
 * DELETE /api/rooms/:roomId
 * Delete a room (only creator can delete)
 */
router.delete("/:roomId", authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Check if room exists and user is creator
    const room = await roomService.checkPermanentRoomExists(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    if (room.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the room creator can delete this room",
      });
    }

    await roomService.deletePermanentRoom(roomId);

    res.json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete room",
    });
  }
});

export default router;
