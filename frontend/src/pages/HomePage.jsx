import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthState, useAuthActions } from "../stores/authStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/ui/mode-toggle";
import UserProfile from "../components/auth/UserProfile";
import { User, LogOut } from "lucide-react";

/**
 * HomePage Component
 * Renders the landing page where users can enter their name, a room ID, and a password
 * to either create a new room or join an existing one.
 */
const HomePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthState();
  const { logout } = useAuthActions();
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Handles the form submission
  const handleJoinRoom = (e) => {
    e.preventDefault();
    const displayUsername = isAuthenticated ? user?.username : username;

    if (roomId.trim() && displayUsername.trim()) {
      // Navigate to the room page, passing user details in the state
      // to avoid exposing them in the URL.
      navigate(`/room/${roomId}`, {
        state: {
          username: displayUsername,
          password: password.trim() || null, // Allow empty password
          isCreating: false, // This is for joining existing rooms
          from: "/", // Track where they came from
        },
      });
    } else {
      alert("Please enter room ID and your name.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header with Auth */}
      <header className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold">VideoCallApp</h1>
        </div>
        <div className="flex items-center space-x-2">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground">
                Welcome, {user?.firstName || user?.username || "User"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserProfile(true)}
              >
                <User className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="default" size="sm">
                  Create Account
                </Button>
              </Link>
            </div>
          )}
          <ModeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-sm shadow-lg bg-card text-card-foreground border-border">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-card-foreground">
              Join or Create a Room
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your details below. If the room doesn't exist, it will be
              created with your password.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleJoinRoom}>
            <CardContent className="grid gap-4">
              {!isAuthenticated && (
                <div className="grid gap-2">
                  <Label
                    htmlFor="username"
                    className="font-medium text-foreground"
                  >
                    Your Name
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-input text-foreground border-border"
                  />
                </div>
              )}
              {isAuthenticated && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Joining as:{" "}
                    <span className="font-medium">{user?.username}</span>
                  </p>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="roomId" className="font-medium text-foreground">
                  Room ID
                </Label>
                <Input
                  id="roomId"
                  type="text"
                  placeholder="my-secret-room"
                  required
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="bg-input text-foreground border-border"
                />
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="password"
                  className="font-medium text-foreground"
                >
                  Password (Optional)
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Leave empty for passwordless room"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input text-foreground border-border"
                />
                <p className="text-sm text-muted-foreground">
                  Only required if the room has a password
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full mt-4 font-medium bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Join or Create Room
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Profile Access Button (for logged-in users) */}
        {isAuthenticated && (
          <div className="mt-6 text-center">
            <div className="text-sm text-muted-foreground mb-3">
              Manage your rooms and create permanent rooms with admin controls
            </div>
            <Button
              onClick={() => navigate("/rooms")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Go to Rooms
            </Button>
          </div>
        )}
      </main>

      {isAuthenticated && (
        <UserProfile
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
        />
      )}
    </div>
  );
};

export default HomePage;
