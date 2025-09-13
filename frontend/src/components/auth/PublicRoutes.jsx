import { useAuthState } from "../../stores/authStore";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const PublicRoutes = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthState();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if auth check is complete and user is authenticated
    if (!isLoading && isAuthenticated) {
      navigate("/rooms");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading or nothing while auth check is in progress
  if (isLoading) {
    return null; // App.jsx will show the LoadingScreen overlay
  }

  // If authenticated after loading, don't render anything (redirect will happen)
  if (isAuthenticated) {
    return null;
  }

  // User is not authenticated, render the public routes
  return children;
};

export default PublicRoutes;
