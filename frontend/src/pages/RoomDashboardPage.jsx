import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  User,
  Settings,
  Plus,
  Users,
  Calendar,
  Crown,
  LogOut,
  Edit,
} from "lucide-react";
import CreatePermanentRoomModal from "../components/modals/CreatePermanentRoomModal";

/**
 * RoomManagementPage Component
 * User dashboard with room management and settings
 */
const RoomManagementPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthState();
  const [userRooms, setUserRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const serverUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

  // Fetch user's rooms via HTTP
  const fetchUserRooms = async () => {
    try {
      const response = await fetch(`${serverUrl}/api/rooms/my-rooms`, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setUserRooms(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserRooms();
    }
  }, [isAuthenticated]);

  const handleCreateRoom = () => {
    setShowCreateModal(true);
  };

  const handleRoomCreated = () => {
    // Refresh the rooms list
    fetchUserRooms();
  };

  const handleManageRoom = (roomId) => {
    navigate(`/room/manage/${roomId}`);
  };

  const handleJoinRoom = (roomId) => {
    navigate(`/room/${roomId}`, {
      state: {
        username: user?.username,
        password: null,
        isCreating: false,
        from: "/rooms",
      },
    });
  };

  const handleLeaveRoom = async (roomId) => {
    try {
      const response = await fetch(`${serverUrl}/api/rooms/${roomId}/leave`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        fetchUserRooms(); // Refresh list
      } else {
        alert(data.message || "Failed to leave room");
      }
    } catch (error) {
      console.error("Failed to leave room:", error);
      alert("Failed to leave room. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {user?.username}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Member since:</span>
                    <span className="text-foreground">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleCreateRoom}
                  className="w-full flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create New Room
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Rooms Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Created Rooms */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="w-5 h-5" />
                      Rooms I Created
                    </CardTitle>
                    <CardDescription>
                      Rooms you own and can manage
                    </CardDescription>
                  </div>
                  <Badge variant="default">
                    {
                      userRooms.filter((room) => room.roomType === "created")
                        .length
                    }{" "}
                    room
                    {userRooms.filter((room) => room.roomType === "created")
                      .length !== 1
                      ? "s"
                      : ""}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : userRooms.filter((room) => room.roomType === "created")
                    .length === 0 ? (
                  <div className="text-center py-8">
                    <Crown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No rooms created yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first permanent room to get started
                    </p>
                    <Button
                      onClick={handleCreateRoom}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create Room
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userRooms
                      .filter((room) => room.roomType === "created")
                      .map((room) => (
                        <div
                          key={room.roomId}
                          className="flex items-center justify-between p-4 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">
                                {room.roomId}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {room.memberCount} members
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(
                                    room.createdAt
                                  ).toLocaleDateString()}
                                </span>
                                {room.roomType === "created" ? (
                                  <Badge
                                    variant="default"
                                    className="flex items-center gap-1"
                                  >
                                    <Crown className="w-3 h-3" />
                                    Owner
                                  </Badge>
                                ) : room.isAdmin ? (
                                  <Badge
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                  >
                                    <Crown className="w-3 h-3" />
                                    Admin
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="flex items-center gap-1"
                                  >
                                    <Users className="w-3 h-3" />
                                    Member
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleJoinRoom(room.roomId)}
                            >
                              Join
                            </Button>
                            {room.isAdmin && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleManageRoom(room.roomId)}
                                className="flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" />
                                Manage
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Member Rooms */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Rooms I'm a Member Of
                    </CardTitle>
                    <CardDescription>
                      Rooms you've been invited to join
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {
                      userRooms.filter((room) => room.roomType === "member")
                        .length
                    }{" "}
                    room
                    {userRooms.filter((room) => room.roomType === "member")
                      .length !== 1
                      ? "s"
                      : ""}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : userRooms.filter((room) => room.roomType === "member")
                    .length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No member rooms yet
                    </h3>
                    <p className="text-muted-foreground">
                      You haven't been invited to any rooms yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userRooms
                      .filter((room) => room.roomType === "member")
                      .map((room) => (
                        <div
                          key={room.roomId}
                          className="flex items-center justify-between p-4 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">
                                {room.roomId}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {room.memberCount} members
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(
                                    room.createdAt
                                  ).toLocaleDateString()}
                                </span>
                                {room.isAdmin ? (
                                  <Badge
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                  >
                                    <Crown className="w-3 h-3" />
                                    Admin
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="flex items-center gap-1"
                                  >
                                    <Users className="w-3 h-3" />
                                    Member
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleJoinRoom(room.roomId)}
                              className="flex items-center gap-1"
                            >
                              <Users className="w-3 h-3" />
                              Join
                            </Button>
                            {room.isAdmin && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleManageRoom(room.roomId)}
                                className="flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" />
                                Manage
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLeaveRoom(room.roomId)}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Leave this room"
                            >
                              <LogOut className="w-3 h-3" />
                              Leave
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Create Permanent Room Modal */}
      <CreatePermanentRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onRoomCreated={handleRoomCreated}
      />
    </div>
  );
};

export default RoomManagementPage;
