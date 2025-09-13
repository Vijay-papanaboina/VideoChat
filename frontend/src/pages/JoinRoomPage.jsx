import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthState } from "../stores/authStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Users, Lock, AlertCircle, CheckCircle } from "lucide-react";

const JoinRoomPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthState();
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [roomInfo, setRoomInfo] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkRoomAvailability = async () => {
    if (!roomId.trim()) return;

    setIsChecking(true);
    setError("");
    setRoomInfo(null);

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"
        }/api/rooms/check`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ roomId: roomId.trim().toUpperCase() }),
        }
      );

      const data = await response.json();

      if (data.exists) {
        setRoomInfo({
          exists: true,
          isActive: data.isActive,
          isPermanent: data.isPermanent,
          isInviteOnly: data.isInviteOnly,
          memberCount: data.memberCount,
          requiresPassword: data.requiresPassword,
        });
      } else {
        setRoomInfo({
          exists: false,
        });
      }
    } catch (error) {
      console.error("Room check error:", error);
      setError("Failed to check room availability. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setError("");
    setIsJoining(true);

    try {
      const displayUsername = isAuthenticated ? user?.username : username;
      navigate(`/room/${roomId.trim().toUpperCase()}`, {
        state: {
          isJoining: true,
          password: password,
          username: displayUsername,
          from: "/join-room", // Track where they came from
        },
      });
    } catch (error) {
      console.error("Join room error:", error);
      setError("Failed to join room. Please try again.");
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Join a Room
          </h2>
          <p className="text-muted-foreground">
            Enter the room ID and password to join an existing video call
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Room Information
            </CardTitle>
            <CardDescription>
              Enter the room details provided by the room creator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinRoom} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="roomId">Room ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="roomId"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="Enter room ID (e.g., ABC123)"
                    required
                    disabled={isJoining || isChecking}
                    className="uppercase"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={checkRoomAvailability}
                    disabled={!roomId.trim() || isJoining || isChecking}
                  >
                    {isChecking ? "Checking..." : "Check"}
                  </Button>
                </div>
              </div>

              {!isAuthenticated && (
                <div className="space-y-2">
                  <Label htmlFor="username">Your Name</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your display name"
                    required
                    disabled={isJoining || isChecking}
                  />
                  <p className="text-sm text-muted-foreground">
                    This will be your name in the room
                  </p>
                </div>
              )}

              {/* Room Status */}
              {roomInfo && (
                <div
                  className={`p-4 rounded-lg border ${
                    roomInfo.exists && roomInfo.isActive
                      ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                      : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {roomInfo.exists && roomInfo.isActive ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span
                      className={`font-medium ${
                        roomInfo.exists && roomInfo.isActive
                          ? "text-green-800 dark:text-green-200"
                          : "text-red-800 dark:text-red-200"
                      }`}
                    >
                      {roomInfo.exists && roomInfo.isActive
                        ? "Room is available"
                        : roomInfo.exists && !roomInfo.isActive
                        ? "Room is currently inactive"
                        : "Room does not exist"}
                    </span>
                  </div>
                  {roomInfo.exists && roomInfo.isActive && (
                    <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                      {roomInfo.isPermanent ? (
                        <span>
                          Permanent room • {roomInfo.memberCount} members online
                        </span>
                      ) : (
                        <span>
                          Temporary room • {roomInfo.memberCount} members online
                        </span>
                      )}
                      {roomInfo.isInviteOnly && (
                        <span className="block text-orange-600 dark:text-orange-400">
                          ⚠️ This is an invite-only room
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {roomInfo?.exists && roomInfo?.isActive && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      roomInfo.requiresPassword
                        ? "Enter room password"
                        : "No password required"
                    }
                    disabled={isJoining}
                    required={roomInfo.requiresPassword}
                  />
                  {!roomInfo.requiresPassword && (
                    <p className="text-sm text-muted-foreground">
                      This room doesn't require a password
                    </p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={
                  isJoining ||
                  !roomId ||
                  !roomInfo?.exists ||
                  !roomInfo?.isActive ||
                  (!isAuthenticated && !username)
                }
              >
                {isJoining ? "Joining Room..." : "Join Room"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="mt-8">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">
                    Don't have a room ID?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Ask the person who created the room to share the room ID
                    with you.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lock className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">
                    Forgot the password?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Contact the room creator to get the correct password.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default JoinRoomPage;
