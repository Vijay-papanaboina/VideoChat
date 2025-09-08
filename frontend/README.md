# VideoCall App

A modern, real-time video calling application built with React, Socket.IO, and WebRTC. Features secure room-based video calls with up to 5 participants.

## Features

- 🎥 **Real-time Video Calls**: Instant video streaming using WebRTC
- 🔒 **Secure Rooms**: Password-protected rooms for privacy
- 👥 **Multi-participant**: Support for up to 5 users per room
- 📱 **Responsive Design**: Beautiful UI that works on all devices
- ⚡ **Instant Connection**: No call/answer flow - immediate streaming
- 🎨 **Dynamic Layouts**: Automatic grid layout based on participant count
- 🎛️ **Media Controls**: Mute/unmute, video on/off, leave room

## Tech Stack

### Frontend

- **React 19** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **Socket.IO Client** - Real-time communication
- **WebRTC** - Peer-to-peer video/audio streaming

### Backend

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Socket.IO** - Real-time bidirectional communication
- **CORS** - Cross-origin resource sharing

## Project Structure

```
VideoCallApp/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── pages/           # Page components
│   │   │   ├── HomePage.jsx # Landing page
│   │   │   └── RoomPage.jsx # Video call interface
│   │   ├── lib/             # Utility functions
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # App entry point
│   ├── public/              # Static assets
│   └── package.json         # Frontend dependencies
├── backend/                 # Node.js backend server
│   ├── server.js            # Socket.IO server
│   └── package.json         # Backend dependencies
└── README.md               # This file
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd VideoCallApp
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the backend server**

   ```bash
   cd backend
   npm start
   ```

   The server will run on the configured backend URL (default: `http://localhost:8000`)

2. **Start the frontend development server**

   ```bash
   cd frontend
   npm run dev
   ```

   The frontend will run on `http://localhost:5173`

3. **Open your browser**
   Navigate to `http://localhost:5173` to access the application

## Usage

### Creating a Room

1. Enter your name
2. Optionally enter a custom room ID (or leave empty for auto-generation)
3. Set a secure password for the room
4. Click "Create Room"

### Joining a Room

1. Enter your name
2. Enter the room ID you want to join
3. Enter the room password
4. Click "Join Room"

### During a Call

- **Mute/Unmute**: Click the microphone icon
- **Video On/Off**: Click the video camera icon
- **Leave Room**: Click the phone icon
- **Participant Count**: See how many people are in the room (max 5)

## Features in Detail

### Dynamic Video Layouts

The application automatically adjusts the video grid layout based on the number of participants:

- 1 person: Single large view
- 2 people: Side-by-side
- 3-4 people: 2x2 grid
- 5 people: 3x2 grid

### Local Video Positioning

Your own video appears in a smaller window in the bottom-right corner with a mirror effect for natural interaction.

### Room Management

- **Password Protection**: All rooms require a password
- **User Limit**: Maximum 5 users per room
- **Auto-cleanup**: Empty rooms are automatically deleted
- **Real-time Updates**: See when users join or leave

### WebRTC Features

- **STUN Servers**: Configured for NAT traversal
- **Peer-to-Peer**: Direct connections between users
- **Media Controls**: Independent audio/video control
- **Connection Management**: Automatic reconnection handling

## Configuration

### Environment Variables

The frontend uses Vite environment variables to configure the backend URL. Create a `.env` file in the frontend directory:

```env
# Backend URL configuration
VITE_BACKEND_URL=http://localhost:8000
```

**Note**: The application will fallback to `http://localhost:8000` if no environment variable is set.

### Backend Configuration

The backend server can be configured via environment variables:

- `PORT`: Server port (default: 8000)
- `NODE_ENV`: Environment (development/production)

## Browser Compatibility

This application requires modern browsers with WebRTC support:

- Chrome 56+
- Firefox 52+
- Safari 11+
- Edge 79+

## Security Considerations

- **HTTPS Required**: WebRTC requires HTTPS in production
- **Password Protection**: All rooms are password-protected
- **User Limits**: Prevents room overcrowding
- **Input Validation**: All user inputs are validated

## Troubleshooting

### Common Issues

1. **Camera/Microphone Access Denied**

   - Ensure you've granted permission to access media devices
   - Check browser settings for camera/microphone permissions

2. **Connection Issues**

   - Verify the backend server is running
   - Check network connectivity
   - Ensure firewall allows WebRTC traffic

3. **Room Full Error**

   - Maximum 5 users per room
   - Create a new room or wait for someone to leave

4. **Video Not Displaying**
   - Check if camera is being used by another application
   - Try refreshing the page
   - Verify WebRTC support in your browser

## Development

### Adding New Features

1. Frontend changes go in `frontend/src/`
2. Backend changes go in `backend/`
3. UI components use shadcn/ui for consistency

### Code Style

- Use functional components with hooks
- Follow React best practices
- Use Tailwind CSS for styling
- Add comments for complex logic

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
