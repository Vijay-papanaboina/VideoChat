// Chat Handlers
import { chatService } from "../../src/services/chatService.js";
import { roomService } from "../../src/services/roomService.js";

/**
 * Register chat message handlers
 * @param {Socket} socket - The socket instance
 * @param {object} rooms - The rooms object
 */
export const registerChatHandlers = (socket, rooms) => {
  socket.on("chat-message", async (data) => {
    console.log(
      `💬 Chat message from ${data.username} in room ${data.roomId}: ${data.message}`
    );

    // Debug: Check if room exists and has users
    if (rooms[data.roomId]) {
      const userCount = Object.keys(rooms[data.roomId].users).length;
      console.log(
        `📊 Room ${data.roomId} has ${userCount} users:`,
        Object.keys(rooms[data.roomId].users)
      );
    } else {
      console.log(`❌ Room ${data.roomId} does not exist!`);
    }

    // Determine room type and save message to appropriate database table
    const room = rooms[data.roomId];
    const roomType = room?.isPermanent ? "permanent" : "temporary";

    try {
      if (roomType === "permanent") {
        await chatService.sendPermanentMessage({
          roomId: data.roomId,
          userId: data.userId || null,
          username: data.username,
          message: data.message,
          messageType: data.type || "text",
        });
      } else {
        await chatService.sendTemporaryMessage({
          roomId: data.roomId,
          userId: data.userId || null,
          username: data.username,
          message: data.message,
          messageType: data.type || "text",
        });
      }
      console.log(`💾 Message saved to ${roomType} database`);

      // Update message count in room session
      try {
        if (roomType === "permanent") {
          await roomService.updatePermanentChatSession(data.roomId, {
            lastMessageAt: new Date(),
            messageCount: { increment: 1 },
          });
        } else {
          await roomService.updateTemporaryChatSession(data.roomId, {
            lastMessageAt: new Date(),
            messageCount: { increment: 1 },
          });
        }
      } catch (error) {
        console.error(`❌ Failed to update message count:`, error);
      }
    } catch (error) {
      console.error(`❌ Failed to save message to database:`, error);
    }

    // Broadcast message to all users in the room except sender
    socket.to(data.roomId).emit("chat-message", data);
    console.log(`📤 Broadcasted message to room ${data.roomId}`);

    // Send confirmation back to sender
    socket.emit("chat-message-sent", data);
    console.log(`✅ Sent confirmation to sender ${data.username}`);
  });

  socket.on("typing", (data) => {
    socket.to(data.roomId).emit("user-typing", {
      username: data.username,
      roomId: data.roomId,
    });
  });

  socket.on("stop-typing", (data) => {
    socket.to(data.roomId).emit("user-stopped-typing", {
      username: data.username,
      roomId: data.roomId,
    });
  });
};
