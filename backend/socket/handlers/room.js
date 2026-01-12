// Room Handlers
import { roomService } from "../../src/services/roomService.js";
import { db } from "../../src/db.js";
import { users } from "../../src/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import {
  registerUserSocket,
  unregisterSocketById,
  getUserSocket,
} from "../userSocketMap.js";

// In-memory data stores for rooms
// rooms structure: { roomId: { password, users, screenSharing, isActive, createdBy, createdAt, admins, isPermanent, isInviteOnly } }
export const rooms = {};
export const MAX_USERS_PER_ROOM = 100;

/**
 * Register room handlers
 * @param {Socket} socket - The socket instance
 * @param {Server} io - The Socket.IO server
 */
export const registerRoomHandlers = (socket, io) => {
  // Event listener for a user joining a room
  socket.on("join-room", async (data) => {
    const {
      roomId,
      password,
      username,
      userId = null,
      isCreating = false,
    } = data;

    // --- Room Validation ---
    if (!rooms[roomId]) {
      const isPermanentRoom = !isCreating && userId !== null;

      if (isPermanentRoom) {
        const permanentRoomExists = await roomService.checkPermanentRoomExists(
          roomId
        );
        if (!permanentRoomExists) {
          socket.emit("join-error", {
            message: "Permanent room does not exist. Please create it first.",
          });
          return;
        }
      } else {
        try {
          await roomService.createTemporaryRoom(roomId, password, username);
        } catch (error) {
          console.error(`❌ Failed to create temporary room in DB:`, error);
        }
      }

      // Create room in memory
      // Hash password if provided for security
      const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

      rooms[roomId] = {
        password: hashedPassword,
        users: {},
        screenSharing: {},
        isActive: true,
        createdBy: userId,
        createdAt: new Date(),
        admins: userId ? [userId] : [],
        isPermanent: isPermanentRoom,
        isInviteOnly: isPermanentRoom,
      };
      console.log(
        `🚪 ${
          isPermanentRoom ? "Permanent" : "Temporary"
        } room created: ${roomId} by user: ${userId || "anonymous"}`
      );

      // Create chat session in database
      try {
        if (isPermanentRoom) {
          await roomService.createPermanentChatSession(roomId);
        } else {
          await roomService.createTemporaryChatSession(roomId);
        }
      } catch (error) {
        console.error(`❌ Failed to create chat session in DB:`, error);
      }
    } else {
      const existingRoom = rooms[roomId];
      // Reactivate permanent rooms when users rejoin
      if (existingRoom.isPermanent && !existingRoom.isActive) {
        existingRoom.isActive = true;
        console.log(`♻️ Permanent room ${roomId} reactivated`);

        // Re-create chat session when room becomes active again
        try {
          await roomService.createPermanentChatSession(roomId);
        } catch (error) {
          console.error(`❌ Failed to recreate chat session:`, error);
        }
      }
    }

    // Check room access permissions
    if (rooms[roomId].isInviteOnly) {
      // Check if user is a member of this permanent room
      const isMember = await roomService.isPermanentRoomMember(roomId, userId);
      if (!isMember) {
        socket.emit("join-error", {
          message: "This room is invite-only. You need an invitation to join.",
        });
        console.log(
          `🚫 Access denied to invite-only room ${roomId} - user ${userId} is not a member`
        );
        return;
      }
    } else {
      const roomPassword = rooms[roomId].password;
      const userPassword = password;

      const roomHasPassword = roomPassword !== null;
      const userProvidedPassword = !!(
        userPassword && userPassword.trim() !== ""
      );

      // Check if password requirements match
      if (roomHasPassword !== userProvidedPassword) {
        socket.emit("join-error", { message: "Invalid room password." });
        console.log(
          `🚫 Password mismatch for room ${roomId} from ${socket.id}`
        );
        return;
      }

      // Verify password with bcrypt if room has one
      if (roomHasPassword) {
        const passwordValid = await bcrypt.compare(userPassword, roomPassword);
        if (!passwordValid) {
          socket.emit("join-error", { message: "Invalid room password." });
          console.log(
            `🚫 Invalid password for room ${roomId} from ${socket.id}`
          );
          return;
        }
      }
    }

    // Check if the room is already full
    const userCount = Object.keys(rooms[roomId].users).length;
    console.log(
      `📊 Room ${roomId} currently has ${userCount} users, max allowed: ${MAX_USERS_PER_ROOM}`
    );

    if (userCount >= MAX_USERS_PER_ROOM) {
      socket.emit("room-full");
      console.log(
        `🈵 Room ${roomId} is full (${userCount}/${MAX_USERS_PER_ROOM} users). Connection rejected for ${socket.id}`
      );
      return;
    }

    // --- Join Logic ---
    if (rooms[roomId].isActive === false) {
      rooms[roomId].isActive = true;
      console.log(`🔄 Reactivating room ${roomId} - user rejoining`);
    }

    // Register user socket mapping for real-time notifications
    if (userId) {
      registerUserSocket(userId, socket.id);
    }

    const isAdmin = rooms[roomId].admins.includes(userId);
    rooms[roomId].users[socket.id] = {
      username,
      userId,
      joinedAt: new Date(),
      isAdmin: isAdmin,
      socketId: socket.id,
    };
    socket.join(roomId);
    console.log(
      `👤 User ${username} (${socket.id}) joined room: ${roomId} as ${
        isAdmin ? "admin" : "member"
      }`
    );

    // Safety check: ensure room still exists
    if (!rooms[roomId] || !rooms[roomId].users) {
      console.log(
        `⚠️ Room ${roomId} no longer exists, user ${username} cannot join`
      );
      socket.emit("join-error", { message: "Room no longer exists." });
      return;
    }

    const otherUsers = Object.keys(rooms[roomId].users)
      .filter((id) => id !== socket.id)
      .map((id) => ({
        socketId: id,
        username: rooms[roomId].users[id].username,
        isAdmin: rooms[roomId].users[id].isAdmin,
        userId: rooms[roomId].users[id].userId,
      }));

    socket.emit("all-users", otherUsers);

    if (
      rooms[roomId].screenSharing &&
      Object.keys(rooms[roomId].screenSharing).length > 0
    ) {
      console.log(
        "📤 Sending screen sharing state to new user:",
        rooms[roomId].screenSharing
      );
      socket.emit("initial-screen-sharing-state", rooms[roomId].screenSharing);
    }

    socket.to(roomId).emit("user-joined", {
      socketId: socket.id,
      username,
      isAdmin: isAdmin,
      userId: userId,
    });
  });

  // Handle user disconnection
  socket.on("disconnect", async () => {
    console.log(`👤 User disconnected: ${socket.id}`);

    // Unregister from user socket map
    unregisterSocketById(socket.id);

    let userRoomId = null;

    for (const roomId in rooms) {
      if (rooms[roomId].users[socket.id]) {
        userRoomId = roomId;

        const leavingUsername = rooms[roomId].users[socket.id]?.username;

        if (
          rooms[roomId].screenSharing &&
          leavingUsername &&
          rooms[roomId].screenSharing[leavingUsername]
        ) {
          delete rooms[roomId].screenSharing[leavingUsername];
          console.log(
            `🧹 Cleaned up screen sharing state for ${leavingUsername}`
          );
        }

        delete rooms[roomId].users[socket.id];

        if (Object.keys(rooms[roomId].users).length === 0) {
          console.log(`📝 Room ${roomId} is now empty`);

          if (rooms[roomId].isPermanent) {
            rooms[roomId].isActive = false;
            console.log(`💤 Permanent room ${roomId} marked as inactive`);

            try {
              await roomService.endPermanentChatSession(roomId);
            } catch (error) {
              console.error(
                `❌ Failed to end permanent chat session in DB:`,
                error
              );
            }
          } else {
            console.log(`🗑️ Temporary room ${roomId} being destroyed`);

            try {
              await roomService.deleteTemporaryRoom(roomId);
            } catch (error) {
              console.error(
                `❌ Failed to delete temporary room from DB:`,
                error
              );
            }

            delete rooms[roomId];
            console.log(
              `🗑️ Temporary room ${roomId} completely destroyed and available for reuse`
            );
          }
        }
        break;
      }
    }

    if (userRoomId) {
      socket.to(userRoomId).emit("user-left", socket.id);
    }
  });

  // Create permanent room (for logged-in users)
  socket.on("create-permanent-room", async (data) => {
    const { roomId, username, userId } = data;

    if (!userId) {
      socket.emit("error", {
        message: "Must be logged in to create permanent rooms",
      });
      return;
    }

    if (rooms[roomId]) {
      socket.emit("error", { message: "Room already exists in memory" });
      return;
    }

    try {
      await roomService.createPermanentRoom(roomId, userId);

      // Add creator as a member with admin rights
      await roomService.addPermanentRoomMember(
        roomId,
        userId,
        userId, // addedBy = self
        true // isAdmin = true
      );

      rooms[roomId] = {
        password: null,
        users: {},
        screenSharing: {},
        isActive: true,
        createdBy: userId,
        createdAt: new Date(),
        admins: [userId],
        isPermanent: true,
        isInviteOnly: true,
      };

      console.log(
        `🏠 Permanent room created: ${roomId} by user: ${username} (${userId})`
      );

      socket.emit("permanent-room-created", {
        roomId,
        message: "Permanent room created successfully",
      });
    } catch (error) {
      console.error("Failed to create permanent room:", error);
      socket.emit("error", {
        message: "Failed to create permanent room. Please try again.",
      });
    }
  });

  // Get user's rooms
  socket.on("get-user-rooms", async (data) => {
    const { userId } = data;

    if (!userId) {
      socket.emit("error", { message: "User ID required" });
      return;
    }

    try {
      const [createdRooms, memberRooms] = await Promise.all([
        roomService.getUserPermanentRooms(userId),
        roomService.getUserPermanentRoomMemberships(userId),
      ]);

      const activeRooms = [];
      for (const roomId in rooms) {
        const room = rooms[roomId];
        const userInRoom = Object.values(room.users).find(
          (user) => user.userId === userId
        );

        if (userInRoom) {
          activeRooms.push({
            roomId,
            isAdmin: userInRoom.isAdmin,
            memberCount: Object.keys(room.users).length,
            createdAt: room.createdAt,
            isActive: room.isActive,
            isCurrentlyActive: true,
          });
        }
      }

      const allUserRooms = [
        ...createdRooms.map((room) => ({
          roomId: room.roomId,
          isAdmin: true,
          memberCount: 0,
          createdAt: room.createdAt,
          isActive: room.isActive,
          isCurrentlyActive: false,
          roomType: "created",
        })),
        ...memberRooms.map((membership) => ({
          roomId: membership.roomId,
          isAdmin: membership.isAdmin,
          memberCount: 0,
          createdAt: membership.roomCreatedAt,
          isActive: membership.roomIsActive,
          isCurrentlyActive: false,
          roomType: "member",
        })),
        ...activeRooms.filter(
          (activeRoom) =>
            !createdRooms.some((room) => room.roomId === activeRoom.roomId) &&
            !memberRooms.some(
              (membership) => membership.roomId === activeRoom.roomId
            )
        ),
      ];

      socket.emit("user-rooms", allUserRooms);
    } catch (error) {
      console.error("Failed to get user rooms:", error);
      socket.emit("error", { message: "Failed to fetch user rooms" });
    }
  });

  // Get room information (for admins)
  socket.on("get-room-info", async (data) => {
    const { roomId, userId } = data;

    const permanentRoomExists = await roomService.checkPermanentRoomExists(
      roomId
    );

    if (permanentRoomExists) {
      try {
        const userRooms = await roomService.getUserPermanentRooms(userId);
        const isCreator = userRooms.some((room) => room.roomId === roomId);

        if (!isCreator) {
          socket.emit("error", {
            message: "Insufficient permissions - not the room creator",
          });
          return;
        }
      } catch (error) {
        console.error("Failed to check permanent room permissions:", error);
        socket.emit("error", { message: "Failed to verify permissions" });
        return;
      }
    } else {
      const userRoom = rooms[roomId];
      if (!userRoom) {
        socket.emit("error", { message: "Room not found" });
        return;
      }

      const currentUser = userRoom.users[socket.id];
      if (!currentUser || !currentUser.isAdmin) {
        socket.emit("error", { message: "Insufficient permissions" });
        return;
      }
    }

    let roomMembers = [];
    let createdByUsername = null;
    let roomData = null;

    if (permanentRoomExists) {
      try {
        const userRooms = await roomService.getUserPermanentRooms(userId);
        roomData = userRooms.find((room) => room.roomId === roomId);

        roomMembers = await roomService.getPermanentRoomMembers(roomId);

        if (roomData && roomData.createdBy) {
          const creatorInfo = await db
            .select({ username: users.username })
            .from(users)
            .where(eq(users.id, roomData.createdBy))
            .limit(1);

          if (creatorInfo.length > 0) {
            createdByUsername = creatorInfo[0].username;
          }
        }
      } catch (error) {
        console.error("Failed to get room members:", error);
      }
    } else {
      roomData = rooms[roomId];
    }

    const roomInfo = {
      roomId,
      createdBy: roomData?.createdBy,
      createdByUsername,
      createdAt: roomData?.createdAt,
      admins: roomData?.admins || [roomData?.createdBy].filter(Boolean),
      isPermanent: permanentRoomExists,
      isInviteOnly: roomData?.isInviteOnly || false,
      userCount: permanentRoomExists
        ? 0
        : Object.keys(roomData?.users || {}).length,
      users: permanentRoomExists
        ? []
        : Object.values(roomData?.users || {}).map((user) => ({
            username: user.username,
            userId: user.userId,
            isAdmin: user.isAdmin,
            joinedAt: user.joinedAt,
          })),
      members: roomMembers,
    };

    socket.emit("room-info", roomInfo);
  });

  // Add member to permanent room
  socket.on("add-room-member", async (data) => {
    const { roomId, targetUserId, addedBy, isAdmin = false } = data;

    try {
      const userRooms = await roomService.getUserPermanentRooms(addedBy);
      const isCreator = userRooms.some((room) => room.roomId === roomId);

      if (!isCreator) {
        socket.emit("error", {
          message: "Insufficient permissions to add members",
        });
        return;
      }

      await roomService.addPermanentRoomMember(
        roomId,
        targetUserId,
        addedBy,
        isAdmin
      );

      const roomMembers = await roomService.getPermanentRoomMembers(roomId);

      socket.emit("member-added", {
        roomId,
        message: "Member added successfully",
        members: roomMembers,
      });

      console.log(
        `👥 Member ${targetUserId} added to room ${roomId} by ${addedBy}`
      );
    } catch (error) {
      console.error("Failed to add room member:", error);
      socket.emit("error", {
        message: error.message || "Failed to add member",
      });
    }
  });

  // Remove member from permanent room
  socket.on("remove-room-member", async (data) => {
    const { roomId, targetUserId, removedBy } = data;

    try {
      const userRooms = await roomService.getUserPermanentRooms(removedBy);
      const isCreator = userRooms.some((room) => room.roomId === roomId);

      if (!isCreator) {
        socket.emit("error", {
          message: "Insufficient permissions to remove members",
        });
        return;
      }

      if (targetUserId === removedBy) {
        socket.emit("error", { message: "Cannot remove the room creator" });
        return;
      }

      await roomService.removePermanentRoomMember(roomId, targetUserId);

      const roomMembers = await roomService.getPermanentRoomMembers(roomId);

      socket.emit("member-removed", {
        roomId,
        message: "Member removed successfully",
        members: roomMembers,
      });

      console.log(
        `👥 Member ${targetUserId} removed from room ${roomId} by ${removedBy}`
      );
    } catch (error) {
      console.error("Failed to remove room member:", error);
      socket.emit("error", {
        message: error.message || "Failed to remove member",
      });
    }
  });

  // Update member admin status
  socket.on("update-member-admin", async (data) => {
    const { roomId, targetUserId, isAdmin, updatedBy } = data;

    try {
      const userRooms = await roomService.getUserPermanentRooms(updatedBy);
      const isCreator = userRooms.some((room) => room.roomId === roomId);

      if (!isCreator) {
        socket.emit("error", {
          message: "Insufficient permissions to update admin status",
        });
        return;
      }

      if (targetUserId === updatedBy) {
        socket.emit("error", {
          message: "Cannot change your own admin status",
        });
        return;
      }

      await roomService.updatePermanentRoomMemberAdmin(
        roomId,
        targetUserId,
        isAdmin
      );

      const roomMembers = await roomService.getPermanentRoomMembers(roomId);

      socket.emit("member-admin-updated", {
        roomId,
        message: `Member admin status updated to ${isAdmin}`,
        members: roomMembers,
      });

      console.log(
        `👥 Member ${targetUserId} admin status updated to ${isAdmin} in room ${roomId} by ${updatedBy}`
      );
    } catch (error) {
      console.error("Failed to update member admin status:", error);
      socket.emit("error", {
        message: error.message || "Failed to update admin status",
      });
    }
  });

  // Delete permanent room
  socket.on("delete-permanent-room", async (data) => {
    const { roomId, userId } = data;

    try {
      const userRooms = await roomService.getUserPermanentRooms(userId);
      const userRoom = userRooms.find((room) => room.roomId === roomId);

      if (!userRoom || userRoom.createdBy !== userId) {
        socket.emit("error", {
          message: "Only room creators can delete rooms",
        });
        return;
      }

      await roomService.deletePermanentRoom(roomId);

      if (rooms[roomId]) {
        delete rooms[roomId];
      }

      io.to(roomId).emit("room-deleted", { roomId });

      const roomSockets = await io.in(roomId).fetchSockets();
      roomSockets.forEach((roomSocket) => {
        roomSocket.leave(roomId);
      });

      console.log(
        `🗑️ Permanent room deleted: ${roomId} by user ${userId} (CASCADE deletion handled)`
      );
      socket.emit("room-deleted", { roomId });
    } catch (error) {
      console.error("Failed to delete permanent room:", error);
      socket.emit("error", { message: "Failed to delete room" });
    }
  });

  // User leaves a room voluntarily
  socket.on("leave-room", async (data) => {
    const { roomId, userId } = data;

    try {
      const isMember = await roomService.isPermanentRoomMember(roomId, userId);
      if (!isMember) {
        socket.emit("error", {
          message: "You are not a member of this room",
          code: "NOT_MEMBER",
        });
        return;
      }

      const userRooms = await roomService.getUserPermanentRooms(userId);
      const isCreator = userRooms.some((room) => room.roomId === roomId);

      if (isCreator) {
        socket.emit("error", {
          message:
            "Room creators cannot leave their own room. You must delete the room instead.",
          code: "CREATOR_CANNOT_LEAVE",
        });
        return;
      }

      await roomService.removePermanentRoomMember(roomId, userId);

      if (rooms[roomId]) {
        const room = rooms[roomId];
        const userInRoom = Object.values(room.users).find(
          (user) => user.userId === userId
        );

        if (userInRoom) {
          delete room.users[userInRoom.socketId];

          // Notify remaining room members using working getUserSocket
          Object.values(room.users).forEach((member) => {
            const memberSocket = getUserSocket(io, member.userId);
            if (memberSocket) {
              memberSocket.emit("user-left-room", {
                roomId,
                userId,
                username: userInRoom.username,
                remainingUsers: Object.keys(room.users).length,
              });
            }
          });
        }
      }

      socket.emit("room-left", {
        message: "Successfully left the room",
        roomId,
      });

      console.log(`👥 User ${userId} left permanent room ${roomId}`);
    } catch (error) {
      console.error("Failed to leave room:", error);
      socket.emit("error", {
        message: "Failed to leave room. Please try again.",
        code: "LEAVE_FAILED",
      });
    }
  });
};
