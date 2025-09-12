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
import { Badge } from "../components/ui/badge";
import { Plus, Users, Lock, Globe, Copy, Check } from "lucide-react";

const CreateRoomPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthState();
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generateRoomId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRoomId(result);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError("");
    setIsCreating(true);

    try {
      // Check if room already exists by trying to join it
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"
        }/api/rooms/check`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ roomId }),
        }
      );

      const data = await response.json();

      if (data.exists) {
        setError("Room ID is already in use. Please choose a different one.");
        setIsCreating(false);
        return;
      }

      // Room doesn't exist, proceed to create
      const displayUsername = isAuthenticated ? user?.username : "Anonymous";
      navigate(`/room/${roomId}`, {
        state: {
          isCreating: true,
          password: password,
          username: displayUsername,
        },
      });
    } catch (error) {
      console.error("Failed to check room availability:", error);
      setError("Failed to check room availability. Please try again.");
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Create a New Room
          </h2>
          <p className="text-muted-foreground">
            Set up a new video call room and invite others to join
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Room Details
            </CardTitle>
            <CardDescription>
              Choose a unique room ID and optional password for security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRoom} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
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
                    disabled={isCreating}
                    className="uppercase"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateRoomId}
                    disabled={isCreating}
                  >
                    Generate
                  </Button>
                </div>
                {roomId && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Room ID: {roomId}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={copyToClipboard}
                      className="h-6 w-6 p-0"
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password (Optional)</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set a password for extra security"
                  disabled={isCreating}
                />
                <p className="text-sm text-muted-foreground">
                  Leave empty for open access
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Room Type
                </h4>
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <Globe className="h-4 w-4" />
                  <span>Temporary Room</span>
                  <Badge variant="secondary">Public</Badge>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Anyone with the room ID can join. Room will be deleted when
                  empty.
                </p>
                {isAuthenticated && (
                  <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                    <Link
                      to="/create-room"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Create a permanent room with admin controls →
                    </Link>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isCreating || !roomId}
              >
                {isCreating ? "Creating Room..." : "Create Room"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">
                    Multi-User Support
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Support for multiple participants
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Lock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Secure Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Optional password protection
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

export default CreateRoomPage;
