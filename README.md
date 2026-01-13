# VideoCallApp

Real-time video calling application with WebRTC mesh topology, Socket.IO signaling, and full room management.

🔗 **Live Demo:** https://video-chat-beta.vercel.app

## Features

- **P2P Video Calls** — Mesh topology where peers connect directly
- **Screen Sharing** — Track replacement without SDP renegotiation
- **Video Recording & Screenshots** — MediaRecorder with codec detection
- **Temporary Rooms** — No login, auto-delete when empty
- **Permanent Rooms** — PostgreSQL-backed with invite system
- **Admin Controls** — Kick, promote, demote members
- **Real-time Chat** — With typing indicators

## Architecture

```
Frontend (React)  ←──REST/Socket──→  Backend (Express)  ←───→  PostgreSQL
     │                                      │
     │ WebRTC (P2P Media)                   │ Signaling Only
     └──────────────────────────────────────┘
```

**Key:** Media flows directly between browsers. Server only handles signaling.

## Quick Start

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

## Documentation

| Topic                           | Link                                       |
| ------------------------------- | ------------------------------------------ |
| **Backend API & Socket Events** | [backend/README.md](./backend/README.md)   |
| **Frontend Setup & Usage**      | [frontend/README.md](./frontend/README.md) |

## Tech Stack

| Layer    | Technologies                                 |
| -------- | -------------------------------------------- |
| Frontend | React, Vite, TailwindCSS, shadcn/ui, Zustand |
| Backend  | Node.js, Express, Socket.IO, Helmet          |
| Database | PostgreSQL, Drizzle ORM                      |
| Auth     | JWT (httpOnly cookies), bcrypt               |

## Environment Variables

**Backend** — See [backend/README.md](./backend/README.md#environment-variables)

```env
PORT=8000
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
CORS_ORIGIN=http://localhost:4000
```

**Frontend** — See [frontend/README.md](./frontend/README.md#environment-variables)

```env
VITE_BACKEND_URL=http://localhost:8000
```

## Deployment

- HTTPS required for WebRTC
- Set `CORS_ORIGIN` to frontend domain
- Use managed PostgreSQL (Supabase, Neon, Railway)

## License

MIT
