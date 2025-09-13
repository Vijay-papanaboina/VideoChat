import { useState, useEffect } from "react";
import {
  Users,
  Crown,
  UserMinus,
  UserPlus,
  Shield,
  Settings,
} from "lucide-react";

/**
 * RoomManagement Component
 * Provides admin controls for room management
 */
const RoomManagement = ({
  socketRef,
  roomId,
  currentUser,
  remoteStreamsArray,
  isAdmin,
  onClose,
}) => {
  const [roomInfo, setRoomInfo] = useState(null);
  const [showUserActions, setShowUserActions] = useState(null);

  // Request room information when component mounts
  useEffect(() => {
    if (isAdmin && socketRef.current) {
      socketRef.current.emit("get-room-info", {
        roomId,
        userId: currentUser?.userId,
      });
    }
  }, [isAdmin, roomId, socketRef, currentUser]);

  // Listen for room info response
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleRoomInfo = (data) => {
      setRoomInfo(data);
    };

    const handleError = (data) => {
      console.error("Room management error:", data.message);
    };

    socket.on("room-info", handleRoomInfo);
    socket.on("error", handleError);

    return () => {
      socket.off("room-info", handleRoomInfo);
      socket.off("error", handleError);
    };
  }, [socketRef]);

  const handleKickUser = (targetSocketId) => {
    if (socketRef.current) {
      socketRef.current.emit("kick-user", { targetSocketId, roomId });
      setShowUserActions(null);
    }
  };

  const handlePromoteUser = (targetSocketId) => {
    if (socketRef.current) {
      socketRef.current.emit("promote-user", { targetSocketId, roomId });
      setShowUserActions(null);
    }
  };

  const handleDemoteUser = (targetSocketId) => {
    if (socketRef.current) {
      socketRef.current.emit("demote-user", { targetSocketId, roomId });
      setShowUserActions(null);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-foreground">
              Room Management
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* Room Info */}
        {roomInfo && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h3 className="font-medium text-foreground mb-2">
              Room Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Room ID:</span>
                <span className="ml-2 text-foreground font-mono">
                  {roomInfo.roomId}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Users:</span>
                <span className="ml-2 text-foreground">
                  {roomInfo.userCount}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Admins:</span>
                <span className="ml-2 text-foreground">
                  {roomInfo.admins.length}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <span className="ml-2 text-foreground">
                  {new Date(roomInfo.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Users List */}
        <div>
          <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Room Members ({remoteStreamsArray.length + 1})
          </h3>

          <div className="space-y-2">
            {/* Current User (Admin) */}
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Crown className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <div className="font-medium text-foreground">
                    {currentUser.username} (You)
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    Administrator
                  </div>
                </div>
              </div>
            </div>

            {/* Other Users */}
            {remoteStreamsArray.map(
              ({ socketId, username, isAdmin: userIsAdmin }) => (
                <div
                  key={socketId}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        userIsAdmin ? "bg-yellow-500" : "bg-muted"
                      }`}
                    >
                      {userIsAdmin ? (
                        <Crown className="w-4 h-4 text-foreground" />
                      ) : (
                        <Users className="w-4 h-4 text-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {username}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {userIsAdmin ? "Administrator" : "Member"}
                      </div>
                    </div>
                  </div>

                  {/* User Actions */}
                  <div className="flex items-center gap-2">
                    {showUserActions === socketId ? (
                      <div className="flex gap-1">
                        {!userIsAdmin ? (
                          <>
                            <button
                              onClick={() => handleKickUser(socketId)}
                              className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                              title="Kick user"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePromoteUser(socketId)}
                              className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded"
                              title="Promote to admin"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleDemoteUser(socketId)}
                            className="p-1 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded"
                            title="Demote from admin"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setShowUserActions(null)}
                          className="p-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowUserActions(socketId)}
                        className="p-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                      >
                        ⋯
                      </button>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-foreground rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomManagement;
