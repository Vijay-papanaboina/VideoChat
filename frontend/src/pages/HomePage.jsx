import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

/**
 * HomePage Component
 * Renders the landing page where users can enter their name, a room ID, and a password
 * to either create a new room or join an existing one.
 */
const HomePage = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  // Handles the form submission
  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (roomId.trim() && password.trim() && username.trim()) {
      // Navigate to the room page, passing user details in the state
      // to avoid exposing them in the URL.
      navigate(`/room/${roomId}`, {
        state: {
          username,
          password,
        },
      });
    } else {
      alert("Please fill in all fields.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Theme Toggle Button */}
      <div className="fixed top-4 right-4 z-10">
        <ModeToggle />
      </div>

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
    </div>
  );
};

export default HomePage;
