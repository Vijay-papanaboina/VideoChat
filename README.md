# VideoCallApp Monorepo

Real-time video calling application with WebRTC, Socket.IO, React (Vite) frontend, and Node/Express backend. This monorepo contains two workspaces:

- `backend/` — Express + Socket.IO signaling server, REST endpoints, Drizzle ORM (PostgreSQL)
- `frontend/` — React + Vite client, Tailwind, shadcn/ui, WebRTC and Socket.IO client

## Architecture

- WebRTC for peer-to-peer media
- Socket.IO for signaling and realtime features (chat, presence, room admin)
- REST endpoints for auth/chat helpers and room checks
- PostgreSQL persistence via Drizzle ORM for permanent rooms, messages, and invitations

### Directory Structure

```
VideoCallApp/
├── backend/
│   ├── server.js           # Express + Socket.IO server
│   ├── drizzle/            # Generated migrations (drizzle)
│   ├── drizzle.config.js   # Drizzle CLI config
│   ├── routes/             # REST routes (auth, chat, etc.)
│   └── src/                # db, schema, services, middleware
└── frontend/
    ├── src/                # React app (components, pages, lib)
    ├── vite.config.js      # Vite config (dev server port)
    └── public/             # Static assets
```

## Environment Variables (Summary)

- Backend
  - `PORT` (default 8000)
  - `NODE_ENV` (development|production)
  - `CORS_ORIGIN` (e.g., http://localhost:4000)
  - Database via either `DATABASE_URL` or discrete `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (see `backend/drizzle.config.js`)
  - (If auth uses JWT) `JWT_SECRET`
- Frontend
  - `VITE_BACKEND_URL` (e.g., http://localhost:8000)

See the READMEs in `backend/` and `frontend/` for complete details.

## Local Development

1. Backend

- From `backend/`: `npm install` then `npm run dev` (or `npm start`)
- Default: http://localhost:8000

2. Frontend

- From `frontend/`: `npm install` then `npm run dev`
- Default: http://localhost:5173 (Vite dev), Vite config exposes port 4000 for dev server as configured

3. Configure env

- `frontend/.env` → `VITE_BACKEND_URL=http://localhost:8000`
- `backend/.env` → set DB and `CORS_ORIGIN` etc. (see backend README)

## Database & Migrations

- ORM: Drizzle (PostgreSQL)
- Config: `backend/drizzle.config.js`
- Generated SQL output: `backend/drizzle/`

Common commands (run in `backend/`):

- Generate: `npx drizzle-kit generate`
- Push: `npx drizzle-kit push`

## Key Endpoints & Events (Overview)

- REST
  - `GET /` — health/info
  - `POST /api/rooms/check` — check room status
  - `GET/POST /api/auth/*`, `GET/POST /api/chat/*` — see backend README
- Socket.IO
  - `join-room`, `offer`, `answer`, `ice-candidate`
  - `screen-share-started`, `screen-share-stopped`
  - `chat-message`, `typing`, `stop-typing`
  - Admin: `kick-user`, `promote-user`, `demote-user`
  - Invitations: `send-room-invitation`, `accept-room-invitation`, `decline-room-invitation`, `cancel-room-invitation`
  - Membership: `get-user-rooms`, `get-room-info`, `add-room-member`, `remove-room-member`, `update-member-admin`, `leave-room`, `delete-permanent-room`

## Deployment Notes

- Serve frontend over HTTPS in production (WebRTC requirement)
- Set `CORS_ORIGIN` to the deployed frontend origin
- Provide a managed PostgreSQL and set `DATABASE_URL`

## Troubleshooting

- Camera/Mic denied: allow permissions in browser
- WebRTC over HTTP: use HTTPS in production
- CORS: ensure backend `CORS_ORIGIN` matches frontend origin
- Socket connection: verify backend URL and ports

## License

MIT
