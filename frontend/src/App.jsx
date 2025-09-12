import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ui/theme-provider";
import { useAuthActions } from "./stores/authStore";
import LoadingScreen from "./components/ui/LoadingScreen";
import Navbar from "./components/layout/Navbar";
import LandingPage from "./pages/LandingPage";
import RoomPage from "./pages/RoomPage";
import UserProfilePage from "./pages/UserProfilePage";
import RoomManagementPage from "./pages/ProfilePage";
import CreateRoomPage from "./pages/CreateRoomPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CreateRoomPageNew from "./pages/CreateRoomPage";
import JoinRoomPage from "./pages/JoinRoomPage";

function App() {
  const { checkAuth } = useAuthActions();
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [checkAuth]);

  return (
    <ThemeProvider defaultTheme="light" storageKey="video-call-theme">
      <div className="App">
        <Navbar />
        <div className="relative">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/rooms" element={<RoomManagementPage />} />
            <Route path="/create-room" element={<CreateRoomPage />} />
            <Route path="/room/create" element={<CreateRoomPageNew />} />
            <Route path="/room/join" element={<JoinRoomPage />} />
            <Route
              path="/manage-room/:roomId"
              element={<RoomManagementPage />}
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>

          {/* Show loading overlay while checking authentication */}
          {isLoading && <LoadingScreen />}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
