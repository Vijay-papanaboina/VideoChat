import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthState } from "../stores/authStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Users,
  Crown,
  UserMinus,
  UserPlus,
  Shield,
  Settings,
  Calendar,
  Copy,
  Check,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import io from "socket.io-client";

/**
 * RoomManagementPage Component
 * Dedicated page for managing room members and settings
 */
const RoomManagementPage = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { user, isAuthenticated } = useAuthState();
  const [roomInfo, setRoomInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserActions, setShowUserActions] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const socketRef = useRef(null);

  // Setup socket connection
  useEffect(() => {
    if (isAuthenticated && roomId) {
      const serverUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
      socketRef.current = io(serverUrl);

      // Request room info
      socketRef.current.emit("get-room-info", { roomId, userId: user?.id });

      // Listen for room info response
      socketRef.current.on("room-info", (data) => {
        setRoomInfo(data);
        setIsLoading(false);
      });

      // Listen for room deleted
      socketRef.current.on("room-deleted", () => {
        navigate("/rooms");
      });

      socketRef.current.on("error", (data) => {
        console.error("Room management error:", data.message);
        alert(data.message);
        setIsLoading(false);
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [isAuthenticated, roomId, user?.id, navigate]);

  // Copy room ID to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  // Delete room
  const handleDeleteRoom = async () => {
    if (!roomInfo || !socketRef.current) return;

    setIsDeleting(true);
    try {
      socketRef.current.emit("delete-permanent-room", {
        roomId,
        userId: user?.id,
      });
    } catch (error) {
      console.error("Failed to delete room:", error);
      setIsDeleting(false);
    }
  };

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

  const handleJoinRoom = () => {
    navigate(`/room/${roomId}`, {
      state: {
        username: user?.username,
        password: null,
        isPermanentRoom: true,
      },
    });
  };

  const handleBackToRooms = () => {
    navigate("/rooms");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading room information...</p>
        </div>
      </div>
    );
  }

  if (!roomInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-8 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Room Not Found
            </h2>
            <p className="text-muted-foreground mb-6">
              The room you're looking for doesn't exist or you don't have access
              to it.
            </p>
            <Button onClick={handleBackToRooms} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Rooms
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if current user is admin
  const currentUserIsAdmin = roomInfo.admins.includes(user?.id);

  if (!currentUserIsAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-8 text-center">
            <Shield className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Access Denied
            </h2>
            <p className="text-muted-foreground mb-6">
              You need admin privileges to manage this room.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleBackToRooms}>
                Back to Rooms
              </Button>
              <Button onClick={handleJoinRoom}>Join Room</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToRooms}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Rooms
              </Button>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-xl font-semibold text-foreground">
                Room Management
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleJoinRoom}
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Join Room
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Room
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Room Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Room Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">
                    Room ID:
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono font-bold text-gray-900 dark:text-white">
                      {roomInfo.roomId}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyToClipboard}
                      className="p-1 h-auto"
                    >
                      {copySuccess ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">
                    Created By:
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {roomInfo.createdByUsername || "Unknown"}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">
                    Created:
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(roomInfo.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">
                    Total Members:
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {roomInfo.members ? roomInfo.members.length : 0}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">
                    Admins:
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {roomInfo.admins.length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Member List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Room Members
                    </CardTitle>
                    <CardDescription>
                      Manage members and their permissions
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {roomInfo.members ? roomInfo.members.length : 0} member
                    {(roomInfo.members ? roomInfo.members.length : 0) !== 1
                      ? "s"
                      : ""}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {roomInfo.members && roomInfo.members.length > 0 ? (
                    roomInfo.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              member.isAdmin ? "bg-yellow-500" : "bg-gray-500"
                            }`}
                          >
                            {member.isAdmin ? (
                              <Crown className="w-5 h-5 text-white" />
                            ) : (
                              <Users className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {member.username}
                              </h4>
                              {member.userId === user?.id && (
                                <Badge variant="outline" className="text-xs">
                                  You
                                </Badge>
                              )}
                              {member.userId === roomInfo.createdBy && (
                                <Badge variant="default" className="text-xs">
                                  Creator
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Added{" "}
                                {new Date(member.addedAt).toLocaleDateString()}
                              </span>
                              <Badge
                                variant={
                                  member.isAdmin ? "default" : "secondary"
                                }
                                className="text-xs"
                              >
                                {member.isAdmin ? "Administrator" : "Member"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* User Actions */}
                        {currentUserIsAdmin && member.userId !== user?.id && (
                          <div className="flex items-center gap-2">
                            {showUserActions === member.socketId ? (
                              <div className="flex gap-1">
                                {!member.isAdmin ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleKickUser(member.socketId)
                                      }
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      title="Kick user"
                                    >
                                      <UserMinus className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handlePromoteUser(member.socketId)
                                      }
                                      className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                      title="Promote to admin"
                                    >
                                      <UserPlus className="w-4 h-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleDemoteUser(member.socketId)
                                    }
                                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                    title="Demote from admin"
                                    disabled={
                                      member.userId === roomInfo.createdBy
                                    }
                                  >
                                    <Shield className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowUserActions(null)}
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setShowUserActions(member.socketId)
                                }
                              >
                                ⋯
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No permanent members added yet</p>
                      <p className="text-sm">
                        Add members to give them permanent access to this room
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Delete Room
                </h3>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this room? All members will lose
              access and all chat history will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteRoom}
                disabled={isDeleting}
                className="flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Room
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagementPage;
