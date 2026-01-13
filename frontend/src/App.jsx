import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "./components/ui/theme-provider";
import LoadingScreen from "./components/ui/LoadingScreen";
import Navbar from "./components/layout/Navbar";
import ProtectedRoutes from "./components/auth/ProtectedRoutes";
import PublicRoutes from "./components/auth/PublicRoutes";
import InviteNotifications from "./components/InviteNotifications";
import { SocketProvider } from "./contexts/SocketContext";
import { useAuthActions, useAuthState } from "./stores/authStore";
import LandingPage from "./pages/LandingPage";
import RoomPage from "./pages/RoomPage";
import UserProfilePage from "./pages/UserProfilePage";
import RoomDashboardPage from "./pages/RoomDashboardPage";
import IndividualRoomManagementPage from "./pages/RoomManagementPage";
import CreateRoomPage from "./pages/CreateRoomPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import JoinRoomPage from "./pages/JoinRoomPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

function App() {
  const { checkAuth } = useAuthActions();
  const { isLoading, showNavbar } = useAuthState();

  // Check authentication status on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="video-call-theme">
      <SocketProvider>
        <div className="App">
          {showNavbar && <Navbar />}
          <div className="relative">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/room/:roomId" element={<RoomPage />} />
              <Route path="/room/create" element={<CreateRoomPage />} />
              <Route path="/room/join" element={<JoinRoomPage />} />

              {/* Email verification and password reset (public) */}
              <Route
                path="/verify-email/:token"
                element={<VerifyEmailPage />}
              />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route
                path="/reset-password/:token"
                element={<ResetPasswordPage />}
              />

              {/* Auth-only Public Routes (redirect authenticated users) */}
              <Route
                path="/login"
                element={
                  <PublicRoutes>
                    <LoginPage />
                  </PublicRoutes>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoutes>
                    <RegisterPage />
                  </PublicRoutes>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoutes>
                    <Routes>
                      <Route path="/profile" element={<UserProfilePage />} />
                      <Route path="/rooms" element={<RoomDashboardPage />} />
                      <Route
                        path="/room/manage/:roomId"
                        element={<IndividualRoomManagementPage />}
                      />
                    </Routes>
                  </ProtectedRoutes>
                }
              />
            </Routes>

            {/* Show loading overlay while checking authentication */}
            {isLoading && <LoadingScreen hideNavbar={!showNavbar} />}

            {/* Global invite notifications */}
            <InviteNotifications />

            {/* Toast Notifications */}
            <Toaster richColors position="top-center" />
          </div>
        </div>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;
