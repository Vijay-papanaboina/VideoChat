// Screen Share Handlers

/**
 * Register screen sharing handlers
 * @param {Socket} socket - The socket instance
 * @param {object} rooms - The rooms object
 */
export const registerScreenShareHandlers = (socket, rooms) => {
  socket.on("screen-share-started", (data) => {
    console.log(
      `📺 ${data.username} started screen sharing in room ${data.roomId}`
    );

    // Update room's screen sharing state
    if (rooms[data.roomId]) {
      rooms[data.roomId].screenSharing[data.username] = { isSharing: true };
    }

    console.log(
      "📤 Broadcasting user-screen-sharing event to room:",
      data.roomId
    );
    socket.to(data.roomId).emit("user-screen-sharing", {
      username: data.username,
      isSharing: true,
    });
  });

  socket.on("screen-share-stopped", (data) => {
    console.log(
      `📺 ${data.username} stopped screen sharing in room ${data.roomId}`
    );

    // Update room's screen sharing state
    if (rooms[data.roomId]) {
      rooms[data.roomId].screenSharing[data.username] = { isSharing: false };
    }

    console.log(
      "📤 Broadcasting user-screen-sharing event to room:",
      data.roomId
    );
    socket.to(data.roomId).emit("user-screen-sharing", {
      username: data.username,
      isSharing: false,
    });
  });
};
