import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Video, Users, Shield, Zap, ArrowRight, Plus } from "lucide-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Connect with
            <span className="text-foreground"> Anyone, Anywhere</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            High-quality video calls with screen sharing, chat, and room
            management. Perfect for meetings, catch-ups, or casual
            conversations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/room/create">
              <Button size="lg" className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Room
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/room/join">
              <Button
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <Users className="h-5 w-5" />
                Join Room
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className=" hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                <Video className="h-6 w-6 text-foreground" />
              </div>
              <CardTitle className="text-foreground">HD Video Calls</CardTitle>
              <CardDescription className="text-muted-foreground">
                Crystal clear video quality with adaptive bitrate for the best
                experience
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className=" hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-foreground" />
              </div>
              <CardTitle className="text-foreground">
                Multi-User Support
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Support for multiple participants with smart layout management
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className=" hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-foreground" />
              </div>
              <CardTitle className="text-foreground">
                Secure & Private
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                End-to-end encryption and secure room management
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className=" hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-foreground" />
              </div>
              <CardTitle className="text-foreground">Screen Sharing</CardTitle>
              <CardDescription className="text-muted-foreground">
                Share your screen seamlessly with other participants
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className=" hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-foreground" />
              </div>
              <CardTitle className="text-foreground">Room Management</CardTitle>
              <CardDescription className="text-muted-foreground">
                Create permanent rooms with admin controls and member management
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className=" hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-foreground" />
              </div>
              <CardTitle className="text-foreground">Real-time Chat</CardTitle>
              <CardDescription className="text-muted-foreground">
                Chat with participants during video calls
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How it Works */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            How it Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Create or Join
              </h3>
              <p className="text-muted-foreground">
                Create a new room or join an existing one with a room ID
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Connect
              </h3>
              <p className="text-muted-foreground">
                Allow camera and microphone access to start your video call
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Collaborate
              </h3>
              <p className="text-muted-foreground">
                Share screens, chat, and manage your room with advanced features
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-secondary rounded-2xl p-8 text-center text-secondary-foreground">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Your Video Call?
          </h2>
          <p className="text-xl mb-6 opacity-90">
            Join thousands of users who trust VideoCall for their communication
            needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/room/create">
              <Button size="lg" className="flex items-center gap-2 ">
                <Plus className="h-5 w-5" />
                Create Your First Room
              </Button>
            </Link>
            <Link to="/room/join">
              <Button
                size="lg"
                className="flex items-center gap-2"
              >
                <Users className="h-5 w-5" />
                Join a Room
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-muted-foreground">
            <p>
              &copy; 2024 VideoCall. Built with ❤️ for seamless communication.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
