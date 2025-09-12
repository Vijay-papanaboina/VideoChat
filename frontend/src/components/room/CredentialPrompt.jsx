import { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * CredentialPrompt Component
 * Modal for entering room credentials when they're missing
 */
const CredentialPrompt = ({ roomId, onClose }) => {
  const navigate = useNavigate();
  const [promptUsername, setPromptUsername] = useState("");
  const [promptPassword, setPromptPassword] = useState("");

  const handleCredentialSubmit = (e) => {
    e.preventDefault();
    if (promptUsername.trim() && promptPassword.trim()) {
      // Close the dialog
      onClose();
      // Update the location state with new credentials
      navigate(`/room/${roomId}`, {
        state: { username: promptUsername, password: promptPassword },
        replace: true,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4 text-foreground">
          Enter Room Credentials
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Please enter your username and room password to join this room.
        </p>
        <form onSubmit={handleCredentialSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="prompt-username"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Username
            </label>
            <input
              id="prompt-username"
              type="text"
              value={promptUsername}
              onChange={(e) => setPromptUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter your username"
              required
            />
          </div>
          <div>
            <label
              htmlFor="prompt-password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Room Password
            </label>
            <input
              id="prompt-password"
              type="password"
              value={promptPassword}
              onChange={(e) => setPromptPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter room password"
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Join Room
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CredentialPrompt;
