import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import RoomPage from "./pages/RoomPage";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="video-call-theme">
      <AuthProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
