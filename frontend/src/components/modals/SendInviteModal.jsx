import { useState, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { X, UserPlus, Mail, Clock, Users, Search } from "lucide-react";
import { useAuthState } from "../../stores/authStore";
import io from "socket.io-client";

const SendInviteModal = ({ isOpen, onClose, roomId, onInviteSent }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [expiresIn, setExpiresIn] = useState("7"); // days
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { user } = useAuthState();

  // Search for users
  const searchUsers = useCallback(
    async (query) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"
          }/api/auth/users/search?q=${encodeURIComponent(
            query
          )}&roomId=${encodeURIComponent(roomId)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // Include cookies for authentication
          }
        );

        if (response.ok) {
          const users = await response.json();
          setSearchResults(users);
        } else {
          setError("Failed to search users");
        }
      } catch (error) {
        console.error("Failed to search users:", error);
        setError("Failed to search users");
      } finally {
        setIsSearching(false);
      }
    },
    [roomId]
  );

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setError("");
    setIsSending(true);

    try {
      const serverUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
      const socket = io(serverUrl, {
        withCredentials: true,
      });

      socket.on("connect", () => {
        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(expiresIn));

        // Send invitation
        socket.emit("send-room-invitation", {
          roomId,
          invitedUserId: selectedUser.id,
          invitedBy: user?.id,
          message: message.trim() || null,
          expiresAt: expiresAt.toISOString(),
        });
      });

      socket.on("room-invitation-sent", (data) => {
        console.log("Invitation sent:", data);
        socket.disconnect();
        setSuccess(true);
        setIsSending(false);

        // Call callback to refresh invitations list
        if (onInviteSent) {
          onInviteSent();
        }

        // Close modal after showing success
        setTimeout(() => {
          handleClose();
        }, 1500);
      });

      socket.on("error", (error) => {
        console.error("Socket error:", error);

        // Show user-friendly error messages based on error codes
        let errorMessage = "Failed to send invitation";
        if (error.code === "USER_ALREADY_MEMBER") {
          errorMessage = "This user is already a member of this room";
        } else if (error.code === "INVITATION_ALREADY_EXISTS") {
          errorMessage = "This user already has a pending invitation";
        } else if (error.message) {
          errorMessage = error.message;
        }

        setError(errorMessage);
        setIsSending(false);
        socket.disconnect();
      });
    } catch (error) {
      console.error("Failed to send invitation:", error);
      setError("Failed to send invitation");
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUser(null);
    setMessage("");
    setExpiresIn("7");
    setError("");
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
                  <UserPlus className="h-5 w-5" />
                  Send Room Invitation
                </CardTitle>
                <CardDescription>
                  Invite a user to join your room
                </CardDescription>
              </div>
              <Button variant="ghost" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendInvite} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                  ✅ Invitation sent successfully!
                </div>
              )}

              {/* User Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search Users</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by username..."
                    className="pl-10"
                    disabled={isSending}
                  />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="border border-border rounded-md max-h-40 overflow-y-auto">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className={`flex items-center justify-between p-3 ${
                          user.isRoomMember
                            ? "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-800"
                            : "hover:bg-muted cursor-pointer"
                        }`}
                        onClick={() =>
                          !user.isRoomMember && setSelectedUser(user)
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              user.isRoomMember ? "bg-gray-400" : "bg-blue-600"
                            }`}
                          >
                            <span className="text-white font-semibold text-sm">
                              {user.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {user.username}
                            </p>
                            {user.isRoomMember && (
                              <p className="text-xs text-muted-foreground">
                                Already a member
                              </p>
                            )}
                          </div>
                        </div>
                        {user.isRoomMember ? (
                          <Badge variant="outline" className="text-xs">
                            Member
                          </Badge>
                        ) : selectedUser?.id === user.id ? (
                          <Badge variant="default">Selected</Badge>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}

                {isSearching && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>

              {/* Selected User */}
              {selectedUser && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {selectedUser.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100">
                          {selectedUser.username}
                        </h4>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUser(null)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800"
                      title="Deselect user"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Invitation Message (Optional)</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal message to your invitation..."
                  rows={3}
                  disabled={isSending}
                />
              </div>

              {/* Expiration */}
              <div className="space-y-2">
                <Label htmlFor="expires">Invitation Expires In</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="expires"
                    type="number"
                    min="1"
                    max="30"
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    className="w-20"
                    disabled={isSending}
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </div>

              {/* Room Info */}
              <div className="bg-muted border border-border rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Room Information
                </h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    Room ID: <span className="font-mono">{roomId}</span>
                  </p>
                  <p>Invitation expires: {expiresIn} days</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={isSending}
                >
                  {success ? "Close" : "Cancel"}
                </Button>
                {!success && (
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSending || !selectedUser}
                  >
                    {isSending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Invitation
                      </>
                    )}
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

export default SendInviteModal;
