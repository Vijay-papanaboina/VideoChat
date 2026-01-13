# VideoCallApp Backend

Express + Socket.IO signaling server with REST API and PostgreSQL persistence.

## Features

- **WebRTC Signaling** — SDP offer/answer, ICE candidate exchange
- **Room Management** — Temporary (in-memory) and permanent (DB) rooms
- **Real-time Chat** — Messages with typing indicators, stored in DB
- **Invitation System** — Send/accept/decline with live notifications
- **Admin Controls** — Kick, promote, demote members
- **Authentication** — JWT with httpOnly cookies, email verification

## Project Structure

```
backend/
├── server.js              # Express + Socket.IO setup
├── socket/
│   ├── index.js           # Socket.IO initialization, register-user
│   ├── userSocketMap.js   # userId → socketId mapping
│   └── handlers/
│       ├── room.js        # Room join/leave/create (22KB)
│       ├── webrtc.js      # Offer/answer/ICE forwarding
│       ├── chat.js        # Messages, typing indicators
│       ├── invitation.js  # Invite send/accept/decline/cancel
│       ├── memberAdmin.js # Kick/promote/demote
│       └── screenShare.js # Screen share notifications
├── routes/
│   ├── auth.js            # Auth endpoints
│   └── chat.js            # Chat endpoints
├── src/
│   ├── controllers/       # authController, chatController
│   ├── services/          # authService, chatService, roomService
│   ├── middleware/        # auth, errorHandler
│   ├── schema.js          # Drizzle schema (users, rooms, messages, invitations)
│   └── db.js              # Drizzle connection
├── drizzle/               # Generated migrations
└── drizzle.config.js      # Drizzle CLI config
```

## Environment Variables

```env
PORT=8000
NODE_ENV=development
CORS_ORIGIN=http://localhost:4000
JWT_SECRET=your-secret-key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/videocall

# Email (choose one)
RESEND_API_KEY=re_xxxxx        # Production
# Or Ethereal auto-generates dev credentials
```

## REST API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint                 | Auth | Description              |
| ------ | ------------------------ | ---- | ------------------------ |
| POST   | `/register`              | No   | Register new user        |
| POST   | `/login`                 | No   | Login, get JWT cookie    |
| POST   | `/logout`                | Yes  | Clear JWT cookie         |
| GET    | `/profile`               | Yes  | Get current user         |
| PUT    | `/profile`               | Yes  | Update username          |
| PUT    | `/change-password`       | Yes  | Change password          |
| DELETE | `/account`               | Yes  | Delete account           |
| GET    | `/verify`                | Yes  | Verify JWT               |
| GET    | `/users/search`          | Yes  | Search users by username |
| GET    | `/verify-email/:token`   | No   | Verify email             |
| POST   | `/forgot-password`       | No   | Request password reset   |
| POST   | `/reset-password/:token` | No   | Reset password           |

### Chat (`/api/chat`)

| Method | Endpoint               | Auth | Description        |
| ------ | ---------------------- | ---- | ------------------ |
| GET    | `/room/:roomId/recent` | No   | Last 50 messages   |
| GET    | `/room/:roomId/count`  | No   | Message count      |
| GET    | `/room/:roomId`        | Yes  | Paginated messages |
| GET    | `/room/:roomId/search` | Yes  | Search messages    |
| PUT    | `/message/:messageId`  | Yes  | Edit message       |
| DELETE | `/message/:messageId`  | Yes  | Delete message     |

### Rooms (`/api/rooms`)

| Method | Endpoint | Auth | Description                |
| ------ | -------- | ---- | -------------------------- |
| POST   | `/check` | No   | Check room status/password |

## Socket.IO Events

### Connection & Registration

| Event             | Direction       | Description                              |
| ----------------- | --------------- | ---------------------------------------- |
| `register-user`   | Client → Server | Map userId to socketId for notifications |
| `user-registered` | Server → Client | Confirm registration                     |

### Room & WebRTC

| Event              | Direction       | Description                      |
| ------------------ | --------------- | -------------------------------- |
| `join-room`        | Client → Server | Join room with username/password |
| `all-users`        | Server → Client | List of existing room users      |
| `user-joined`      | Server → Client | New user joined notification     |
| `user-left`        | Server → Client | User left notification           |
| `offer` / `answer` | Client ↔ Server | WebRTC SDP exchange              |
| `ice-candidate`    | Client ↔ Server | ICE candidate exchange           |

### Chat

| Event                                 | Direction       | Description          |
| ------------------------------------- | --------------- | -------------------- |
| `chat-message`                        | Client ↔ Server | Send/receive message |
| `typing` / `stop-typing`              | Client → Server | Typing indicators    |
| `user-typing` / `user-stopped-typing` | Server → Client | Broadcast typing     |

### Invitations

| Event                      | Direction       | Description         |
| -------------------------- | --------------- | ------------------- |
| `send-room-invitation`     | Client → Server | Send invite         |
| `room-invitation-received` | Server → Client | Notify invitee      |
| `accept-room-invitation`   | Client → Server | Accept invite       |
| `decline-room-invitation`  | Client → Server | Decline invite      |
| `get-user-invitations`     | Client → Server | Get pending invites |

### Admin Controls

| Event          | Direction       | Description           |
| -------------- | --------------- | --------------------- |
| `kick-user`    | Client → Server | Remove user from room |
| `promote-user` | Client → Server | Make user admin       |
| `demote-user`  | Client → Server | Remove admin status   |

## Development

```bash
npm install
cp example.env .env   # Edit with your values
npx drizzle-kit push  # Create tables
npm run dev           # Start with nodemon
```

## Database Commands

```bash
npx drizzle-kit generate  # Generate migration SQL
npx drizzle-kit push      # Push schema to DB
npx drizzle-kit studio    # Open Drizzle Studio
```

## License

MIT
