import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { X, Plus, Users, Lock, Crown, Copy, Check } from "lucide-react";
import { useAuthState } from "../../stores/authStore";
import io from "socket.io-client";

const CreatePermanentRoomModal = ({ isOpen, onClose, onRoomCreated }) => {
  const [roomId, setRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuthState();

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
      // Check if room already exists
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

      // Create socket connection and create permanent room
      const socket = io(
        import.meta.env.VITE_BACKEND_URL || "http://localhost:8000",
        {
          withCredentials: true,
        }
      );

      socket.on("connect", () => {
        // Create permanent room via socket
        socket.emit("create-permanent-room", {
          roomId,
          username: user?.username,
          userId: user?.id,
        });
      });

      socket.on("permanent-room-created", (data) => {
        console.log("Permanent room created:", data);
        socket.disconnect();
        setSuccess(true);
        setIsCreating(false);
        // Call the callback to refresh rooms list
        if (onRoomCreated) {
          onRoomCreated();
        }
        // Close modal after a short delay to show success message
        setTimeout(() => {
          handleClose();
        }, 1500);
      });

      socket.on("error", (error) => {
        console.error("Socket error:", error);
        setError(error.message || "Failed to create room. Please try again.");
        setIsCreating(false);
        socket.disconnect();
      });
    } catch (error) {
      console.error("Failed to check room availability:", error);
      setError("Failed to check room availability. Please try again.");
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setRoomId("");
    setError("");
    setCopied(false);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg max-w-md w-full">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Create Permanent Room
                </CardTitle>
                <CardDescription>
                  Create a room with admin controls and member management
                </CardDescription>
              </div>
              <Button variant="ghost" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRoom} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                  ✅ Permanent room created successfully! It will appear in your
                  dashboard.
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

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Room Type
                </h4>
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <Crown className="h-4 w-4" />
                  <span>Permanent Room</span>
                  <Badge variant="default">Invite Only</Badge>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  You'll be the admin. Add members and manage permissions.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>You'll be the room administrator</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Invite-only access (no password needed)</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Crown className="h-4 w-4" />
                  <span>Full member management controls</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={isCreating}
                >
                  {success ? "Close" : "Cancel"}
                </Button>
                {!success && (
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isCreating || !roomId}
                  >
                    {isCreating ? "Creating..." : "Create Room"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePermanentRoomModal;
