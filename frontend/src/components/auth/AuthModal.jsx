import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);

  if (!isOpen) return null;

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  const switchToLogin = () => setIsLogin(true);
  const switchToRegister = () => setIsLogin(false);

  return (
    <div className="fixed inset-0 bg-background/50 flex items-center justify-center p-4 z-50">
      <div className="relative bg-background rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 z-10"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Auth forms */}
        {isLogin ? (
          <LoginForm
            onSwitchToRegister={switchToRegister}
            onSuccess={handleSuccess}
          />
        ) : (
          <RegisterForm
            onSwitchToLogin={switchToLogin}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal;
