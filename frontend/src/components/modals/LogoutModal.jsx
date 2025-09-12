import { useState } from "react";
import { useAuthActions } from "../../stores/authStore";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { LogOut, X } from "lucide-react";

const LogoutModal = ({ isOpen, onClose }) => {
  const { logout } = useAuthActions();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LogOut className="h-5 w-5" />
                Sign Out
              </CardTitle>
              <CardDescription>
                Are you sure you want to sign out?
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            You will need to sign in again to access your account.
          </p>
          <div className="flex space-x-3">
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="destructive"
              className="flex-1"
            >
              {isLoggingOut ? "Signing out..." : "Yes, sign out"}
            </Button>
            <Button
              onClick={onClose}
              disabled={isLoggingOut}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LogoutModal;
