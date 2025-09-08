import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
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
import { ModeToggle } from "@/components/mode-toggle";
import AuthModal from "../components/auth/AuthModal";
import UserProfile from "../components/auth/UserProfile";
import { User, LogOut } from "lucide-react";

/**
 * HomePage Component
 * Renders the landing page where users can enter their name, a room ID, and a password
 * to either create a new room or join an existing one.
 */
const HomePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Handles the form submission
  const handleJoinRoom = (e) => {
    e.preventDefault();
    const displayUsername = isAuthenticated() ? user.username : username;

    if (roomId.trim() && password.trim() && displayUsername.trim()) {
      // Navigate to the room page, passing user details in the state
      // to avoid exposing them in the URL.
      navigate(`/room/${roomId}`, {
        state: {
          username: displayUsername,
          password,
        },
      });
    } else {
      alert("Please fill in all fields.");
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
          {isAuthenticated() ? (
            <>
              <span className="text-sm text-muted-foreground">
                Welcome, {user.firstName || user.username}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAuthModal(true)}
            >
              Sign In
            </Button>
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
              {!isAuthenticated() && (
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
              {isAuthenticated() && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Joining as:{" "}
                    <span className="font-medium">{user.username}</span>
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
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input text-foreground border-border"
                />
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
      </main>

      {/* Authentication Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          // Optionally show success message
        }}
      />

      {isAuthenticated() && (
        <UserProfile
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
        />
      )}
    </div>
  );
};

export default HomePage;
