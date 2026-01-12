// WebRTC Signaling Handlers
// Handles offer, answer, and ICE candidate forwarding

/**
 * Register WebRTC signaling handlers
 * @param {Socket} socket - The socket instance
 * @param {Server} io - The Socket.IO server
 */
export const registerWebRTCHandlers = (socket, io) => {
  // Forward WebRTC signaling offers to the target user
  socket.on("offer", (payload) => {
    io.to(payload.target).emit("offer", payload);
  });

  // Forward WebRTC signaling answers to the target user
  socket.on("answer", (payload) => {
    io.to(payload.target).emit("answer", payload);
  });

  // Forward ICE candidates to the target user
  socket.on("ice-candidate", (payload) => {
    const payloadWithSender = {
      ...payload,
      sender: socket.id,
    };
    io.to(payload.target).emit("ice-candidate", payloadWithSender);
  });
};
