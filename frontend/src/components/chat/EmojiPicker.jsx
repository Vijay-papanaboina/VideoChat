import { useState } from "react";
import { X } from "lucide-react";

/**
 * EmojiPicker Component
 * Simple emoji picker for chat messages
 */
const EmojiPicker = ({ onEmojiSelect }) => {
  const [activeCategory, setActiveCategory] = useState("smileys");

  const emojiCategories = {
    smileys: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "🤣",
      "😂",
      "🙂",
      "🙃",
      "😉",
      "😊",
      "😇",
      "🥰",
      "😍",
      "🤩",
      "😘",
      "😗",
      "😚",
      "😙",
      "😋",
      "😛",
      "😜",
      "🤪",
      "😝",
      "🤑",
      "🤗",
      "🤭",
      "🤫",
      "🤔",
      "🤐",
      "🤨",
      "😐",
      "😑",
      "😶",
      "😏",
      "😒",
      "🙄",
      "😬",
      "🤥",
      "😔",
      "😪",
      "🤤",
      "😴",
      "😷",
      "🤒",
      "🤕",
      "🤢",
      "🤮",
      "🤧",
      "🥵",
      "🥶",
      "🥴",
      "😵",
      "🤯",
      "🤠",
      "🥳",
      "😎",
      "🤓",
      "🧐",
    ],
    people: [
      "👶",
      "🧒",
      "👦",
      "👧",
      "🧑",
      "👨",
      "👩",
      "🧓",
      "👴",
      "👵",
      "👱",
      "👨‍🦰",
      "👩‍🦰",
      "👨‍🦱",
      "👩‍🦱",
      "👨‍🦳",
      "👩‍🦳",
      "👨‍🦲",
      "👩‍🦲",
      "👱‍♀️",
      "👱‍♂️",
      "🧔",
      "👨‍💼",
      "👩‍💼",
      "👨‍🔬",
      "👩‍🔬",
      "👨‍💻",
      "👩‍💻",
      "👨‍🎤",
      "👩‍🎤",
      "👨‍🎨",
      "👩‍🎨",
      "👨‍✈️",
      "👩‍✈️",
      "👨‍🚀",
      "👩‍🚀",
      "👨‍🚒",
      "👩‍🚒",
      "👮",
      "👮‍♀️",
      "👮‍♂️",
      "🕵️",
      "🕵️‍♀️",
      "🕵️‍♂️",
      "💂",
      "💂‍♀️",
      "💂‍♂️",
      "🥷",
      "👷",
      "👷‍♀️",
    ],
    gestures: [
      "👍",
      "👎",
      "👌",
      "✌️",
      "🤞",
      "🤟",
      "🤘",
      "🤙",
      "👈",
      "👉",
      "👆",
      "🖕",
      "👇",
      "☝️",
      "👋",
      "🤚",
      "🖐️",
      "✋",
      "🖖",
      "👏",
      "🙌",
      "👐",
      "🤲",
      "🤝",
      "🙏",
      "✍️",
      "💅",
      "🤳",
      "💪",
      "🦾",
      "🦿",
      "🦵",
      "🦶",
      "👂",
      "🦻",
      "👃",
      "🧠",
      "🦷",
      "🦴",
      "👀",
      "👁️",
      "👅",
      "👄",
      "💋",
      "🩸",
      "💘",
      "💝",
      "💖",
      "💗",
      "💓",
    ],
    objects: [
      "⌚",
      "📱",
      "📲",
      "💻",
      "⌨️",
      "🖥️",
      "🖨️",
      "🖱️",
      "🖲️",
      "💽",
      "💾",
      "💿",
      "📀",
      "🧮",
      "🎥",
      "📷",
      "📸",
      "📹",
      "📼",
      "🔍",
      "🔎",
      "🕯️",
      "💡",
      "🔦",
      "🏮",
      "🪔",
      "📔",
      "📕",
      "📖",
      "📗",
      "📘",
      "📙",
      "📚",
      "📓",
      "📒",
      "📃",
      "📜",
      "📄",
      "📰",
      "🗞️",
      "📑",
      "🔖",
      "🏷️",
      "💰",
      "💴",
      "💵",
      "💶",
      "💷",
      "💸",
      "💳",
    ],
    symbols: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💔",
      "❣️",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "💟",
      "☮️",
      "✝️",
      "☪️",
      "🕉️",
      "☸️",
      "✡️",
      "🔯",
      "🕎",
      "☯️",
      "☦️",
      "🛐",
      "⛎",
      "♈",
      "♉",
      "♊",
      "♋",
      "♌",
      "♍",
      "♎",
      "♏",
      "♐",
      "♑",
      "♒",
      "♓",
      "🆔",
      "⚛️",
      "🉑",
      "☢️",
      "☣️",
      "📴",
      "📳",
    ],
  };

  const categoryNames = {
    smileys: "😀",
    people: "👥",
    gestures: "👍",
    objects: "📱",
    symbols: "❤️",
  };

  return (
    <div className="bg-background border border-border rounded-lg shadow-lg w-80 h-64 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Choose Emoji
        </h3>
        <button
          onClick={() => onEmojiSelect("")}
          className="p-1 hover:bg-muted rounded"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex border-b border-border">
        {Object.entries(categoryNames).map(([category, icon]) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`flex-1 p-2 text-center text-lg hover:bg-muted ${
              activeCategory === category
                ? "bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-500"
                : ""
            }`}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-8 gap-1">
          {emojiCategories[activeCategory]?.map((emoji, index) => (
            <button
              key={index}
              onClick={() => onEmojiSelect(emoji)}
              className="p-2 text-lg hover:bg-muted rounded text-center"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;
