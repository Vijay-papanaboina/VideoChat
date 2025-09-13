import { useAuthState } from "../../stores/authStore";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const ProtectedRoutes = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthState();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if auth check is complete and user is not authenticated
    if (!isLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading or nothing while auth check is in progress
  if (isLoading) {
    return null; // App.jsx will show the LoadingScreen overlay
  }

  // If not authenticated after loading, don't render anything (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated, render the protected routes
  return children;
};

export default ProtectedRoutes;
