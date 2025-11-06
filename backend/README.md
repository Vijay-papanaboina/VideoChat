# VideoCallApp Backend

Express + Socket.IO server providing signaling, REST endpoints, and persistence via Drizzle ORM (PostgreSQL) for the VideoCallApp.

## Features

- REST endpoints for auth/chat helpers and room checks
- Socket.IO signaling: join, offer/answer, ICE, chat, typing
- Room admin actions (kick/promote/demote), invitations, memberships
- Temporary and permanent rooms; DB persistence for permanent rooms
- CORS and cookie parsing, structured error handling

## Project Structure

```
backend/
├── server.js              # Express + Socket.IO setup and events
├── routes/                # REST routes (auth.js, chat.js)
├── src/
│   ├── db.js              # Drizzle connection
│   ├── schema.js          # Drizzle schema
│   ├── services/          # chatService, roomService
│   └── middleware/        # errorHandler, notFound
├── drizzle/               # Generated migrations
└── drizzle.config.js      # Drizzle CLI config
```

## Environment Variables

- `PORT` (default: 8000)
- `NODE_ENV` (development|production)
- `CORS_ORIGIN` (frontend origin, e.g., http://localhost:4000)
- Database connection (used by drizzle):
  - Either `DATABASE_URL`
  - Or discrete values: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- (If auth uses JWT) `JWT_SECRET`

## API Endpoints

- `GET /` — health/info
- `POST /api/rooms/check` — room existence/status

Auth (prefix: `/api/auth`)

- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout (auth required)
- `GET /api/auth/profile` — Get profile (auth required)
- `PUT /api/auth/profile` — Update profile (auth required)
- `PUT /api/auth/change-password` — Change password (auth required)
- `DELETE /api/auth/account` — Delete account (auth required)
- `GET /api/auth/verify` — Verify token (auth required)
- `GET /api/auth/users/search` — Search users (auth required)

Chat (prefix: `/api/chat`)

- `GET /api/chat/room/:roomId/recent` — Recent messages (public)
- `GET /api/chat/room/:roomId/count` — Message count (public)
- `GET /api/chat/room/:roomId` — Paginated messages (auth required)
- `GET /api/chat/room/:roomId/search` — Search messages (auth required)
- `GET /api/chat/room/:roomId/activity` — Activity summary (auth required)
- `GET /api/chat/room/:roomId/by-date-range` — Messages by date range (auth required)
- `GET /api/chat/message/:messageId` — Get message by ID (auth required)
- `PUT /api/chat/message/:messageId` — Edit message (auth required)
- `DELETE /api/chat/message/:messageId` — Delete message (auth required)
- `GET /api/chat/user/messages` — Current user's messages (auth required)

## Socket.IO Events (Server)

- Signaling: `join-room`, `offer`, `answer`, `ice-candidate`
- Screen sharing: `screen-share-started`, `screen-share-stopped`
- Chat: `chat-message`, `typing`, `stop-typing`
- Room membership/admin:
  - `kick-user`, `promote-user`, `demote-user`
  - `get-user-rooms`, `get-room-info`
  - `add-room-member`, `remove-room-member`, `update-member-admin`
  - `delete-permanent-room`, `leave-room`
- Invitations:
  - `send-room-invitation`, `accept-room-invitation`, `decline-room-invitation`, `cancel-room-invitation`

## Drizzle ORM & Migrations

- Config: `drizzle.config.js`
- Output: `drizzle/`

Common commands:

- Generate SQL: `npx drizzle-kit generate`
- Push schema: `npx drizzle-kit push`

## Local Development

1. Install deps: `npm install`
2. Create `.env` with the variables above
3. Start dev: `npm run dev` (or prod: `npm start`)
4. Server default: http://localhost:8000

## Deployment

- Provide managed PostgreSQL and set `DATABASE_URL`
- Set `CORS_ORIGIN` to your frontend origin
- Serve behind HTTPS in production (for WebRTC clients)

## Troubleshooting

- CORS errors: verify `CORS_ORIGIN` matches frontend origin exactly
- Socket connection issues: confirm ports and that server is reachable
- WebRTC in production: ensure HTTPS
- DB errors: verify `DATABASE_URL` or discrete DB vars and network access

## License

MIT
