import { useState } from "react";
import { Plus, Users, Lock, Copy, Check } from "lucide-react";

/**
 * CreateRoomModal Component
 * Allows logged-in users to create permanent rooms
 */
const CreateRoomModal = ({
  socketRef,
  username,
  userId,
  isOpen,
  onClose,
  onRoomCreated,
}) => {
  const [roomId, setRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  // Generate a random room ID
  const generateRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(randomId);
  };

  // Copy room ID to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(createdRoomId);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const handleCreateRoom = () => {
    if (!roomId.trim()) {
      alert("Please enter a room ID");
      return;
    }

    setIsCreating(true);

    if (socketRef.current) {
      socketRef.current.emit("create-permanent-room", {
        roomId: roomId.trim(),
        username,
        userId,
      });
    }
  };

  const handleClose = () => {
    setRoomId("");
    setCreatedRoomId("");
    setIsCreating(false);
    setCopySuccess(false);
    onClose();
  };

  // Listen for room creation response
  if (socketRef.current) {
    socketRef.current.on("permanent-room-created", (data) => {
      setCreatedRoomId(data.roomId);
      setIsCreating(false);
    });

    socketRef.current.on("error", (data) => {
      alert(data.message);
      setIsCreating(false);
    });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Plus className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-foreground">
              Create Permanent Room
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {!createdRoomId ? (
          <>
            {/* Room Creation Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Room ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="Enter room ID (e.g., ABC123)"
                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent "
                    maxLength={10}
                  />
                  <button
                    onClick={generateRoomId}
                    className="px-3 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                    title="Generate random ID"
                  >
                    🎲
                  </button>
                </div>
              </div>

              {/* Room Features */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Permanent Room Features:
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Full admin controls & member management
                  </li>
                  <li className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Invite-only access (no password needed)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Persistent room (survives when empty)
                  </li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={isCreating || !roomId.trim()}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? "Creating..." : "Create Room"}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Room Created Success */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2">
                Room Created Successfully!
              </h3>

              <p className="text-muted-foreground mb-4">
                Your permanent room is ready. Share the room ID with people you
                want to invite.
              </p>

              {/* Room ID Display */}
              <div className="bg-muted p-4 rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Room ID:</p>
                    <p className="text-xl font-mono font-bold text-foreground">
                      {createdRoomId}
                    </p>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy room ID"
                  >
                    {copySuccess ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onRoomCreated(createdRoomId);
                    handleClose();
                  }}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Join Room
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateRoomModal;
