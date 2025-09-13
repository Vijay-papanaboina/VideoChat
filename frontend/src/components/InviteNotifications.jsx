import { useState, useEffect, useRef } from "react";
import { useAuthState } from "../stores/authStore";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { X, Mail, Check, XCircle, Clock, Users } from "lucide-react";
import io from "socket.io-client";

const InviteNotifications = () => {
  const { user, isAuthenticated } = useAuthState();
  const [invitations, setInvitations] = useState([]);
  const [isResponding, setIsResponding] = useState(null);
  const socketRef = useRef(null);

  // Setup socket connection and fetch invitations
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const serverUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
      socketRef.current = io(serverUrl);

      // Request pending invitations
      socketRef.current.emit("get-user-invitations", { userId: user.id });

      // Listen for invitations response
      socketRef.current.on("user-invitations", (invites) => {
        setInvitations(invites);
      });

      // Listen for new invitations
      socketRef.current.on("room-invitation-received", (data) => {
        setInvitations((prev) => [data.invitation, ...prev]);
      });

      // Listen for invitation responses
      socketRef.current.on("room-invitation-accepted", (data) => {
        setInvitations((prev) =>
          prev.filter((inv) => inv.id !== data.invitation.id)
        );
      });

      socketRef.current.on("room-invitation-declined", (data) => {
        setInvitations((prev) =>
          prev.filter((inv) => inv.id !== data.invitation.id)
        );
      });

      socketRef.current.on("room-invitation-cancelled", (data) => {
        setInvitations((prev) =>
          prev.filter((inv) => inv.id !== data.invitation.id)
        );
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [isAuthenticated, user?.id]);

  const handleAcceptInvitation = async (invitationId) => {
    setIsResponding(invitationId);
    try {
      socketRef.current.emit("accept-room-invitation", {
        invitationId,
        userId: user.id,
      });
    } catch (error) {
      console.error("Failed to accept invitation:", error);
      setIsResponding(null);
    }
  };

  const handleDeclineInvitation = async (invitationId) => {
    setIsResponding(invitationId);
    try {
      socketRef.current.emit("decline-room-invitation", {
        invitationId,
        userId: user.id,
      });
    } catch (error) {
      console.error("Failed to decline invitation:", error);
      setIsResponding(null);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date() > new Date(expiresAt);
  };

  if (!isAuthenticated || invitations.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full">
      <Card className="shadow-lg border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4" />
            Room Invitations
            <Badge variant="secondary" className="ml-auto">
              {invitations.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="border border-border rounded-lg p-3 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium text-sm">
                      Room {invitation.roomId}
                    </span>
                    {isExpired(invitation.expiresAt) && (
                      <Badge variant="destructive" className="text-xs">
                        Expired
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Invited by {invitation.inviterUsername}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(invitation.createdAt)}
                  </p>
                  {invitation.message && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      "{invitation.message}"
                    </p>
                  )}
                </div>
              </div>

              {!isExpired(invitation.expiresAt) && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAcceptInvitation(invitation.id)}
                    disabled={isResponding === invitation.id}
                    className="flex-1 text-xs h-7"
                  >
                    {isResponding === invitation.id ? (
                      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Accept
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeclineInvitation(invitation.id)}
                    disabled={isResponding === invitation.id}
                    className="flex-1 text-xs h-7"
                  >
                    {isResponding === invitation.id ? (
                      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Decline
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteNotifications;
