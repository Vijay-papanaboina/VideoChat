// Member Admin Handlers (kick, promote, demote)
import { roomService } from "../../src/services/roomService.js";

/**
 * Register member administration handlers
 * @param {Socket} socket - The socket instance
 * @param {Server} io - The Socket.IO server
 * @param {object} rooms - The rooms object
 */
export const registerMemberAdminHandlers = (socket, io, rooms) => {
  // Kick user from room
  socket.on("kick-user", (data) => {
    const { targetSocketId, roomId } = data;
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

    const targetUser = userRoom.users[targetSocketId];
    if (!targetUser) {
      socket.emit("error", { message: "User not found in room" });
      return;
    }

    // Don't allow kicking other admins
    if (targetUser.isAdmin) {
      socket.emit("error", { message: "Cannot kick other administrators" });
      return;
    }

    // Remove user from room
    delete userRoom.users[targetSocketId];

    // Notify the kicked user
    io.to(targetSocketId).emit("kicked-from-room", {
      message: "You have been removed from the room by an administrator",
    });

    // Notify other users in the room
    socket.to(roomId).emit("user-kicked", {
      socketId: targetSocketId,
      username: targetUser.username,
    });

    console.log(
      `👢 User ${targetUser.username} (${targetSocketId}) was kicked from room ${roomId} by ${currentUser.username}`
    );
  });

  // Promote user to admin
  socket.on("promote-user", async (data) => {
    const { targetSocketId, roomId } = data;
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

    const targetUser = userRoom.users[targetSocketId];
    if (!targetUser) {
      socket.emit("error", { message: "User not found in room" });
      return;
    }

    if (targetUser.isAdmin) {
      socket.emit("error", { message: "User is already an administrator" });
      return;
    }

    // Promote user to admin
    targetUser.isAdmin = true;
    if (targetUser.userId && !userRoom.admins.includes(targetUser.userId)) {
      userRoom.admins.push(targetUser.userId);
    }

    // Persist to database for permanent rooms
    if (userRoom.isPermanent && targetUser.userId) {
      try {
        await roomService.updatePermanentRoomMemberAdmin(
          roomId,
          targetUser.userId,
          true
        );
        console.log(`💾 Admin status persisted for user ${targetUser.userId}`);
      } catch (error) {
        console.error("Failed to persist admin status:", error);
      }
    }

    // Notify the promoted user
    io.to(targetSocketId).emit("promoted-to-admin", {
      message: "You have been promoted to administrator",
    });

    // Notify other users in the room
    socket.to(roomId).emit("user-promoted", {
      socketId: targetSocketId,
      username: targetUser.username,
    });

    console.log(
      `⬆️ User ${targetUser.username} (${targetSocketId}) was promoted to admin in room ${roomId} by ${currentUser.username}`
    );
  });

  // Demote admin to regular user
  socket.on("demote-user", async (data) => {
    const { targetSocketId, roomId } = data;
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

    const targetUser = userRoom.users[targetSocketId];
    if (!targetUser) {
      socket.emit("error", { message: "User not found in room" });
      return;
    }

    if (!targetUser.isAdmin) {
      socket.emit("error", { message: "User is not an administrator" });
      return;
    }

    // Don't allow demoting the room creator
    if (targetUser.userId === userRoom.createdBy) {
      socket.emit("error", { message: "Cannot demote the room creator" });
      return;
    }

    // Demote user from admin
    targetUser.isAdmin = false;
    if (targetUser.userId) {
      userRoom.admins = userRoom.admins.filter(
        (adminId) => adminId !== targetUser.userId
      );
    }

    // Persist to database for permanent rooms
    if (userRoom.isPermanent && targetUser.userId) {
      try {
        await roomService.updatePermanentRoomMemberAdmin(
          roomId,
          targetUser.userId,
          false
        );
        console.log(`💾 Admin status persisted for user ${targetUser.userId}`);
      } catch (error) {
        console.error("Failed to persist admin status:", error);
      }
    }

    // Notify the demoted user
    io.to(targetSocketId).emit("demoted-from-admin", {
      message: "You have been demoted from administrator",
    });

    // Notify other users in the room
    socket.to(roomId).emit("user-demoted", {
      socketId: targetSocketId,
      username: targetUser.username,
    });

    console.log(
      `⬇️ User ${targetUser.username} (${targetSocketId}) was demoted from admin in room ${roomId} by ${currentUser.username}`
    );
  });
};
