# VideoCallApp Frontend

React + Vite client with WebRTC, Socket.IO, and responsive UI.

## Features

- **Video Calls** — P2P mesh connections via WebRTC
- **Screen Sharing** — Track replacement without renegotiation
- **Recording** — VP9/VP8 codec detection, grid recording
- **Screenshots** — Individual streams or full grid
- **Chat** — Real-time messaging with typing indicators
- **Room Dashboard** — Manage permanent rooms
- **Authentication** — JWT with email verification

## Tech Stack

- React + Vite
- TailwindCSS + shadcn/ui
- Zustand (state management)
- Socket.IO Client
- WebRTC

## Project Structure

```
frontend/src/
├── pages/
│   ├── LandingPage.jsx      # Home
│   ├── RoomPage.jsx         # Video call interface
│   ├── RoomDashboardPage.jsx# Room management
│   ├── UserProfilePage.jsx  # User settings
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   └── ...
├── components/
│   ├── room/                # Video grid, controls
│   ├── chat/                # Chat panel, messages
│   ├── auth/                # Protected routes
│   ├── modals/              # Room management modals
│   └── ui/                  # shadcn/ui components
├── hooks/
│   ├── useWebRTC.js         # Core WebRTC logic
│   ├── useScreenShare.js    # Screen sharing
│   ├── useVideoRecording.js # MediaRecorder
│   ├── useScreenshot.js     # Canvas capture
│   ├── useMediaControls.js  # Mute/unmute
│   └── useKeyboardShortcuts.js
├── contexts/
│   └── SocketContext.jsx    # Shared socket
├── stores/
│   ├── authStore.js         # Auth state
│   └── chatStore.js         # Messages, typing
└── utils/
    └── api.js               # REST API client
```

## Environment Variables

```env
VITE_BACKEND_URL=http://localhost:8000
```

## Quick Start

```bash
npm install
cp .env.example .env   # Set VITE_BACKEND_URL
npm run dev            # Starts on localhost:4000
```

## Key Hooks

### useWebRTC

- Creates peer connections for each user
- Handles SDP offer/answer exchange
- Manages ICE candidates
- Cleans up connections on leave

### useScreenShare

- Uses `getDisplayMedia()` for screen capture
- Replaces video track via `RTCRtpSender.replaceTrack()`
- Restores camera on stop

### useVideoRecording

- Records local stream, screen share, or grid view
- Grid recording composites videos on canvas
- Supports VP9/VP8 codec selection

### useScreenshot

- Captures individual video elements
- Full grid capture via canvas composition
- Downloads as PNG

## Room Types

| Type      | Auth Required | Persistence            | Features                           |
| --------- | ------------- | ---------------------- | ---------------------------------- |
| Temporary | No            | In-memory, auto-delete | Basic video/chat                   |
| Permanent | Yes           | PostgreSQL             | Invites, admin controls, dashboard |

## Keyboard Shortcuts

| Key   | Action              |
| ----- | ------------------- |
| `M`   | Toggle mute         |
| `V`   | Toggle video        |
| `S`   | Toggle screen share |
| `Esc` | Leave room          |

## Browser Support

- Chrome 56+
- Firefox 52+
- Safari 11+
- Edge 79+

**Note:** HTTPS required in production for WebRTC.

## License

MIT
