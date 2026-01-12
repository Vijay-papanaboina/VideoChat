// Invitation Handlers
import { roomService } from "../../src/services/roomService.js";
import { getUserSocket } from "../userSocketMap.js";

/**
 * Register invitation handlers
 * @param {Socket} socket - The socket instance
 * @param {Server} io - The Socket.IO server
 * @param {object} rooms - The rooms object
 */
export const registerInvitationHandlers = (socket, io, rooms) => {
  // Send room invitation
  socket.on("send-room-invitation", async (data) => {
    const { roomId, invitedUserId, invitedBy, message, expiresAt } = data;

    try {
      // Verify user has permission to invite (is room creator or admin)
      const userRooms = await roomService.getUserPermanentRooms(invitedBy);
      const userRoom = userRooms.find((room) => room.roomId === roomId);

      if (!userRoom) {
        socket.emit("error", {
          message: "You don't have permission to invite users to this room",
        });
        return;
      }

      // Check if user is creator or admin
      const isCreator = userRoom.createdBy === invitedBy;
      const isAdmin = userRoom.isAdmin;

      if (!isCreator && !isAdmin) {
        socket.emit("error", {
          message: "Only room creators and admins can send invitations",
        });
        return;
      }

      // Send the invitation
      const invitation = await roomService.sendRoomInvitation(
        roomId,
        invitedUserId,
        invitedBy,
        message,
        expiresAt
      );

      // Notify the invited user if they're online (NOW WORKS!)
      const invitedUserSocket = getUserSocket(io, invitedUserId);
      if (invitedUserSocket) {
        invitedUserSocket.emit("room-invitation-received", {
          invitation,
          roomId,
          inviterUsername: userRoom.username,
        });
        console.log(`📨 Real-time notification sent to user ${invitedUserId}`);
      } else {
        console.log(
          `📭 User ${invitedUserId} is offline, will see invitation on next login`
        );
      }

      socket.emit("room-invitation-sent", {
        message: "Invitation sent successfully",
        invitation,
      });

      console.log(
        `📧 Room invitation sent: ${roomId} -> user ${invitedUserId} by ${invitedBy}`
      );
    } catch (error) {
      // Handle specific error types gracefully
      if (error.code === "USER_ALREADY_MEMBER") {
        console.log(
          `ℹ️  Invitation skipped: User ${invitedUserId} is already a member of room ${roomId}`
        );
        socket.emit("error", {
          message: "This user is already a member of this room",
          code: "USER_ALREADY_MEMBER",
        });
      } else if (error.code === "INVITATION_ALREADY_EXISTS") {
        console.log(
          `ℹ️  Invitation skipped: User ${invitedUserId} already has a pending invitation for room ${roomId}`
        );
        socket.emit("error", {
          message: "This user already has a pending invitation for this room",
          code: "INVITATION_ALREADY_EXISTS",
        });
      } else {
        console.error("❌ Failed to send room invitation:", error.message);
        socket.emit("error", {
          message: "Failed to send invitation. Please try again.",
          code: "INTERNAL_ERROR",
        });
      }
    }
  });

  // Accept room invitation
  socket.on("accept-room-invitation", async (data) => {
    const { invitationId, userId } = data;

    try {
      const invitation = await roomService.acceptRoomInvitation(
        invitationId,
        userId
      );

      // Notify the inviter if they're online (NOW WORKS!)
      const inviterSocket = getUserSocket(io, invitation.invitedBy);
      if (inviterSocket) {
        inviterSocket.emit("room-invitation-accepted", {
          invitation,
          roomId: invitation.roomId,
        });
        console.log(
          `📨 Notified inviter ${invitation.invitedBy} of acceptance`
        );
      }

      socket.emit("room-invitation-accepted", {
        message: "Invitation accepted successfully",
        invitation,
        roomId: invitation.roomId,
      });

      console.log(
        `✅ Room invitation accepted: ${invitationId} by user ${userId}`
      );
    } catch (error) {
      console.error("Failed to accept room invitation:", error);
      socket.emit("error", {
        message: error.message || "Failed to accept invitation",
      });
    }
  });

  // Decline room invitation
  socket.on("decline-room-invitation", async (data) => {
    const { invitationId, userId } = data;

    try {
      const invitation = await roomService.declineRoomInvitation(
        invitationId,
        userId
      );

      // Notify the inviter if they're online (NOW WORKS!)
      const inviterSocket = getUserSocket(io, invitation.invitedBy);
      if (inviterSocket) {
        inviterSocket.emit("room-invitation-declined", {
          invitation,
          roomId: invitation.roomId,
        });
        console.log(`📨 Notified inviter ${invitation.invitedBy} of decline`);
      }

      socket.emit("room-invitation-declined", {
        message: "Invitation declined",
        invitation,
      });

      console.log(
        `❌ Room invitation declined: ${invitationId} by user ${userId}`
      );
    } catch (error) {
      console.error("Failed to decline room invitation:", error);
      socket.emit("error", {
        message: error.message || "Failed to decline invitation",
      });
    }
  });

  // Get user's pending invitations
  socket.on("get-user-invitations", async (data) => {
    const { userId } = data;

    try {
      const invitations = await roomService.getUserPendingInvitations(userId);
      socket.emit("user-invitations", invitations);
    } catch (error) {
      console.error("Failed to get user invitations:", error);
      socket.emit("error", {
        message: "Failed to get invitations",
      });
    }
  });

  // Get room invitations (for room admins)
  socket.on("get-room-invitations", async (data) => {
    const { roomId, userId } = data;

    try {
      // Verify user has permission to view invitations
      const userRooms = await roomService.getUserPermanentRooms(userId);
      const userRoom = userRooms.find((room) => room.roomId === roomId);

      if (!userRoom) {
        socket.emit("error", {
          message:
            "You don't have permission to view invitations for this room",
        });
        return;
      }

      const invitations = await roomService.getRoomInvitations(roomId);
      socket.emit("room-invitations", invitations);
    } catch (error) {
      console.error("Failed to get room invitations:", error);
      socket.emit("error", {
        message: "Failed to get room invitations",
      });
    }
  });

  // Cancel room invitation
  socket.on("cancel-room-invitation", async (data) => {
    const { invitationId, cancelledBy, roomId } = data;

    try {
      // Verify user has permission to cancel invitations
      const userRooms = await roomService.getUserPermanentRooms(cancelledBy);
      const userRoom = userRooms.find((room) => room.roomId === roomId);

      if (!userRoom) {
        socket.emit("error", {
          message:
            "You don't have permission to cancel invitations for this room",
        });
        return;
      }

      const invitation = await roomService.cancelRoomInvitation(
        invitationId,
        cancelledBy
      );

      // Notify the invited user if they're online (NOW WORKS!)
      const invitedUserSocket = getUserSocket(io, invitation.invitedUserId);
      if (invitedUserSocket) {
        invitedUserSocket.emit("room-invitation-cancelled", {
          invitation,
          roomId,
        });
        console.log(
          `📨 Notified user ${invitation.invitedUserId} of cancellation`
        );
      }

      socket.emit("room-invitation-cancelled", {
        message: "Invitation cancelled successfully",
        invitation,
      });

      console.log(
        `🚫 Room invitation cancelled: ${invitationId} by user ${cancelledBy}`
      );
    } catch (error) {
      console.error("Failed to cancel room invitation:", error);
      socket.emit("error", {
        message: error.message || "Failed to cancel invitation",
      });
    }
  });
};
