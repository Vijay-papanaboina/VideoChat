import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthState } from "../../stores/authStore";
import { Button } from "../ui/button";
import { ModeToggle } from "../ui/mode-toggle";
import LogoutModal from "../modals/LogoutModal";
import { Video, User, LogOut, LogIn, Home } from "lucide-react";

const Navbar = ({ showHomeButton = true, title = "VideoCall" }) => {
  const { user, isAuthenticated } = useAuthState();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            {showHomeButton && (
              <>
                <Link to="/">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Home
                  </Button>
                </Link>
                <div className="h-6 w-px bg-border" />
              </>
            )}
            <div className="flex items-center gap-2">
              <Video className="h-6 w-6 text-foreground" />
              <span className="text-lg font-semibold text-foreground">
                {title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/profile">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-foreground hover:bg-muted"
                  >
                    <User className="h-4 w-4" />
                    {user?.username || user?.firstName}
                  </Button>
                </Link>
                <Link to="/rooms">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-foreground hover:bg-muted"
                  >
                    Rooms
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLogoutModal(true)}
                  className="text-foreground hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-foreground hover:bg-muted"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="">
                    Create Account
                  </Button>
                </Link>
              </>
            )}
            <ModeToggle />
          </div>
        </div>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
      />
    </header>
  );
};

export default Navbar;
