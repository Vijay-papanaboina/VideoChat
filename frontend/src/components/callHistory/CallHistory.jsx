import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Loader2,
  Clock,
  Users,
  Star,
  StarOff,
  BarChart3,
  Calendar,
  Video,
  X,
  TrendingUp,
  Activity,
} from "lucide-react";

const CallHistory = ({ onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("history");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Data states
  const [callHistory, setCallHistory] = useState([]);
  const [callStats, setCallStats] = useState({});
  const [recentRooms, setRecentRooms] = useState([]);
  const [favoriteRooms, setFavoriteRooms] = useState([]);
  const [analytics, setAnalytics] = useState([]);

  // API base URL
  const API_BASE_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

  // API helper function
  const apiCall = useCallback(
    async (endpoint, options = {}) => {
      const token = localStorage.getItem("authToken");
      const url = `${API_BASE_URL}${endpoint}`;
      const config = {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      };

      try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Something went wrong");
        }

        return data;
      } catch (error) {
        console.error("API call failed:", error);
        throw error;
      }
    },
    [API_BASE_URL]
  );

  // Load call history
  const loadCallHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiCall("/api/call-history/history");
      setCallHistory(data.data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Load call statistics
  const loadCallStats = useCallback(async () => {
    try {
      const data = await apiCall("/api/call-history/stats");
      setCallStats(data.data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  }, [apiCall]);

  // Load recent rooms
  const loadRecentRooms = useCallback(async () => {
    try {
      const data = await apiCall("/api/call-history/recent-rooms");
      setRecentRooms(data.data);
    } catch (error) {
      console.error("Failed to load recent rooms:", error);
    }
  }, [apiCall]);

  // Load favorite rooms
  const loadFavoriteRooms = useCallback(async () => {
    try {
      const data = await apiCall("/api/call-history/favorites");
      setFavoriteRooms(data.data);
    } catch (error) {
      console.error("Failed to load favorites:", error);
    }
  }, [apiCall]);

  // Load analytics
  const loadAnalytics = useCallback(
    async (period = "week") => {
      try {
        const data = await apiCall(
          `/api/call-history/analytics?period=${period}`
        );
        setAnalytics(data.data);
      } catch (error) {
        console.error("Failed to load analytics:", error);
      }
    },
    [apiCall]
  );

  // Toggle favorite room
  const toggleFavorite = async (roomId, isFavorite) => {
    try {
      if (isFavorite) {
        await apiCall(`/api/call-history/favorites/${roomId}`, {
          method: "DELETE",
        });
      } else {
        await apiCall("/api/call-history/favorites", {
          method: "POST",
          body: JSON.stringify({ roomId }),
        });
      }
      loadFavoriteRooms();
    } catch (error) {
      setError(error.message);
    }
  };

  // Format duration
  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format time
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Load data on component mount
  useEffect(() => {
    if (user) {
      loadCallHistory();
      loadCallStats();
      loadRecentRooms();
      loadFavoriteRooms();
      loadAnalytics();
    }
  }, [
    user,
    loadCallHistory,
    loadCallStats,
    loadRecentRooms,
    loadFavoriteRooms,
    loadAnalytics,
  ]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  Call History & Analytics
                </CardTitle>
                <CardDescription>
                  Track your video calls, statistics, and favorite rooms
                </CardDescription>
              </div>
              <Button variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Tabs */}
            <div className="flex space-x-1 mb-6">
              <Button
                variant={activeTab === "history" ? "default" : "ghost"}
                onClick={() => setActiveTab("history")}
                className="flex-1"
              >
                <Video className="w-4 h-4 mr-2" />
                History
              </Button>
              <Button
                variant={activeTab === "stats" ? "default" : "ghost"}
                onClick={() => setActiveTab("stats")}
                className="flex-1"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Statistics
              </Button>
              <Button
                variant={activeTab === "rooms" ? "default" : "ghost"}
                onClick={() => setActiveTab("rooms")}
                className="flex-1"
              >
                <Users className="w-4 h-4 mr-2" />
                Rooms
              </Button>
              <Button
                variant={activeTab === "analytics" ? "default" : "ghost"}
                onClick={() => setActiveTab("analytics")}
                className="flex-1"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">
                {error}
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Recent Calls</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadCallHistory}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Refresh"
                    )}
                  </Button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : callHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No call history found. Start making calls to see them here!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {callHistory.map((call) => (
                      <Card key={call.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <Video className="w-4 h-4 text-blue-500" />
                              <span className="font-medium">{call.roomId}</span>
                              {call.callQuality > 0 && (
                                <div className="flex items-center space-x-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${
                                        i < call.callQuality
                                          ? "text-yellow-400 fill-current"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(call.startedAt)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(call.startedAt)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Users className="w-3 h-3" />
                                <span>
                                  {call.participantsCount} participants
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Activity className="w-3 h-3" />
                                <span>{formatDuration(call.duration)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {formatDuration(call.duration)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {call.connectionType}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === "stats" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">
                  Call Statistics (Last 30 Days)
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {callStats.totalCalls || 0}
                    </div>
                    <div className="text-sm text-gray-500">Total Calls</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatDuration(callStats.totalDuration || 0)}
                    </div>
                    <div className="text-sm text-gray-500">Total Duration</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(callStats.avgDuration || 0)}m
                    </div>
                    <div className="text-sm text-gray-500">Avg Duration</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round(callStats.avgQuality || 0)}/5
                    </div>
                    <div className="text-sm text-gray-500">Avg Quality</div>
                  </Card>
                </div>
              </div>
            )}

            {/* Rooms Tab */}
            {activeTab === "rooms" && (
              <div className="space-y-6">
                {/* Recent Rooms */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Rooms</h3>
                  {recentRooms.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No recent rooms found
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentRooms.map((room, index) => (
                        <Card key={index} className="p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{room.roomId}</div>
                              <div className="text-sm text-gray-500">
                                Joined {formatDate(room.lastJoined)} •{" "}
                                {room.joinCount} times
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFavorite(room.roomId, false)}
                            >
                              <Star className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Favorite Rooms */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Favorite Rooms</h3>
                  {favoriteRooms.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No favorite rooms yet. Add some from recent rooms!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {favoriteRooms.map((favorite) => (
                        <Card key={favorite.id} className="p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">
                                {favorite.roomId}
                              </div>
                              {favorite.roomName && (
                                <div className="text-sm text-gray-500">
                                  {favorite.roomName}
                                </div>
                              )}
                              <div className="text-sm text-gray-500">
                                Added {formatDate(favorite.addedAt)}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                toggleFavorite(favorite.roomId, true)
                              }
                            >
                              <StarOff className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Call Analytics</h3>
                  <div className="flex space-x-2">
                    {["day", "week", "month", "year"].map((period) => (
                      <Button
                        key={period}
                        variant="outline"
                        size="sm"
                        onClick={() => loadAnalytics(period)}
                        className="capitalize"
                      >
                        {period}
                      </Button>
                    ))}
                  </div>
                </div>

                {analytics.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No analytics data available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analytics.map((day, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">
                              {formatDate(day.date)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {day.callsCount} calls •{" "}
                              {formatDuration(day.totalDuration)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              Quality: {Math.round(day.avgQuality || 0)}/5
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CallHistory;
